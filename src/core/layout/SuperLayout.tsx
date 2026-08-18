// src/core/layout/SuperLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import SuperSidebar from "@/core/layout/SuperSidebar";
import SuperTopbar from "@/core/layout/SuperTopbar";
import SuperAppContext from "@/core/context/SuperAppContext";
import { SidebarProvider } from "@/core/context/SidebarContext";

const SuperLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [displayed, setDisplayed] = useState(true);

  return (
    <SuperAppContext.Provider value={true}>
      <SidebarProvider>
        <div className="h-screen flex bg-[#1E293B]">
          <SuperSidebar
            collapsed={collapsed}
            displayed={displayed}
          />

          <div className="flex flex-col flex-1 min-w-0 bg-gray-50">
            <SuperTopbar
              collapsed={collapsed}
              displayed={displayed}
              displaySidebar={() => setDisplayed(!displayed)}
              toggleSidebar={() => setCollapsed(!collapsed)}
            />

            <main
              // className="flex-1 overflow-auto"
              className="flex-1 overflow-auto p-4 md:p-6 dark:bg-gray-900"
            >
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SuperAppContext.Provider>
  );
}

export default SuperLayout;
