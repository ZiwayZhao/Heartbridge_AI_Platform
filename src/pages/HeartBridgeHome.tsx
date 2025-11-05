import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Brain, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import HeartBridgeChat from '@/components/HeartBridgeChat';
import Layout from '@/components/Layout';

export default function HeartBridgeHome() {
  const { t } = useLanguage();

  return (
    <Layout>
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* Welcome Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">
                  {t('welcome.title')}
                </h2>
                <p className="text-blue-100 mb-4 text-sm sm:text-base">
                  {t('welcome.subtitle')}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    {t('welcome.feature1')}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {t('welcome.feature2')}
                  </span>
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    {t('welcome.feature3')}
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <Brain className="w-16 h-16 text-blue-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="h-[calc(100vh-280px)]">
          <CardContent className="p-0 h-full">
            <HeartBridgeChat className="h-full" />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
