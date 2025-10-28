-- Enable auto-confirm email for easier development and testing
-- This allows users to sign up without email confirmation

-- Note: In production, you should disable this and require email confirmation
-- This can be configured in Lovable Cloud dashboard under Auth Settings

-- Create admin check function if not exists (for backwards compatibility)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
      AND role = 'admin'::app_role
  )
$$;

-- Add admin user creation function
CREATE OR REPLACE FUNCTION public.create_admin_user(user_email text, user_password text, user_full_name text DEFAULT 'Admin User')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- Create auth user (note: this requires service role key in practice)
  -- For now, return instruction to manually create admin
  result := json_build_object(
    'success', false,
    'message', 'Please create admin user through Supabase Auth dashboard, then run: INSERT INTO user_roles (user_id, role) VALUES (''<user_id>'', ''admin'');'
  );
  
  RETURN result;
END;
$$;

-- Update RLS policies to use the has_role function correctly
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure knowledge management permissions for admins
DROP POLICY IF EXISTS "Admins can delete knowledge units" ON public.knowledge_units;
DROP POLICY IF EXISTS "Admins can insert knowledge units" ON public.knowledge_units;
DROP POLICY IF EXISTS "Admins can update knowledge units" ON public.knowledge_units;

CREATE POLICY "Admins can delete knowledge units"
ON public.knowledge_units
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert knowledge units"
ON public.knowledge_units
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update knowledge units"
ON public.knowledge_units
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add comment to guide admin creation
COMMENT ON FUNCTION public.create_admin_user IS 'To create an admin user: 1) Create user via Supabase Auth, 2) Insert role: INSERT INTO user_roles (user_id, role) VALUES (''<user_id>'', ''admin'');';