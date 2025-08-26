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
      content: '你好，我是基于RAG的AI助手！\n\n我可以帮你解答各种问题。我的回答都基于真实的知识库数据，绝不编造信息。'
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
      content: '聊天记录已清空，有什么新问题我可以帮你解答吗？'
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