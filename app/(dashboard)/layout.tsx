"use client";

import { PropsWithChildren, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Sidebar from "@/components/sidebar"; 
import { Menu, X } from "lucide-react";
import BottomNavBar from "@/components/shared/BottomNav";
import LeftSidebar from "@/components/shared/LeftSideBar";

const Layout = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
     <html lang="en">
      
   <body className=" bg-gray-100 dark:bg-dark-1">
   
        {/* Main content area */}
         <main className='flex flex-row'>
            <LeftSidebar />
         
        <div className="flex-1 overflow-y-auto bg-gray-50 shadow-md p-4 md:p-6 relative z-10">
        
          {children}
        </div>
        </main>
        <BottomNavBar />

    </body>
    </html>
  );
};

export default Layout;