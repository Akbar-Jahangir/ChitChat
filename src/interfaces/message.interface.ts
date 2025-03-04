export interface Message {
  messageId: string;
  messageContent?: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  fileUrl?: string;
}