
export interface ChatItemProps {
  timestamp?: string;
  messageText?: string;
  unreadMessagesCount?: number;
  messageStatus?: "received" | "sent" | null;
}
