import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // App branding
    'app.name': 'HeartBridge',
    'app.tagline': 'Professional Autism Intervention Platform',
    'app.description': 'AI-powered autism intervention guidance',
    
    // Navigation
    'nav.chat': 'Chat',
    'nav.upload': 'Upload Knowledge',
    'nav.cases': 'Cases',
    'nav.settings': 'Settings',
    
    // Welcome section
    'welcome.title': '🧠 Welcome to HeartBridge!',
    'welcome.subtitle': 'I\'m HeartBridge AI, your professional autism intervention assistant. I provide evidence-based guidance for early intervention, behavioral analysis, social skills training, language development, and more.',
    'welcome.feature1': 'Intervention Strategies',
    'welcome.feature2': 'Behavior Management',
    'welcome.feature3': 'Professional Guidance',
    
    // Chat interface
    'chat.title': 'Chat with HeartBridge AI',
    'chat.placeholder': 'Ask about autism intervention strategies...',
    'chat.send': 'Send',
    'chat.clear': 'Clear Chat',
    'chat.loading': 'Thinking...',
    
    // Upload section
    'upload.title': 'Add Knowledge to HeartBridge',
    'upload.subtitle': 'Upload CSV files with Q&A pairs about autism intervention to expand the knowledge base',
    'upload.button': 'Upload File',
    'upload.processing': 'Processing...',
    'upload.success': 'Successfully uploaded',
    'upload.error': 'Upload failed',
    
    // Cases section
    'cases.title': 'Intervention Cases',
    'cases.subtitle': 'Track progress and interventions for each child',
    'cases.new': 'New Case',
    'cases.childName': 'Child Name',
    'cases.age': 'Age',
    'cases.diagnosis': 'Diagnosis Details',
    
    // Settings
    'settings.language': 'Language',
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    
    // Footer
    'footer.madeWith': 'Made with',
    'footer.for': 'for children with autism',
    'footer.powered': 'Powered by HeartBridge AI',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
  },
  zh: {
    // App branding
    'app.name': 'HeartBridge 心桥',
    'app.tagline': '专业自闭症干预平台',
    'app.description': 'AI驱动的自闭症干预指导',
    
    // Navigation
    'nav.chat': '咨询',
    'nav.upload': '知识上传',
    'nav.cases': '案例',
    'nav.settings': '设置',
    
    // Welcome section
    'welcome.title': '🧠 欢迎来到 HeartBridge！',
    'welcome.subtitle': '我是HeartBridge AI，您的专业自闭症干预助手。我提供基于循证的早期干预、行为分析、社交技能训练、语言发展等专业指导。',
    'welcome.feature1': '干预策略',
    'welcome.feature2': '行为管理',
    'welcome.feature3': '专业指导',
    
    // Chat interface
    'chat.title': '与 HeartBridge AI 咨询',
    'chat.placeholder': '询问自闭症干预策略...',
    'chat.send': '发送',
    'chat.clear': '清空聊天',
    'chat.loading': '思考中...',
    
    // Upload section
    'upload.title': '为 HeartBridge 添加知识',
    'upload.subtitle': '上传包含自闭症干预问答的CSV文件，扩充知识库',
    'upload.button': '上传文件',
    'upload.processing': '处理中...',
    'upload.success': '上传成功',
    'upload.error': '上传失败',
    
    // Cases section
    'cases.title': '干预案例',
    'cases.subtitle': '跟踪每个孩子的进展和干预情况',
    'cases.new': '新建案例',
    'cases.childName': '儿童姓名',
    'cases.age': '年龄',
    'cases.diagnosis': '诊断详情',
    
    // Settings
    'settings.language': '语言',
    'settings.profile': '个人资料',
    'settings.notifications': '通知',
    
    // Footer
    'footer.madeWith': '用',
    'footer.for': '为自闭症儿童创造',
    'footer.powered': '由 HeartBridge AI 驱动',
    
    // Common
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.close': '关闭',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('heartbridge-language');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('heartbridge-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
