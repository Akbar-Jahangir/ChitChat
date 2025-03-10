import { ReactNode } from "react";

 

export interface HeaderProps {
  userInfo: {
    userId: string;
    profilePicUrl?: string;
    username: string;
    isOnline?: boolean;
  };
  actionIcons: { id: string; icon: ReactNode; type?: string | undefined; onClick?: (() => void) | undefined; }[]
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
  onSearchIconClick?: () => void;
}