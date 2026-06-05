import { useState } from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import logo from "../assets/Logo.png";

function PagesWithNavbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F7EACD] w-full overflow-x-hidden relative">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#F7EACD] border-b border-[#3B2A1F]/5 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Mindhive Logo" className="h-10 w-10" />
          <h1 className="font-black tracking-widest text-lg text-[#3B2A1F]">
            MINDHIVE
          </h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-[#3B2A1F] hover:bg-[#3B2A1F]/10 rounded-lg"
        >
          <FiMenu size={24} />
        </button>
      </div>

      <Navbar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main Content Container */}
      <div className="flex-1 mt-16 md:mt-0 w-full">
        <Outlet />
      </div>
    </div>
  );
}

export default PagesWithNavbar;
