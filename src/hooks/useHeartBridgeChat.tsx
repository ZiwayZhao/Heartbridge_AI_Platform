import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    content: string;
    similarity: number;
    category: string;
  }>;
  retrievedCount?: number;
  processingTime?: number;
}

export interface ChatOptions {
  category?: string | null;
  importance?: string | null;
}

const translations = {
  en: {
    welcome: "Hello! I'm HeartBridge AI, your professional autism intervention specialist assistant! 🧠\n\nI have extensive knowledge in early autism intervention, behavioral analysis, social skills training, language development, and more. Whether you need to understand early identification methods, intervention strategies, home training techniques, or practical behavior management advice, feel free to ask!\n\nLet's work together to create a better future for every child! ✨",
    cleared: "Chat history cleared! ✨\n\nI'm HeartBridge AI, ready to provide professional intervention guidance anytime. Do you have any questions about autism intervention? 🧠",
    error: "Chat Error",
    errorDesc: "Sorry, I encountered an issue: ",
    errorMsg: "Sorry, I encountered a problem. Please try again later."
  },
  zh: {
    welcome: "你好！我是HeartBridge AI，专业的自闭症干预专家助手！🧠\n\n我拥有丰富的自闭症谱系障碍早期干预、行为分析、社交技能训练、语言发展等专业知识。无论您需要了解早期识别方法、干预策略、家庭训练技巧，还是想要一些实用的行为管理建议，都可以问我！\n\n让我们一起为每个孩子创造更好的未来！✨",
    cleared: "聊天记录已清空！✨\n\n我是HeartBridge AI，专业的自闭症干预专家助手，随时准备为您提供专业的干预指导。有什么关于自闭症儿童干预的问题需要咨询吗？🧠",
    error: "聊天错误",
    errorDesc: "抱歉，我遇到了一些问题：",
    errorMsg: "抱歉，我遇到了一些问题。请稍后再试。"
  }
};

export function useHeartBridgeChat(language: 'en' | 'zh' = 'en') {
  const t = translations[language];
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (historyLoaded) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setMessages([{
            role: 'assistant',
            content: t.welcome
          }]);
          setHistoryLoaded(true);
          return;
        }

        const { data: history, error } = await supabase
          .from('chat_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(50);

        if (error) throw error;

        if (history && history.length > 0) {
          const loadedMessages: ChatMessage[] = [];
          history.forEach(record => {
            loadedMessages.push({
              role: 'user',
              content: record.message
            });
            loadedMessages.push({
              role: 'assistant',
              content: record.response,
              sources: Array.isArray(record.sources) ? record.sources as any[] : []
            });
          });
          setMessages(loadedMessages);
        } else {
          setMessages([{
            role: 'assistant',
            content: t.welcome
          }]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setMessages([{
          role: 'assistant',
          content: t.welcome
        }]);
      } finally {
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, [historyLoaded, t.welcome]);

  const sendMessage = useCallback(async (
    message: string,
    options: ChatOptions = {}
  ) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const startTime = Date.now();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Sending message to heartbridge-chat:', {
        message: message.trim(),
        category: options.category,
        importance: options.importance,
        userId: user?.id
      });
      
      const response = await supabase.functions.invoke('heartbridge-chat', {
        body: {
          message: message.trim(),
          category: options.category || 'all',
          importance: options.importance || 'all',
        }
      });

      console.log('Response from heartbridge-chat:', response);

      const processingTime = Date.now() - startTime;

      if (response.error) {
        console.error('HeartBridge Chat Error:', response.error);
        throw new Error(`${t.errorDesc}${response.error.message}`);
      }

      if (!response.data || !response.data.response) {
        throw new Error('AI did not return a valid response');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.data.response,
        sources: response.data.sources || [],
        retrievedCount: response.data.retrievedCount || 0,
        processingTime: response.data.processingTime || processingTime
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      toast({
        title: t.error,
        description: errorMessage,
        variant: "destructive",
      });

      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: `${t.errorMsg}: ${errorMessage}`,
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: t.cleared
    }]);
  }, [t]);

  const clearChat = clearMessages;

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    clearChat
  };
}
