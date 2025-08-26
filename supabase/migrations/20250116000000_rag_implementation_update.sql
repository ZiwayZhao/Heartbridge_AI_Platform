-- RAG 实现更新 - 基于 rag-implementation/database/schema.sql
-- 这个迁移将现有的数据库结构更新为新的 RAG 实现标准

-- 启用向量扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS vector;

-- 定义知识单元类别和重要性级别（如果不存在）
DO $$ BEGIN
    CREATE TYPE knowledge_category AS ENUM ('general', 'specific', 'technical', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE knowledge_importance AS ENUM ('high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE embedding_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 备份现有的 knowledge_units 表（如果存在）
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_units') THEN
        DROP TABLE IF EXISTS knowledge_units_backup;
        CREATE TABLE knowledge_units_backup AS SELECT * FROM knowledge_units;
    END IF;
END $$;

-- 删除现有的 knowledge_units 表（如果存在）
DROP TABLE IF EXISTS knowledge_units CASCADE;

-- 创建新的知识单元表
CREATE TABLE knowledge_units (
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

-- 启用行级安全
ALTER TABLE knowledge_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE structured_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_query_logs ENABLE ROW LEVEL SECURITY;

-- 创建开放访问策略（所有人都可以访问）
CREATE POLICY "Allow all access to knowledge_units" ON knowledge_units FOR ALL USING (true);
CREATE POLICY "Allow all access to structured_data" ON structured_data FOR ALL USING (true);
CREATE POLICY "Allow all access to rag_query_logs" ON rag_query_logs FOR ALL USING (true);

-- 如果有备份数据，尝试迁移到新表结构
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_units_backup') THEN
        -- 迁移现有数据到新的表结构
        INSERT INTO knowledge_units (content, category, importance, labels, keywords, embedding, created_at, updated_at)
        SELECT 
            content,
            CASE 
                WHEN category = 'travel_guide' THEN 'general'::knowledge_category
                WHEN category = 'technical' THEN 'technical'::knowledge_category
                ELSE 'general'::knowledge_category
            END,
            'medium'::knowledge_importance,
            COALESCE(tags, '{}'),
            COALESCE(tags, '{}'),
            embedding,
            created_at,
            updated_at
        FROM knowledge_units_backup
        WHERE content IS NOT NULL;
        
        -- 清理备份表
        DROP TABLE knowledge_units_backup;
    END IF;
END $$;
