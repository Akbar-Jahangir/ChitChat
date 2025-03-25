import { createContext, useState, ReactNode } from "react";
import { SidebarContextType } from "./sidebarContext.interface";

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Provider Component
export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);

  const toggleLeftSidebar = () => {setLeftSidebarOpen((prev) => !prev)
    console.log("toggleLeftSidebar");
    
  };
  const toggleRightSidebar = () => setRightSidebarOpen((prev) => !prev);
 

  return (
    <SidebarContext.Provider
      value={{ isLeftSidebarOpen, isRightSidebarOpen, toggleLeftSidebar, toggleRightSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;
