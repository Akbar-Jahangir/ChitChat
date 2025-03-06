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
    <header className="flex items-center justify-between w-[95%] pb-[7px] pt-[14px]" id={userInfo.userId}>
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <img
            src={userInfo.profilePicUrl || BlankImg}
            alt="profilePic"
            className="h-[45px] w-[45px] rounded-full"
          />

          <p className="text-sm font-semibold text-primary max-w-[70%] overflow-hidden text-ellipsis whitespace-nowrap">
            {userInfo.username}
          </p>

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
