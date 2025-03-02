import { ChatUserProps } from "../../interfaces/chatUser.interface";

export interface HeaderProps {
  userInfo:ChatUserProps
  onlineStatus?: boolean;
  actionIcons: { id: string; icon: React.ReactNode }[];
}
