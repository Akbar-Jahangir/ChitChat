import React, { useContext, useState, useRef, useEffect } from "react";
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
    ArrowIconSvg,
} from "../Svgs";
import { Header } from "../Header";
import { SenderContext, RecipientContext } from "../../contexts/ChatContext";
import { uid } from "uid";
import useDatabase from "../../hooks/useDatabase";
import { Message } from "../../interfaces/message.interface";
import { MessageBubble } from "../MessageBubble";
import { Textarea } from "../Textarea";
import { ref, uploadBytes, getDownloadURL, storage } from "../../utils/firebaseConfig";
import FilePreview from "../FilePreview/FilePreview";
import { ChatWindowProps } from "./chatWindow.interface";
import { MessageGroup } from "./messageGroup.interface";
import { PusherMembers } from "./pusherMember.interface";
import { formatMessageGroupDate } from "../../utils/dateFormatter";

export const ChatWindow: React.FC<ChatWindowProps> = ({ toggleRightSidebar, rightSidebarVisible }) => {
    
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
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [isCameraInitialized, setIsCameraInitialized] = useState<boolean>(false);
    const [capturedPhotoData, setCapturedPhotoData] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const pusherRef = useRef<Pusher | null>(null);
    const messageChannelRef = useRef<Channel | null>(null);
    const presenceChannelRef = useRef<PresenceChannel | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastPresenceUpdateRef = useRef<number>(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevRecipientIdRef = useRef<string>("");
    
    const { saveMessage, getChatHistory } = useDatabase();
    const { recipientname, recipientId, recipientPicUrl } = useContext(RecipientContext);
    const { senderId } = useContext(SenderContext);
    
    const PUSHER_KEY = "33466c91963fd345d327";
    const PUSHER_CLUSTER = "ap2";
    const SERVER_URL = "https://chit-chat.koyeb.app";

    const userInfo = {
        userId: recipientId,
        profilePicUrl: recipientPicUrl,
        username: recipientname,
        isOnline: isRecipientOnline
    };

    const SidebarToggleIcon = () => (
        <div
            onClick={toggleRightSidebar}
            className={`cursor-pointer transition-transform duration-300 ${rightSidebarVisible ? 'rotate-180' : ''}`}
        >
            <ArrowIconSvg />
        </div>
    );

    const messageTypeBtnData = [
        { id: 1, icon: <AttachmentIconSvg />, accept: "image/*,video/*,.mp3,.pdf,.docx,.xlsx,.ppt,.pptx,.ppsx" },
        { id: 2, icon: <CameraIconSvg />, type: "camera" },
    ];

    // Helper functions
    function groupMessagesByDate(messages: Message[]): MessageGroup[] {
        const groups: Record<string, { messages: Message[], timestamp: number }> = {};

        messages.forEach(message => {
            const { display, timestamp } = formatMessageGroupDate(message.timestamp);
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
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    function getChannelName(userId1: string, userId2: string): string {
        const sortedIds = [userId1, userId2].sort();
        return `chat-${sortedIds[0]}-${sortedIds[1]}`;
    }

  
    async function sendMessageToServer(messageData: Message): Promise<boolean> {
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
    }

    async function updatePresence(action: "join" | "leave", force: boolean = false): Promise<void> {
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
    }

    async function sendHeartbeat(): Promise<void> {
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
    }

    // Function to clear all form and media data
    function clearAllFormAndMediaData() {
        // Clear text input
        setOutgoingMessage("");
        
        // Clear file/media states
        setLocalFileUrl("");
        setUploadedFileUrl("");
        setFileName("");
        setFileType("");
        setCapturedPhotoData(null);
        
        // Stop any ongoing uploads
        if (isUploading) {
            setIsUploading(false);
        }
        
        // Clear file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        
        // Close camera if open
        if (isCameraOpen) {
            closeCamera();
        }
        
        // Clear search if any
        setSearchValue("");
    }
    
    function cancelMedia() {
        // Stop camera if it's active
        if (isCameraOpen) {
            closeCamera();
        }
        
        setLocalFileUrl("");
        setUploadedFileUrl("");
        setFileName("");
        setFileType("");
        setCapturedPhotoData(null);
        
        if (isUploading) {
            setIsUploading(false);
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    // File handling functions
    async function uploadFile(file: File): Promise<string> {
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
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    }

    // Camera functions
    function openCamera() {
        setIsCameraOpen(true);
        setIsCameraInitialized(false);
        setCapturedPhotoData(null);
    }

    function closeCamera() {
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
            cameraStreamRef.current = null;
        }
        setIsCameraOpen(false);
        setIsCameraInitialized(false);
    }

    function capturePhoto() {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Get data URL for preview
            const dataURL = canvas.toDataURL('image/jpeg');
            setCapturedPhotoData(dataURL);
            setLocalFileUrl(dataURL);
            
            // Create file name
            const currentDate = new Date();
            const fileName = `Photo_${currentDate.toISOString().replace(/:/g, '-')}.jpg`;
            setFileName(fileName);
            setFileType('image/jpeg');
            
            // Convert canvas to blob for upload
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                
                // Create file from blob
                const file = new File([blob], fileName, { type: 'image/jpeg' });
                
                try {
                    const fileUrl = await uploadFile(file);
                    setUploadedFileUrl(fileUrl);
                } catch (error) {
                    console.error("Error uploading captured photo:", error);
                    alert("Failed to upload photo. Please try again.");
                }
            }, 'image/jpeg', 0.95);
        }
    }

    function discardCapturedPhoto() {
        setCapturedPhotoData(null);
        setLocalFileUrl("");
        setFileName("");
        setFileType("");
        setUploadedFileUrl("");
        
        // Re-initialize camera without closing it
        setIsCameraInitialized(false);
    }

    function handleMediaButtonClick(type: string) {
        if (type === "camera") {
            openCamera();
        } else {
         
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const messageText = outgoingMessage.trim();
        if (!messageText && !uploadedFileUrl) return;
    
   
        const MESSAGE_SIZE_LIMIT = 9000;
        
        if (messageText.length > MESSAGE_SIZE_LIMIT) {
            alert(`Message too large. Please limit your message to ${MESSAGE_SIZE_LIMIT} characters.`);
            return;
        }
    
        const messageData: Message = {
            messageId: uid(),
            recipientId: recipientId,
            senderId: senderId,
            messageContent: messageText,
            timestamp: Date.now(),
            fileUrl: uploadedFileUrl,
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
            setCapturedPhotoData(null);
            
            // Close camera after message is sent
            if (isCameraOpen) {
                closeCamera();
            }
        }
    }

    function handleClearSearch() {
        setSearchValue("");
    }
  
    function cleanupPusher() {
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
    }

    function setupPusher() {
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
    }

    function checkOnlineStatus() {
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
    }

    useEffect(() => {
        if (isCameraOpen && !isCameraInitialized) {
            (async () => {
                try {
                    // Stop any existing stream
                    if (cameraStreamRef.current) {
                        cameraStreamRef.current.getTracks().forEach(track => track.stop());
                    }
    
                    // Get access to camera
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: "environment" }, // Use rear camera if available
                        audio: false
                    });
                    
                    cameraStreamRef.current = stream;
    
                    // Set the stream to the video element
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(err => {
                            console.error("Error playing video:", err);
                        });
                        setIsCameraInitialized(true);
                    }
                } catch (error) {
                    console.error("Error accessing camera:", error);
                    alert("Could not access camera. Please check camera permissions.");
                    closeCamera();
                    
                    // Fall back to file input if camera fails
                    if (fileInputRef.current) {
                        fileInputRef.current.click();
                    }
                }
            })();
        }
    }, [isCameraOpen, isCameraInitialized]);


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
                        (msg) =>
                            (msg.senderId === senderId && msg.recipientId === recipientId) ||
                            (msg.senderId === recipientId && msg.recipientId === senderId)
                    );
    
                    filteredMessages.sort((a, b) => a.timestamp - b.timestamp);
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
            
            // Also make sure to close camera if component unmounts
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [recipientId]);


    useEffect(() => {
        // First handle filtering
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

    return (
        <div className={`w-full lg:w-auto flex-grow transition-all duration-300 bg-white h-screen`}>
            <div className="w-[100%] flex flex-col items-center relative h-full">
                <div className="w-[95%] sticky top-0 bg-white z-10">
                    <Header
                        userInfo={userInfo}
                        actionIcons={[
                            { id: "1", icon: <SearchIconSvg />, type: 'search' },
                            { id: "2", icon: <FavoriteIconSvg width="22px" height="19px" color="#BABABA" />, type: 'favorite' },
                            { id: "3", icon: <BellIconSvg />, type: 'bell' },
                            { id: "4", icon: <SidebarToggleIcon />, type: 'toggle' },
                        ]}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        onSearchIconClick={handleClearSearch}
                    />
                    <div className="h-[1px] w-full bg-lightGray"></div>
                </div>
                <div className="w-[100%] flex justify-center overflow-y-scroll custom-scrollbar h-full mb-16">
                    <div className="w-[95%] flex flex-col items-center h-full">
                        {searchValue.trim() !== "" && filteredMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-screen w-full text-gray">
                                <p className="text-gray-500 text-lg">No messages found for "{searchValue}"</p>
                            </div>
                        )}
                        {groupedMessages.map((group) => (
                            <div key={group.timestamp} className="w-full">
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
                                {group.date && (
                                    <div className="flex justify-center my-4 items-center">
                                        <span className="bg-slate w-full h-[1px]"></span>
                                        <span className="bg-gray-100 rounded-full px-3 py-1 text-sm text-slate mx-[1px] w-fit">
                                            {group.date}
                                        </span>
                                        <span className="bg-slate w-full h-[1px]"></span>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                
                {/* Camera UI */}
                {isCameraOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center">
                        {capturedPhotoData ? (
                            // Show captured photo preview
                            <div className="flex flex-col items-center w-full">
                                <div className="relative w-full max-w-lg">
                                    <img 
                                        src={capturedPhotoData} 
                                        alt="Captured" 
                                        className="w-full h-auto"
                                    />
                                </div>
                                <div className="flex justify-center mt-4 w-full">
                                    <button 
                                        onClick={discardCapturedPhoto}
                                        className="bg-red-500 text-white rounded-full px-4 py-2 m-2"
                                    >
                                        Retake
                                    </button>
                                    <button 
                                        onClick={closeCamera}
                                        className="bg-green-500 text-white rounded-full px-4 py-2 m-2"
                                    >
                                        Use Photo
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Show camera viewfinder
                            <>
                                <div className="relative w-full max-w-lg">
                                    <video 
                                        ref={videoRef}
                                        autoPlay 
                                        playsInline 
                                        className="w-full h-auto"
                                        style={{ objectFit: 'cover' }}
                                    />
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                                <div className="flex justify-center mt-4 w-full">
                                    <button 
                                        onClick={capturePhoto}
                                        className="bg-white rounded-full w-16 h-16 flex items-center justify-center m-2"
                                    >
                                        <div className="bg-white border-4 border-gray-500 rounded-full w-12 h-12"></div>
                                    </button>
                                    <button 
                                        onClick={closeCamera}
                                        className="bg-red-500 text-white rounded-full px-4 py-2 flex items-center justify-center m-2"
                                    >
                                       Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
                
                {/* File Preview - Show only when camera is not open */}
                {localFileUrl && !isCameraOpen && (
                    <div className="mb-16 bg-lavenderBlue w-full flex justify-center pt-2 relative">
                        <FilePreview fileUrl={localFileUrl} fileName={fileName} />
                        
                        <Button
                            type="button"
                            onClick={cancelMedia}
                            className="absolute top-2 right-2 rounded border w-8 h-8 flex items-center justify-center"
                            aria-label="Cancel file upload"
                           btnText="✕"
                        />
                        
                        {/* Loading indicator for uploads */}
                        {isUploading && (
                            <div className="absolute inset-0 bg-gray bg-opacity-50 flex items-center justify-center">
                                <div className="loader w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
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
                                    data.type === "camera" ? (
                                        <div 
                                            key={data.id} 
                                            className="cursor-pointer mx-1"
                                            onClick={() => handleMediaButtonClick("camera")}
                                        >
                                            {data.icon}
                                        </div>
                                    ) : (
                                        <label key={data.id} className="cursor-pointer mx-1">
                                            {data.icon}
                                            <Input 
                                                ref={fileInputRef} 
                                                type="file" 
                                                accept={data.accept} 
                                                onChange={handleFileChange} 
                                                className="hidden" 
                                            />
                                        </label>
                                    )
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