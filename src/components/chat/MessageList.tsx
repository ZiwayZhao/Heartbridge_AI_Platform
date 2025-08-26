
import { useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChatMessage } from '@/hooks/useRAGChat';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-3 sm:space-y-4 max-h-full">
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} index={index} />
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <Card className="bg-blue-50 border-blue-200 max-w-[90%] sm:max-w-[85%]">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                <div className="animate-spin w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                正在检索知识库并生成回答...
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
