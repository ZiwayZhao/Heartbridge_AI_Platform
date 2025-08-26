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
    source_name?: string;
  }>;
  retrievedCount?: number;
  processingTime?: number;
}

export interface RAGChatOptions {
  category?: string | null;
  location?: string | null;
  importance?: string | null;
}

export function useRAGChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
      
      const { data, error } = await supabase.functions.invoke('rag-chat', {
        body: {
          message: message.trim(),
          category: options.category === 'all' ? null : options.category,
          location: options.location,
          importance: options.importance === 'all' ? null : options.importance,
        }
      });

      const processingTime = Date.now() - startTime;

      if (error) {
        console.error('RAG Chat Error:', error);
        throw new Error(`聊天服务错误: ${error.message}`);
      }

      if (!data || !data.response) {
        throw new Error('AI 未返回有效响应');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        sources: data.sources || [],
        retrievedCount: data.sources?.length || 0,
        processingTime
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
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
}