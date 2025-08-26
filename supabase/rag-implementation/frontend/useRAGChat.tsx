import { useState } from 'react';

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

export function useRAGChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '你好，我是基于RAG的AI助手！\n\n我可以帮你解答各种问题。我的回答都基于真实的知识库数据，绝不编造信息。'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (userMessage: string, category?: string, importance?: string) => {
    if (!userMessage.trim()) return;

    // 添加用户消息
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // 这里需要替换为你的后端API调用
      const response = await fetch('/api/rag-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          category,
          importance
        })
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }

      const data = await response.json();

      // 添加AI回复
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        retrievedCount: data.retrievedCount,
        processingTime: data.processingTime
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('RAG聊天错误:', error);
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `抱歉，处理您的问题时出现了错误: ${error.message || '请稍后重试'}`
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '聊天记录已清空，有什么新问题我可以帮你解答吗？'
    }]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat
  };
}
