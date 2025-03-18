import React, { useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { TikMarkIconSvg } from "../Svgs";
import { ChatUserProps } from "../../interfaces/chatUser.interface";
import { RecipientContext, SenderContext } from "../../contexts/ChatContext";
import { Message } from "../../interfaces/message.interface";
import BlankImg from "../../assets/Images/BlankImg.png"
import { ChatItemProps } from "./chatItem.interface";
import { db, getDocs } from "../../utils/firebaseConfig";
import {
  collection,
} from "firebase/firestore";

export const ChatItem: React.FC<ChatItemProps> = React.memo(({ searchValue }) => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [storedUsers, setStoredUsers] = useState<ChatUserProps[]>([]);

  // Track the last seen message timestamp for each chat
  const [lastSeenTimestamps, setLastSeenTimestamps] = useState<Record<string, number>>({});

  const { setRecipientname, setRecipientId, setRecipientPicUrl } = useContext(RecipientContext);
  const { senderId } = useContext(SenderContext);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = usersSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            username: data.username,
            profilePicUrl: data.profilePicUrl,
            email: data.email,
          } as ChatUserProps;
        });
        setStoredUsers(usersList);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);
  const getAllMessages = async (): Promise<Message[]> => {
    try {
      const conversationsRef = collection(db, "conversations");

      const querySnapshot = await getDocs(conversationsRef);

      const messages: Message[] = [];
      querySnapshot.forEach((doc) => {
        const conversation = doc.data();
        if (conversation.messages) {
          messages.push(...conversation.messages);
        }
      });

      return messages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };
  const getAllMessagesRef = useRef(getAllMessages);

  const memoizedUsers = useMemo(() => storedUsers, [storedUsers]);

  useEffect(() => {
    getAllMessagesRef.current = getAllMessages;
    try {
      const savedTimestamps = localStorage.getItem(`lastSeenTimestamps_${senderId}`);
      if (savedTimestamps) {
        setLastSeenTimestamps(JSON.parse(savedTimestamps));
      }
    } catch (error) {
      console.error("Error loading last seen timestamps:", error);
    }

    const fetchMessages = async () => {
      try {
        const response = await getAllMessagesRef.current();
        setMessages(response);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    // Set up an interval to poll for new messages
    const intervalId = setInterval(fetchMessages, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);

  }, [senderId]);

  const handleClick = useCallback(
    (userId: string, username: string, profilePicUrl: string) => {
      setRecipientname(username);
      setRecipientId(userId);
      setRecipientPicUrl(profilePicUrl);
      setActiveChatId(userId);

      // Get all messages for this conversation
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

  const formatChatListTimestamp = (timestamp: number): string => {
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

    // Return month number instead of name: "MM/DD/YY" format
    return `${messageDate.getMonth() + 1}/${messageDate.getDate()}/${messageDate.getFullYear().toString().slice(2)}`;
  };

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
            className={`w-[100%] flex flex-col items-center rounded-sm py-2 cursor-pointer ${activeChatId === user.userId ? "bg-slate" : "hover:bg-slate"
              }`}
            key={user.userId}
            onClick={() => handleClick(user.userId, user.username, user.profilePicUrl)}
          >
            <div className="flex w-[90%] justify-between gap-2">
              <div className="w-fit">
                <div
                  className="max-w-11 max-h-11 min-w-11 min-h-11 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${user.profilePicUrl || BlankImg})` }}
                ></div>
              </div>

              <div className="w-full">
                <div className="flex justify-between w-full">
                  <p className="text-sm font-semibold text-primary max-w-[50%] line-clamp-2">{user.username}</p>
                  {lastMessage && <p className="text-lightSlate text-xs self-center w-fit ">{formatChatListTimestamp(lastMessage.timestamp)}</p>}
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