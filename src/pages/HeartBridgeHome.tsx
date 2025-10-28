import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings,
  Heart,
  Brain,
  Users,
  Database
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import HeartBridgeChat from '@/components/HeartBridgeChat';
import { useNavigate } from 'react-router-dom';

export default function HeartBridgeHome() {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-16">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('app.name')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('app.tagline')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/knowledge')}
                className="text-blue-600 hover:text-blue-700"
              >
                <Database className="w-4 h-4 mr-1" />
                知识管理
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="text-blue-600 hover:text-blue-700"
              >
                <Settings className="w-4 h-4 mr-1" />
                {language === 'en' ? '中文' : 'EN'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Welcome Card */}
        <Card className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 md:justify-between">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                  {t('welcome.title')}
                </h2>
                <p className="text-blue-100 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                  {t('welcome.subtitle')}
                </p>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-blue-100">
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3 md:w-4 md:h-4" />
                    {t('welcome.feature1')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 md:w-4 md:h-4" />
                    {t('welcome.feature2')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 md:w-4 md:h-4" />
                    {t('welcome.feature3')}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block self-center">
                <Brain className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-blue-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <div className="h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)] lg:h-[calc(100vh-320px)]">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              <HeartBridgeChat className="h-full" />
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <p className="flex items-center gap-1 text-center sm:text-left">
              {t('footer.madeWith')} <span className="text-red-500">❤️</span> {t('footer.for')}
            </p>
            <p className="mt-1 sm:mt-0">
              {t('footer.powered')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
