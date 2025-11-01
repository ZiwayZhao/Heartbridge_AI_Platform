-- Create BCBA consultants table
CREATE TABLE public.bcba_consultants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  specialties TEXT[],
  contact_email TEXT,
  contact_phone TEXT,
  pricing TEXT,
  experience_years INTEGER,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bcba_consultants ENABLE ROW LEVEL SECURITY;

-- Everyone can view active consultants
CREATE POLICY "Anyone can view active consultants"
ON public.bcba_consultants
FOR SELECT
USING (is_active = true);

-- Admins can manage all consultants
CREATE POLICY "Admins can insert consultants"
ON public.bcba_consultants
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update consultants"
ON public.bcba_consultants
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete consultants"
ON public.bcba_consultants
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_bcba_consultants_updated_at
BEFORE UPDATE ON public.bcba_consultants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();