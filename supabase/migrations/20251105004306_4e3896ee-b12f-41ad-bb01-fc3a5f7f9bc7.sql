-- 创建邀请码表
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'parent',
  max_uses integer DEFAULT NULL,
  used_count integer DEFAULT 0,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

-- 启用 RLS
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- 管理员可以管理邀请码
CREATE POLICY "Admins can manage invite codes"
ON public.invite_codes
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- 所有人可以查看激活的邀请码（用于验证）
CREATE POLICY "Anyone can view active invite codes"
ON public.invite_codes
FOR SELECT
TO anon
USING (is_active = true);

-- 插入管理员邀请码
INSERT INTO public.invite_codes (code, role, max_uses, is_active)
VALUES ('Upen666', 'admin', NULL, true)
ON CONFLICT (code) DO NOTHING;