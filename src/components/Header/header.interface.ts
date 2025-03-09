export interface HeaderProps {
  userInfo: {
    userId: string;
    profilePicUrl: string;
    username: string;
    isOnline?: boolean;
  };
  actionIcons: { id: string; icon: React.ReactNode; type?: "search" | "favorite" | "bell" | "other"; onClick?: () => void }[];
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
  onSearchIconClick?: () => void;
}
