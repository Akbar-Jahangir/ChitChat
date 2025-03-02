export interface SenderContextProps {
  sendername: string;
  senderId: string;
  senderPicUrl: string;
  setSendername: (name: string) => void;
  setSenderId: (id: string) => void;
  setSenderPicUrl: (url: string) => void;
}
