export interface HeaderProps {
  userInfo: {
    userId: string;
    profilePicUrl: string;
    username: string;
    isOnline?: boolean;
  };
  actionIcons: {
    id: string;
    icon: React.ReactNode;
    type?: string;
  }[];
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
  onSearchIconClick?: () => void;
}