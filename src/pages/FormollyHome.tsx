import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Upload, 
  HardDrive, 
  Settings, 
  Map,
  Heart,
  Plane,
  Coffee
} from 'lucide-react';
import WelcomeNotice from '@/components/WelcomeNotice';
import ZiwayChat from '@/components/ZiwayChat';
import TravelKnowledgeUploader from '@/components/TravelKnowledgeUploader';
import CloudDrive from '@/components/CloudDrive';

export default function FormollyHome() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');

  // 检查是否是首次访问
  useEffect(() => {
    const hasVisited = localStorage.getItem('formolly-visited');
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem('formolly-visited', 'true');
    }
  }, []);

  const handleWelcomeClose = () => {
    setShowWelcome(false);
  };

  const handleShowWelcome = () => {
    setShowWelcome(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-16">
      {/* 头部 */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <img 
                  src="/logo-flower.png" 
                  alt="Formolly Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Formolly
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Molly 的欧洲旅行助手
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShowWelcome}
                className="text-orange-600 hover:text-orange-700"
              >
                <Settings className="w-4 h-4 mr-1" />
                须知
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* 欢迎卡片 - 响应式优化 */}
        <Card className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 md:justify-between">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
                  🌍 欢迎来到 Formolly！
                </h2>
                <p className="text-orange-100 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">
                  我是 Ziway，你的AI旅行助手。为 Molly 精心准备了丰富的欧洲生活和旅行经验。
                </p>
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-orange-100">
                  <span className="flex items-center gap-1">
                    <Map className="w-3 h-3 md:w-4 md:h-4" />
                    旅行攻略
                  </span>
                  <span className="flex items-center gap-1">
                    <Coffee className="w-3 h-3 md:w-4 md:h-4" />
                    生活经验
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 md:w-4 md:h-4" />
                    贴心建议
                  </span>
                </div>
              </div>
              <div className="hidden sm:block self-center">
                <Plane className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-orange-200" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 主功能区域 - 响应式优化 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-2 text-xs sm:text-sm">
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">与 Ziway 聊天</span>
              <span className="sm:hidden">聊天</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-2 text-xs sm:text-sm">
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">知识上传</span>
              <span className="sm:hidden">上传</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 px-1 sm:px-2 text-xs sm:text-sm">
              <HardDrive className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">云盘文件</span>
              <span className="sm:hidden">云盘</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card className="h-[60vh] sm:h-[65vh] lg:h-[70vh]">
              <CardContent className="p-0 h-full">
                <ZiwayChat className="h-full" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-orange-600" />
                    为 Ziway 添加知识
                  </CardTitle>
                  <CardDescription>
                    上传欧洲旅行相关的CSV问答文件，让 Ziway 学习更多知识来帮助 Molly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TravelKnowledgeUploader />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <CloudDrive />
          </TabsContent>
        </Tabs>
      </main>

      {/* 固定底栏 - 响应式优化 */}
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-50">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <p className="flex items-center gap-1 text-center sm:text-left">
              Made with <span className="text-red-500">❤️</span> for Molly's European Adventure
            </p>
            <p className="mt-1 sm:mt-0">
              Powered by Ziway AI
            </p>
          </div>
        </div>
      </footer>

      {/* 开屏须知弹窗 */}
      <WelcomeNotice 
        open={showWelcome} 
        onOpenChange={handleWelcomeClose}
        showEditButton={true}
      />
    </div>
  );
}
