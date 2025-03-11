export interface HeaderProps {
  userInfo: {
    username: string;
    profilePicUrl?: string;
    isOnline?: boolean;
    email?: string;
    userId?: string;
  };
  actionIcons: {
    id: string;
    icon: React.ReactNode;
    type?: 'search' | 'edit' | 'favorite' |'bell' | 'toggle';
    onClick?: () => void;
  }[];
  searchValue?: string;
  setSearchValue?: React.Dispatch<React.SetStateAction<string>>;
  onSearchIconClick?: () => void;
}