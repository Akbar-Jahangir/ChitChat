import React, { useContext, useMemo, useState, useCallback, useEffect } from "react";
import { TikMarkIconSvg } from "../Svgs";
import { ChatUserProps } from "../../interfaces/chatUser.interface";
import useDatabase from "../../hooks/useDatabase";
import { RecipientContext, SenderContext } from "../../contexts/ChatContext";
import { Message } from "../../interfaces/message.interface";
import BlankImg from "../../assets/Images/BlankImg.png"

interface ChatItemProps {
  searchValue: string;
}

export const ChatItem: React.FC<ChatItemProps> = React.memo(({ searchValue }) => {
  const { storedUsers, getAllMessages } = useDatabase();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  // State to track which chats have been read (clicked on)

  // Track the last seen message timestamp for each chat
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState<Record<string, number>>({});
  
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
    
    // Set up an interval to poll for new messages
    const intervalId = setInterval(fetchMessages, 5000); // Poll every 5 seconds
    
    // Load last seen timestamps from localStorage
    try {
      const savedTimestamps = localStorage.getItem(`lastSeenTimestamps_${senderId}`);
      if (savedTimestamps) {
        setLastSeenTimestamps(JSON.parse(savedTimestamps));
      }
    } catch (error) {
      console.error("Error loading last seen timestamps:", error);
    }
    
    return () => clearInterval(intervalId);
  }, [getAllMessages, senderId]);

  const handleClick = useCallback(
    (userId: string, username: string, profilePicUrl: string) => {
      setRecipientname(username);
      setRecipientId(userId);
      setRecipientPicUrl(profilePicUrl);
      setActiveChatId(userId);
      
      // Update the last seen timestamp for this chat
      const lastMessage = getLastMessage(userId);
      if (lastMessage) {
        const newTimestamps = {
          ...lastSeenTimestamps,
          [userId]: lastMessage.timestamp
        };
        setLastSeenTimestamps(newTimestamps);
        
        // Save to localStorage
        localStorage.setItem(`lastSeenTimestamps_${senderId}`, JSON.stringify(newTimestamps));
      }
    },
    [setRecipientname, setRecipientId, setRecipientPicUrl, lastSeenTimestamps, senderId]
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

    // Return month number instead of name: "MM/DD/YYYY" format
    return `${messageDate.getMonth() + 1}/${messageDate.getDate()}/${messageDate.getFullYear().toString().slice(2)}`;
  };

  const getLastMessage = useCallback((userId: string): Message | null => {
    if (!messages || messages.length === 0) return null;
    
    const userMessages = messages
      .filter(
        (msg) =>
          (msg.senderId === userId && msg.recipientId === senderId) ||
          (msg.senderId === senderId && msg.recipientId === userId)
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return userMessages.length > 0 ? userMessages[0] : null;
  }, [messages, senderId]);

  const getUnreadMessagesCount = useCallback((userId: string): number => {
    // If this chat is currently active, return 0
    if (activeChatId === userId) {
      return 0;
    }
    
    const lastSeenTimestamp = lastSeenTimestamps[userId] || 0;
    
    // Count messages that came after the last seen timestamp
    return messages.filter(
      (msg) => 
        msg.senderId === userId && 
        msg.recipientId === senderId && 
        msg.timestamp > lastSeenTimestamp
    ).length;
  }, [activeChatId, lastSeenTimestamps, messages, senderId]);

  const filteredUsers = useMemo(() => {
    const filtered = memoizedUsers.filter((user) =>
      user.username.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Create an array of users with their last messages
    const usersWithLastMessages = filtered.map((user) => {
      const lastMessage = getLastMessage(user.userId);
      return {
        user,
        lastMessage,
        // If there's no last message, use 0 as timestamp for sorting
        timestamp: lastMessage ? lastMessage.timestamp : 0
      };
    });

    // Sort users by the timestamp of their last message (newest first)
    return usersWithLastMessages
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((item) => item.user);
  }, [memoizedUsers, getLastMessage, searchValue]);

  return (
    <>
      {filteredUsers.map((user: ChatUserProps) => {
        const lastMessage = getLastMessage(user.userId);
        // Get unread messages count using our new function
        const unreadMessagesCount = getUnreadMessagesCount(user.userId);

        return (
          <div
            className={`w-[95%] flex flex-col items-center rounded-sm py-2 cursor-pointer ${
              activeChatId === user.userId ? "bg-slate" : "hover:bg-slate"
            }`}
            key={user.userId}
            onClick={() => handleClick(user.userId, user.username, user.profilePicUrl)}
          >
            <div className="flex w-[95%] justify-between">
              <div className="w-[17%]">
              <div
                className="max-w-[45px] max-h-[45px] min-w-[45px] min-h-[45px] rounded-full bg-cover bg-center"
                style={{ backgroundImage: `url(${user.profilePicUrl || BlankImg })` }}
              ></div>
              </div>

              <div className="w-[77%]">
                <div className="flex justify-between w-full">
                  <p className="text-sm font-semibold text-primary w-[55%] truncate">{user.username}</p>
                  {lastMessage && <p className="text-lightSlate text-xs self-center w-[30%] text-end">{formatTimestamp(lastMessage.timestamp)}</p>}
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