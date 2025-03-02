import React, { useState, createContext } from "react";
import { ContextProviderProps } from "./contextProvider.interface";
import { SenderContextProps } from "./senderContext.interface";
import { RecipientContextProps } from "./recipientContext.interface";

// Default values for ChatContext
const defaultSenderContext: SenderContextProps = {
  sendername: "",
  senderId: "",
  senderPicUrl: "",
  setSendername: () => { },
  setSenderId: () => { },
  setSenderPicUrl: () => { },
};

// Default values for RecipientContext
const defaultRecipientContext: RecipientContextProps = {
  recipientname: "",
  recipientId: "",
  recipientPicUrl: "",
  setRecipientname: () => { },
  setRecipientId: () => { },
  setRecipientPicUrl: () => { },
};

export const SenderContext = createContext<SenderContextProps>(defaultSenderContext);

export const RecipientContext = createContext<RecipientContextProps>(defaultRecipientContext);

export const ChatProvider: React.FC<ContextProviderProps> = ({ children }) => {
  const [sendername, setSendername] = useState<string>("");
  const [senderId, setSenderId] = useState<string>("");
  const [senderPicUrl, setSenderPicUrl] = useState<string>("");

  const [recipientname, setRecipientname] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>("");
  const [recipientPicUrl, setRecipientPicUrl] = useState<string>("");

  return (
    <SenderContext.Provider
      value={{
        sendername,
        senderId,
        senderPicUrl,
        setSendername,
        setSenderId,
        setSenderPicUrl,
      }}
    >
      <RecipientContext.Provider
        value={{
          recipientname,
          recipientId,
          recipientPicUrl,
          setRecipientname,
          setRecipientId,
          setRecipientPicUrl,
        }}
      >
        {children}
      </RecipientContext.Provider>
    </SenderContext.Provider>
  );
};
