import React from "react";
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
import { MessageBubble } from "../MessageBubble";
import { Textarea } from "../Textarea";
import FilePreview from "../FilePreview/FilePreview";
import { ChatWindowProps } from "./chatWindow.interface";
import { Camera } from "../Camera/Camera";
import { useHelper } from "./Helpers/useHelper";

export const ChatWindow: React.FC<ChatWindowProps> = ({ toggleRightSidebar, rightSidebarVisible }) => {
    const {
        // States
        outgoingMessage,
        setOutgoingMessage,
        groupedMessages,
        localFileUrl,
        fileName,
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
        userInfo,

        // Functions
        handleFileChange,
        closeCamera,
        handleCapturedPhoto,
        handleMediaButtonClick,
        handleSubmit,
        handleDismissNotification,
        handleClearSearch,
        cancelMedia
    } = useHelper();

    const SidebarToggleIcon = () => (
        <div
            onClick={toggleRightSidebar}
            className={`cursor-pointer transition-transform duration-300 ${rightSidebarVisible ? 'rotate-180' : ''}`}
        >
            <ArrowIconSvg />
        </div>
    );

    // Message type buttons data
    const messageTypeBtnData = [
        { id: 1, icon: <AttachmentIconSvg />, accept: "image/*,video/*,.mp3,.pdf,.docx,.xlsx,.ppt,.pptx,.ppsx" },
        { id: 2, icon: <CameraIconSvg />, type: "camera" },
    ];

    return (
        <div className={`w-full lg:w-auto flex-grow transition-all duration-300 bg-white h-screen relative`}>
            {/* In-app notification */}
            {showNotification && (
                <div className="fixed top-4 right-4 max-w-xs bg-primary text-white p-4 rounded-lg shadow-lg z-50 animate-fadeIn">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 mr-2">
                            <p className="font-semibold text-sm">{notificationMessage}</p>
                        </div>
                        <Button
                            onClick={handleDismissNotification}
                            btnText="✕"
                            className="text-white hover:text-gray-200 focus:outline-none"
                            aria-label="Dismiss notification" />
                    </div>
                </div>
            )}

            {/* Hidden audio element for notification sound */}
            <audio preload="auto" />

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
                {isCameraOpen && (
                    <Camera
                        onCapture={handleCapturedPhoto}
                        onClose={closeCamera}
                    />
                )}
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