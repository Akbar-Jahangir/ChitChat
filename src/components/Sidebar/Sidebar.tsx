import React, { useContext, useEffect, useState } from "react";
import { Button } from "../Button";
import { ChatItem } from "../ChatItem";
import { Header } from "../Header";
import { Searchbar } from "../Searchbar";
import {
  ChatIconSvg,
  EditIconSvg,
  FavoriteIconSvg,
  ImageIconSvg,
  MP3IconSvg,
  PdfIconSvg,
  ProfileIconSvg,
  VideoChatIconSvg,
  VideoIconSvg,
} from "../Svgs";
import { SenderContext, RecipientContext } from "../../contexts/ChatContext";
import { SidebarProps } from "./sidebar.interface";
import BlankImg from "../../assets/Images/BlankImg.png"
import { MediaDisplay } from "../MediaDisplay";
import { Message } from "../../interfaces/message.interface";
import getChatHistory from "../../utils/getChatHistory";
import useSidebar from "../../hooks/useSidebar";

export const Sidebar: React.FC<SidebarProps> = ({ alignment = null, }) => {
  const [searchValue, setSearchValue] = useState("");
  const [mediaItems, setMediaItems] = useState<Message[]>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<string | null>(null);
  const [filteredMediaItems, setFilteredMediaItems] = useState<Message[]>([]);
  const { toggleRightSidebar,isRightSidebarOpen} = useSidebar()
  const { sendername, senderId, senderPicUrl } = useContext(SenderContext);
  const { recipientId, recipientname, recipientPicUrl } = useContext(RecipientContext);
  const userInfo = {
    userId: senderId,
    profilePicUrl: senderPicUrl,
    username: sendername,
  };

  const mediaBtnsData = [
    { id: 20, btnText: "PDF", icon: <PdfIconSvg /> },
    { id: 30, btnText: "VIDEO", icon: <VideoIconSvg /> },
    { id: 40, btnText: "MP3", icon: <MP3IconSvg /> },
    { id: 50, btnText: "IMAGE", icon: <ImageIconSvg /> },
  ];

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const allMessages = await getChatHistory(senderId, recipientId);


        const filteredMessages = allMessages.filter(
          (msg) =>
            (msg.senderId === senderId && msg.recipientId === recipientId) ||
            (msg.senderId === recipientId && msg.recipientId === senderId)
        );
        filteredMessages.sort((a, b) => a.timestamp - b.timestamp);

        const extractedMediaItems: Message[] = [];

        filteredMessages.forEach(msg => {
          // Check if the message has fileUrl property
          if (msg && msg.fileUrl) {
            // If fileUrl is an array, process each item
            if (Array.isArray(msg.fileUrl)) {
              msg.fileUrl.forEach(fileItem => {
                if ((typeof fileItem === 'object') && fileItem.fileUrl && fileItem.fileName) {
                  extractedMediaItems.push({
                    messageId: `${msg.messageId}-${fileItem.fileName}`,
                    fileUrl: fileItem.fileUrl,
                    fileName: fileItem.fileName,
                    fileType: fileItem.fileType || getFileTypeFromName(fileItem.fileName),
                    timestamp: msg.timestamp,
                    senderId: msg.senderId,
                    recipientId: msg.recipientId
                  });
                }
              });
            }
            // If fileUrl is a string and fileName exists, it's a single file
            else if (typeof msg.fileUrl === 'string' && msg.fileName) {
              extractedMediaItems.push({
                messageId: msg.messageId,
                fileUrl: msg.fileUrl,
                fileName: msg.fileName,
                fileType: msg.fileType || getFileTypeFromName(msg.fileName),
                timestamp: msg.timestamp,
                senderId: msg.senderId,
                recipientId: msg.recipientId
              });
            }
          }
        });

        setMediaItems(extractedMediaItems);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };

    if (recipientId) {
      fetchMessages();
    }
  }, [recipientId]);


  const getFileTypeFromName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'IMAGE';
    } else if (['mp4', 'webm', 'mov', 'avi'].includes(extension)) {
      return 'VIDEO';
    } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
      return 'MP3';
    } else if (['pdf'].includes(extension)) {
      return 'PDF';
    }

    return 'OTHER';
  };

  useEffect(() => {
    // Filter media items based on selected media type and search value
    let filtered = mediaItems;
    
    // Apply media type filter
    if (selectedMediaType && selectedMediaType !== "ALL") {
      filtered = filtered.filter(item => item.fileType === selectedMediaType);
    }
    
    // Apply search filter
    if (searchValue.trim() !== "") {
      const searchTerm = searchValue.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.fileName?.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredMediaItems(filtered);
  }, [selectedMediaType, mediaItems, searchValue]);

  const handleMediaButtonClick = (mediaType: string) => {
    setSelectedMediaType(mediaType);
  };

  const handleViewAllClick = () => {
    setSelectedMediaType("ALL");
  };


  return (
    <>
      {alignment === "left" ? (
       
        <div className="w-[100%] lg:w-[27%] flex flex-col items-center bg-smokeWhite space-y-3.5 h-screen py-4 overflow-hidden absolute lg:static z-50">
          <div className="w-[90%] flex flex-col items-center space-y-3.5">
            <Header userInfo={userInfo} actionIcons={[{ id: "1", icon: <EditIconSvg />,type:"edit" }]} />
            <Searchbar searchValue={searchValue} setSearchValue={setSearchValue} />
            <span className="h-[1px] w-[100%] bg-lightGray"></span>
          </div>
          <div className="custom-scrollbar w-[100%] flex flex-col items-center space-y-3.5 overflow-y-auto">
            <ChatItem searchValue={searchValue} />
          </div>
        </div>
      ) :
      isRightSidebarOpen &&
        (
          <div className="w-full lg:w-[27%] flex flex-col items-center bg-smokeWhite space-y-3.5 h-screen p-4 overflow-hidden absolute  lg:static z-50">
            <div className="flex flex-col items-center space-y-4 md:space-y-6 h-screen w-full">
              <div className="w-full mt-4 md:mt-6">
                <Searchbar searchValue={searchValue} setSearchValue={setSearchValue} />
              </div>
              <div className="flex flex-col items-center text-center">
                <img
                  src={recipientPicUrl || BlankImg}
                  alt="profilePic"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <p className="font-semibold text-lg mt-2">{recipientname}</p>
              </div>
              <div className="space-y-4 md:space-y-6 flex flex-col items-center overflow-y-scroll custom-scrollbar h-[70vh] pb-10">
                <div className="flex gap-x-3">
                  <Button type="button" btnText="Chat" icon={<ChatIconSvg />} className="text-xs" iconClass="chatting-btn" onClick={toggleRightSidebar} />
                  <span className="h-[99px] border border-slate"></span>
                  <Button type="button" btnText="Video Call" icon={<VideoChatIconSvg />} className=" text-xs" iconClass="chatting-btn" />
                </div>

                <div className="flex justify-between w-[100%]">
                  <Button type="button" btnText="View Friends" icon={<ProfileIconSvg />} className="flex text-xs gap-2" />
                  <Button type="button" btnText="Add to Favorites" icon={<FavoriteIconSvg color="black" width="14px" height="14px" />} className="flex text-xs gap-2" />
                </div>

                <p className="w-full font-semibold">Attachments</p>
                <div className="flex flex-wrap justify-center w-full gap-3">
                  {mediaBtnsData.map((data) => (
                    <Button
                      key={data.id}
                      type="button"
                      className={`media-btn ${selectedMediaType === data.btnText ? 'bg-primary text-white' : ''}`}
                      icon={data.icon}
                      btnText={data.btnText}
                      onClick={() => handleMediaButtonClick(data.btnText)}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  btnText="View All"
                  className={`text-xs font-semibold border border-primary rounded-full w-24 h-7 p-1 ${selectedMediaType === "ALL" ? 'bg-primary text-white' : 'text-primary'
                    }`}
                  onClick={handleViewAllClick}
                />

                {/* Media Display Section with No Media Message or Search Results Message */}
                {selectedMediaType && (
                  <div className="w-full mt-4">
                    {filteredMediaItems.length > 0 ? (
                      <MediaDisplay mediaType={selectedMediaType} mediaItems={filteredMediaItems} />
                    ) : (
                      <div className="text-center py-4">
                        {searchValue.trim() !== "" ? (
                          <p className="text-gray-500">No matches found for "{searchValue}"</p>
                        ) : (
                          <p className="text-gray-500">No {selectedMediaType === "ALL" ? "media" : selectedMediaType.toLowerCase()} found</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
    </>
  );
};

export default Sidebar;