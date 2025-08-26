import ChatInterface from '@/components/chat/ChatInterface';

interface ZiwayChatProps {
  className?: string;
}

export default function ZiwayChat({ className }: ZiwayChatProps) {
  return <ChatInterface className={className} />;
}