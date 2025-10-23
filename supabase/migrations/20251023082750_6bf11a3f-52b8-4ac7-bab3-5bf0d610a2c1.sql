-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'zh')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (CRITICAL: separate from profiles for security)
CREATE TYPE public.app_role AS ENUM ('admin', 'therapist', 'parent');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Knowledge units for RAG system
CREATE TABLE public.knowledge_units (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536),
  entities JSONB DEFAULT '{}'::jsonb,
  source_name TEXT DEFAULT 'Manual Upload',
  data_type TEXT DEFAULT 'text' CHECK (data_type IN ('text', 'qa', 'case_study', 'intervention_script')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'intervention', 'communication', 'behavior', 'social_skills', 'sensory')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  importance TEXT DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat history table
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Intervention cases table
CREATE TABLE public.intervention_cases (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  child_age INTEGER,
  diagnosis_details TEXT,
  intervention_goals JSONB DEFAULT '[]'::jsonb,
  progress_notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_cases ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for knowledge_units
CREATE POLICY "Anyone can view knowledge units"
  ON public.knowledge_units FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert knowledge units"
  ON public.knowledge_units FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update knowledge units"
  ON public.knowledge_units FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete knowledge units"
  ON public.knowledge_units FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for chat_history
CREATE POLICY "Users can view their own chat history"
  ON public.chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat history"
  ON public.chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for intervention_cases
CREATE POLICY "Users can view their own cases"
  ON public.intervention_cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cases"
  ON public.intervention_cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cases"
  ON public.intervention_cases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases"
  ON public.intervention_cases FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_units_updated_at
  BEFORE UPDATE ON public.knowledge_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_intervention_cases_updated_at
  BEFORE UPDATE ON public.intervention_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign default 'parent' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'parent');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Vector search function for RAG
CREATE OR REPLACE FUNCTION public.search_knowledge_units(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL,
  filter_importance text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  entities jsonb,
  source_name text,
  data_type text,
  category text,
  tags text[],
  importance text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_units.id,
    knowledge_units.content,
    knowledge_units.entities,
    knowledge_units.source_name,
    knowledge_units.data_type,
    knowledge_units.category,
    knowledge_units.tags,
    knowledge_units.importance,
    1 - (knowledge_units.embedding <=> query_embedding) as similarity
  FROM public.knowledge_units
  WHERE 
    (filter_category IS NULL OR knowledge_units.category = filter_category)
    AND (filter_importance IS NULL OR knowledge_units.importance = filter_importance)
    AND knowledge_units.embedding IS NOT NULL
    AND 1 - (knowledge_units.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;