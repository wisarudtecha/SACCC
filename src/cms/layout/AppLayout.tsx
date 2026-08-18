// src/cms/layout/AppLayout.tsx
import { Outlet } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/core/context/SidebarContext";
import { useSuperApp } from "@/core/context/SuperAppContext";
import AppHeader from "@/cms/layout/AppHeader";
import AppSidebar from "@/cms/layout/AppSidebar";
import Backdrop from "@/cms/layout/Backdrop";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const isSuper = useSuperApp();

  return (
    <div
      // className="min-h-screen xl:flex"
      className={`${isSuper ? "h-full flex" : "min-h-screen xl:flex"}`}
    >
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      
      <div
        className={`flex-1 transition-all duration-300 ease-in-out dark:bg-gray-900 ${
          isExpanded || isHovered ?
            // "lg:ml-72.5"
            isSuper ? "" : "ml-72.5"
              :
            // "lg:ml-22.5"
            isSuper ? "" : "ml-22.5"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />

        <div
          // className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6"
          className={`${isSuper ? "" : "max-w-(--breakpoint-2xl)"} dark:bg-gray-900`}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
