
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255, 'Email too long'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password too long'),
  username: z.string().trim().min(2, 'Username must be at least 2 characters').max(50, 'Username too long').optional()
});

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const errors = result.error.errors.map(e => e.message).join(', ');
      toast({
        title: 'Validation Error',
        description: errors,
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(result.data.email, result.data.password);
    
    if (!error) {
      onOpenChange(false);
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    const result = authSchema.safeParse({ email, password, username });
    if (!result.success) {
      const errors = result.error.errors.map(e => e.message).join(', ');
      toast({
        title: 'Validation Error',
        description: errors,
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(result.data.email, result.data.password, result.data.username);
    
    if (!error) {
      onOpenChange(false);
    }
    
    setIsLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const errors = result.error.errors.map(e => e.message).join(', ');
      toast({
        title: 'Validation Error',
        description: errors,
        variant: 'destructive'
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(result.data.email, result.data.password);
    
    if (!error) {
      onOpenChange(false);
      // Redirect will happen based on user role
      window.location.href = '/admin';
    }
    
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {showAdminLogin ? '管理员登录' : '用户登录'}
          </DialogTitle>
          <DialogDescription>
            {showAdminLogin 
              ? '请输入管理员账户信息访问后台管理系统'
              : '登录或注册以使用AI问答功能'
            }
          </DialogDescription>
        </DialogHeader>

        {showAdminLogin ? (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">管理员邮箱</Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">管理员密码</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                required
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? '登录中...' : '管理员登录'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdminLogin(false)}
                className="w-full"
              >
                返回普通登录
              </Button>
            </div>
          </form>
        ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">邮箱</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">密码</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? '登录中...' : '登录'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">用户名</Label>
                  <Input
                    id="register-username"
                    name="username"
                    placeholder="您的用户名"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">邮箱</Label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">密码</Label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? '注册中...' : '注册'}
                </Button>
              </form>
            </TabsContent>

            <div className="mt-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdminLogin(true)}
                className="w-full"
              >
                管理员登录
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
