import ChatInterface from '@/components/chat/ChatInterface';

interface HeartBridgeChatProps {
  className?: string;
}

export default function HeartBridgeChat({ className }: HeartBridgeChatProps) {
  return <ChatInterface className={className} />;
}
