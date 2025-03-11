import React, { useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { TikMarkIconSvg } from "../Svgs";
import { ChatUserProps } from "../../interfaces/chatUser.interface";
import useDatabase from "../../hooks/useDatabase";
import { RecipientContext, SenderContext } from "../../contexts/ChatContext";
import { Message } from "../../interfaces/message.interface";
import BlankImg from "../../assets/Images/BlankImg.png"
import { formatChatListTimestamp } from "../../utils/dateFormatter";

interface ChatItemProps {
  searchValue: string;
}

export const ChatItem: React.FC<ChatItemProps> = React.memo(({ searchValue }) => {
  const { storedUsers, getAllMessages } = useDatabase();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Track the last seen message timestamp for each chat
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState<Record<string, number>>({});

  const { setRecipientname, setRecipientId, setRecipientPicUrl } = useContext(RecipientContext);
  const { senderId } = useContext(SenderContext);

  // Prevent getAllMessages from causing re-renders
  const getAllMessagesRef = useRef(getAllMessages);
  useEffect(() => {
    getAllMessagesRef.current = getAllMessages;
  }, [getAllMessages]);

  const memoizedUsers = useMemo(() => storedUsers, [storedUsers]);

  
  useEffect(() => {
    try {
      const savedTimestamps = localStorage.getItem(`lastSeenTimestamps_${senderId}`);
      if (savedTimestamps) {
        setLastSeenTimestamps(JSON.parse(savedTimestamps));
      }
    } catch (error) {
      console.error("Error loading last seen timestamps:", error);
    }
  }, [senderId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await getAllMessagesRef.current();
        setMessages(response);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

  }, [senderId]);

  const handleClick = useCallback(
    (userId: string, username: string, profilePicUrl: string) => {
      setRecipientname(username);
      setRecipientId(userId);
      setRecipientPicUrl(profilePicUrl);
      setActiveChatId(userId);

 
      const userMessages = messages.filter(
        (msg) =>
          (msg.senderId === userId && msg.recipientId === senderId) ||
          (msg.senderId === senderId && msg.recipientId === userId)
      );

      // Find the latest message timestamp
      if (userMessages.length > 0) {
        const latestTimestamp = Math.max(...userMessages.map(msg => msg.timestamp));

        // Update the last seen timestamp for this chat
        const newTimestamps = {
          ...lastSeenTimestamps,
          [userId]: latestTimestamp
        };
        setLastSeenTimestamps(newTimestamps);

        // Save to localStorage
        localStorage.setItem(`lastSeenTimestamps_${senderId}`, JSON.stringify(newTimestamps));
      }
    },
    [setRecipientname, setRecipientId, setRecipientPicUrl, lastSeenTimestamps, senderId, messages]
  );

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

  // Function to format preview text for messages with files
  const getMessagePreview = useCallback((message: Message | null): string => {
    if (!message) return "";

    // Check if message has a file
    if (message.fileUrl) {
      const fileText = message.messageContent ? message.messageContent + " · " : "";

      // Show file name if available, otherwise show file type
      if (message.fileName) {
        return fileText + message.fileName;
      } else if (message.fileType) {
        // Extract file type (e.g., "image/jpeg" -> "Image")
        const fileType = message.fileType.split('/')[0];
        return fileText + fileType.charAt(0).toUpperCase() + fileType.slice(1);
      } else {
        return fileText + "File";
      }
    }

    // Return message content if no file
    return message.messageContent || "";
  }, []);

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
        // Get formatted message preview (text + file info)
        const messagePreview = getMessagePreview(lastMessage);

        return (
          <div
            className={`w-[95%] flex flex-col items-center rounded-sm py-2 cursor-pointer ${activeChatId === user.userId ? "bg-slate" : "hover:bg-slate"
              }`}
            key={user.userId}
            onClick={() => handleClick(user.userId, user.username, user.profilePicUrl)}
          >
            <div className="flex w-[95%] justify-between">
              <div className="w-[17%]">
                <div
                  className="max-w-[45px] max-h-[45px] min-w-[45px] min-h-[45px] rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${user.profilePicUrl || BlankImg})` }}
                ></div>
              </div>

              <div className="w-[77%]">
                <div className="flex justify-between w-full">
                  <p className="text-sm font-semibold text-primary w-[55%] truncate">{user.username}</p>
                  {lastMessage && <p className="text-lightSlate text-xs self-center w-[30%] text-end">
                    {formatChatListTimestamp(lastMessage.timestamp)}
                  </p>}
                </div>

                <div className="flex justify-between w-full">
                  <p className="text-gray text-xs max-w-[142px] line-clamp-2">
                    {messagePreview}
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