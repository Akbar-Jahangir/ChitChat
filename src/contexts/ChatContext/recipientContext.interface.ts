export interface RecipientContextProps {
    recipientname: string;
    recipientId: string;
   recipientPicUrl: string;
    setRecipientname: (name: string) => void;
    setRecipientId: (id: string) => void;
    setRecipientPicUrl: (url: string) => void;
  }
  