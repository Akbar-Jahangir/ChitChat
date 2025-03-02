
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

export const ChatWindow: React.FC = () => {
    const [outgoingMessage, setOutgoingMessage] = useState<string>("");
    const { saveMessage, getMessages } = useDatabase();
    const [storedMessages, setStoredMessages] = useState<Message[]>([]);

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
        { id: 2, icon: <CameraIconSvg />, accept: "image/*", capture: "environment" },
    ];

    const sendMessageToServer = async (messageData: Message) => {
        try {
            const response = await fetch("http://localhost:5000/send-message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(messageData),
            });

            if (!response.ok) {
                throw new Error(`Failed to send message.`);
            }

            const responseData = await response.json(); // Ensure response is parsed
            console.log("Message sent successfully!", responseData);
        } catch (error) {
            console.error("Error sending message:", error);
            alert(`Something went wrong. Please try again.`);
        }
    };


    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!outgoingMessage.trim()) return;

        const messageData: Message = {
            messageId: uid(),
            conversationId: `${senderId}-${recipientId}`, // Unique conversation ID
            recipientId: recipientId,
            messageContent: outgoingMessage,
            messageType: "text",
            senderId: senderId,
            timestamp: Date.now(),
            fileUrl: undefined,
        };

        setStoredMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, messageData];
            return updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
        });
        saveMessage(messageData);
        await sendMessageToServer(messageData);

        setOutgoingMessage("");
    }, [outgoingMessage, recipientId, senderId]);
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const file = e.target.files[0];
        const fileUrl = URL.createObjectURL(file);

        const messageData: Message = {
            messageId: uid(),
            conversationId: `${senderId}-${recipientId}`,
            recipientId: recipientId,
            messageContent: outgoingMessage,
            messageType: file.type.startsWith("image/") ? "image" : "file",
            senderId: senderId,
            timestamp: Date.now(),
            fileUrl: fileUrl,
        };

        setStoredMessages((prevMessages) => {
            const updatedMessages = [...prevMessages, messageData];
            return updatedMessages.sort((a, b) => a.timestamp - b.timestamp);
        });
        saveMessage(messageData);
        await sendMessageToServer(messageData);
    };
    useEffect(() => {
        const fetchMessages = async () => {
            const allMessages = await getMessages();
            if (!allMessages || !Array.isArray(allMessages)) {
                setStoredMessages([]);
                return;
            }
            const filteredMessages = allMessages.filter(
                (msg) =>
                    (msg.senderId === senderId && msg.recipientId === recipientId) ||
                    (msg.senderId === recipientId && msg.recipientId === senderId)
            );
            filteredMessages.sort((a, b) => a.timestamp - b.timestamp);
            setStoredMessages(filteredMessages);
        };

        fetchMessages();

        const pusher = new Pusher("da72da3e339224a3b27a", { cluster: "ap2" });
        const channel = pusher.subscribe("chat-channel");

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
        };
    }, [recipientId]);

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
                    {storedMessages?.map((msg) => (
                        <ChatMessage key={`${msg.messageId}-${msg.timestamp}`} senderId={msg.senderId} messageContent={msg.messageContent} />
                    ))}
                </div>
                <div className="bg-lavenderBlue w-full flex justify-center py-1 absolute bottom-0">
                    <form onSubmit={handleSubmit} className="w-[95%] flex gap-x-2 px-3 items-center py-2">
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
                                        <Input type="file" accept={data.accept} onChange={handleFileUpload} className="hidden" multiple={true} />
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

