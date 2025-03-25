export interface SidebarContextType {
    isLeftSidebarOpen: boolean;
    isRightSidebarOpen: boolean;
    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
  }