import React, { useContext, useState } from "react";
import BlankImg from "../../assets/Images/BlankImg.png"
import { MessageBubbleProps } from "./messageBubble.interface";
import { SenderContext, RecipientContext } from "../../contexts/ChatContext";
import { DocsThumbnailSvg, PdfThumbnailSvg, PowerPointThumbnailSvg, XcelThumbnailSvg } from "../Svgs";

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ messageContent, senderId, fileUrl, fileName }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const { senderId: currentUserId, senderPicUrl } = useContext(SenderContext);
    const { recipientPicUrl } = useContext(RecipientContext);
    const maxChars = 500;

    const toggleReadMore = () => {
        setIsExpanded(!isExpanded);
    };

    const isImage = (fileName: string) => {
        return [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".tiff", ".ico"].some(ext => fileName.toLowerCase().includes(ext));
    };

    const isVideo = (fileName: string) => {
        return [".mp4", ".mov", ".avi"].some(ext => fileName.toLowerCase().includes(ext));
    };

    const isAudio = (fileName: string) => {
        return [".mp3"].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };

    const isDocument = (fileName: string) => {
        return [".doc", ".docx", ".txt"].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };
    const isExcel = (fileName: string) => {
        return [".xls", ".xlsx", ".csv"].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };
    const isPowerPoint = (fileName: string) => {
        return [".ppt", ".pptx"].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };
    const isPdf = (fileName: string) => {
        return [".pdf",].some(ext =>
            fileName.toLowerCase().includes(ext)
        );
    };

    return (
        <>
            <div className={`w-[100%] flex ${senderId === currentUserId ? "justify-end" : "justify-start"} my-4`}>
                <div>
                    {senderId === currentUserId ? (
                        <div className="flex items-end gap-x-1">
                            <div className="mt-2 max-w-xs">
                                {/* Container for sender's messages */}
                                <div className={`${messageContent && fileUrl ? "bg-primary p-2 rounded-[10px] rounded-br-none" : ""}`}>
                                    {fileUrl && (
                                        isImage(fileName!) ? (
                                            <img
                                                src={fileUrl}
                                                alt="Uploaded"
                                                className={`rounded max-w-[200px] border p-1 ${messageContent ? "mb-2" : ""} cursor-pointer`}
                                                onClick={() => setSelectedImage(fileUrl)}
                                            />
                                        ) : isVideo(fileName!) ? (
                                            <video controls className={`rounded-lg max-w-[300px] ${messageContent ? "mb-2" : ""}`}>
                                                <source src={fileUrl} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : isDocument(fileName!) ? (
                                            <div className={`w-full flex flex-col items-center ${messageContent ? "mb-2" : ""}`}>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary block items-center gap-2"
                                                >
                                                    <div className="flex justify-center">
                                                        <DocsThumbnailSvg />
                                                    </div>
                                                </a>
                                                <p className="text-sm text-primary max-w-[150px] truncate">{fileName}</p>
                                            </div>
                                        ) : isPowerPoint(fileName!) ? (
                                            <div className={`w-full flex flex-col items-center ${messageContent ? "mb-2" : ""}`}>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary block items-center gap-2"
                                                >
                                                    <div className="flex justify-center">
                                                        <PowerPointThumbnailSvg />
                                                    </div>
                                                </a>
                                                <p className="text-sm text-primary max-w-[150px] truncate">{fileName}</p>
                                            </div>
                                        ) : isExcel(fileName!) ? (
                                            <div className={`w-full flex flex-col items-center ${messageContent ? "mb-2" : ""}`}>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary block items-center gap-2"
                                                >
                                                    <div className="flex justify-center max-w-[250px]">
                                                        <XcelThumbnailSvg />
                                                    </div>
                                                </a>
                                                <p className="text-sm text-primary max-w-[150px] truncate">{fileName}</p>
                                            </div>
                                        ) : isAudio(fileName!) ? (
                                            <audio controls className={messageContent ? "mb-2" : ""}>
                                                <source src={fileUrl} type="audio/mp3" />
                                                Your browser does not support the audio element.
                                            </audio>
                                        ) : isPdf(fileName!) ? (
                                            <div className={`w-full flex flex-col items-center ${messageContent ? "mb-2" : ""}`}>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary block items-center gap-2"
                                                >
                                                    <div className="flex justify-center">
                                                        <PdfThumbnailSvg />
                                                    </div>
                                                </a>
                                                <p className="text-sm text-primary max-w-[150px] truncate">{fileName}</p>
                                            </div>
                                        ) :
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`text-primary block ${messageContent ? "mb-2" : ""}`}
                                            >
                                                View File
                                            </a>
                                    )}

                                    {messageContent && (
                                        <div className={!fileUrl ? "bg-primary text-black rounded-[10px] rounded-br-none p-2 break-words" : ""}>
                                            {isExpanded || messageContent.length <= maxChars
                                                ? messageContent
                                                : `${messageContent.slice(0, maxChars)} `}
                                            {messageContent.length > maxChars && (
                                                <button onClick={toggleReadMore} className="text-smokeWhite text-sm">
                                                    {isExpanded ? "Read less" : "Read more"}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <img src={senderPicUrl || BlankImg} className="w-[25px] h-[25px] rounded-full" />
                        </div>
                    ) : (
                        <div className="flex items-end gap-x-1">
                            <img src={recipientPicUrl || BlankImg} className="w-[25px] h-[25px] rounded-full" />
                            <div className="mt-2 max-w-xs">
                                {/* Container for recipient's messages */}
                                <div className={`${messageContent && fileUrl ? "bg-lavenderBlue p-2 rounded-[10px] rounded-bl-none" : ""}`}>
                                    {fileUrl && (
                                        isImage(fileName!) ? (
                                            <img
                                                src={fileUrl}
                                                alt="Uploaded"
                                                className={`rounded-lg max-w-[200px] border p-1 ${messageContent ? "mb-2" : ""} cursor-pointer`}
                                                onClick={() => setSelectedImage(fileUrl)}
                                            />
                                        ) : isVideo(fileName!) ? (
                                            <video controls className={`rounded-lg max-w-[300px] ${messageContent ? "mb-2" : ""}`}>
                                                <source src={fileUrl} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : isDocument(fileName!) ? (
                                            <div className={`w-full flex flex-col items-center ${messageContent ? "mb-2" : ""}`}>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary block items-center gap-2"
                                                >
                                                    <div className="flex justify-center">
                                                        <DocsThumbnailSvg />
                                                    </div>
                                                </a>
                                                <p className="text-sm text-primary max-w-[150px] truncate">{fileName}</p>
                                            </div>
                                        ) : isPowerPoint(fileName!) ? (
                                            <div className={`w-full flex flex-col items-center ${messageContent ? "mb-2" : ""}`}>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary block items-center gap-2"
                                                >
                                                    <div className="flex justify-center">
                                                        <PowerPointThumbnailSvg />
                                                    </div>
                                                </a>
                                                <p className="text-sm text-primary max-w-[150px] truncate">{fileName}</p>
                                            </div>
                                        ) : isExcel(fileName!) ? (
                                            <div className={`w-full flex flex-col items-center ${messageContent ? "mb-2" : ""}`}>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary block items-center gap-2"
                                                >
                                                    <div className="flex justify-center max-w-[250px]">
                                                        <XcelThumbnailSvg />
                                                    </div>
                                                </a>
                                                <p className="text-sm text-primary max-w-[150px] truncate">{fileName}</p>
                                            </div>
                                        ) : isAudio(fileName!) ? (
                                            <audio controls className={messageContent ? "mb-2" : ""}>
                                                <source src={fileUrl} type="audio/mp3" />
                                                Your browser does not support the audio element.
                                            </audio>
                                        ) : isPdf(fileName!) ? (
                                            <div className={`w-full flex flex-col items-center ${messageContent ? "mb-2" : ""}`}>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary block items-center gap-2"
                                                >
                                                    <div className="flex justify-center">
                                                        <PdfThumbnailSvg />
                                                    </div>
                                                </a>
                                                <p className="text-sm text-primary max-w-[150px] truncate">{fileName}</p>
                                            </div>
                                        ) :
                                            <a
                                                href={fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`text-primary block ${messageContent ? "mb-2" : ""}`}
                                            >
                                                View File
                                            </a>
                                    )}

                                    {messageContent && (
                                        <div className={!fileUrl ? "bg-lavenderBlue text-black rounded-[10px] rounded-bl-none p-2 break-words" : ""}>
                                            {isExpanded || messageContent.length <= maxChars
                                                ? messageContent
                                                : `${messageContent.slice(0, maxChars)} `}
                                            {messageContent.length > maxChars && (
                                                <button onClick={toggleReadMore} className="text-primary text-sm">
                                                    {isExpanded ? "Read less" : "Read more"}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-3xl w-full flex justify-center">
                        <img
                            src={selectedImage}
                            alt="Full screen"
                            className="rounded-lg max-w-full max-h-screen"
                        />
                        <button
                            className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded-full text-lg font-bold"
                            onClick={() => setSelectedImage(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
});