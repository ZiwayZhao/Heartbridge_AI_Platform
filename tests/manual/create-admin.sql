-- 手动创建管理员用户的 SQL 脚本
-- 注意：首先需要通过 Supabase Auth 创建用户，然后获取 user_id

-- 步骤1: 通过 Supabase Auth 注册用户后，查找用户 ID
-- SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- 步骤2: 将用户设置为管理员（替换 'YOUR_USER_ID' 为实际的用户 ID）
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('YOUR_USER_ID', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- 步骤3: 验证管理员角色
-- SELECT u.email, ur.role 
-- FROM auth.users u
-- JOIN public.user_roles ur ON u.id = ur.user_id
-- WHERE ur.role = 'admin';

-- 或使用 has_role 函数验证
-- SELECT public.has_role('YOUR_USER_ID', 'admin');
