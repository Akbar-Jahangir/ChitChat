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
import { ChatMessage } from "../MessageBubble";
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
   
    
    // Refs to track connection states
    const pusherRef = useRef<Pusher | null>(null);
    const messageChannelRef = useRef<Channel | null>(null);
    const presenceChannelRef = useRef<PresenceChannel | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            console.log("Sending message to server at:", `${SERVER_URL}/send-message`);
            
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
    
            const responseData = await response.json();
            console.log("Message sent successfully!", responseData);
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
    const updatePresence = useCallback(async (action: "join" | "leave") => {
        if (!senderId) {
            console.warn("Cannot update presence: senderId is not defined");
            return;
        }
        
        const endpoint = action === "join" ? "join-presence" : "leave-presence";
        try {
            console.log(`${action === "join" ? "Joining" : "Leaving"} presence channel for user ${senderId}`);
            
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
            
            const data = await response.json();
            console.log(`Successfully ${action === "join" ? "joined" : "left"} presence:`, data);
        } catch (error) {
            console.error(`Error ${action} presence:`, error);
        }
    }, [senderId]);

    // Clean up all Pusher resources
    const cleanupPusher = useCallback(() => {
        console.log("Cleaning up Pusher resources");
        
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
                console.log("Unbinding events from message channel:", messageChannelRef.current.name);
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
                console.log("Unbinding events from presence channel:", presenceChannelRef.current.name);
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
                console.log("Disconnecting Pusher");
                pusherRef.current.disconnect();
            } catch (error) {
                console.error("Error disconnecting Pusher:", error);
            }
            pusherRef.current = null;
        }
        
;
        
    }, []);

    // Initialize Pusher and channels
    const setupPusher = useCallback(() => {
        console.log("Setting up Pusher with senderId:", senderId, "and recipientId:", recipientId);
        
        if (!senderId || !recipientId) {
            console.warn("Cannot setup Pusher: senderId or recipientId is not defined");
            return;
        }
        
        // Clean up any existing connections first
        cleanupPusher();
        
       
        
        // Create new Pusher instance with debug logging
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
            console.log('Connected to Pusher successfully');
           
            
            // Tell server we're online once connected
            updatePresence("join").catch(error => {
                console.error("Error updating presence on connection:", error);
            });
        });
        
        pusherRef.current.connection.bind('disconnected', () => {
            console.log('Disconnected from Pusher');
        
            setIsRecipientOnline(false);
        });
        
        pusherRef.current.connection.bind('error', () => {
            console.error('Pusher connection error:');
            
            
            // Attempt to reconnect after a delay
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log("Attempting to reconnect to Pusher...");
                setupPusher();
            }, 5000);
        });
        
        // Subscribe to message channel
        const chatChannelName = getChannelName(senderId, recipientId);
        console.log("Subscribing to message channel:", chatChannelName);
        messageChannelRef.current = pusherRef.current.subscribe(chatChannelName);
        
        // Bind message events
        messageChannelRef.current.bind("pusher:subscription_succeeded", () => {
            console.log("Successfully subscribed to message channel:", chatChannelName);
        });
        
        messageChannelRef.current.bind("pusher:subscription_error", () => {
            console.error("Error subscribing to message channel:");
        });
        
        messageChannelRef.current.bind("new-message", (data: Message) => {
            console.log("Received new message:", data);
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
        console.log("Subscribing to presence channel:", presenceChannelName);
        presenceChannelRef.current = pusherRef.current.subscribe(presenceChannelName) as PresenceChannel;
        
        // Bind presence events
        presenceChannelRef.current.bind("pusher:subscription_succeeded", (members: PusherMembers) => {
            console.log("Successfully subscribed to presence channel with members:", members);
            console.log("Looking for recipient ID:", recipientId);
            console.log("Current members:", Object.keys(members.members));
            
            // Check if recipient is in the members list
            const isOnline = Object.keys(members.members).includes(recipientId);
            console.log("Is recipient online?", isOnline);
            setIsRecipientOnline(isOnline);
        });
        
        presenceChannelRef.current.bind("pusher:subscription_error", () => {
            console.error("Error subscribing to presence channel:");
        });
        
        presenceChannelRef.current.bind("pusher:member_added", (member: { id: string; info?: unknown }) => {
            console.log("Member added to presence channel:", member);
            
            if (member.id === recipientId) {
                console.log("Recipient came online:", recipientId);
                setIsRecipientOnline(true);
            }
        });
        
        presenceChannelRef.current.bind("pusher:member_removed", (member: { id: string; info?: unknown }) => {
            console.log("Member removed from presence channel:", member);
            
            if (member.id === recipientId) {
                console.log("Recipient went offline:", recipientId);
                setIsRecipientOnline(false);
            }
        });
        
        // Set up heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
            if (pusherRef.current?.connection.state === "connected") {
                updatePresence("join").catch(error => {
                    console.error("Error in heartbeat:", error);
                });
            }
        }, 30000); // Every 30 seconds
        
    }, [cleanupPusher, recipientId, senderId, updatePresence]);

    // Load chat history
    useEffect(() => {
        const fetchMessages = async () => {
            if (!senderId || !recipientId) {
                console.warn("Cannot fetch messages: senderId or recipientId is not defined");
                return;
            }
            
            try {
                console.log("Fetching chat history for sender:", senderId, "and recipient:", recipientId);
                const allMessages = await getChatHistory(senderId, recipientId);
                const filteredMessages = allMessages.filter(
                    (msg) =>
                        (msg.senderId === senderId && msg.recipientId === recipientId) ||
                        (msg.senderId === recipientId && msg.recipientId === senderId)
                );

                filteredMessages.sort((a, b) => a.timestamp - b.timestamp);
                console.log("Retrieved", filteredMessages.length, "messages");
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

    // Group messages when stored messages change
    useEffect(() => {
        setGroupedMessages(groupMessagesByDate(storedMessages));
    }, [storedMessages, groupMessagesByDate]);

    // Reset file state when recipient changes
    useEffect(() => {
        setLocalFileUrl("");
        setUploadedFileUrl("");
        setFileName("");
        setFileType("");
    }, [recipientId]);

    // Handle page unload events
    useEffect(() => {
        const handleBeforeUnload = () => {
            updatePresence("leave");
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [updatePresence]);

    // Explicitly check online status periodically
    useEffect(() => {
        const checkOnlineStatus = () => {
            if (presenceChannelRef.current && recipientId) {
                const members = presenceChannelRef.current.members;
                if (members) {
                    const memberIds = Object.keys(members.members);
                    console.log("Current presence members:", memberIds);
                    const isOnline = memberIds.includes(recipientId);
                    console.log(`Recipient ${recipientId} online status:`, isOnline);
                    setIsRecipientOnline(isOnline);
                }
            }
        };
        
        // Check immediately and then periodically
        checkOnlineStatus();
        const intervalId = setInterval(checkOnlineStatus, 10000); // Every 10 seconds
        
        return () => {
            clearInterval(intervalId);
        };
    }, [recipientId]);

    // Scroll to bottom when new messages arrive
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    
    

    return (
        <div className="w-[100%] lg:w-[75%] flex">
            <div className="w-[100%] flex flex-col items-center relative">
                <div className="w-[95%] sticky top-0 bg-white z-10">
                    <Header userInfo={userInfo} actionIcons={[
                        { id: "1", icon: <SearchIconSvg /> },
                        { id: "2", icon: <FavoriteIconSvg width="22px" height="19px" color="#BABABA" /> },
                        { id: "3", icon: <BellIconSvg /> },
                    ]} />
                    <div className="h-[1px] w-full bg-lightGray"></div>
                   
                </div>
                <div className="w-[100%] flex justify-center overflow-y-scroll custom-scrollbar">
                    <div className="w-[95%] flex flex-col items-center h-[80vh]">
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
                                    <ChatMessage
                                        key={msg.messageId}
                                        senderId={msg.senderId}
                                        messageContent={msg.messageContent}
                                        fileUrl={msg.fileUrl}
                                        fileName={msg.fileName}
                                    />
                                ))}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
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