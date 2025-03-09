import React from "react";
import { HeaderProps } from "./header.interface";
import { Button } from "../Button";
import BlankImg from "../../assets/Images/BlankImg.png";
import { OnlineIconSvg } from "../Svgs";

export const Header: React.FC<HeaderProps> = ({ userInfo, actionIcons }) => {
  return (
    <div className="w-full flex items-center justify-between py-2">
      <div className="flex items-center">
        <div className="flex gap-2 items-center">
          <img
            src={userInfo.profilePicUrl || BlankImg}
            alt={userInfo.username}
            className="w-12 h-12 rounded-full object-cover"
          />
           <p className="text-sm font-semibold text-primary w-[55%] truncate">{userInfo.username}</p>
        </div>
        
        {userInfo.isOnline === true && (
            <div>
              <OnlineIconSvg />
            </div>
          )}
      </div>
      
      <div className="flex items-center gap-x-4">
        {actionIcons.map((icon) => (
          <Button type="button" key={icon.id} icon={icon.icon} className="focus:outline-none" />
        ))}
      </div>
    </div>
  );
};