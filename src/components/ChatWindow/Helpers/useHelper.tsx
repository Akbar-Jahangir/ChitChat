import { useState, useRef, useEffect, useContext } from "react";
import Pusher, { PresenceChannel, Channel } from "pusher-js";
import { uid } from "uid";
import { SenderContext, RecipientContext } from "../../../contexts/ChatContext";
import { Message } from "../../../interfaces/message.interface";
import { MessageGroup } from "../messageGroup.interface";
import { PusherMembers } from "../pusherMember.interface";
import useDatabase from "../../../hooks/useDatabase";
import { ref, uploadBytes, getDownloadURL, storage } from "../../../utils/firebaseConfig";
import { getChannelName, groupMessagesByDate, dataUrlToBlob, blobToFile } from "./helper";

export const SERVER_URL = "https://chit-chat.koyeb.app";
export const PUSHER_KEY = "33466c91963fd345d327";
export const PUSHER_CLUSTER = "ap2";

export function useHelper() {
    // Context
    const { saveMessage, getChatHistory } = useDatabase();
    const { recipientname, recipientId, recipientPicUrl } = useContext(RecipientContext);
    const { senderId } = useContext(SenderContext);

    // States
    const [outgoingMessage, setOutgoingMessage] = useState<string>("");
    const [storedMessages, setStoredMessages] = useState<Message[]>([]);
    const [groupedMessages, setGroupedMessages] = useState<MessageGroup[]>([]);
    const [localFileUrl, setLocalFileUrl] = useState<string>("");
    const [uploadedFileUrl, setUploadedFileUrl] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [fileType, setFileType] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store the selected file
    const [isRecipientOnline, setIsRecipientOnline] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [showNotification, setShowNotification] = useState<boolean>(false);
    const [notificationMessage, setNotificationMessage] = useState<string>("");
    
    // Refs
    const pusherRef = useRef<Pusher | null>(null);
    const messageChannelRef = useRef<Channel | null>(null);
    const presenceChannelRef = useRef<PresenceChannel | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastPresenceUpdateRef = useRef<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevRecipientIdRef = useRef<string>("");
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const notificationPermissionRef = useRef<boolean>(false);
    const notificationTimeout = useRef<NodeJS.Timeout | null>(null);
    const userInfo = {
        userId: recipientId,
        profilePicUrl: recipientPicUrl,
        username: recipientname,
        isOnline: isRecipientOnline
    };

    // Request notification permission
    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            notificationPermissionRef.current = permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    // Show notification
    const showMessageNotification = (message: Message) => {
        // Only show notifications for messages from the recipient to the current user
        if (message.senderId !== recipientId || message.recipientId !== senderId) {
            return;
        }

        // Play notification sound
        if (audioRef.current) {
            audioRef.current.play().catch(error => {
                console.error('Error playing notification sound:', error);
            });
        }

        // Show in-app notification
        const senderName = recipientname || 'Someone';
        const messageContent = message.messageContent || (message.fileUrl ? 'Sent an attachment' : 'New message');
        const shortMessage = messageContent.length > 40 ? `${messageContent.substring(0, 40)}...` : messageContent;
        
        setNotificationMessage(`${senderName}: ${shortMessage}`);
        setShowNotification(true);
        
        // Clear any existing timeout
        if (notificationTimeout.current) {
            clearTimeout(notificationTimeout.current);
        }
        
        // Auto-hide notification after 5 seconds
        const timeout = setTimeout(() => {
            setShowNotification(false);
        }, 5000);
        
        notificationTimeout.current = timeout;

        // Show browser notification if permission granted
        if (notificationPermissionRef.current && document.visibilityState !== 'visible') {
            try {
                const notification = new Notification('New Message', {
                    body: `${senderName}: ${shortMessage}`,
                    icon: recipientPicUrl || '/favicon.ico'
                });
                
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
                
                // Auto-close notification after 5 seconds
                setTimeout(() => notification.close(), 5000);
            } catch (error) {
                console.error('Error creating notification:', error);
            }
        }
    };

    // Send message to server
    const sendMessageToServer = async (messageData: Message): Promise<boolean> => {
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

    // Update presence status
    const updatePresence = async (action: "join" | "leave", force: boolean = false): Promise<void> => {
        if (!senderId) {
            return;
        }

        const now = Date.now();
        // Only update presence if forced or if it's been more than 2 minutes since the last update
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
            }
        } catch (error) {
            console.error(`Error ${action} presence:`, error);
        }
    };

    // Send heartbeat to keep connection alive
    const sendHeartbeat = async (): Promise<void> => {
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
    };

    // Clear all form and media data
    const clearAllFormAndMediaData = () => {
        setOutgoingMessage("");
        setLocalFileUrl("");
        setUploadedFileUrl("");
        setFileName("");
        setFileType("");
        setSelectedFile(null);
        setSearchValue("");
        if (isUploading) {
            setIsUploading(false);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        if (isCameraOpen) {
            closeCamera();
        }
    };

    // Cancel media upload or capture
    const cancelMedia = () => {
        if (isCameraOpen) {
            closeCamera();
        }
        setLocalFileUrl("");
        setUploadedFileUrl("");
        setFileName("");
        setFileType("");
        setSelectedFile(null);

        if (isUploading) {
            setIsUploading(false);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const uploadFile = async (file: File): Promise<string> => {
        try {
            setIsUploading(true);
            const fileRef = ref(storage, `chat-uploads/${Date.now()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            setIsUploading(false);
            return url;
        } catch (error) {
            setIsUploading(false);
            console.error("Error uploading file:", error);
            throw new Error("File upload failed");
        }
    };

    // Handle file input change
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        // Just store the selected file and show preview, without uploading
        const url = URL.createObjectURL(file);
        setLocalFileUrl(url);
        setFileName(file.name);
        setFileType(file.type);
        setSelectedFile(file); // Save the file for later upload

        e.target.value = "";
    };

    // Camera functions
    const openCamera = () => {
        setIsCameraOpen(true);
    };

    const closeCamera = () => {
        setIsCameraOpen(false);
    };

    const handleCapturedPhoto = async (dataURL: string, fileName: string) => {
        setLocalFileUrl(dataURL);
        setFileName(fileName);
        setFileType('image/jpeg');

        // Convert data URL to blob and store for later upload
        try {
            const blob = await dataUrlToBlob(dataURL);
            // Create file from blob and store it
            const file = blobToFile(blob, fileName);
            setSelectedFile(file);
        } catch (error) {
            console.error("Error processing captured photo:", error);
            alert("Failed to process photo. Please try again.");
        }

        closeCamera();
    };

    const handleMediaButtonClick = (type: string) => {
        if (type === "camera") {
            openCamera();
        } else {
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        }
    };

    // Handle message submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const messageText = outgoingMessage.trim();
        if (!messageText && !selectedFile) return;

        const MESSAGE_SIZE_LIMIT = 9000;

        if (messageText.length > MESSAGE_SIZE_LIMIT) {
            alert(`Message too large. Please limit your message to ${MESSAGE_SIZE_LIMIT} characters.`);
            return;
        }

        // Upload the file now if there is one
        let fileUrl = '';
        if (selectedFile) {
            try {
                fileUrl = await uploadFile(selectedFile);
                setUploadedFileUrl(fileUrl);
            } catch (error) {
                console.error("Error uploading file:", error);
                alert("Failed to upload file. Please try again.");
                return;
            }
        }

        const messageData: Message = {
            messageId: uid(),
            recipientId: recipientId,
            senderId: senderId,
            messageContent: messageText,
            timestamp: Date.now(),
            fileUrl: fileUrl,
            fileName: fileName,
            fileType: fileType
        };

        const sent = await sendMessageToServer(messageData);
        if (sent) {
            saveMessage(messageData);
            setOutgoingMessage("");
            setUploadedFileUrl("");
            setLocalFileUrl("");
            setFileName("");
            setFileType("");
            setSelectedFile(null);

            // Close camera after message is sent
            if (isCameraOpen) {
                closeCamera();
            }
        }
    };

    // Dismiss notification
    const handleDismissNotification = () => {
        setShowNotification(false);
        if (notificationTimeout.current) {
            clearTimeout(notificationTimeout.current);
        }
    };

    // Clear search
    const handleClearSearch = () => {
        setSearchValue("");
    };

    // Pusher cleanup
    const cleanupPusher = () => {
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
    };

    // Setup Pusher
    const setupPusher = () => {
        if (!pusherRef.current || !senderId || !recipientId) return;

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

                // Show notification if message is from recipient
                if (data.senderId === recipientId && data.recipientId === senderId) {
                    showMessageNotification(data);
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
    };

    // Check online status
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

    // Visibility change effect
    useEffect(() => {
        const handleVisibilityChange = () => {
            // If page becomes visible, dismiss any notifications
            if (document.visibilityState === 'visible' && showNotification) {
                setShowNotification(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [showNotification]);

    // Audio notification setup
    useEffect(() => {
        // Create audio element for notification sound
        audioRef.current = new Audio('/notification-alert.mp3');
        
        // Request notification permission when component mounts
        requestNotificationPermission();

        return () => {
            // Clean up audio element
            if (audioRef.current) {
                audioRef.current = null;
            }
        };
    }, []);

    // Message fetching and Pusher setup effect
    useEffect(() => {
        if (!senderId || !recipientId) {
            return;
        }

        if (prevRecipientIdRef.current !== recipientId && prevRecipientIdRef.current !== "") {
            // Clear all form and media data when switching to a different recipient
            clearAllFormAndMediaData();
        }
        // Update the ref with current recipientId for next comparison
        prevRecipientIdRef.current = recipientId;
        
        (async () => {
            try {
                const allMessages = await getChatHistory(senderId, recipientId);
                const filteredMessages = allMessages.filter(
                    (msg:Message) =>
                        (msg.senderId === senderId && msg.recipientId === recipientId) ||
                        (msg.senderId === recipientId && msg.recipientId === senderId)
                );

                // Sort messages by timestamp
                filteredMessages.sort((a: Message, b: Message): number => a.timestamp - b.timestamp);
                setStoredMessages(filteredMessages);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        })();

        cleanupPusher();

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

        pusherRef.current.connection.bind('connected', () => {
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
                // Re-setup Pusher on connection error
                cleanupPusher();
                setupPusher();
            }, 5000);
        });
        
        setupPusher();

        // Set up heartbeat and status checking
        heartbeatIntervalRef.current = setInterval(() => {
            if (pusherRef.current?.connection.state === "connected") {
                // Send heartbeat to keep connection alive
                sendHeartbeat().catch(error => {
                    console.error("Error in heartbeat:", error);
                });

                // Only update presence occasionally (every 2 minutes)
                updatePresence("join").catch(error => {
                    console.error("Error in periodic presence update:", error);
                });

                // Check online status regularly
                checkOnlineStatus();
            }
        }, 30000); // Every 30 seconds

        // Handle beforeunload to properly leave presence
        const handleBeforeUnload = () => {
            updatePresence("leave", true);
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        // Cleanup function
        return () => {
            cleanupPusher();
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [recipientId, senderId]);

    // Message filtering and grouping effect
    useEffect(() => {
        let messagesToProcess = storedMessages;

        if (searchValue.trim()) {
            // Filter messages that contain the search term in the content or filename
            messagesToProcess = storedMessages.filter(msg =>
                (msg.messageContent && msg.messageContent.toLowerCase().includes(searchValue.toLowerCase())) ||
                (msg.fileName && msg.fileName.toLowerCase().includes(searchValue.toLowerCase()))
            );
        }

        setFilteredMessages(messagesToProcess);

        // Then group the filtered messages
        setGroupedMessages(groupMessagesByDate(messagesToProcess));
    }, [searchValue, storedMessages]);

    // Scroll to bottom effect
    useEffect(() => {
        // Scroll to bottom when new messages arrive
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [groupedMessages]);

    return {
        // States
        outgoingMessage,
        setOutgoingMessage,
        storedMessages,
        groupedMessages,
        localFileUrl,
        uploadedFileUrl,
        fileName,
        fileType,
        isRecipientOnline,
        searchValue,
        setSearchValue,
        filteredMessages,
        isCameraOpen,
        isUploading,
        showNotification,
        notificationMessage,
        
        // Refs
        fileInputRef,
        messagesEndRef,
        
        // User info
        userInfo,
        
        // Functions
        handleFileChange,
        openCamera,
        closeCamera,
        handleCapturedPhoto,
        handleMediaButtonClick,
        handleSubmit,
        handleDismissNotification,
        handleClearSearch,
        cancelMedia
    };
}