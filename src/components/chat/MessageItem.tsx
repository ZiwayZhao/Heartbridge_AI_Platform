
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Database } from 'lucide-react';
import { ChatMessage } from '@/hooks/useHeartBridgeChat';

interface MessageItemProps {
  message: ChatMessage;
  index: number;
}

export default function MessageItem({ message, index }: MessageItemProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 sm:mb-4`}>
      <div className={`max-w-[90%] sm:max-w-[85%] ${isUser ? 'order-2' : 'order-1'}`}>
        <Card className={`${isUser ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
              {message.content}
            </div>
            
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Database className="w-2 h-2 sm:w-3 sm:h-3" />
                  <span className="text-xs">参考来源 (最佳匹配)</span>
                </div>
                <div className="space-y-2">
                  {message.sources.map((source, i) => (
                    <div key={i} className="text-xs bg-white/50 rounded p-2 border">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {source.category}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          相似度: {(source.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-gray-700 text-xs leading-relaxed">{source.content}</div>
                    </div>
                  ))}
                </div>
                
                {message.processingTime && (
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
                    <span className="text-xs">处理时间: {message.processingTime}ms</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
