import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';

export default function Settings() {
  const { user, profile } = useAuth();
  const { language, setLanguage } = useLanguage();

  const texts = {
    en: {
      title: 'Settings',
      description: 'Manage your preferences',
      back: 'Back to Home',
      languageLabel: 'Language',
      languageDescription: 'Select your preferred language',
      english: 'English',
      chinese: '中文',
      accountInfo: 'Account Information',
      email: 'Email',
      name: 'Name',
    },
    zh: {
      title: '设置',
      description: '管理您的偏好设置',
      back: '返回首页',
      languageLabel: '语言',
      languageDescription: '选择您偏好的语言',
      english: 'English',
      chinese: '中文',
      accountInfo: '账户信息',
      email: '邮箱',
      name: '姓名',
    },
  };

  const t = texts[language];

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t.accountInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t.email}</Label>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="space-y-2">
              <Label>{t.name}</Label>
              <p className="text-sm text-muted-foreground">{profile?.full_name || 'Not set'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.languageLabel}</CardTitle>
            <CardDescription>{t.languageDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={(value: 'en' | 'zh') => setLanguage(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t.english}</SelectItem>
                <SelectItem value="zh">{t.chinese}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
