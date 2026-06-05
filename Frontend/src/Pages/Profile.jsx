import React, { useState, useEffect } from "react";
import { FaUserCircle, FaCamera, FaSignOutAlt, FaCalendarTimes, FaBrain } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api";

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // States for Auto-Delete
  const [isAutoDeleteEnabled, setIsAutoDeleteEnabled] = useState(false);
  const [deleteDays, setDeleteDays] = useState(30);

  const [isLoading, setIsLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [user, setUser] = useState({
    name: "",
    email: "",
    username: "",
    bio: "",
  });

  useEffect(() => {


    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/profile/');
        setUser({
          name: response.data.full_name || response.data.username || "",
          email: response.data.email || "",
          username: response.data.username || "",
          bio: response.data.bio || "",
        });
        setIsAutoDeleteEnabled(response.data.auto_empty_bin || false);
        setIsFocusMode(response.data.is_focus_mode || false);
        setDeleteDays(response.data.auto_empty_days || 30);
        if (response.data.profile_image) {
          setProfileImagePreview(response.data.profile_image.startsWith('http') ? response.data.profile_image : `http://127.0.0.1:8000${response.data.profile_image}`);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("full_name", user.name);
      formData.append("username", user.username);
      formData.append("email", user.email);
      formData.append("bio", user.bio);
      formData.append("auto_empty_bin", isAutoDeleteEnabled);
      formData.append("auto_empty_days", deleteDays);
      formData.append("is_focus_mode", isFocusMode);
      
      if (profileImage) {
        formData.append("profile_image", profileImage);
      }

      const res = await api.patch('/api/profile/', formData);
      if (res.data.profile_image) {
        setProfileImagePreview(res.data.profile_image.startsWith('http') ? res.data.profile_image : `http://127.0.0.1:8000${res.data.profile_image}`);
        setProfileImage(null);
      }
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleLogout = () => {
    // Add logic here to clear tokens/session if needed
    navigate("/login");
  };

  return (
    <div className="ml-64 min-h-screen bg-[#F7EACD] p-10 font-inter text-[#3B2A1F] flex justify-center">
      <div className="w-full max-w-3xl mt-4">
        <header className="mb-10 flex justify-center text-center">
          <div>
            <h2 className="text-4xl font-black mb-2">Account Settings</h2>
            <p className="text-gray-600">Manage your profile information and application preferences.</p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-8 border-b-2 border-black/10 mb-8 w-full">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-4 px-2 font-bold text-lg transition-all ${activeTab === "profile" ? "border-b-4 border-[#3B2A1F]" : "opacity-50"}`}
        >
          Profile Detail
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`pb-4 px-2 font-bold text-lg transition-all ${activeTab === "settings" ? "border-b-4 border-[#3B2A1F]" : "opacity-50"}`}
        >
          Preferences
        </button>
      </div>

      {/* TAB CONTENT: PROFILE */}
      {activeTab === "profile" && (
        <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center gap-4 mb-10 text-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-yellow-200 border-4 border-black flex items-center justify-center overflow-hidden shadow-sm">
                {profileImagePreview ? (
                  <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FaUserCircle className="text-8xl text-black/20" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full hover:scale-110 transition-transform shadow-lg cursor-pointer">
                <FaCamera size={16} />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-[#3B2A1F]">
                {isLoading ? "Loading..." : (user.name || "Unknown User")}
              </h3>
              <p className="text-gray-600">Update your photo and personal details.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-bold ml-1">Full Name</label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                className="p-3 bg-white/60 border-2 border-black rounded-xl outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-bold ml-1">Username</label>
              <input
                type="text"
                value={user.username}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
                className="p-3 bg-white/60 border-2 border-black rounded-xl outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
              />
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <label className="font-bold ml-1">Email</label>
              <input
                type="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className="p-3 bg-white/60 border-2 border-black rounded-xl outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
              />
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <label className="font-bold ml-1 text-[#3B2A1F]">Bio</label>
              <textarea
                rows="3"
                value={user.bio}
                onChange={(e) => setUser({ ...user, bio: e.target.value })}
                className="p-3 bg-white/60 border-2 border-black rounded-xl focus:bg-white outline-none transition-all resize-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]"
              ></textarea>
            </div>
          </div>

          {/* LOGOUT */}
          <hr className="border-black/10 my-8" />
          <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FaSignOutAlt className="text-xl text-red-600" />
                <div>
                  <h4 className="font-bold text-red-600">Sign Out</h4>
                  <p className="text-sm text-red-500">Securely exit your account session.</p>
                </div>
              </div>
              {!showLogoutConfirm ? (
                <button onClick={() => setShowLogoutConfirm(true)} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-md active:scale-95">Sign Out</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-all">Confirm</button>
                  <button onClick={() => setShowLogoutConfirm(false)} className="px-4 py-2 bg-gray-200 text-[#3B2A1F] rounded-lg font-bold text-sm hover:bg-gray-300 transition-all">Cancel</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PREFERENCES */}
      {activeTab === "settings" && (
        <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">

          {/* FOCUS MODE */}
          <div className={`p-6 rounded-2xl border-3 transition-all duration-300 shadow-sm ${isFocusMode ? "bg-white/50 border-[#FFE455] shadow-md backdrop-blur-sm" : "bg-white/40 border-black/5"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FaBrain className={`text-xl ${isFocusMode ? "text-[#FFE455]" : ""}`} />
                <div>
                  <h4 className="font-bold">Focus / Study Mode</h4>
                  <p className="text-sm opacity-70">Minimize distractions and enhance concentration.</p>
                </div>
              </div>
              
              <label className="relative inline-block w-12 h-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFocusMode}
                  onChange={() => setIsFocusMode(!isFocusMode)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#FFE455] transition-colors duration-200"></div>
                <div className={`absolute top-1 left-1 bg-white rounded-full h-4 w-4 transition-all duration-200 ${isFocusMode ? "translate-x-6" : "translate-x-0"}`}></div>
              </label>
            </div>
          </div>

          {/* AUTO-DELETE FEATURE (Fixed Toggle) */}
          <div className={`p-6 rounded-2xl border-3 transition-all duration-300 shadow-sm ${isAutoDeleteEnabled ? "bg-white/50 border-[#FFE455] shadow-md backdrop-blur-sm" : "bg-white/40 border-black/5"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <FaCalendarTimes className={`text-xl ${isAutoDeleteEnabled ? "text-[#FFE455]" : ""}`} />
                <div>
                  <h4 className="font-bold">Auto-Empty Bin</h4>
                  <p className="text-sm opacity-70">Permanently delete items in your trash automatically.</p>
                </div>
              </div>

              {/* FIXED TOGGLE COMPONENT */}
              <label className="relative inline-block w-12 h-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAutoDeleteEnabled}
                  onChange={() => setIsAutoDeleteEnabled(!isAutoDeleteEnabled)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-[#FFE455] transition-colors duration-200"></div>
                <div className={`absolute top-1 left-1 bg-white rounded-full h-4 w-4 transition-all duration-200 ${isAutoDeleteEnabled ? "translate-x-6" : "translate-x-0"}`}></div>
              </label>
            </div>

            {isAutoDeleteEnabled && (
              <div className="mt-4 p-4 bg-white/50 rounded-xl border border-white shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-[#3B2A1F]">Delete items after:</span>
                  <span className="px-3 py-1 bg-[#FFE455] text-[#3B2A1F] text-xs font-black rounded-full">
                    {deleteDays} DAYS
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="90"
                  value={deleteDays}
                  onChange={(e) => setDeleteDays(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FFE455]"
                />
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-2 px-1">
                  <span>1 DAY</span>
                  <span>45 DAYS</span>
                  <span>90 DAYS</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="mt-12 flex justify-center gap-4 w-full">
        <button onClick={handleSave} className="px-8 py-3 bg-black text-white rounded-full font-bold shadow-lg hover:scale-110 transition-all active:scale-95">Save Changes</button>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white border-2 border-black rounded-full font-bold shadow-lg hover:scale-110 transition-all active:scale-95">Cancel</button>
      </div>
      </div>
    </div>
  );
};

export default Profile;