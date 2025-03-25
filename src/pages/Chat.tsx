import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SenderContext, RecipientContext } from "../contexts/ChatContext";
import { Sidebar } from "../components/Sidebar";
import { ChatWindow } from "../components/ChatWindow";

import useSidebar from "../hooks/useSidebar";

const Chat: React.FC = () => {
  const { recipientId } = useContext(RecipientContext);
  const { senderId } = useContext(SenderContext);
  const navigate = useNavigate();
  // const [rightSidebarVisible, setRightSidebarVisible] = useState(false);
  const {isRightSidebarOpen}=useSidebar();

  useEffect(() => {
    if (!senderId) {
      navigate("/signIn");
    }
  }, []);

  // const toggleRightSidebar = () => {
  //   setRightSidebarVisible(prev => !prev);
  // };

  if (!senderId) {
    return null;
  }

  return (
    <div className="w-full flex h-screen relative">
      <Sidebar alignment="left" />
      {recipientId && (
        <div className="w-[100%] flex absolute lg:static z-50 h-screen">
          <ChatWindow />
          {isRightSidebarOpen && <Sidebar alignment="right"/>}
        </div>
      )}
    </div>
  );
};

export default Chat;