import React, { useCallback, useContext, useEffect, useState } from "react";
import Pusher from "pusher-js";
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

    // Format date for message grouping
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
            // Format as "March 7, 2025" for older dates
            return {
                display: messageDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
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

    const checkServerStatus = async () => {
        try {
            const response = await fetch(`${SERVER_URL}/health-check`, {
                method: "GET",
                headers: { "Cache-Control": "no-cache" }, // Ensures fresh request
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json();
            return data.status === "ok";
        } catch (error) {
            console.error("Error checking server status:", error);
            return false;
        }
    };

    const sendMessageToServer = async (messageData: Message) => {
        const isServerOnline = await checkServerStatus();
        if (!isServerOnline) {
            alert("Server is offline. Message not sent.");
            setOutgoingMessage("");
            return false;
        }

        try {
            const response = await fetch(`${SERVER_URL}/send-message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messageData,
                    channel: getChannelName(messageData.senderId, messageData.recipientId),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to send message.");
            }

            const responseData = await response.json();
            console.log("Message sent successfully!", responseData);
            return true;
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please check your connection.");
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
    const updatePresence = async (action: "join" | "leave") => {
        const endpoint = action === "join" ? "join-presence" : "leave-presence";
        try {
            await fetch(`${SERVER_URL}/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: senderId }),
            });
        } catch (error) {
            console.error(`Error ${action} presence:`, error);
        }
    };

    // Handle messages from Pusher
    useEffect(() => {
        const fetchMessages = async () => {
            const allMessages = await getChatHistory(senderId, recipientId);
            const filteredMessages = allMessages.filter(
                (msg) =>
                    (msg.senderId === senderId && msg.recipientId === recipientId) ||
                    (msg.senderId === recipientId && msg.recipientId === senderId)
            );

            filteredMessages.sort((a, b) => a.timestamp - b.timestamp);
            setStoredMessages(filteredMessages);
        };

        fetchMessages();

        // Set up chat message pusher
        const channelName = getChannelName(senderId, recipientId);
        const messagePusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
        const messageChannel = messagePusher.subscribe(channelName);

        messageChannel.bind("new-message", (data: Message) => {
            setStoredMessages((prevMessages) => {
                // Check if the message already exists to avoid duplicates
                if (prevMessages.some((msg) => msg.messageId === data.messageId)) {
                    return prevMessages;
                }

                // Add the new message and sort
                return [...prevMessages, data].sort((a, b) => a.timestamp - b.timestamp);
            });
        });

        return () => {
            messageChannel.unbind_all();
            messageChannel.unsubscribe();
            messagePusher.disconnect();
        };
    }, [recipientId, senderId, getChatHistory]);

    // Handle online status with Pusher presence channels
    useEffect(() => {
        // Configure Pusher for presence channels
        const presencePusher = new Pusher(PUSHER_KEY, {
            cluster: PUSHER_CLUSTER,
            authEndpoint: `${SERVER_URL}/pusher/auth`,
            auth: {
                params: {
                    user_id: senderId
                }
            }
        });

        // Subscribe to presence channel for ALL users
        const presenceChannelName = `presence-users`;
        const presenceChannel = presencePusher.subscribe(presenceChannelName);

        // Set online status when subscription succeeds
        presenceChannel.bind("pusher:subscription_succeeded", (members: PusherMembers) => {
            // Check if recipient is in the members list
            const isOnline = members.members && members.members[recipientId] !== undefined;
            setIsRecipientOnline(isOnline);
        });

        // When someone comes online
        presenceChannel.bind("pusher:member_added", (member: { id: string; info?: unknown }) => {
            if (member.id === recipientId) {
                setIsRecipientOnline(true);
            }
        });

        // When someone goes offline
        presenceChannel.bind("pusher:member_removed", (member: { id: string; info?: unknown }) => {
            if (member.id === recipientId) {
                setIsRecipientOnline(false);
            }
        });

        // When page loads, mark user as online
        updatePresence("join");

        // Set up heartbeat to maintain presence
        const heartbeatInterval = setInterval(() => {
            updatePresence("join");
        }, 30000); // Every 30 seconds

        // When component unmounts or user changes
        return () => {
            clearInterval(heartbeatInterval);
            presenceChannel.unbind_all();
            presenceChannel.unsubscribe();
            presencePusher.disconnect();
            
            // Notify server that user is going offline
            updatePresence("leave");
        };
    }, [recipientId, senderId]);

    // Group messages when stored messages change
    useEffect(() => {
        setGroupedMessages(groupMessagesByDate(storedMessages));
    }, [storedMessages, groupMessagesByDate]);

    // Reset file-related states when changing recipient
    useEffect(() => {
        setLocalFileUrl("");
        setUploadedFileUrl("");
        setFileName("");
        setFileType("");
    }, [recipientId]);

    // Set window unload listener to update status when user leaves
    useEffect(() => {
        const handleBeforeUnload = () => {
            updatePresence("leave");
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            updatePresence("leave");
        };
    }, [senderId]);

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
                                        <span className="bg-gray-100 rounded-full px-3 py-1 text-sm text-slate mx-[1px]">
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