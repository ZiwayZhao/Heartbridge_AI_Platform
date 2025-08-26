-- 启用向量扩展
CREATE EXTENSION IF NOT EXISTS vector;

-- 定义知识单元类别和重要性级别
CREATE TYPE knowledge_category AS ENUM ('general', 'specific', 'technical', 'other');
CREATE TYPE knowledge_importance AS ENUM ('high', 'medium', 'low');
CREATE TYPE embedding_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 创建知识单元表
CREATE TABLE IF NOT EXISTS knowledge_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  category knowledge_category NOT NULL DEFAULT 'general',
  importance knowledge_importance NOT NULL DEFAULT 'medium',
  labels TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  embedding vector(1536),
  embedding_status embedding_status DEFAULT 'pending',
  embedding_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建结构化数据表
CREATE TABLE IF NOT EXISTS structured_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建RAG查询日志表
CREATE TABLE IF NOT EXISTS rag_query_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  retrieved_units_count INTEGER DEFAULT 0,
  response TEXT,
  response_quality_score FLOAT,
  user_feedback INTEGER CHECK (user_feedback >= 1 AND user_feedback <= 5),
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建向量搜索函数
CREATE OR REPLACE FUNCTION search_knowledge_units(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  filter_category knowledge_category DEFAULT NULL,
  filter_importance knowledge_importance DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  category knowledge_category,
  importance knowledge_importance,
  labels text[],
  keywords text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ku.id,
    ku.content,
    ku.category,
    ku.importance,
    ku.labels,
    ku.keywords,
    1 - (ku.embedding <=> query_embedding) as similarity
  FROM knowledge_units ku
  WHERE 
    ku.embedding IS NOT NULL
    AND (filter_category IS NULL OR ku.category = filter_category)
    AND (filter_importance IS NULL OR ku.importance = filter_importance)
    AND 1 - (ku.embedding <=> query_embedding) > match_threshold
  ORDER BY ku.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 创建索引
CREATE INDEX IF NOT EXISTS knowledge_units_embedding_idx ON knowledge_units USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
CREATE INDEX IF NOT EXISTS knowledge_units_category_idx ON knowledge_units (category);
CREATE INDEX IF NOT EXISTS knowledge_units_importance_idx ON knowledge_units (importance);
CREATE INDEX IF NOT EXISTS knowledge_units_labels_idx ON knowledge_units USING GIN (labels);
CREATE INDEX IF NOT EXISTS knowledge_units_keywords_idx ON knowledge_units USING GIN (keywords);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_units_updated_at
    BEFORE UPDATE ON knowledge_units
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
