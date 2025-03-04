
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
import { Sidebar } from "../Sidebar";
import { uid } from "uid";
import useDatabase from "../../hooks/useDatabase";
import { Message } from "../../interfaces/message.interface";
import { ChatMessage } from "../ChatMessage";
import { Textarea } from "../Textarea/Textarea";
import { supabase } from "../../utils/client";
import FilePreview from "../FilePreview/FilePreview";
export const ChatWindow: React.FC = () => {
    const [outgoingMessage, setOutgoingMessage] = useState<string>("");
    const { saveMessage, getMessages } = useDatabase();
    const [storedMessages, setStoredMessages] = useState<Message[]>([]);
    const [fileUrl, setFileUrl] = useState<string>("")

    const { recipientname,
        recipientId,
        recipientPicUrl, } =
        useContext(RecipientContext);
    const { senderId } = useContext(SenderContext);




    const userInfo = {
        userId: recipientId,
        profilePicUrl: recipientPicUrl,
        username: recipientname,
    };

    const messageTypeBtnData = [
        { id: 1, icon: <AttachmentIconSvg />, accept: "image/*,video/*,audio/*,.pdf,.docx,.xlsx" },
        { id: 2, icon: <CameraIconSvg />, accept: "image/*" },
    ];
    const checkServerStatus = async () => {
        try {
            const response = await fetch("http://localhost:5000/health-check", {
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
            const response = await fetch("http://localhost:5000/send-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messageData,
                    channel: getChannelName(messageData.senderId, messageData.recipientId),
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to send message.`);
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

        if (!outgoingMessage.trim() && !fileUrl) return;

        const messageData: Message = {
            messageId: uid(),
            recipientId: recipientId,
            senderId: senderId,
            messageContent: outgoingMessage.trim(),
            timestamp: Date.now(),
            fileUrl: fileUrl,
        };

        const sent = await sendMessageToServer(messageData);
        if (sent) {
            setStoredMessages((prevMessages) => [...prevMessages, messageData].sort((a, b) => a.timestamp - b.timestamp));
            saveMessage(messageData);

            setOutgoingMessage("");
            setFileUrl("");
        }
    }, [outgoingMessage, fileUrl, senderId, recipientId]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileExt = file.name.split(".").pop();
        const fileName = `${uid()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        e.target.value = "";

        const { error } = await supabase.storage
            .from("chat-uploads")
            .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (error) {
            console.error("File upload failed:", error);
            alert("Failed to upload file.");
            return;
        }

        const { data } = supabase.storage.from("chat-uploads").getPublicUrl(filePath);

        if (data?.publicUrl) {
            setFileUrl(data.publicUrl)
        }
    };

    const getChannelName = (userId1: string, userId2: string) => {
        const sortedIds = [userId1, userId2].sort();
        return `chat-${sortedIds[0]}-${sortedIds[1]}`;
    };

    useEffect(() => {
        const fetchMessages = async () => {
            const allMessages = await getMessages(senderId, recipientId);
            console.log("All messages from database:", allMessages);
            const filteredMessages = allMessages.filter(
                (msg) =>
                    (msg.senderId === senderId && msg.recipientId === recipientId) ||
                    (msg.senderId === recipientId && msg.recipientId === senderId)
            );

            filteredMessages.sort((a, b) => a.timestamp - b.timestamp);
            setStoredMessages(filteredMessages);
            console.log("Filtered messages:", filteredMessages);
        };

        fetchMessages();

        const channelName = getChannelName(senderId, recipientId);
        const pusher = new Pusher("da72da3e339224a3b27a", { cluster: "ap2" });
        const channel = pusher.subscribe(channelName);

        channel.bind("new-message", (data: Message) => {
            setStoredMessages((prevMessages) => {
                if (prevMessages.some((msg) => msg.messageId === data.messageId)) {
                    return prevMessages;
                }
                return [...prevMessages, data].sort((a, b) => a.timestamp - b.timestamp);
            });
        });

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
            pusher.disconnect();
        };
    }, [recipientId, senderId]);



    return (
        <div className="w-full flex">
            <div className="w-[80%] flex flex-col items-center relative">
                <div className="w-[95%] sticky top-0 bg-white">

                    <Header userInfo={userInfo} actionIcons={[
                        { id: "1", icon: <SearchIconSvg /> },
                        { id: "2", icon: <FavoriteIconSvg width="22px" height="19px" color="#BABABA" /> },
                        { id: "3", icon: <BellIconSvg /> },
                    ]} />
                    <div className="h-[1px] w-full bg-lightGray"></div>
                </div>
                <div className="w-[100%] flex flex-col items-center h-[80vh] overflow-y-scroll custom-scrollbar">
                    {storedMessages &&
                        storedMessages.map((msg) => (
                            <ChatMessage key={msg.messageId} senderId={msg.senderId} messageContent={msg.messageContent} picUrl={msg.fileUrl} />
                        ))}
                </div>
                {fileUrl && (
                    <FilePreview fileUrl={fileUrl} />
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
                                        e.preventDefault(); // Prevents adding a new line
                                        handleSubmit(e); // Calls the message sending function
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
            <Sidebar alignment="right" />
        </div>
    );
};

