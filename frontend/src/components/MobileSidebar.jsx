import React, { Fragment } from "react";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";

const MobileSidebar = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-gray-900/80" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 flex w-full max-w-xs">
        <div className="relative flex w-full flex-col bg-white">
          <div className="absolute right-0 top-0 -mr-12 pt-4">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <Sidebar />
        </div>
      </div>
    </div>
  );
};

export default MobileSidebar;
