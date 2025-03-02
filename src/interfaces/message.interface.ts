export interface Message {
  conversationId: string;
  messageId: string;
  messageContent: string;
  messageType: "text" | "video" | "file" | "image" | "audio";
  senderId: string;
  recipientId: string;
  timestamp: number;
  fileUrl?: string;
}