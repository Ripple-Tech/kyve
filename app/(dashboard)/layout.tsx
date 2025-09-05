"use client";

import { PropsWithChildren, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Sidebar from "@/components/sidebar"; 
import { Menu, X } from "lucide-react";

const Layout = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="relative h-screen flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Sidebar for desktop */}
      <div className="hidden md:block w-64 lg:w-80 border-r border-gray-100 p-6 h-full text-brand-900 relative z-10">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <p className="text-lg font-semibold text-brand-900">escrow</p>
          <button onClick={() => setIsDrawerOpen(true)} className="text-gray-500 hover:text-gray-600">
            <Menu className="size-6" />
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 shadow-md p-4 md:p-6 relative z-10">
          {children}
        </div>

        <Modal className="p-4" showModal={isDrawerOpen} setShowModal={setIsDrawerOpen}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-semibold text-brand-900">escrow</p>
            <button aria-label="Close modal" onClick={() => setIsDrawerOpen(false)}>
              <X className="size-6" />
            </button>
          </div>
          <Sidebar onClose={() => setIsDrawerOpen(false)} />
        </Modal>
      </div>
    </div>
  );
};

export default Layout;