# 🚀 Vercel 部署指南

## 简单 3 步部署

### 1. 准备工作 ✅
- 代码已推送到 Git 仓库
- 项目使用 React + Vite + Supabase

### 2. 部署到 Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "New Project"
3. 导入您的 Git 仓库
4. Vercel 会自动检测为 Vite 项目
5. 点击 "Deploy"

### 3. 设置环境变量
在 Vercel Dashboard 的 Settings → Environment Variables 中添加：

```
VITE_SUPABASE_URL=https://ijrbyfpesocafkkwmfht.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🎉 完成！

- ✅ 前端：Vercel 托管
- ✅ 后端：Supabase 提供 API 和数据库
- ✅ 自动部署：Git 推送后自动更新

## 📝 注意事项

1. **环境变量必须以 `VITE_` 开头** 才能在前端访问
2. **Supabase 配置已经正确** 无需修改代码
3. **自定义域名** 可在 Vercel Dashboard 设置

就是这么简单！🌸
