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
      content: '你好！我是Ziway，专业的自闭症儿童干预专家！🧠\n\n我拥有丰富的自闭症谱系障碍早期干预、行为分析、社交技能训练、语言发展等专业知识。无论您需要了解早期识别方法、干预策略、家庭训练技巧，还是想要一些实用的行为管理建议，都可以问我！\n\n让我们一起为每个孩子创造更好的未来！✨'
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
      content: '聊天记录已清空！✨\n\n我是Ziway，专业的自闭症儿童干预专家，随时准备为您提供专业的干预指导。有什么关于自闭症儿童干预的问题需要咨询吗？🧠'
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