import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SenderContext, RecipientContext } from "../contexts/ChatContext";
import { Sidebar } from "../components/Sidebar";
import { ChatWindow } from "../components/ChatWindow";

const Chat: React.FC = () => {
  const { senderId } = useContext(SenderContext);
  const { recipientId } = useContext(RecipientContext);
  const navigate = useNavigate();
  const [rightSidebarVisible, setRightSidebarVisible] = useState(false);

  useEffect(() => {
    if (!senderId) {
      navigate("/signIn");
    }
  }, [senderId, navigate]);

  const toggleRightSidebar = () => {
    setRightSidebarVisible(prev => !prev);
  };

  if (!senderId) {
    return null;
  }

  return (
    <div className="w-full flex h-screen relative">
      <Sidebar alignment="left" />
      {recipientId && (
        <div className="w-[100%] flex absolute lg:static z-50 h-screen">
          <ChatWindow 
            toggleRightSidebar={toggleRightSidebar} 
            rightSidebarVisible={rightSidebarVisible} 
          />
          {rightSidebarVisible && <Sidebar alignment="right"/>}
        </div>
      )}
    </div>
  );
};

export default Chat;