# RAG实现说明

本文件夹包含了一个完整的RAG（检索增强生成）系统实现。主要包括以下组件：

## 1. 前端实现
- `frontend/useRAGChat.tsx`: React Hook实现，用于处理RAG聊天功能
  - 管理聊天消息状态
  - 处理用户输入
  - 调用后端API
  - 展示检索结果和AI回复

## 2. 后端实现
- `backend/rag-chat.ts`: RAG核心实现
  - 查询理解和分析
  - 向量检索
  - 关键词搜索
  - 结果融合
  - 生成回答
- `backend/generate-embeddings.ts`: 向量生成服务
  - 单条/批量文本向量化
  - 向量存储管理
  - 错误处理和状态更新

## 3. 数据库设计
- `database/schema.sql`: 数据库表结构和函数
  - knowledge_units表：存储知识单元和向量
  - rag_query_logs表：查询日志
  - search_knowledge_units函数：向量搜索实现

## 4. 工作流程
1. 文档处理和向量化：
   - 上传文档后进行文本提取
   - 生成文本向量表示
   - 存储到向量数据库

2. 检索和问答：
   - 用户提问
   - 问题向量化
   - 多路径检索（向量+关键词）
   - 结果融合和排序
   - 生成回答

## 5. 关键特性
- 混合检索策略（向量+关键词）
- 结构化数据支持
- 实时向量生成
- 错误处理和日志记录
- 可配置的相似度阈值
- 支持按类别和重要性过滤

## 6. 依赖
- OpenAI API (text-embedding-ada-002)
- Supabase
- PostgreSQL (with pg_vector)
- TypeScript
- React
