import React, { useContext, useMemo, useState, useCallback, useEffect } from "react";
import { TikMarkIconSvg } from "../Svgs";
import { ChatUserProps } from "../../interfaces/chatUser.interface";
import useDatabase from "../../hooks/useDatabase";
import { RecipientContext, SenderContext } from "../../contexts/ChatContext";
import { Message } from "../../interfaces/message.interface";
import BlankImg from "/Images/BlankImg.png"

interface ChatItemProps {
  searchValue: string;
}

export const ChatItem: React.FC<ChatItemProps> = React.memo(({ searchValue }) => {
  const { storedUsers, getAllMessages } = useDatabase();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const { setRecipientname, setRecipientId, setRecipientPicUrl } = useContext(RecipientContext);
  const { senderId } = useContext(SenderContext);

  const memoizedUsers = useMemo(() => storedUsers, [storedUsers]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await getAllMessages();
        setMessages(response);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, []);

  const handleClick = useCallback(
    (userId: string, username: string, profilePicUrl: string) => {
      setRecipientname(username);
      setRecipientId(userId);
      setRecipientPicUrl(profilePicUrl);
      setActiveChatId(userId);
    },
    [setRecipientname, setRecipientId, setRecipientPicUrl]
  );

  const formatTimestamp = (timestamp: number): string => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    today.setDate(today.getDate());

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear();

    const isYesterday =
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return messageDate.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  const getLastMessage = (userId: string): Message | null => {
    if (!messages) return null;
    const userMessages = messages
      .filter(
        (msg) =>
          (msg.senderId === userId && msg.recipientId === senderId) ||
          (msg.senderId === senderId && msg.recipientId === userId)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return userMessages.length > 0 ? userMessages[0] : null;
  };

  
  const filteredUsers = memoizedUsers.filter((user) =>
    user.username.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <>
      {filteredUsers.map((user: ChatUserProps) => {
        const lastMessage = getLastMessage(user.userId);
        const unreadMessagesCount = messages.filter(
          (msg) => msg.senderId === senderId && msg.recipientId === user.userId
        ).length;

        return (
          <div
            className={`w-[95%] flex flex-col items-center rounded-sm py-2 cursor-pointer ${
              activeChatId === user.userId ? "bg-slate" : "hover:bg-slate"
            }`}
            key={user.userId}
            onClick={() => handleClick(user.userId, user.username, user.profilePicUrl)}
          >
            <div className="flex gap-2 w-[95%]">
              <div
                className="max-w-[45px] max-h-[45px] min-w-[45px] min-h-[45px] rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${user.profilePicUrl || BlankImg })` }}
              ></div>

              <div className="w-[100%]">
                <div className="flex justify-between w-full">
                  <p className="text-sm font-semibold text-primary  max-w-[45%]  truncate overflow-hidden">{user.username}</p>
                  {lastMessage && <p className="text-lightSlate text-xs self-center">{formatTimestamp(lastMessage.timestamp)}</p>}
                </div>

                <div className="flex justify-between w-full">
                  <p className="text-gray text-xs max-w-[142px] line-clamp-2">
                    {lastMessage && lastMessage.messageContent}
                  </p>
                  <div className="text-lightSlate text-xs">
                    {lastMessage && lastMessage.senderId === senderId ? (
                      <span className="bg-lavenderBlue rounded-full w-[15px] h-[15px] flex justify-center items-center">
                        <TikMarkIconSvg />
                      </span>
                    ) : unreadMessagesCount > 0 ? (
                      <p className="bg-primary rounded-full text-white w-[15px] h-[15px] flex justify-center items-center text-xs">
                        {unreadMessagesCount <= 9 ? unreadMessagesCount : "9+"}
                      </p>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
});
