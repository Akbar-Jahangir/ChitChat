export interface MessageBubbleProps {
  messageContent?: string;
  senderId: string;
  fileUrl?: string;
  fileName?:string
  messageId:string
  onDeleteMessage?: (messageId: string) => void; 
}
