import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface UserRole {
  role: 'admin' | 'parent' | 'therapist';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isAdmin = userRoles.some(role => role.role === 'admin');

  useEffect(() => {
    let mounted = true;
    
    // 设置认证状态监听器
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // 先获取角色，然后再设置loading为false
          try {
            await Promise.all([
              fetchUserProfile(session.user.id),
              fetchUserRoles(session.user.id)
            ]);
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        } else {
          setProfile(null);
          setUserRoles([]);
          setLoading(false);
        }
      }
    );

    // 检查现有会话
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await Promise.all([
            fetchUserProfile(session.user.id),
            fetchUserRoles(session.user.id)
          ]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile({
          id: userId,
          full_name: user?.email?.split('@')[0] || 'User',
          email: user?.email || null
        });
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name,
          email: data.email
        });
      } else {
        setProfile({
          id: userId,
          full_name: user?.email?.split('@')[0] || 'User',
          email: user?.email || null
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile({
        id: userId,
        full_name: user?.email?.split('@')[0] || 'User',
        email: user?.email || null
      });
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        setUserRoles([]);
        return;
      }

      setUserRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setUserRoles([]);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string, inviteCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // 如果提供了邀请码，验证邀请码
    let assignedRole: 'admin' | 'parent' | 'therapist' | null = null;
    let codeData: any = null;
    
    if (inviteCode) {
      const { data, error: codeError } = await supabase
        .from('invite_codes')
        .select('*')
        .eq('code', inviteCode)
        .eq('is_active', true)
        .maybeSingle();

      if (codeError || !data) {
        toast({
          title: '错误',
          description: '邀请码无效或已过期',
          variant: 'destructive',
        });
        return { error: new Error('Invalid invite code') };
      }

      codeData = data;

      // 检查使用次数限制
      if (codeData.max_uses && codeData.used_count >= codeData.max_uses) {
        toast({
          title: '错误',
          description: '邀请码已达到使用次数上限',
          variant: 'destructive',
        });
        return { error: new Error('Invite code limit reached') };
      }

      // 检查过期时间
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        toast({
          title: '错误',
          description: '邀请码已过期',
          variant: 'destructive',
        });
        return { error: new Error('Invite code expired') };
      }

      assignedRole = codeData.role as 'admin' | 'parent' | 'therapist';
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || email.split('@')[0]
        }
      }
    });

    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }

    if (data.user) {
      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          user_id: data.user.id,
          full_name: fullName || email.split('@')[0],
          email: data.user.email,
        }]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // 如果有分配的角色，添加用户角色
      if (assignedRole && inviteCode && codeData) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: data.user.id,
            role: assignedRole,
          }]);

        if (roleError) {
          console.error('Error assigning role:', roleError);
        }

        // 更新邀请码使用次数
        const { error: updateError } = await supabase
          .from('invite_codes')
          .update({ used_count: codeData.used_count + 1 })
          .eq('code', inviteCode);

        if (updateError) {
          console.error('Error updating invite code:', updateError);
        }
      }

      toast({
        title: "Success",
        description: assignedRole === 'admin' 
          ? '管理员账户创建成功！' 
          : 'Account created successfully! Please check your email for verification.',
      });
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Sign Out Failed",
        description: error.message,
        variant: "destructive"
      });
    }

    return { error };
  };

  return {
    user,
    session,
    profile,
    userRoles,
    isAdmin,
    loading,
    signUp,
    signIn,
    signOut
  };
}
