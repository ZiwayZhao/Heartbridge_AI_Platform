import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/UserMenu';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">{t.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/')} variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.back}
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>

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
    </div>
  );
}
