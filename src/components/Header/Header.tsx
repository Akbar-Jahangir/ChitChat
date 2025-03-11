import React from "react";
import { HeaderProps } from "./header.interface";
import { Button } from "../Button";
import BlankImg from "../../assets/Images/BlankImg.png";
import { OnlineIconSvg } from "../Svgs";
import { Searchbar } from "../Searchbar";
import { useNavigate } from "react-router-dom";

export const Header: React.FC<HeaderProps> = ({ 
  userInfo, 
  actionIcons, 
  searchValue = "", 
  setSearchValue,
  onSearchIconClick 
}) => {
  const [showSearchBar, setShowSearchBar] = React.useState(false);
  const navigate = useNavigate();
  
  const handleSearchIconClick = () => {
    setShowSearchBar(!showSearchBar);
    if (onSearchIconClick) onSearchIconClick();
  };

  const handleIconClick = (iconType:string) => {
    console.log(iconType);
    
    if (iconType === 'search') {
      handleSearchIconClick();
    } else if (iconType === 'edit' && userInfo.userId) {
      navigate(`/editProfile`);
    }
    // } else if (icon.onClick) {
    //   icon.onClick();
    // }
  };
  
  return (
    <div className="w-full flex flex-col items-center justify-between py-2">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
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
            <Button 
              type="button" 
              key={icon.id} 
              icon={icon.icon} 
              className="focus:outline-none"
              onClick={() => handleIconClick(icon.type!)}
            />
          ))}
        </div>
      </div>
      
      {showSearchBar && setSearchValue && (
        <div className="w-full mt-2">
          <Searchbar 
            searchValue={searchValue} 
            setSearchValue={setSearchValue} 
          />
        </div>
      )}
    </div>
  );
};