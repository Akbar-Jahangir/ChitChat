import React, { useContext, useState } from "react";
import BlankImg from "../../assets/Images/blankImg.png"
import { ChatMessageProps } from "./chatMessage.interface";
import { SenderContext, RecipientContext } from "../../contexts/ChatContext";


export const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ messageContent, senderId, picUrl }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const { senderId:currentUserId, senderPicUrl } = useContext(SenderContext);
    const { recipientPicUrl } = useContext(RecipientContext);
    const maxChars = 500;

    const toggleReadMore = () => {
        setIsExpanded(!isExpanded);
    };


    return (
        <div className={`w-[95%] flex  ${senderId === currentUserId ? "justify-end" : "justify-start"} my-4`}>
            <div className={`my-2`}>
                {senderId === currentUserId ?
                    <div className="flex items-end gap-x-1">
                        {picUrl && <img src={picUrl} alt="pic" className="max-w-[300px] max-h-[300px] " />}
                        {messageContent &&
                            <p className="bg-primary text-black rounded-[10px] rounded-bl-none p-2 max-w-[265px] break-words">
                                {isExpanded || messageContent.length <= maxChars
                                    ? messageContent
                                    : `${messageContent.slice(0, maxChars)} `}
                                {messageContent.length > maxChars && (
                                    <button
                                        onClick={toggleReadMore}
                                        className="text-smokeWhite text-sm"
                                    >
                                        {isExpanded ? "Read less" : "Read more"}
                                    </button>
                                )}
                            </p>
                        }
                        <img src={senderPicUrl || BlankImg} className="w-[25px] h-[25px] rounded-full " />
                    </div>
                    : <div className="flex items-end gap-x-1">
                        <img src={recipientPicUrl || BlankImg} className="w-[25px] h-[25px] rounded-full" />
                        <p className="bg-lavenderBlue text-black rounded-[10px] rounded-bl-none p-2  max-w-[265px] break-words">
                            {isExpanded || messageContent.length <= maxChars
                                ? messageContent
                                : `${messageContent.slice(0, maxChars)} `}
                            {messageContent.length > maxChars && (
                                <button
                                    onClick={toggleReadMore}
                                    className="text-primary text-sm"
                                >
                                    {isExpanded ? "Read less" : "Read more"}
                                </button>
                            )}
                        </p>
                    </div>}
            </div>
        </div>
    );
});


