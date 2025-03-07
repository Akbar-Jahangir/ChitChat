export interface Message {
  messageId: string;
  messageContent?: string;
  senderId: string;
  recipientId: string;
  timestamp: number;
  fileUrl?: string;
  fileName?:string
  fileType?: string; // Add this line to store the file type
}