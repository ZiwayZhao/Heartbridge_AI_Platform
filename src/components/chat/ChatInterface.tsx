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
  const [category, setCategory] = useState<string>('all');
  const [importance, setImportance] = useState<string>('all');

  const handleSend = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    await sendMessage(inputMessage, {
      category: category === 'all' ? null : category,
      importance: importance === 'all' ? null : importance
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
      {/* 聊天头部 */}
      <CardHeader className="border-b bg-muted/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">与 Ziway 对话</CardTitle>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              清空
            </Button>
          )}
        </div>
      </CardHeader>

      {/* 过滤器 */}
      <div className="p-4 border-b bg-muted/5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                <SelectItem value="交通">交通</SelectItem>
                <SelectItem value="住宿">住宿</SelectItem>
                <SelectItem value="美食">美食</SelectItem>
                <SelectItem value="景点">景点</SelectItem>
                <SelectItem value="购物">购物</SelectItem>
                <SelectItem value="文化">文化</SelectItem>
                <SelectItem value="生活">生活</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select value={importance} onValueChange={setImportance}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="重要性" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有重要性</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="medium">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 min-h-0">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              开始与 Ziway 对话
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              我是你的欧洲旅行AI助手，拥有丰富的旅行经验和实用建议。
              问我任何关于欧洲旅行的问题吧！
            </p>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t bg-muted/5">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="向 Ziway 提问任何关于欧洲旅行的问题..."
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || isLoading}
            className="self-end px-4 py-2 h-[60px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </div>
  );
}