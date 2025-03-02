import React from "react";
import { HeaderProps } from "./header.interface";
import { Button } from "../Button";
import BlankImg from "../../assets/Images/blankImg.png";
import { OnlineIconSvg } from "../Svgs";

export const Header: React.FC<HeaderProps> = ({
  userInfo,
  actionIcons,
  onlineStatus = false,
}) => {

  return (
    <header className="flex items-center justify-between w-[100%] pb-[7px] pt-[14px]" id={userInfo.userId}>
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <img
            src={userInfo.profilePicUrl || BlankImg}
            alt="profilePic"
            className="h-[45px] w-[45px] rounded-full"
          />
          <div>
            <p className="text-[15px] font-semibold text-primary">{userInfo.username}</p>

          </div>
          {onlineStatus && <OnlineIconSvg />}
        </div>
      </div>
      <div className="flex gap-2.5">
        {actionIcons?.map((icon) => (
          <Button type="button" icon={icon.icon} key={icon.id} className="hover:bg-slate p-1  flex justify-center items-center rounded" />
        ))}

      </div>
    </header>

  );
};
