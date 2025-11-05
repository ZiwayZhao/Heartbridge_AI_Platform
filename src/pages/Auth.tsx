import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, Loader2 } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });
  
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    inviteCode: '',
  });

  const texts = {
    en: {
      title: 'HeartBridge',
      subtitle: 'Professional Autism Intervention Platform',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      inviteCode: 'Invite Code (Optional)',
      inviteCodeHelper: 'Enter invite code for special permissions',
      signInButton: 'Sign In',
      signUpButton: 'Create Account',
      signInTab: 'Sign In',
      signUpTab: 'Sign Up',
      signInDescription: 'Sign in to your HeartBridge account',
      signUpDescription: 'Create a new HeartBridge account',
      passwordMismatch: 'Passwords do not match',
      fillAllFields: 'Please fill in all fields',
      emailInvalid: 'Please enter a valid email address',
      passwordTooShort: 'Password must be at least 6 characters',
    },
    zh: {
      title: 'HeartBridge 心桥',
      subtitle: '专业自闭症干预平台',
      signIn: '登录',
      signUp: '注册',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      fullName: '姓名',
      inviteCode: '邀请码（可选）',
      inviteCodeHelper: '如有邀请码可输入以获得特殊权限',
      signInButton: '登录',
      signUpButton: '创建账户',
      signInTab: '登录',
      signUpTab: '注册',
      signInDescription: '登录到您的 HeartBridge 账户',
      signUpDescription: '创建新的 HeartBridge 账户',
      passwordMismatch: '密码不匹配',
      fillAllFields: '请填写所有字段',
      emailInvalid: '请输入有效的邮箱地址',
      passwordTooShort: '密码至少需要6个字符',
    },
  };

  const t = texts[language];

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!signInData.email || !signInData.password) {
      setError(t.fillAllFields);
      return;
    }

    if (!validateEmail(signInData.email)) {
      setError(t.emailInvalid);
      return;
    }

    setIsLoading(true);
    try {
      await signIn(signInData.email, signInData.password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!signUpData.email || !signUpData.password || !signUpData.confirmPassword || !signUpData.fullName) {
      setError(t.fillAllFields);
      return;
    }

    if (!validateEmail(signUpData.email)) {
      setError(t.emailInvalid);
      return;
    }

    if (signUpData.password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setIsLoading(true);
    try {
      await signUp(
        signUpData.email, 
        signUpData.password, 
        signUpData.fullName,
        signUpData.inviteCode || undefined
      );
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">{t.title}</CardTitle>
          <CardDescription className="text-base">{t.subtitle}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">{t.signInTab}</TabsTrigger>
              <TabsTrigger value="signup">{t.signUpTab}</TabsTrigger>
            </TabsList>
            
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">{t.email}</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t.password}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.signInButton}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t.fullName}</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder={language === 'zh' ? '张三' : 'John Doe'}
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t.email}</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t.password}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">{t.confirmPassword}</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="signup-invite">{t.inviteCode}</Label>
                  <Input
                    id="signup-invite"
                    type="text"
                    placeholder="Upen666"
                    value={signUpData.inviteCode}
                    onChange={(e) => setSignUpData({ ...signUpData, inviteCode: e.target.value })}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">{t.inviteCodeHelper}</p>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t.signUpButton}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
