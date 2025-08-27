import { useState, useCallback } from 'react';
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

export interface RAGChatOptions {
  category?: string | null;
  importance?: string | null;
}

export function useRAGChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好！我是Ziway，你的AI旅行助手！🌍\n\n我为Molly准备了丰富的欧洲旅行经验和生活知识。无论你想了解哪个城市的攻略、美食推荐、交通指南，还是想要一些贴心的旅行小贴士，都可以问我！\n\n让我们一起探索美丽的欧洲吧！✨'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (
    message: string, 
    options: RAGChatOptions = {}
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
      
      const response = await supabase.functions.invoke('rag-chat', {
        body: {
          message: message.trim(),
          category: options.category,
          importance: options.importance,
        }
      });

      const processingTime = Date.now() - startTime;

      if (response.error) {
        console.error('RAG Chat Error:', response.error);
        throw new Error(`聊天服务错误: ${response.error.message}`);
      }

      if (!response.data || !response.data.response) {
        throw new Error('AI 未返回有效响应');
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
      const errorMessage = error instanceof Error ? error.message : '发生未知错误';
      
      toast({
        title: "聊天错误",
        description: errorMessage,
        variant: "destructive",
      });

      const errorResponse: ChatMessage = {
        role: 'assistant',
        content: `抱歉，我遇到了一些问题：${errorMessage}。请稍后再试。`,
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([{
      role: 'assistant',
      content: '聊天记录已清空啦！✨\n\n我是Ziway，随时准备为你和Molly提供欧洲旅行的帮助。有什么新的问题或者想了解的地方吗？🌍'
    }]);
  }, []);

  const clearChat = clearMessages;

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    clearChat
  };
}