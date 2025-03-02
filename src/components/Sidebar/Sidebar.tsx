import React, { useContext } from "react";
import { Button } from "../Button";
import { ChatItem } from "../ChatItem";
import { Header } from "../Header";
import { Searchbar } from "../Searchbar";
import { ChatIconSvg, EditIconSvg, FavoriteIconSvg, ImageIconSvg, MP3IconSvg, PdfIconSvg, ProfileIconSvg, VideoChatIconSvg, VideoIconSvg } from "../Svgs";
import { SenderContext, RecipientContext } from "../../contexts/ChatContext";
import { sidebarProps } from "./sidebar.interface";
import BlankImg from "../../assets/Images/blankImg.png";


export const Sidebar: React.FC<sidebarProps> = ({ alignment }) => {
  const { sendername,
    senderId,
    senderPicUrl} = useContext(SenderContext);
  const { recipientname, recipientPicUrl } = useContext(RecipientContext);

  const userInfo = {
    userId: senderId,
    profilePicUrl: senderPicUrl,
    username: sendername,
  };
  const mediaBtnsData = [
    {
      id: 20,
      btnText: "PDF",
      icon: <PdfIconSvg />
    },
    {
      id: 30,
      btnText: "VIDEO",
      icon: <VideoIconSvg />
    },
    {
      id: 40,
      btnText: "MP3",
      icon: <MP3IconSvg />
    },
    {
      id: 50,
      btnText: "IMAGE",
      icon: <ImageIconSvg />
    },
  ]


  return (

    <div className="w-[25%] flex flex-col items-center  bg-smokeWhite space-y-3.5 h-screen">
      {alignment === "left" ?
        <>
          <div className="w-[90%] flex flex-col items-center justify-center space-y-3.5 pt-[15px]">
            <Header
              userInfo={userInfo}
              actionIcons={[{ id: "1", icon: <EditIconSvg /> }]} />
            <Searchbar />
            <span className="h-[1px] w-[90%] bg-lightGray"></span>
          </div>
          <div className="custom-scrollbar w-[95%] flex flex-col items-center space-y-3.5 overflow-y-scroll overflow-x-hidden">
            <ChatItem />
          </div>
        </>
        :
        <div className="flex flex-col items-center space-y-4 2xl:space-y-8">
          <div className="w-full flex justify-center mt-[30px] 2xl:mt-[42px]">
            <Searchbar />
          </div>
          <div className="flex flex-col items-center">
            <img src={recipientPicUrl || BlankImg} alt="profilePic" className="w-[105px] h-[105px] rounded-full object-cover" />
            <p className="font-semibold text-[15px] mt-1">{recipientname}</p>
          </div>
          <div className="flex gap-x-3">
            <Button type="button" btnText="Chat" icon={<ChatIconSvg />} className=" text-[11px]" iconClass="chatting-btn" />
            <span className="h-[99px] border border-slate"></span>
            <Button type="button" btnText="Video Call" icon={<VideoChatIconSvg />} className=" text-[11px]" iconClass="chatting-btn" />
          </div>

          <div className="flex justify-between w-[90%]">
            <Button type="button" btnText="View Friends" icon={<ProfileIconSvg />} className="flex text-[11px] gap-2" />

            <Button type="button" btnText="View Friends" icon={<FavoriteIconSvg color="black" width="14px" height="14px" />} className="flex text-[11px] gap-2" />

          </div>

          <p className="w-[90%] font-semibold">Attachments</p>
          <div className="flex flex-col items-center space-y-3.5 w-[90%]">
            <div className="w-full flex justify-between">
              {mediaBtnsData.map((data) => (
                <Button key={data.id} type="button" className="media-btn" icon={data.icon} btnText={data.btnText} />
              ))}
            </div>
            <Button type="button" btnText="View All" className="text-[10px] font-semibold border border-primary rounded-full w-[100px] h-[27px] text-primary" />
          </div>
        </div>
      }
    </div>

  );
};

export default Sidebar;
