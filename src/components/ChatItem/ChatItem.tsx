import React, { useContext, useMemo, useState, useCallback } from "react";
import { ChatItemProps } from "./chatItem.interface";
import BlankImg from "../../assets/Images/blankImg.png";
import { TikMarkIconSvg } from "../Svgs";
import { ChatUserProps } from "../../interfaces/chatUser.interface";
import useDatabase from "../../hooks/useDatabase";
import { RecipientContext } from "../../contexts/ChatContext";

export const ChatItem: React.FC<ChatItemProps> = React.memo(({
  timestamp,
  messageStatus,
  messageText,
  unreadMessagesCount = 4
}) => {
  const { storedUsers } = useDatabase();
  const { setRecipientname,
    setRecipientId,
    setRecipientPicUrl, } = useContext(RecipientContext);

  // State to track the active chat
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Memoize users to prevent unnecessary re-renders
  const memoizedUsers = useMemo(() => storedUsers, [storedUsers]);

  // UseCallback to prevent function re-creation
  const handleClick = useCallback((userId: string, username: string, profilePicUrl: string) => {
    setRecipientname(username);
    setRecipientId(userId);
    setRecipientPicUrl(profilePicUrl);
    setActiveChatId(userId);
  }, [setRecipientname,setRecipientId,setRecipientPicUrl]);

  return (
    <>
      {memoizedUsers.map((user: ChatUserProps) => (
        <div
          className={`w-[95%] flex flex-col items-center rounded-sm py-2 cursor-pointer ${activeChatId === user.userId ? "bg-lightSlate" : "hover:bg-slate"
            }`}
          key={user.userId}
          onClick={() => handleClick(user.userId, user.username, user.profilePicUrl)}
        >
          <div className="flex gap-2 w-[95%]">
            <div
              className="min-w-[45px] min-h-[45px] max-w-[45px] max-h-[45px] rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url(${user.profilePicUrl || BlankImg})` }}
            ></div>

            <div className="w-[100%]">
              <div className="flex justify-between w-full">
                <p className="text-primary font-semibold text-[14px]">{user.username}</p>
                {messageText && <p className="text-lightSlate text-[9px] self-center">{timestamp}</p>}
              </div>

              <div className="flex justify-between w-full">
                <p className="text-gray text-[9px] max-w-[142px] laxe-clamp-2">{messageText}</p>
                <div className="text-lightSlate text-[9px]">
                  {messageStatus === "sent" ? (
                    <span className="bg-lavenderBlue rounded-full w-[15px] h-[15px] flex justify-center items-center">
                      <TikMarkIconSvg />
                    </span>
                  ) : messageStatus === "received" ? (
                    <p className="bg-primary rounded-full text-white w-[15px] h-[15px] flex justify-center items-center text-[10px]">
                      {unreadMessagesCount <= 9 ? unreadMessagesCount : "9+"}
                    </p>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
});
