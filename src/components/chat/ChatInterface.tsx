import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Trash2, MessageCircle } from 'lucide-react';
import { useRAGChat } from '@/hooks/useRAGChat';
import MessageList from './MessageList';

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const { messages, isLoading, sendMessage, clearMessages } = useRAGChat();
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    await sendMessage(inputMessage, {
      category: null,
      importance: null
    });
    
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 简化的聊天头部 */}
      <div className="flex-shrink-0 border-b bg-muted/5 p-2 sm:p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
            <h2 className="text-sm sm:text-base font-semibold">与 Ziway 对话</h2>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              disabled={isLoading}
              className="h-7 px-2 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              清空
            </Button>
          )}
        </div>
      </div>

      {/* 消息列表 - 最大化空间 */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground mb-3" />
            <h3 className="text-sm sm:text-lg font-medium text-muted-foreground mb-2">
              开始与 Ziway 对话
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              我是你的欧洲旅行AI助手，问我任何关于欧洲旅行的问题吧！
            </p>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* 输入区域 - 紧凑布局 */}
      <div className="flex-shrink-0 border-t bg-muted/5 p-2 sm:p-3">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="向 Ziway 提问任何关于欧洲旅行的问题..."
            className="flex-1 min-h-[50px] max-h-[100px] resize-none text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="px-3 py-2 h-[50px] text-sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </div>
  );
}