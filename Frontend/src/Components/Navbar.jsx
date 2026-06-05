import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api";
import {
  FiHome,
  FiLayers,
  FiBookmark,
  FiTrash2,
  FiSettings,
  FiArchive,
  FiTarget,
} from "react-icons/fi";
import logo from "../assets/Logo.png";

const Navbar = () => {
  const location = useLocation();
  const [userData, setUserData] = useState({ name: "Loading...", initials: "...", profileImage: null });
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/profile/');
        const name = res.data.full_name || res.data.username || "User";
        const initials = name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
        const profileImage = res.data.profile_image ? (res.data.profile_image.startsWith('http') ? res.data.profile_image : `http://127.0.0.1:8000${res.data.profile_image}`) : null;
        setUserData({ name, initials, profileImage });
        setIsFocusMode(res.data.is_focus_mode || false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  const isActive = (path) => location.pathname === path;

  // Internal Helper Component for Nav Items
  const NavItem = ({ to, icon, label, active }) => (
    <Link
      to={to}
      className={`flex items-center gap-8 px-6 py-3 rounded-xl transition-all duration-200 hover:scale-110 ${
        active
          ? "bg-[#FFE455] hover:bg-[#ffd814] text-[#3B2A1F] font-medium shadow-sm"
          : "text-[#3B2A1F]/70 hover:bg-[#3B2A1F]/10 font-medium"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-lg">{label}</span>
    </Link>
  );

  return (
    <aside className="w-64 h-screen flex flex-col py-4 px-4 justify-between bg-[#F7EACD] fixed left-0 top-0 border-r border-[#3B2A1F]/5">
      <div>
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-20 h-20 flex items-center justify-center">
            <img src={logo}></img>
          </div>
          <h1 className="font-black tracking-widest text-xl text-[#3B2A1F]">
            MINDHIVE
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-4">
          <NavItem
            to="/home"
            icon={<FiHome />}
            label="Home"
            active={isActive("/home")}
          />
          <NavItem
            to="/resources"
            icon={<FiLayers />}
            label="Resources"
            active={isActive("/resources")}
          />
          <NavItem
            to="/archives"
            icon={<FiArchive />}
            label="Archives"
            active={isActive("/archives")}
          />
          <NavItem
            to="/saved"
            icon={<FiBookmark />}
            label="Saved for Later"
            active={isActive("/saved")}
          />
          <NavItem
            to="/bin"
            icon={<FiTrash2 />}
            label="Bin"
            active={isActive("/bin")}
          />
           {isFocusMode && (
             <NavItem
               to="/focus"
               icon={<FiTarget />}
               label="Focus Mode"
               active={isActive("/focus")}
             />
           )}
          
        </nav>
      </div>

      {/* User Profile Hook (Bottom) */}
      <Link to="/profile">
        <div className="bg-[#FFE455] p-3 rounded-2xl flex items-center justify-between shadow-md border border-[#3B2A1F]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-[#3B2A1F] text-[#3B2A1F] font-bold overflow-hidden">
              {userData.profileImage ? (
                <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userData.initials
              )}
            </div>
            <div>
              <p className="text-md font-black leading-tight text-[#3B2A1F]">
                {userData.name}
              </p>
              <p className="text-sm text-[#3B2A1F]/70">Edit Account</p>
            </div>
          </div>
          <FiSettings className="text-[#3B2A1F] text-2xl cursor-pointer hover:rotate-90 transition-transform duration-300" />
        </div>
      </Link>
    </aside>
  );
};

export default Navbar;
