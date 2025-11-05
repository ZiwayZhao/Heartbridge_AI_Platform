import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';

export default function Profile() {
  const { user, profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');

  const texts = {
    en: {
      title: 'Profile',
      description: 'Manage your profile information',
      back: 'Back to Home',
      fullName: 'Full Name',
      email: 'Email',
      emailNote: 'Email cannot be changed',
      save: 'Save Changes',
      saving: 'Saving...',
      success: 'Profile updated successfully',
      error: 'Failed to update profile',
    },
    zh: {
      title: '个人资料',
      description: '管理您的个人信息',
      back: '返回首页',
      fullName: '姓名',
      email: '邮箱',
      emailNote: '邮箱无法修改',
      save: '保存修改',
      saving: '保存中...',
      success: '资料更新成功',
      error: '资料更新失败',
    },
  };

  const t = texts[language];

  const handleSave = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t.success,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: t.error,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">{t.emailNote}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">{t.fullName}</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button onClick={handleSave} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                  {t.saving}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t.save}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
