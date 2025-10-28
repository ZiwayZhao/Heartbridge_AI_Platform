# HeartBridge - 自闭症干预知识助手

HeartBridge 是一个基于 RAG (检索增强生成) 的智能问答系统，专注于自闭症谱系障碍（ASD）的家庭干预指导和专业咨询服务。

## 🎯 项目概述

HeartBridge 将专业的自闭症干预知识库与 AI 对话系统结合，为家长、治疗师和看护者提供：
- 实时的专业干预建议和策略
- 基于证据的行为分析方法（ABA、TEACCH、SCERTS 等）
- 可操作的家庭训练技巧
- 结构化的知识管理系统

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
│   │   ├── MessageItem.tsx        # 单条消息组件
│   │   └── FilterControls.tsx     # 过滤器控件
│   ├── knowledge/          # 知识库管理组件
│   │   ├── KnowledgeTable.tsx     # 知识单元表格
│   │   ├── KnowledgeEditDialog.tsx # 编辑对话框
│   │   ├── KnowledgeDeleteDialog.tsx # 删除确认对话框
│   │   ├── CacheManager.tsx       # 缓存管理器
│   │   ├── DataSyncManager.tsx    # 数据同步管理器
│   │   └── QualityAssuranceService.tsx # 质量保证服务
│   ├── ui/                 # shadcn/ui 基础组件库
│   ├── HeartBridgeChat.tsx # 聊天功能包装组件
│   ├── WelcomeNotice.tsx   # 欢迎通知组件
│   ├── DashboardHeader.tsx # 仪表盘头部
│   └── ...
├── pages/                   # 页面组件
│   ├── HeartBridgeHome.tsx       # 首页
│   ├── KnowledgeManagement.tsx   # 知识库管理页面
│   ├── Index.tsx                 # 根页面
│   └── NotFound.tsx              # 404 页面
├── hooks/                   # React Hooks
│   ├── useHeartBridgeChat.tsx    # 聊天逻辑 Hook
│   ├── useAuth.tsx               # 认证 Hook
│   ├── useDatabaseConnection.tsx # 数据库连接 Hook
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
│   │   └── index.ts
│   └── heartbridge-upload-knowledge/ # 知识上传 API
│       └── index.ts
├── migrations/                     # 数据库迁移文件
│   └── [timestamps]_*.sql
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

### 后端技术栈

| 技术 | 用途 | 说明 |
|------|------|------|
| **Supabase** | 后端服务 | BaaS 平台 |
| **PostgreSQL** | 数据库 | 包含 pgvector 扩展 |
| **Deno** | Edge Functions 运行时 | TypeScript 原生支持 |
| **Lovable AI Gateway** | AI 服务 | Google Gemini 2.5 Flash |

---

## 🔧 核心功能实现

### 1. RAG 聊天系统 (`heartbridge-chat`)

**API 端点**: `/functions/v1/heartbridge-chat`

**实现文件**: `supabase/functions/heartbridge-chat/index.ts`

**处理流程**:

```typescript
用户问题 → 生成 Embedding 向量 → 向量数据库检索 → 上下文构建 → AI 生成回答
```

**关键步骤**:

1. **Embedding 生成** (行 41-57)
   - 使用确定性算法生成 1536 维向量
   - 基于字符码和单词位置的数学运算
   - 向量归一化处理

2. **向量搜索** (行 62-68)
   - 调用 `search_knowledge_units` RPC 函数
   - 余弦相似度匹配 (阈值: 0.7)
   - 返回最相关的 8 条知识

3. **上下文构建** (行 75-88)
   - 格式化检索结果
   - 区分 Q&A 对和普通内容
   - 添加类别信息

4. **AI 对话生成** (行 128-157)
   - 使用 Lovable AI Gateway
   - 模型: `google/gemini-2.5-flash`
   - System Prompt 定义专业身份和回答原则
   - User Prompt 包含知识库上下文

5. **会话记录** (行 160-171)
   - 保存到 `chat_history` 表
   - 记录问题、回答、来源和会话 ID

**错误处理**:
- Rate limiting (429)
- AI 服务配额 (402)
- 网络和服务异常 (500)

---

### 2. 知识上传系统 (`heartbridge-upload-knowledge`)

**API 端点**: `/functions/v1/heartbridge-upload-knowledge`

**实现文件**: `supabase/functions/heartbridge-upload-knowledge/index.ts`

**处理流程**:

```typescript
CSV 文件 → 解析数据 → 类别映射 → Embedding 生成 → 数据库插入
```

**关键功能**:

1. **类别映射** (行 9-21)
   ```typescript
   CSV 类别 → 数据库标准类别
   "Functional Communication Training" → "communication"
   "Emotional Regulation" → "behavior"
   "Teaching Waiting Skills" → "behavior"
   ```

2. **Embedding 向量生成** (行 25-42)
   - 本地生成，无需调用外部 API
   - 1536 维向量
   - 实时生成，无异步处理

3. **数据结构化** (行 96-117)
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

4. **批量插入** (行 119-132)
   - 逐条插入知识单元
   - 记录成功和失败数量
   - 详细错误日志

---

### 3. 知识库管理

**页面**: `src/pages/KnowledgeManagement.tsx`

**功能**:
- 查看所有知识单元
- 搜索和过滤
- 编辑 JSON 内容
- 删除知识单元
- 重新生成 Embedding

**组件结构**:

```
KnowledgeManagement
├── KnowledgeTable (列表展示)
│   ├── KnowledgeEditDialog (编辑)
│   └── KnowledgeDeleteDialog (删除)
└── Search Input (搜索框)
```

**核心操作**:

1. **编辑知识** (`KnowledgeEditDialog.tsx`)
   - JSON 编辑器
   - 实时预览
   - 自动重新生成 Embedding

2. **删除知识** (`KnowledgeDeleteDialog.tsx`)
   - 确认对话框
   - 级联删除相关数据

3. **搜索过滤** (`KnowledgeTable.tsx`)
   - 全文搜索 (content, entities, category)
   - 实时过滤结果

---

### 4. 聊天界面

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
  → 显示检索来源和统计信息
```

**多语言支持**:
- 中英文切换
- 欢迎消息本地化
- 错误提示本地化

**组件**: `src/components/chat/ChatInterface.tsx`

UI 功能:
- 消息列表滚动
- 输入框自适应高度
- 加载状态显示
- 清空对话
- 响应式布局

---

## 📊 数据库设计

### 核心表结构

#### 1. `knowledge_units` - 知识单元表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| content | TEXT | 内容（Question + Answer 或纯文本） |
| entities | JSONB | 结构化数据 (question, answer, category, id) |
| embedding | VECTOR(1536) | 向量表示 |
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

#### 2. `chat_history` - 聊天历史表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| session_id | TEXT | 会话 ID |
| user_id | UUID | 用户 ID (可为空) |
| message | TEXT | 用户消息 |
| response | TEXT | AI 回复 |
| sources | JSONB | 检索来源 |
| created_at | TIMESTAMPTZ | 时间戳 |

**RLS 策略**:
- 用户只能查看自己的聊天记录
- 用户只能插入自己的聊天记录

#### 3. `profiles` - 用户配置表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 关联认证用户 |
| email | TEXT | 邮箱 |
| full_name | TEXT | 全名 |
| language_preference | TEXT | 语言偏好 (en/zh) |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 更新时间 |

#### 4. `user_roles` - 用户角色表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户 ID |
| role | app_role | 角色枚举 (admin, parent) |

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

4. **本地 Supabase**:
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

---

## 🔐 安全和权限

### RLS (Row Level Security) 策略

1. **knowledge_units 表**:
   - 所有人可读 (SELECT)
   - 仅 admin 可写 (INSERT, UPDATE, DELETE)

2. **chat_history 表**:
   - 用户只能读写自己的记录

3. **profiles 表**:
   - 用户只能读写自己的资料

### API 密钥管理

- `LOVABLE_API_KEY`: Lovable AI Gateway 密钥（自动配置）
- 密钥存储在 Supabase Secrets 中
- Edge Functions 通过环境变量访问

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
类别映射 + Embedding 生成
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
生成 Query Embedding
  ↓
search_knowledge_units() 数据库函数
  ↓
检索相关知识 (向量相似度)
  ↓
构建上下文 Context
  ↓
调用 Lovable AI Gateway
  ↓
生成专业回答
  ↓
保存到 chat_history
  ↓
返回回答 + 来源 + 统计
  ↓
显示在聊天界面
```

---

## 🛠️ 开发指南

### 添加新的知识类别

1. 在 `heartbridge-upload-knowledge/index.ts` 的 `mapCategoryToDb()` 函数中添加映射
2. 更新数据库 category 枚举类型（如需要）
3. 在前端添加过滤选项

### 调整 AI 回答风格

编辑 `heartbridge-chat/index.ts` 的 `systemPrompt` (行 91-114):

```typescript
const systemPrompt = `You are HeartBridge AI...
🎯 Response Principles:
- [添加你的原则]
...
`;
```

### 修改向量搜索参数

在 `heartbridge-chat/index.ts` (行 62-68):

```typescript
const { data: searchResults } = await supabaseClient.rpc('search_knowledge_units', {
  query_embedding: queryEmbedding,
  match_threshold: 0.7,  // 相似度阈值 (0-1)
  match_count: 8,        // 返回数量
  ...
});
```

### 扩展 UI 组件

所有 UI 组件基于 shadcn/ui，位于 `src/components/ui/`。
可以通过以下命令添加新组件:

```bash
npx shadcn-ui@latest add [component-name]
```

---

## 📚 重要文件说明

| 文件路径 | 用途 | 关键内容 |
|----------|------|----------|
| `supabase/functions/heartbridge-chat/index.ts` | RAG 聊天 API | Embedding 生成、向量搜索、AI 对话 |
| `supabase/functions/heartbridge-upload-knowledge/index.ts` | 知识上传 API | CSV 解析、类别映射、批量插入 |
| `src/hooks/useHeartBridgeChat.tsx` | 聊天逻辑 Hook | 消息管理、API 调用、错误处理 |
| `src/components/chat/ChatInterface.tsx` | 聊天 UI 组件 | 消息显示、输入处理、状态管理 |
| `src/pages/KnowledgeManagement.tsx` | 知识管理页面 | CRUD 操作、搜索过滤 |
| `src/contexts/LanguageContext.tsx` | 多语言上下文 | 中英文切换、翻译字典 |
| `supabase/config.toml` | Supabase 配置 | Edge Functions 配置、认证设置 |
| `tailwind.config.ts` | Tailwind 配置 | 设计系统、主题定制 |

---

## 🧪 测试和调试

### 查看 Edge Function 日志

在 Lovable Cloud 后台:
1. 打开后端管理界面
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

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

开发前请:
1. Fork 本仓库
2. 创建特性分支
3. 提交代码并测试
4. 发起 Pull Request

---

## 📮 联系方式

如有问题或建议，请通过 Issue 或邮件联系项目维护者。

---

**最后更新**: 2025-10-28
**版本**: 1.0.0
**状态**: ✅ 生产就绪
