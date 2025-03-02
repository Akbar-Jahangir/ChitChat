import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SenderContext, RecipientContext } from "../contexts/ChatContext";
import { Sidebar } from "../components/Sidebar";
import { ChatWindow } from "../components/ChatWindow";

const Chat: React.FC = () => {
  const { senderId } = useContext(SenderContext)
  const { recipientId } = useContext(RecipientContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!senderId) {
      navigate("/signIn");
    }
  }, [senderId, navigate]);

  if (!senderId) {
    return null;
  }

  return (
    <div className="w-full flex h-screen">
      <Sidebar alignment="left" />
      {recipientId &&
        <ChatWindow />
      }
    </div>
  );
};

export default Chat;
