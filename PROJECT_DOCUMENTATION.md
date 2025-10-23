# Heartbridge AI Platform - 自闭症儿童干预专家系统

## 📋 项目概述

**Heartbridge AI Platform** 是一个基于AI技术的自闭症儿童干预专家系统，旨在为家长、教育工作者和专业人士提供专业的自闭症谱系障碍干预指导和支持。

### 🎯 核心价值
- **专业干预指导**：基于循证实践的自闭症儿童干预建议
- **智能知识检索**：RAG技术驱动的专业知识问答系统
- **个性化支持**：根据儿童具体情况提供定制化干预方案
- **家庭友好**：注重家庭参与和实用干预技巧

## 🏗️ 技术架构

### 前端技术栈
- **框架**：React 18.3.1 + TypeScript
- **构建工具**：Vite 5.4.1
- **UI组件库**：shadcn/ui + Radix UI
- **样式**：Tailwind CSS
- **状态管理**：React Hooks + TanStack Query
- **路由**：React Router DOM
- **文件处理**：PapaParse (CSV), xlsx (Excel), pdfjs-dist (PDF)

### 后端技术栈
- **平台**：Supabase (Serverless)
- **数据库**：PostgreSQL + pg_vector (向量搜索)
- **函数计算**：Supabase Edge Functions (Deno Runtime)
- **存储**：Supabase Storage
- **AI模型**：OpenAI GPT-3.5-turbo + text-embedding-ada-002

### 核心依赖
```json
{
  "核心框架": ["react", "react-dom", "typescript"],
  "UI组件": ["@radix-ui/*", "lucide-react", "tailwindcss"],
  "数据处理": ["@supabase/supabase-js", "papaparse", "xlsx"],
  "开发工具": ["vite", "eslint", "postcss"]
}
```

## 🗂️ 项目结构

```
Heartbridge_AI_Platform/
├── src/
│   ├── components/           # React组件
│   │   ├── admin/           # 管理后台组件
│   │   ├── chat/            # 聊天界面组件
│   │   ├── knowledge/       # 知识管理组件
│   │   ├── upload/          # 文件上传组件
│   │   └── ui/              # 基础UI组件
│   ├── hooks/               # 自定义React Hooks
│   ├── integrations/        # 第三方服务集成
│   ├── lib/                 # 工具库
│   ├── pages/               # 页面组件
│   └── utils/               # 工具函数
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── rag-chat/        # RAG聊天服务
│   │   ├── generate-embeddings/ # 向量生成
│   │   ├── process-csv/     # CSV处理
│   │   └── process-document/ # 文档处理
│   ├── migrations/          # 数据库迁移
│   └── config.toml          # Supabase配置
└── public/                  # 静态资源
```

## 🚀 核心功能模块

### 1. 智能问答系统 (RAG Chat)
**位置**：`src/components/chat/`, `supabase/functions/rag-chat/`

**功能特点**：
- 🧠 **专业AI助手**：Ziway - 自闭症儿童干预专家
- 🔍 **混合检索**：向量搜索 + 关键词匹配
- 📊 **智能过滤**：按相似度阈值筛选高质量结果
- 🎯 **个性化回答**：根据儿童年龄、能力水平定制建议

**技术实现**：
- 使用OpenAI text-embedding-ada-002生成向量
- pg_vector扩展实现高效向量搜索
- 动态调整temperature参数优化回答质量

### 2. 知识库管理系统
**位置**：`src/components/KnowledgeManager.tsx`, `src/components/TravelKnowledgeUploader.tsx`

**功能特点**：
- 📝 **CSV批量上传**：支持结构化知识数据导入
- 🏷️ **智能分类**：自动分类和标签管理
- ✏️ **在线编辑**：实时编辑知识内容
- 🔄 **批量向量化**：按需生成向量嵌入
- 📊 **状态监控**：实时显示处理状态

**支持格式**：
```csv
content,category,importance,labels,keywords
"ABA训练方法","technical","high","[""ABA"",""行为分析""]","[""训练"",""行为""]"
```

### 3. 文件管理系统
**位置**：`src/components/CloudDrive.tsx`

**功能特点**：
- 📁 **云存储**：Supabase Storage集成
- 🔍 **文件搜索**：按名称、类型、标签搜索
- 📋 **元数据管理**：文件描述、标签、权限设置
- 📊 **使用统计**：文件大小、上传时间等

### 4. 用户界面系统
**位置**：`src/components/AppSidebar.tsx`, `src/pages/`

**页面结构**：
- 🏠 **首页**：系统概览和快速导航
- 💬 **AI问答**：与Ziway专家对话
- 📚 **知识库管理**：知识上传和管理
- ☁️ **云盘文件**：文件存储和管理

## 🗄️ 数据库设计

### 核心数据表

#### 1. knowledge_units (知识单元表)
```sql
CREATE TABLE knowledge_units (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,                    -- 知识内容
  category knowledge_category,              -- 分类：general/specific/technical/other
  importance knowledge_importance,          -- 重要性：high/medium/low
  labels TEXT[],                           -- 标签数组
  keywords TEXT[],                         -- 关键词数组
  embedding vector(1536),                  -- OpenAI向量嵌入
  embedding_status embedding_status,       -- 向量化状态
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 2. structured_data (结构化数据表)
```sql
CREATE TABLE structured_data (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,                  -- 数据类别
  data JSONB NOT NULL,                     -- JSON格式数据
  created_at TIMESTAMP
);
```

#### 3. rag_query_logs (查询日志表)
```sql
CREATE TABLE rag_query_logs (
  id UUID PRIMARY KEY,
  query TEXT NOT NULL,                     -- 用户查询
  retrieved_units_count INTEGER,           -- 检索到的知识单元数量
  response TEXT,                           -- AI回答
  processing_time_ms INTEGER,              -- 处理时间
  created_at TIMESTAMP
);
```

### 向量搜索函数
```sql
CREATE FUNCTION search_knowledge_units(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_category knowledge_category DEFAULT NULL,
  filter_importance knowledge_importance DEFAULT NULL
)
```

## 🔧 部署配置

### 环境变量配置
```bash
# Supabase配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenAI API (在Supabase Secrets中配置)
OPENAI_API_KEY=your-openai-key
```

### 部署步骤
1. **前端部署**：Vercel (推荐) 或 Netlify
2. **后端部署**：Supabase (已配置)
3. **数据库迁移**：`supabase db push`
4. **函数部署**：`supabase functions deploy`

## 📊 系统特色

### 1. 专业AI助手 - Ziway
- **专业领域**：自闭症谱系障碍早期干预、ABA原理、语言发展、社交技能训练
- **回答特点**：基于循证实践、个性化建议、温暖支持性语调
- **智能兜底**：知识库无匹配时使用AI通用能力

### 2. 先进RAG技术
- **混合检索**：向量相似度 + 关键词匹配
- **质量过滤**：相似度阈值动态调整
- **上下文优化**：智能选择最相关的知识片段

### 3. 用户友好设计
- **响应式界面**：支持移动端和桌面端
- **实时反馈**：处理状态实时显示
- **批量操作**：支持批量上传和向量化

## 🚧 待完成工作

### 高优先级任务

#### 1. 系统提示词优化 ⭐⭐⭐
- [ ] **完善专业领域覆盖**：增加更多自闭症干预细分领域
- [ ] **优化回答质量**：改进提示词工程，提升回答的专业性和实用性
- [ ] **个性化适配**：根据用户角色（家长/教师/治疗师）调整回答风格

#### 2. 知识库内容建设 ⭐⭐⭐
- [ ] **专业内容导入**：导入权威的自闭症干预知识库
- [ ] **内容质量控制**：建立内容审核和质量评估机制
- [ ] **分类体系完善**：建立更细致的知识分类体系

#### 3. 用户体验优化 ⭐⭐
- [ ] **界面主题更新**：将旅行主题完全替换为自闭症干预主题
- [ ] **欢迎页面重设计**：更新开屏须知和欢迎消息
- [ ] **导航优化**：调整侧边栏和页面标题

### 中优先级任务

#### 4. 功能增强 ⭐⭐
- [ ] **用户认证系统**：添加用户注册、登录功能
- [ ] **个人化设置**：用户偏好设置、历史记录
- [ ] **导出功能**：支持对话记录和知识库导出

#### 5. 性能优化 ⭐
- [ ] **缓存机制**：实现智能缓存减少API调用
- [ ] **批量处理**：优化大量数据的处理性能
- [ ] **错误处理**：完善错误处理和用户反馈

#### 6. 数据分析 ⭐
- [ ] **使用统计**：用户行为分析和系统使用统计
- [ ] **效果评估**：AI回答质量评估和优化
- [ ] **A/B测试**：不同提示词策略的效果对比

### 低优先级任务

#### 7. 扩展功能
- [ ] **多语言支持**：支持英文等其他语言
- [ ] **API接口**：提供第三方集成API
- [ ] **移动应用**：开发原生移动应用

#### 8. 集成优化
- [ ] **更多AI模型**：集成其他AI模型作为备选
- [ ] **外部数据源**：连接权威医学数据库
- [ ] **协作功能**：多用户协作和分享功能

## 🔍 技术债务

### 1. 代码重构
- [ ] **组件拆分**：将大型组件拆分为更小的可复用组件
- [ ] **类型定义**：完善TypeScript类型定义
- [ ] **错误边界**：添加React错误边界处理

### 2. 测试覆盖
- [ ] **单元测试**：为核心功能添加单元测试
- [ ] **集成测试**：测试前后端集成
- [ ] **E2E测试**：端到端用户流程测试

### 3. 文档完善
- [ ] **API文档**：完善Edge Functions API文档
- [ ] **用户手册**：编写用户使用指南
- [ ] **开发者文档**：技术架构和开发指南

## 📈 项目里程碑

### 已完成 ✅
- [x] 基础架构搭建 (React + Supabase)
- [x] RAG聊天系统实现
- [x] 知识库管理功能
- [x] 文件上传和管理
- [x] 向量搜索和嵌入
- [x] 系统提示词更新为自闭症干预专家

### 进行中 🚧
- [ ] 界面主题完全更新
- [ ] 专业内容库建设
- [ ] 用户体验优化

### 计划中 📅
- [ ] 用户认证系统
- [ ] 高级分析功能
- [ ] 移动端优化

## 🎯 成功指标

### 技术指标
- **响应时间**：AI回答 < 3秒
- **准确率**：知识检索准确率 > 85%
- **可用性**：系统正常运行时间 > 99%

### 用户指标
- **用户满意度**：回答质量评分 > 4.0/5.0
- **使用频率**：日活跃用户增长
- **内容质量**：知识库内容专业度评估

---

**项目状态**：🚀 开发中 | **最后更新**：2025年1月 | **版本**：v1.0.0-beta
