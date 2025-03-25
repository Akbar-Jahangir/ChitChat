import { useContext } from "react";
import SidebarContext from "../contexts/SidebarContext/SidebarContext";
import { SidebarContextType } from "../contexts/SidebarContext/sidebarContext.interface";

// Custom Hook to use Sidebar Context
const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export default useSidebar;
