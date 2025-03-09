import React from "react";
import { HeaderProps } from "./header.interface";
import { Button } from "../Button";
import BlankImg from "../../assets/Images/BlankImg.png";
import { OnlineIconSvg } from "../Svgs";

export const Header: React.FC<HeaderProps> = ({ userInfo, actionIcons }) => {
  return (
    <div className="w-full flex items-center justify-between py-2">
      <div className="flex items-center">
        <div className="relative">
          <img
            src={userInfo.profilePicUrl || BlankImg}
            alt={userInfo.username}
            className="w-12 h-12 rounded-full object-cover"
          />
          
          {/* Online status indicator */}
          {userInfo.isOnline !== undefined && (
            <div className="absolute -bottom-1 -right-1">
              <OnlineIconSvg />
            </div>
          )}
        </div>
        
        <div className="ml-3">
          <h3 className="font-medium text-darkPrimary">{userInfo.username}</h3>
          {userInfo.isOnline !== undefined && (
            <p className="text-xs text-slate">
              {userInfo.isOnline ? "Online" : "Offline"}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-x-4">
        {actionIcons.map((icon) => (
          <Button type="button" key={icon.id} icon={icon.icon} className="focus:outline-none" />
        ))}
      </div>
    </div>
  );
};