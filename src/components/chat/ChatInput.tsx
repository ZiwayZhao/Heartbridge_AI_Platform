
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const message = input.trim();
    setInput('');
    onSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (!user) {
    return (
      <div className="p-4 border-t bg-background">
        <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">请先登录后使用AI问答功能</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
      <div className="flex gap-3">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="💬 请输入关于自闭症干预的问题..."
          rows={2}
          className="flex-1 min-h-[60px] max-h-32 resize-none"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 self-end"
          disabled={!input.trim() || isLoading}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
