import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import Pusher, { PresenceChannel, Channel } from "pusher-js";
import { Button } from "../Button";
import { Input } from "../Input";
import {
    AttachmentIconSvg,
    BellIconSvg,
    CameraIconSvg,
    FavoriteIconSvg,
    SearchIconSvg,
    SendMessageIconSvg,
    VoiceIconSvg,
} from "../Svgs";
import { Header } from "../Header";
import { SenderContext, RecipientContext } from "../../contexts/ChatContext";
import { uid } from "uid";
import useDatabase from "../../hooks/useDatabase";
import { Message } from "../../interfaces/message.interface";
import { MessageBubble } from "../MessageBubble";
import { Textarea } from "../Textarea/Textarea";
import { ref, uploadBytes, getDownloadURL, storage } from "../../utils/firebaseConfig";
import FilePreview from "../FilePreview/FilePreview";

// Define an interface for grouped messages
interface MessageGroup {
    date: string;
    messages: Message[];
    timestamp: number; // Used for sorting
}

// Define a type for Pusher members
interface PusherMembers {
    count: number;
    members: Record<string, unknown>;
    myID: string;
    me: {
        id: string;
        info: unknown;
    };
}

// Define Pusher keys and server URL
const PUSHER_KEY = "33466c91963fd345d327";
const PUSHER_CLUSTER = "ap2";
// Make sure this points to your Vercel backend URL
const SERVER_URL = "https://chit-chat.koyeb.app";

export const ChatWindow: React.FC = () => {
    const [outgoingMessage, setOutgoingMessage] = useState<string>("");
    const [storedMessages, setStoredMessages] = useState<Message[]>([]);
    const [groupedMessages, setGroupedMessages] = useState<MessageGroup[]>([]);
    const [localFileUrl, setLocalFileUrl] = useState<string>("");
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [fileType, setFileType] = useState<string>("");
    const [isRecipientOnline, setIsRecipientOnline] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
   
    // Refs to track connection states
    const pusherRef = useRef<Pusher | null>(null);
    const messageChannelRef = useRef<Channel | null>(null);
    const presenceChannelRef = useRef<PresenceChannel | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastPresenceUpdateRef = useRef<number>(0);

    const { saveMessage, getChatHistory } = useDatabase();

    const {
        recipientname,
        recipientId,
        recipientPicUrl,
    } = useContext(RecipientContext);
    const { senderId } = useContext(SenderContext);

    const userInfo = {
        userId: recipientId,
        profilePicUrl: recipientPicUrl,
        username: recipientname,
        isOnline: isRecipientOnline
    };

    const messageTypeBtnData = [
        { id: 1, icon: <AttachmentIconSvg />, accept: "image/*,video/*,.mp3,.pdf,.docx,.xlsx,.ppt,.pptx,.ppsx" },
        { id: 2, icon: <CameraIconSvg />, accept: "image/*,video/*" },
    ];

    const formatMessageDate = (timestamp: number): { display: string; timestamp: number } => {
        const messageDate = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Reset hours to compare just the dates
        const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
        const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const yesterdayDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

        // We'll use the timestamp at midnight of each day for sorting
        const midnightTimestamp = new Date(
            messageDate.getFullYear(),
            messageDate.getMonth(),
            messageDate.getDate()
        ).getTime();

        if (messageDay.getTime() === todayDay.getTime()) {
            return { display: "", timestamp: midnightTimestamp }; // Empty string for today - no header will show
        } else if (messageDay.getTime() === yesterdayDay.getTime()) {
            return { display: "Yesterday", timestamp: midnightTimestamp };
        } else {
            // Format as "3/7/2025" instead of "March 7, 2025"
            return {
                display: messageDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'numeric',  // Changed from 'long' to 'numeric'
                    day: 'numeric'
                }),
                timestamp: midnightTimestamp
            };
        }
    };

    // Group messages by date
    const groupMessagesByDate = useCallback((messages: Message[]) => {
        const groups: Record<string, { messages: Message[], timestamp: number }> = {};

        messages.forEach(message => {
            const { display, timestamp } = formatMessageDate(message.timestamp);
            // Use display as the key - empty string for today
            if (!groups[display]) {
                groups[display] = { messages: [], timestamp };
            }
            groups[display].messages.push(message);
        });

        return Object.entries(groups)
            .map(([date, { messages, timestamp }]) => ({
                date,
                messages: messages.sort((a, b) => a.timestamp - b.timestamp),
                timestamp
            }))
            .sort((a, b) => a.timestamp - b.timestamp); // Oldest to newest
    }, []);

    const sendMessageToServer = async (messageData: Message) => {
        try {
            const response = await fetch(`${SERVER_URL}/send-message`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    messageData,
                    channel: getChannelName(messageData.senderId, messageData.recipientId),
                }),
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Failed to send message. Server response:", errorText);
                return false;
            }
    
           
            return true;
        } catch (error) {
            console.error("Error sending message:", error);
            return false;
        }
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!outgoingMessage.trim() && !uploadedFileUrl) return;

        const messageData: Message = {
            messageId: uid(),
            recipientId: recipientId,
            senderId: senderId,
            messageContent: outgoingMessage.trim(),
            timestamp: Date.now(),
            fileUrl: uploadedFileUrl,
            fileName: fileName,
            fileType: fileType
        };

        const sent = await sendMessageToServer(messageData);
        if (sent) {
            // Don't update storedMessages here, let the Pusher event handle it
            // This prevents duplicate messages
            saveMessage(messageData);

            setOutgoingMessage("");
            setUploadedFileUrl("");
            setLocalFileUrl("");
            setFileName("");
            setFileType("");
        }
    }, [outgoingMessage, uploadedFileUrl, recipientId, senderId, saveMessage, fileName, fileType]);

    const uploadFile = async (file: File): Promise<string> => {
        try {
            const fileRef = ref(storage, `chat-uploads/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            return await getDownloadURL(fileRef);
        } catch (error) {
            console.error("Error uploading file:", error);
            throw new Error("File upload failed");
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
    
        if (!file) return;
    
        const url = URL.createObjectURL(file);
        setLocalFileUrl(url);
        setFileName(file.name);
        setFileType(file.type);
    
        try {
            const fileUrl = await uploadFile(file);
            setUploadedFileUrl(fileUrl);
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file. Please try again.");
            setLocalFileUrl("");
            setFileName("");
            setFileType("");
        }
    
        e.target.value = "";
    };

    const getChannelName = (userId1: string, userId2: string) => {
        const sortedIds = [userId1, userId2].sort();
        return `chat-${sortedIds[0]}-${sortedIds[1]}`;
    };

    // Join or leave presence channel
    const updatePresence = useCallback(async (action: "join" | "leave", force: boolean = false) => {
        if (!senderId) {
            return;
        }
        
        const now = Date.now();
        // Only update presence if forced or if it's been more than 2 minutes since the last update
        // This prevents unnecessary API calls
        if (!force && action === "join" && (now - lastPresenceUpdateRef.current < 120000)) {
            return;
        }
        
        lastPresenceUpdateRef.current = now;
        const endpoint = action === "join" ? "join-presence" : "leave-presence";
        
        try {
            const response = await fetch(`${SERVER_URL}/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: senderId }),
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to ${action} presence. Server response:`, errorText);
                return;
            }
        } catch (error) {
            console.error(`Error ${action} presence:`, error);
        }
    }, [senderId]);

    // Ping the server to maintain the connection without updating presence
    const sendHeartbeat = useCallback(async () => {
        if (!senderId || pusherRef.current?.connection.state !== "connected") {
            return;
        }
        
        try {
            await fetch(`${SERVER_URL}/heartbeat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: senderId }),
            });
        } catch (error) {
            console.error("Heartbeat error:", error);
        }
    }, [senderId]);

    // Clean up all Pusher resources
    const cleanupPusher = useCallback(() => {
        // Clear heartbeat interval
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
        
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        // Clean up message channel
        if (messageChannelRef.current) {
            try {
                messageChannelRef.current.unbind_all();
                if (pusherRef.current) {
                    pusherRef.current.unsubscribe(messageChannelRef.current.name);
                }
            } catch (e) {
                console.error("Error cleaning up message channel:", e);
            }
            messageChannelRef.current = null;
        }
        
        // Clean up presence channel
        if (presenceChannelRef.current) {
            try {
                presenceChannelRef.current.unbind_all();
                if (pusherRef.current) {
                    pusherRef.current.unsubscribe(presenceChannelRef.current.name);
                }
            } catch (e) {
                console.error("Error cleaning up presence channel:", e);
            }
            presenceChannelRef.current = null;
        }
        
        // Disconnect Pusher instance
        if (pusherRef.current) {
            try {
                pusherRef.current.disconnect();
            } catch (error) {
                console.error("Error disconnecting Pusher:", error);
            }
            pusherRef.current = null;
        }
    }, []);

    // Initialize Pusher and channels
    const setupPusher = useCallback(() => {
        if (!senderId || !recipientId) {
            return;
        }
        
        // Clean up any existing connections first
        cleanupPusher();
        
        // Create new Pusher instance
        pusherRef.current = new Pusher(PUSHER_KEY, {
            cluster: PUSHER_CLUSTER,
            authEndpoint: `${SERVER_URL}/pusher/auth`,
            auth: {
                params: {
                    user_id: senderId
                }
            },
            enabledTransports: ["ws", "wss"],
        });
        
        // Add connection handlers
        pusherRef.current.connection.bind('connected', () => {
            // Tell server we're online once connected - force this update
            updatePresence("join", true).catch(error => {
                console.error("Error updating presence on connection:", error);
            });
        });
        
        pusherRef.current.connection.bind('disconnected', () => {
            setIsRecipientOnline(false);
        });
        
        pusherRef.current.connection.bind('error', () => {
            // Attempt to reconnect after a delay
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
                setupPusher();
            }, 5000);
        });
        
        // Subscribe to message channel
        const chatChannelName = getChannelName(senderId, recipientId);
        messageChannelRef.current = pusherRef.current.subscribe(chatChannelName);
        
        // Bind message events
        messageChannelRef.current.bind("new-message", (data: Message) => {
            setStoredMessages((prevMessages) => {
                // Check if the message already exists to avoid duplicates
                if (prevMessages.some((msg) => msg.messageId === data.messageId)) {
                    return prevMessages;
                }
                
                // Add the new message and sort
                return [...prevMessages, data].sort((a, b) => a.timestamp - b.timestamp);
            });
        });
        
        // Subscribe to presence channel
        const presenceChannelName = "presence-users";
        presenceChannelRef.current = pusherRef.current.subscribe(presenceChannelName) as PresenceChannel;
        
        // Bind presence events
        presenceChannelRef.current.bind("pusher:subscription_succeeded", (members: PusherMembers) => {
            // Check if recipient is in the members list
            const isOnline = Object.keys(members.members).includes(recipientId);
            setIsRecipientOnline(isOnline);
        });
        
        presenceChannelRef.current.bind("pusher:member_added", (member: { id: string; info?: unknown }) => {
            if (member.id === recipientId) {
                setIsRecipientOnline(true);
            }
        });
        
        presenceChannelRef.current.bind("pusher:member_removed", (member: { id: string; info?: unknown }) => {
            if (member.id === recipientId) {
                setIsRecipientOnline(false);
            }
        });
        
        // Set up heartbeat instead of frequent presence updates
        heartbeatIntervalRef.current = setInterval(() => {
            if (pusherRef.current?.connection.state === "connected") {
                sendHeartbeat().catch(error => {
                    console.error("Error in heartbeat:", error);
                });
                
                // Only update presence occasionally (every 2 minutes)
                updatePresence("join").catch(error => {
                    console.error("Error in periodic presence update:", error);
                });
            }
        }, 30000); // Every 30 seconds
        
    }, [cleanupPusher, recipientId, senderId, updatePresence, sendHeartbeat]);

    // Load chat history
    useEffect(() => {
        const fetchMessages = async () => {
            if (!senderId || !recipientId) {
                return;
            }
            
            try {
                const allMessages = await getChatHistory(senderId, recipientId);
                const filteredMessages = allMessages.filter(
                    (msg) =>
                        (msg.senderId === senderId && msg.recipientId === recipientId) ||
                        (msg.senderId === recipientId && msg.recipientId === senderId)
                );

                filteredMessages.sort((a, b) => a.timestamp - b.timestamp);
                setStoredMessages(filteredMessages);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
    }, [recipientId, senderId, getChatHistory]);

    // Setup Pusher connections when user/recipient changes
    useEffect(() => {
        if (senderId && recipientId) {
            setupPusher();
        }
        
        return () => {
            cleanupPusher();
        };
    }, [recipientId, senderId, setupPusher, cleanupPusher]);

    // Filter messages when search value changes
    useEffect(() => {
        if (!searchValue.trim()) {
            // If no search term, use all stored messages
            setFilteredMessages(storedMessages);
        } else {
            // Filter messages that contain the search term in the content or filename
            const filtered = storedMessages.filter(msg => 
                (msg.messageContent && msg.messageContent.toLowerCase().includes(searchValue.toLowerCase())) ||
                (msg.fileName && msg.fileName.toLowerCase().includes(searchValue.toLowerCase()))
            );
            setFilteredMessages(filtered);
        }
    }, [searchValue, storedMessages]);

    // Group messages when filtered messages change
    useEffect(() => {
        setGroupedMessages(groupMessagesByDate(filteredMessages));
    }, [filteredMessages, groupMessagesByDate]);

    // Reset file state when recipient changes
    useEffect(() => {
        setLocalFileUrl("");
        setUploadedFileUrl("");
        setFileName("");
        setFileType("");
        setSearchValue("");
    }, [recipientId]);

    // Handle leaving page
    useEffect(() => {
        const handleBeforeUnload = () => {
            updatePresence("leave", true);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [updatePresence]);

    // More efficient presence check
    useEffect(() => {
        // Function to check recipient's online status
        const checkOnlineStatus = () => {
            if (presenceChannelRef.current && recipientId) {
                const members = presenceChannelRef.current.members;
                if (members) {
                    const memberIds = Object.keys(members.members);
                    const isOnline = memberIds.includes(recipientId);
                    
                    // Only update and log if status changes
                    setIsRecipientOnline(prevStatus => {
                        if (prevStatus !== isOnline) {
                            console.log(`Recipient ${recipientId} online status changed to:`, isOnline);
                        }
                        return isOnline;
                    });
                }
            }
        };
        
        // Check immediately
        checkOnlineStatus();
        
        // Check less frequently - every 30 seconds instead of 10
        const intervalId = setInterval(checkOnlineStatus, 30000);
        
        return () => {
            clearInterval(intervalId);
        };
    }, [recipientId]);

    const handleClearSearch = () => {
        setSearchValue("");
    };

    return (
        <div className="w-[100%] lg:w-[75%] flex">
            <div className="w-[100%] flex flex-col items-center relative">
                <div className="w-[95%] sticky top-0 bg-white z-10">
                    <Header 
                        userInfo={userInfo} 
                        actionIcons={[
                            { id: "1", icon: <SearchIconSvg />, type: 'search' },
                            { id: "2", icon: <FavoriteIconSvg width="22px" height="19px" color="#BABABA" />, type: 'favorite' },
                            { id: "3", icon: <BellIconSvg />, type: 'bell' },
                        ]}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        onSearchIconClick={handleClearSearch}
                    />
                    <div className="h-[1px] w-full bg-lightGray"></div>
                </div>
                <div className="w-[100%] flex justify-center overflow-y-scroll custom-scrollbar">
                    <div className="w-[95%] flex flex-col items-center h-[80vh]">
                        {searchValue.trim() !== "" && filteredMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full w-full">
                                <p className="text-gray-500 text-lg">No messages found for "{searchValue}"</p>
                            </div>
                        )}
                        {groupedMessages.map((group) => (
                            <div key={group.timestamp} className="w-full">
                                {group.date && (
                                    <div className="flex justify-center my-4 items-center">
                                        <span className="bg-slate w-full h-[1px]"></span>
                                        <span className="bg-gray-100 rounded-full px-3 py-1 text-sm text-slate mx-[1px] w-fit">
                                            {group.date}
                                        </span>
                                        <span className="bg-slate w-full h-[1px]"></span>
                                    </div>
                                )}
                                {group.messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.messageId}
                                        senderId={msg.senderId}
                                        messageContent={msg.messageContent}
                                        fileUrl={msg.fileUrl}
                                        fileName={msg.fileName}
                                        messageId={msg.messageId}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                {localFileUrl && (
                    <div className="mb-16 bg-lavenderBlue w-full flex justify-center pt-2">
                        <FilePreview fileUrl={localFileUrl} fileName={fileName} />
                    </div>
                )}

                <div className="bg-lavenderBlue w-full flex flex-col items-center justify-center py-1 absolute bottom-0">
                    <form onSubmit={handleSubmit} className="w-[95%] flex gap-x-2 px-3 items-center py-2 ">
                        <div className="w-[95%] bg-white flex items-end rounded-full px-3 ">
                            <Button type="submit" icon={<VoiceIconSvg />} className="mr-2 my-1" />
                            <Textarea
                                value={outgoingMessage}
                                placeholder="Write something..."
                                onChange={(e) => setOutgoingMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e); 
                                    }
                                }}
                                className="w-[90%] px-2 mb-2"
                            />
                            <div className="border-l border-slate flex items-center my-1">
                                {messageTypeBtnData.map((data) => (
                                    <label key={data.id} className="cursor-pointer mx-1">
                                        {data.icon}
                                        <Input type="file" accept={data.accept} onChange={handleFileChange} className="hidden" />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <Button type="submit" icon={<SendMessageIconSvg />} className="bg-primary w-10 h-10 rounded-full flex items-center p-2" />
                    </form>
                </div>
            </div>
        </div>
    );
};