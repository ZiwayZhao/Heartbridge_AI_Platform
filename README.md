# HeartBridge - 自闭症干预智能助手平台

HeartBridge 是一个基于 RAG (检索增强生成) 的智能问答系统，专注于自闭症谱系障碍（ASD）的家庭干预指导和专业 BCBA 咨询服务。

## 🎯 项目概述

HeartBridge 将专业的自闭症干预知识库、AI 对话系统和 BCBA 咨询师资源整合，为家长、治疗师和看护者提供：
- 💬 实时的专业干预建议和策略（基于知识库的 RAG 问答）
- 👨‍⚕️ 经过认证的 BCBA 咨询师信息和联系方式
- 📚 基于证据的行为分析方法（ABA、TEACCH、SCERTS 等）
- 🏠 可操作的家庭训练技巧
- 🔧 结构化的知识管理系统
- 💾 聊天历史记忆功能

---

## ✨ 核心功能

### 1. RAG 智能问答系统
- 基于向量数据库的语义检索
- OpenAI Embeddings (text-embedding-3-small)
- Google Gemini 2.5 Flash AI 模型
- 实时知识检索与上下文增强
- 支持中英文对话
- 自动保存聊天历史

### 2. BCBA 咨询师展示
- 展示经过认证的 BCBA 专业咨询师
- 包含详细信息：经验年限、专长领域、收费标准、联系方式
- 用户可直接通过邮件或电话联系咨询师
- 支持咨询师主页展示和管理后台

### 3. 知识库管理系统
- 管理员可上传、编辑、删除知识单元
- CSV/Excel 批量导入
- 自动向量化（OpenAI Embeddings）
- 分类和重要性标签
- 全文搜索和过滤
- 重新索引功能

### 4. 用户系统
- 邮箱密码注册登录
- 基于角色的访问控制（管理员/普通用户）
- 用户配置管理
- 聊天历史持久化

---

## 📁 项目结构

### 前端 (Frontend) - React + TypeScript

```
src/
├── components/              # React 组件
│   ├── chat/               # 聊天相关组件
│   │   ├── ChatInterface.tsx      # 聊天界面主组件
│   │   ├── ChatInput.tsx          # 聊天输入组件
│   │   ├── MessageList.tsx        # 消息列表组件
│   │   ├── MessageItem.tsx        # 单条消息组件（支持 Markdown 渲染）
│   │   └── FilterControls.tsx     # 过滤器控件
│   ├── knowledge/          # 知识库管理组件
│   │   ├── KnowledgeTable.tsx          # 知识单元表格
│   │   ├── KnowledgeEditDialog.tsx     # 编辑对话框
│   │   ├── KnowledgeDeleteDialog.tsx   # 删除确认对话框
│   │   ├── AnalysisService.tsx         # 分析服务
│   │   ├── CacheManager.tsx            # 缓存管理器
│   │   ├── DataSyncManager.tsx         # 数据同步管理器
│   │   └── QualityAssuranceService.tsx # 质量保证服务
│   ├── ui/                 # shadcn/ui 基础组件库
│   ├── HeartBridgeChat.tsx # 聊天功能包装组件
│   ├── AppSidebar.tsx      # 应用侧边栏导航
│   ├── DashboardHeader.tsx # 仪表盘头部
│   ├── UserMenu.tsx        # 用户菜单
│   ├── UserAvatar.tsx      # 用户头像
│   ├── FireLogo.tsx        # 应用 Logo
│   └── ...
├── pages/                   # 页面组件
│   ├── HeartBridgeHome.tsx       # 首页（聊天界面）
│   ├── BCBAConsultants.tsx       # BCBA 咨询师展示页
│   ├── BCBAManagement.tsx        # BCBA 咨询师管理页（管理员）
│   ├── KnowledgeManagement.tsx   # 知识库管理页面（管理员）
│   ├── Auth.tsx                  # 登录注册页面
│   ├── Settings.tsx              # 用户设置页面
│   ├── Profile.tsx               # 用户资料页面
│   └── NotFound.tsx              # 404 页面
├── hooks/                   # React Hooks
│   ├── useHeartBridgeChat.tsx    # 聊天逻辑 Hook（含历史加载）
│   ├── useAuth.tsx               # 认证 Hook
│   ├── useDatabaseConnection.tsx # 数据库连接 Hook
│   ├── useReindexKnowledge.tsx   # 知识重新索引 Hook
│   └── use-toast.ts              # Toast 通知 Hook
├── contexts/               # React Context
│   └── LanguageContext.tsx       # 多语言上下文（中英文切换）
├── integrations/           # 第三方集成
│   └── supabase/
│       ├── client.ts             # Supabase 客户端配置
│       └── types.ts              # 数据库类型定义（自动生成）
├── utils/                  # 工具函数
│   ├── csvParser.ts              # CSV 文件解析
│   └── excelParser.ts            # Excel 文件解析
├── lib/                    # 库文件
│   ├── utils.ts                  # 通用工具函数
│   └── pdfProcessor.ts           # PDF 文件处理
├── constants/              # 常量定义
│   └── chatOptions.ts            # 聊天选项配置
└── index.css               # 全局样式（Tailwind CSS）
```

### 后端 (Backend) - Supabase Edge Functions

```
supabase/
├── functions/                      # Edge Functions (Deno)
│   ├── heartbridge-chat/          # RAG 聊天 API
│   │   └── index.ts               # 问答处理、向量检索、AI 生成
│   ├── heartbridge-upload-knowledge/ # 知识上传 API
│   │   └── index.ts               # CSV 解析、向量化、批量插入
│   └── reindex-knowledge/         # 知识重新索引 API
│       └── index.ts               # 重新生成所有 Embeddings
├── migrations/                     # 数据库迁移文件
│   └── [timestamps]_*.sql         # SQL 迁移脚本
└── config.toml                     # Supabase 项目配置
```

---

## 🏗️ 技术架构

### 前端技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| **React** | UI 框架 | 18.3.1 |
| **TypeScript** | 类型安全 | Latest |
| **Vite** | 构建工具 | Latest |
| **Tailwind CSS** | 样式框架 | Latest |
| **shadcn/ui** | UI 组件库 | Latest |
| **React Router** | 路由管理 | 6.26.2 |
| **Supabase Client** | 后端通信 | 2.76.1 |
| **Tanstack Query** | 数据获取 | 5.56.2 |
| **React Markdown** | Markdown 渲染 | 10.1.0 |
| **remark-gfm** | GitHub Flavored Markdown | 4.0.1 |

### 后端技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| **Supabase** | 后端服务 | BaaS 平台 |
| **PostgreSQL** | 数据库 | 包含 pgvector 扩展 |
| **Deno** | Edge Functions 运行时 | TypeScript 原生支持 |
| **OpenAI API** | Embeddings 生成 | text-embedding-3-small |
| **Lovable AI Gateway** | AI 对话 | Google Gemini 2.5 Flash |

---

## 🔧 核心功能实现

### 1. RAG 聊天系统 (`heartbridge-chat`)

**API 端点**: `/functions/v1/heartbridge-chat`

**实现文件**: `supabase/functions/heartbridge-chat/index.ts`

**处理流程**:

```
用户问题 → OpenAI Embedding → 向量数据库检索 → 上下文构建 → Gemini AI 生成回答 → 保存历史
```

**关键步骤**:

1. **Embedding 生成** (行 41-65)
   - 调用 OpenAI API 生成 1536 维向量
   - 模型：`text-embedding-3-small`
   - 格式：`float` (非量化)

2. **向量搜索** (行 68-93)
   - 调用 `search_knowledge_units` RPC 函数
   - 余弦相似度匹配 (阈值: 0.5)
   - 返回最相关的 8 条知识

3. **上下文构建** (行 96-109)
   - 格式化检索结果
   - 区分 Q&A 对和普通内容
   - 添加类别信息

4. **AI 对话生成** (行 112-178)
   - 使用 Lovable AI Gateway
   - 模型: `google/gemini-2.5-flash`
   - System Prompt 定义专业身份和回答原则
   - User Prompt 包含知识库上下文

5. **会话记录** (行 181-192)
   - 保存到 `chat_history` 表
   - 记录问题、回答、来源和会话 ID
   - 仅保存认证用户的历史

**错误处理**:
- Rate limiting (429)
- AI 服务配额 (402)
- 网络和服务异常 (500)

---

### 2. 知识上传系统 (`heartbridge-upload-knowledge`)

**API 端点**: `/functions/v1/heartbridge-upload-knowledge`

**实现文件**: `supabase/functions/heartbridge-upload-knowledge/index.ts`

**处理流程**:

```
CSV 文件 → 解析数据 → 类别映射 → OpenAI Embedding → 数据库插入
```

**关键功能**:

1. **类别映射**
   ```typescript
   CSV 类别 → 数据库标准类别
   "Functional Communication Training" → "communication"
   "Emotional Regulation" → "behavior"
   ```

2. **Embedding 向量生成**
   - 使用 OpenAI API
   - 模型：`text-embedding-3-small`
   - 1536 维向量

3. **数据结构化**
   ```typescript
   {
     content: "Question: xxx\nAnswer: yyy",
     entities: {
       question: "xxx",
       answer: "yyy",
       category: "原始类别",
       id: "问题ID"
     },
     category: "映射后的类别",
     source_name: "文件名",
     data_type: "qa" | "text",
     embedding: [1536 维向量]
   }
   ```

4. **批量插入**
   - 逐条插入知识单元
   - 记录成功和失败数量
   - 详细错误日志

---

### 3. 重新索引系统 (`reindex-knowledge`)

**API 端点**: `/functions/v1/reindex-knowledge`

**实现文件**: `supabase/functions/reindex-knowledge/index.ts`

**功能**:
- 批量重新生成所有知识单元的 Embeddings
- 使用 OpenAI API 确保向量一致性
- 提供进度反馈和错误处理

**使用场景**:
- 修复旧的模拟 Embeddings
- 切换 Embedding 模型后重新索引
- 知识库数据迁移

---

### 4. BCBA 咨询师系统

**展示页面**: `src/pages/BCBAConsultants.tsx`
**管理页面**: `src/pages/BCBAManagement.tsx` (仅管理员)

**功能特性**:

1. **咨询师信息展示**
   - 姓名、职称、个人简介
   - 从业年限
   - 专长领域（标签显示）
   - 收费标准
   - 联系方式（邮箱、电话）

2. **管理功能**（管理员专用）
   - 添加新咨询师
   - 编辑咨询师信息
   - 删除咨询师
   - 设置显示顺序
   - 激活/停用咨询师

3. **数据结构**
   ```typescript
   {
     name: string;
     title: string;
     bio: string;
     specialties: string[];      // 专长领域
     contact_email: string;
     contact_phone: string;
     pricing: string;
     experience_years: number;
     is_active: boolean;         // 是否激活
     display_order: number;      // 显示顺序
   }
   ```

---

### 5. 聊天历史记忆功能

**实现位置**: `src/hooks/useHeartBridgeChat.tsx`

**功能特性**:
- 用户登录后自动加载历史聊天记录
- 从 `chat_history` 表读取最近 50 条记录
- 按时间顺序恢复对话
- 新消息自动保存到数据库
- 支持清空当前会话

**数据流**:
```
用户登录 → 加载历史 (chat_history 表) → 显示历史消息 → 新对话自动保存
```

---

### 6. 知识库管理

**页面**: `src/pages/KnowledgeManagement.tsx`

**功能**:
- 查看所有知识单元
- 搜索和过滤
- 编辑 JSON 内容
- 删除知识单元
- 重新生成 Embedding（调用 reindex-knowledge API）

**组件结构**:

```
KnowledgeManagement
├── Reindex Button (重新索引所有向量)
├── Search Input (搜索框)
└── KnowledgeTable (列表展示)
    ├── KnowledgeEditDialog (编辑)
    └── KnowledgeDeleteDialog (删除)
```

---

### 7. 聊天界面

**核心 Hook**: `src/hooks/useHeartBridgeChat.tsx`

**状态管理**:

```typescript
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{...}>;  // 检索到的知识来源
  retrievedCount?: number;  // 检索数量
  processingTime?: number;  // 处理时间
}
```

**消息流**:

```typescript
sendMessage()
  → 添加用户消息到状态
  → 调用 heartbridge-chat API
  → 接收 AI 回复
  → 添加助手消息到状态
  → 保存到 chat_history
  → 显示检索来源和统计信息
```

**多语言支持**:
- 中英文切换
- 欢迎消息本地化
- 错误提示本地化

**Markdown 渲染** (`MessageItem.tsx`):
- 使用 `react-markdown` 渲染 AI 回复
- 支持 GitHub Flavored Markdown (GFM)
- 自动样式化：加粗、斜体、列表、代码块等

---

## 📊 数据库设计

### 核心表结构

#### 1. `knowledge_units` - 知识单元表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| content | TEXT | 内容（Question + Answer 或纯文本） |
| entities | JSONB | 结构化数据 (question, answer, category, id) |
| embedding | VECTOR(1536) | OpenAI 向量表示 |
| category | TEXT | 类别 (communication, behavior, etc.) |
| source_name | TEXT | 来源文件名 |
| data_type | TEXT | 数据类型 (qa, text) |
| tags | TEXT[] | 标签数组 |
| importance | TEXT | 重要性级别 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**索引**:
- HNSW 向量索引 (用于相似度搜索)
- category, source_name, data_type 上的 B-tree 索引

**RLS 策略**:
- 所有人可读（SELECT）
- 仅管理员可写（INSERT, UPDATE, DELETE）

#### 2. `chat_history` - 聊天历史表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| session_id | TEXT | 会话 ID |
| user_id | UUID | 用户 ID |
| message | TEXT | 用户消息 |
| response | TEXT | AI 回复 |
| sources | JSONB | 检索来源 |
| created_at | TIMESTAMPTZ | 时间戳 |

**RLS 策略**:
- 用户只能查看自己的聊天记录（SELECT）
- 用户只能插入自己的聊天记录（INSERT）

#### 3. `bcba_consultants` - BCBA 咨询师表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | TEXT | 姓名 |
| title | TEXT | 职称 |
| bio | TEXT | 个人简介 |
| specialties | TEXT[] | 专长领域 |
| contact_email | TEXT | 联系邮箱 |
| contact_phone | TEXT | 联系电话 |
| pricing | TEXT | 收费标准 |
| experience_years | INTEGER | 从业年限 |
| avatar_url | TEXT | 头像 URL |
| is_active | BOOLEAN | 是否激活 |
| display_order | INTEGER | 显示顺序 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**RLS 策略**:
- 所有人可查看激活的咨询师（SELECT WHERE is_active = true）
- 仅管理员可管理（INSERT, UPDATE, DELETE）

#### 4. `profiles` - 用户配置表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联认证用户 |
| email | TEXT | 邮箱 |
| full_name | TEXT | 全名 |
| language_preference | TEXT | 语言偏好 (en/zh) |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

**RLS 策略**:
- 用户只能读写自己的资料

#### 5. `user_roles` - 用户角色表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| role | app_role | 角色枚举 (admin, therapist, parent) |

**RLS 策略**:
- 用户可查看自己的角色
- 管理员可管理所有角色

### 数据库函数

#### `search_knowledge_units()` - 向量搜索函数

```sql
CREATE FUNCTION search_knowledge_units(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10,
  filter_category TEXT DEFAULT NULL,
  filter_importance TEXT DEFAULT NULL
) RETURNS TABLE (...)
```

**功能**:
- 基于余弦相似度的向量搜索
- 可选的类别和重要性过滤
- 返回相似度分数
- 排序和限制结果数量

#### `has_role()` - 角色检查函数

```sql
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
```

**功能**:
- 检查用户是否具有特定角色
- 用于 RLS 策略和权限控制

---

## 🚀 部署和运行

### 本地开发

1. **安装依赖**:
   ```bash
   npm install
   ```

2. **环境变量**:
   创建 `.env` 文件 (由 Supabase 自动生成):
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
   VITE_SUPABASE_PROJECT_ID=your_project_id
   ```

3. **启动开发服务器**:
   ```bash
   npm run dev
   ```

4. **本地 Supabase** (可选):
   ```bash
   npx supabase start
   npx supabase functions serve
   ```

### 生产部署

**前端**:
- 通过 Lovable 平台自动部署
- 或使用 `npm run build` 生成静态文件

**后端**:
- Edge Functions 自动部署到 Supabase
- 数据库迁移自动应用

### 必需的环境变量（Supabase Secrets）

在 Supabase 项目中配置以下 Secrets：

- `LOVABLE_API_KEY`: Lovable AI Gateway 密钥（自动配置）
- `OPENAI_API_KEY`: OpenAI API 密钥（用于 Embeddings 生成）
- `SUPABASE_URL`: Supabase 项目 URL（自动配置）
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 服务角色密钥（自动配置）
- `SUPABASE_ANON_KEY`: Supabase 匿名密钥（自动配置）

---

## 🔐 安全和权限

### RLS (Row Level Security) 策略

1. **knowledge_units 表**:
   - 所有人可读 (SELECT)
   - 仅 admin 可写 (INSERT, UPDATE, DELETE)

2. **chat_history 表**:
   - 用户只能读写自己的记录

3. **bcba_consultants 表**:
   - 所有人可查看激活的咨询师
   - 仅 admin 可管理所有咨询师

4. **profiles 表**:
   - 用户只能读写自己的资料

5. **user_roles 表**:
   - 用户可查看自己的角色
   - 管理员可管理所有角色

### 认证流程

1. **注册**:
   - 邮箱密码注册
   - 自动创建 profile 记录
   - 默认分配 `parent` 角色
   - 触发器：`handle_new_user()`

2. **登录**:
   - Supabase Auth 验证
   - JWT Token 管理
   - 会话持久化（localStorage）

3. **权限检查**:
   - 基于 `user_roles` 表
   - RLS 策略自动执行
   - 前端路由保护（ProtectedRoute、AdminRoute）

---

## 📝 数据流程图

### 上传知识流程

```
CSV 文件
  ↓
前端上传 (KnowledgeManagement.tsx)
  ↓
heartbridge-upload-knowledge API
  ↓ 
类别映射 + OpenAI Embedding 生成
  ↓
插入 knowledge_units 表
  ↓
返回成功/失败统计
```

### 聊天查询流程

```
用户提问
  ↓
ChatInterface.tsx
  ↓
useHeartBridgeChat Hook
  ↓
heartbridge-chat API
  ↓
生成 Query Embedding (OpenAI)
  ↓
search_knowledge_units() 数据库函数
  ↓
检索相关知识 (向量相似度 > 0.5)
  ↓
构建上下文 Context
  ↓
调用 Lovable AI Gateway (Gemini 2.5 Flash)
  ↓
生成专业回答
  ↓
保存到 chat_history
  ↓
返回回答 + 来源 + 统计
  ↓
显示在聊天界面（Markdown 渲染）
```

### 聊天历史加载流程

```
用户登录
  ↓
useHeartBridgeChat Hook 初始化
  ↓
查询 chat_history 表（最近 50 条）
  ↓
按时间排序恢复消息
  ↓
显示历史对话
  ↓
新对话自动追加到历史
```

---

## 🛠️ 开发指南

### 添加新的知识类别

1. 在 `heartbridge-upload-knowledge/index.ts` 的 `mapCategoryToDb()` 函数中添加映射
2. 更新数据库 category 枚举类型（如需要）
3. 在前端添加过滤选项

### 调整 AI 回答风格

编辑 `heartbridge-chat/index.ts` 的 `systemPrompt` (行 112-135):

```typescript
const systemPrompt = `You are HeartBridge AI...
🎯 Response Principles:
- [添加你的原则]
...
`;
```

### 修改向量搜索参数

在 `heartbridge-chat/index.ts` (行 75-81):

```typescript
const { data: searchResults } = await supabaseClient.rpc('search_knowledge_units', {
  query_embedding: queryEmbedding,
  match_threshold: 0.5,  // 相似度阈值 (0-1)
  match_count: 8,        // 返回数量
  ...
});
```

### 添加新的 BCBA 咨询师

**方式一：通过管理界面**（推荐）
1. 以管理员身份登录
2. 访问 `/bcba-management` 页面
3. 点击"添加咨询师"按钮
4. 填写表单并保存

**方式二：通过数据库**
```sql
INSERT INTO bcba_consultants (
  name, title, bio, specialties, 
  contact_email, contact_phone, pricing, 
  experience_years, is_active, display_order
) VALUES (
  'Dr. Smith', 'BCBA-D', '专业自闭症干预专家',
  ARRAY['ABA', '社交技能训练'], 
  'smith@example.com', '123-456-7890', '500元/小时',
  10, true, 1
);
```

### 扩展 UI 组件

所有 UI 组件基于 shadcn/ui，位于 `src/components/ui/`。
可以通过以下命令添加新组件:

```bash
npx shadcn-ui@latest add [component-name]
```

---

## 🧪 功能测试

### 测试清单

#### 1. 登录功能测试
- ✅ 用户可以注册新账号
- ✅ 用户可以登录现有账号  
- ✅ 登录后自动跳转到主页
- ✅ 未登录用户访问主页自动跳转到登录页
- ✅ 会话持久化（刷新页面保持登录状态）
- ✅ 登出功能正常

#### 2. RAG 检索功能测试

**测试问题（知识库中应有答案）：**
- "自闭症儿童在遇到困难时常见的行为反应是什么？"
- "教孩子说帮我时，强化策略应该怎样安排？"
- "当孩子情绪激动时，家长应如何应对？"

**预期结果：**
- ✅ AI 能检索到知识库中的相关内容
- ✅ 回答准确且基于知识库数据
- ✅ 回答包含具体的干预策略
- ✅ 回答使用 Markdown 格式（加粗、列表等）

#### 3. 聊天历史测试
- ✅ 用户登录后自动加载历史聊天
- ✅ 新对话自动保存到数据库
- ✅ 刷新页面后历史仍然可见
- ✅ 不同用户之间历史隔离
- ✅ 清空对话功能正常

#### 4. BCBA 咨询师功能测试
- ✅ 普通用户可以查看咨询师列表
- ✅ 咨询师信息完整显示
- ✅ 联系方式（邮箱/电话）可点击
- ✅ 管理员可以添加/编辑/删除咨询师
- ✅ 激活/停用状态正确控制显示

#### 5. 数据库交互测试
- ✅ 聊天记录正确保存到数据库
- ✅ RLS 策略正确限制数据访问
- ✅ 管理员可以访问知识库管理
- ✅ 管理员可以访问咨询师管理
- ✅ 普通用户无法访问管理功能

#### 6. 多语言测试
- ✅ 中英文界面切换正常
- ✅ 两种语言下所有功能正常
- ✅ 语言偏好持久化保存

### 创建管理员账号

**第一步：注册账号**
访问 `/auth` 页面，使用邮箱注册账号

**第二步：分配管理员角色**
```sql
-- 查找刚注册的用户 ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 分配管理员角色（替换 YOUR_USER_ID）
INSERT INTO public.user_roles (user_id, role) 
VALUES ('YOUR_USER_ID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 验证角色分配
SELECT public.has_role('YOUR_USER_ID', 'admin');
```

详细测试指南请参考：`tests/integration/test-rag.md`

---

## 📚 重要文件说明

| 文件路径 | 用途 | 关键内容 |
|----------|------|----------|
| `supabase/functions/heartbridge-chat/index.ts` | RAG 聊天 API | OpenAI Embedding、向量搜索、Gemini AI 对话 |
| `supabase/functions/heartbridge-upload-knowledge/index.ts` | 知识上传 API | CSV 解析、类别映射、批量插入 |
| `supabase/functions/reindex-knowledge/index.ts` | 重新索引 API | 批量重新生成 Embeddings |
| `src/hooks/useHeartBridgeChat.tsx` | 聊天逻辑 Hook | 消息管理、历史加载、API 调用 |
| `src/components/chat/ChatInterface.tsx` | 聊天 UI 组件 | 消息显示、输入处理 |
| `src/components/chat/MessageItem.tsx` | 消息项组件 | Markdown 渲染、来源显示 |
| `src/pages/BCBAConsultants.tsx` | 咨询师展示页 | 公开展示 BCBA 信息 |
| `src/pages/BCBAManagement.tsx` | 咨询师管理页 | 管理员 CRUD 操作 |
| `src/pages/KnowledgeManagement.tsx` | 知识管理页面 | CRUD 操作、搜索过滤、重新索引 |
| `src/contexts/LanguageContext.tsx` | 多语言上下文 | 中英文切换、翻译字典 |
| `supabase/config.toml` | Supabase 配置 | Edge Functions 配置、认证设置 |
| `tailwind.config.ts` | Tailwind 配置 | 设计系统、主题定制 |

---

## 🧪 测试和调试

### 查看 Edge Function 日志

在 Lovable Cloud 后台:
1. 点击 <lov-open-backend>View Backend</lov-open-backend>
2. 选择对应的 Edge Function
3. 查看实时日志

### 数据库查询

使用 Supabase SQL Editor 或通过代码:

```typescript
const { data, error } = await supabase
  .from('knowledge_units')
  .select('*')
  .limit(10);
```

### 前端调试

浏览器控制台会显示:
- API 调用日志
- 错误堆栈
- 网络请求详情

---

## 🎨 设计系统

项目使用 Tailwind CSS 和 shadcn/ui 构建设计系统：

- **颜色方案**: 定义在 `src/index.css` 中的 CSS 变量
- **组件库**: shadcn/ui 基础组件 (`src/components/ui/`)
- **响应式**: 移动优先设计，支持所有设备
- **暗色模式**: 完整支持（通过 `next-themes`）

---

## 📋 路由结构

| 路径 | 页面 | 权限要求 | 说明 |
|------|------|----------|------|
| `/` | HeartBridgeHome | 登录用户 | 主页和聊天界面 |
| `/auth` | Auth | 公开 | 登录注册页面 |
| `/consultants` | BCBAConsultants | 登录用户 | BCBA 咨询师展示 |
| `/bcba-management` | BCBAManagement | 管理员 | BCBA 咨询师管理 |
| `/knowledge` | KnowledgeManagement | 管理员 | 知识库管理 |
| `/settings` | Settings | 登录用户 | 用户设置 |
| `/profile` | Profile | 登录用户 | 用户资料 |

---

## 🔄 版本历史

### v2.0.0 (2025-11-01)
- ✨ 新增 BCBA 咨询师展示和管理功能
- ✨ 新增聊天历史记忆功能
- ✨ 新增 Markdown 渲染支持
- 🔧 修复聊天历史加载逻辑
- 🗑️ 移除冗余文件（Index.tsx, ChatInput.tsx）

### v1.0.0 (2025-10-28)
- 🎉 初始版本发布
- ✅ RAG 聊天系统
- ✅ 知识库管理
- ✅ 用户认证系统
- ✅ 多语言支持

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

开发前请:
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交代码并测试 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

---

## 📮 联系方式

如有问题或建议，请通过 Issue 或邮件联系项目维护者。

---

## 🙏 致谢

- OpenAI - Embeddings API
- Google Gemini - AI 对话模型
- Supabase - 后端基础设施
- Lovable - 开发平台和 AI Gateway
- shadcn/ui - UI 组件库

---

**最后更新**: 2025-11-01  
**版本**: 2.0.0  
**状态**: ✅ 生产就绪
