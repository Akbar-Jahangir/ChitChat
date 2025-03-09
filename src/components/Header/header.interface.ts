import { ReactNode } from "react";

export interface UserInfo {
  userId: string;
  profilePicUrl: string;
  username: string;
  isOnline?: boolean;
}

export interface ActionIcon {
  id: string;
  icon: ReactNode;
}

export interface HeaderProps {
  userInfo: UserInfo;
  actionIcons: ActionIcon[];
}