import React, { useState, useEffect, useRef } from "react";
import { MdOutlineRestore } from "react-icons/md";
import {
  FiSearch,
  FiChevronDown,
  FiFolder,
  FiFileText,
  FiImage,
  FiVideo,
  FiGrid,
  FiList,
  FiMoreVertical,
  FiTrash2,
  FiFile,
  FiExternalLink
} from "react-icons/fi";
import api from "../api";
import ResourceThumbnail from "../Components/ResourceThumbnail";

const Trash = () => {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  // New state to track which resource menu is open
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);

  const fetchTrash = async () => {
    try {
      const [resReq, folReq] = await Promise.all([
        api.get("/api/resources/?trashed=true"),
        api.get("/api/folders/?trashed=true")
      ]);
      setResources(resReq.data);
      setFolders(folReq.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const getIconForType = (type) => {
    switch (type) {
      case "folder": return <FiFolder className="text-blue-500" />;
      case "document": return <FiFileText className="text-red-500" />;
      case "image": return <FiImage className="text-green-500" />;
      case "video": return <FiVideo className="text-purple-800" />;
      case "link": return <FiExternalLink className="text-orange-500" />;
      default: return <FiFile className="text-gray-500" />;
    }
  };

  const getColorForType = (type) => {
    switch (type) {
      case "folder": return "bg-blue-100";
      case "document": return "bg-red-100";
      case "image": return "bg-green-100";
      case "video": return "bg-purple-100";
      case "link": return "bg-orange-100";
      default: return "bg-gray-100";
    }
  };

  const mappedResources = resources.map((res) => {
    let parsedTags = [];
    try {
      parsedTags = typeof res.tags === "string" ? JSON.parse(res.tags) : (res.tags || []);
    } catch (e) {
      parsedTags = [];
    }
    return {
      id: res.id,
      name: res.title,
      date: new Date(res.created_at).toLocaleDateString(),
      type: res.type,
      color: getColorForType(res.type),
      icon: getIconForType(res.type),
      itemType: "resource",
      tags: parsedTags,
    };
  });

  const mappedFolders = folders.map((folder) => ({
    id: `folder-${folder.id}`,
    realId: folder.id,
    name: folder.name,
    date: new Date(folder.created_at || Date.now()).toLocaleDateString(),
    type: "folder",
    color: getColorForType("folder"),
    icon: getIconForType("folder"),
    itemType: "folder",
    tags: [],
  }));

  const allResources = [...mappedFolders, ...mappedResources];

  const allTags = ["All", ...new Set(mappedResources.flatMap((r) => r.tags || []))];

  const filteredResources = allResources.filter((item) => {
    const matchesType = selectedType === "All" || (item.type && item.type.toLowerCase() === selectedType.toLowerCase());
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (item.name || "").toLowerCase().includes(searchLower) || 
                          (Array.isArray(item.tags) && item.tags.some(t => typeof t === "string" && t.toLowerCase().includes(searchLower)));
    const matchesTag = selectedTag === "All" || (Array.isArray(item.tags) && item.tags.includes(selectedTag));
    return matchesType && matchesSearch && matchesTag;
  });

  const handleRestore = async (item) => {
    try {
      const actualId = item.itemType === "folder" ? item.realId : item.id;
      await api.post("/api/trash/restore/", { item_id: actualId, type: item.itemType });
      fetchTrash();
      setActiveMenu(null);
    } catch (err) {
      console.error(err);
      alert("Failed to restore item");
    }
  };

  const handlePermanentDelete = async (item) => {
    if (!window.confirm("Are you sure you want to permanently delete this? It cannot be undone.")) return;
    try {
      const actualId = item.itemType === "folder" ? item.realId : item.id;
      await api.delete("/api/trash/permanent/", { data: { item_id: actualId, type: item.itemType } });
      fetchTrash();
      setActiveMenu(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete permanently");
    }
  };

  // Reusable Action Menu Component
  const ActionMenu = ({ item }) => (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border-2 border-[#3B2A1F]/10 z-[60] overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-100">
      <button onClick={() => handleRestore(item)} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F7EACD] flex items-center gap-3">
        <MdOutlineRestore /> Restore
      </button>
      <hr className="my-1 border-[#3B2A1F]/10" />
      <button onClick={() => handlePermanentDelete(item)} className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3">
        <FiTrash2 /> Delete Permanently
      </button>
    </div>
  );

  return (
    <div className="ml-0 md:ml-64 min-h-screen bg-[#F7EACD] p-4 md:p-6 font-inter text-[#3B2A1F]">
      <div className="w-full p-4 md:p-10 mt-16 md:mt-0 relative">
        {/* Header Bar */}
        <header className="mb-6 flex items-center justify-between">
          <div className="relative w-full max-w-6xl">
            <FiSearch className="absolute top-3.5 left-4 z-20 opacity-40" />
            <input
              type="text"
              placeholder="Search tags, resources or notes..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white rounded-full py-3 pl-12 pr-4 outline-none shadow-sm text-sm border border-transparent focus:border-[#3B2A1F]/10 transition w-full"
            />
          </div>
        </header>

        {/* Action Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 bg-white/90 px-5 py-2 rounded-2xl font-black text-sm border-2 border-[#3B2A1F]/5 shadow-[4px_4px_0px_0px_rgba(59,42,31,0.1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                Type: {selectedType}
                <FiChevronDown
                  className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border-2 border-[#3B2A1F]/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {["All", "Document", "Link", "Image", "Video", "Audio"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedType === type ? "bg-[#FFE455]" : "hover:bg-[#F7EACD]"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative w-full md:w-auto">
              <button 
                onClick={() => { setIsTagDropdownOpen(!isTagDropdownOpen); setIsDropdownOpen(false); }}
                className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 bg-white/90 px-5 py-2 rounded-2xl font-black text-sm border-2 border-[#3B2A1F]/5 shadow-[4px_4px_0px_0px_rgba(59,42,31,0.1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                Tag: {selectedTag} <FiChevronDown className={`transition-transform ${isTagDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isTagDropdownOpen && (
                <div className="absolute top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border-2 border-[#3B2A1F]/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="max-h-60 overflow-y-auto">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSelectedTag(tag);
                          setIsTagDropdownOpen(false);
                        }}
                        className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors ${selectedTag === tag ? "bg-[#FFE455]" : "hover:bg-[#F7EACD]"}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/40 p-1 rounded-2xl flex gap-1 border border-white/50">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-white shadow-sm" : "opacity-40"}`}
            >
              <FiList size={20} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-white shadow-sm" : "opacity-40"}`}
            >
              <FiGrid size={20} />
            </button>
          </div>
        </div>

        {/* Dynamic Content Rendering */}
        {viewMode === "list" ? (
          <div className="w-full">
            <div className="grid grid-cols-12 px-6 mb-4 text-[#3B2A1F]/50 font-black uppercase text-xs tracking-widest">
              <div className="col-span-11 md:col-span-7">Name</div>
              <div className="hidden md:block col-span-2">Date Binned</div>
              <div className="hidden md:block col-span-2 text-right">Type</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-3">
              {filteredResources.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 items-center px-6 py-2 bg-white/40 hover:bg-white/90 rounded-2xl transition-all group border border-transparent hover:border-white/50 hover:shadow-md"
                >
                  <div className="col-span-11 md:col-span-7 flex items-center gap-4 font-bold text-lg">
                    <span className="opacity-70 group-hover:scale-125 group-hover:rotate-6 transition-all duration-300">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                    {item.tags && item.tags.length > 0 && (
                      <div className="hidden md:flex gap-1.5 flex-wrap">
                        {item.tags.map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-[#3B2A1F]/10 text-[#3B2A1F] px-2 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="hidden md:block col-span-2 font-medium opacity-50 italic text-sm">
                    {item.date}
                  </div>
                  <div className="hidden md:block col-span-2 text-right font-black text-xs opacity-70">
                    <span className="bg-[#3B2A1F]/5 px-3 py-1 rounded-full">
                      {item.type}
                    </span>
                  </div>
                  <div
                    className="col-span-1 flex justify-end relative"
                    ref={activeMenu === item.id ? menuRef : null}
                  >
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === item.id ? null : item.id)
                      }
                      className="p-2 hover:bg-[#3B2A1F]/5 rounded-full transition-colors"
                    >
                      <FiMoreVertical />
                    </button>
                    {activeMenu === item.id && <ActionMenu item={item} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredResources.map((item) => (
              <div
                key={item.id}
                className="group bg-white/60 hover:bg-white rounded-[2rem] p-3 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-transparent hover:border-white relative"
              >
                <div
                  className={`aspect-square rounded-[1.5rem] mb-4 flex items-center justify-center relative overflow-hidden ${item.type === 'folder' ? item.color : 'bg-gray-100'} bg-opacity-50`}
                >
                  {item.type === 'folder' ? (
                    <span className="scale-[2.5] opacity-80 group-hover:scale-[3] transition-transform duration-500">
                      {item.icon}
                    </span>
                  ) : (
                    <ResourceThumbnail item={item} />
                  )}
                </div>
                <div className="px-2 pb-2">
                  <h3 className="font-black text-sm truncate pr-8">
                    {item.name}
                  </h3>
                  {item.tags && item.tags.length > 0 && (
                    <div className="hidden md:flex gap-1 flex-wrap mt-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[8px] bg-[#3B2A1F]/10 text-[#3B2A1F] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="hidden md:block text-[10px] font-bold opacity-40 italic mt-1">
                    {item.date}
                  </p>
                </div>

                {/* Grid View Menu Trigger */}
                <div
                  className="absolute top-4 right-4 flex flex-col items-end"
                  ref={activeMenu === item.id ? menuRef : null}
                >
                  <button
                    onClick={() =>
                      setActiveMenu(activeMenu === item.id ? null : item.id)
                    }
                    className="bg-white/80 backdrop-blur-md p-1.5 rounded-lg shadow-sm hover:bg-white transition-colors"
                  >
                    <FiMoreVertical size={14} />
                  </button>

                  {activeMenu === item.id && (
                    <div className="relative">
                      <ActionMenu item={item} />
                    </div>
                  )}
                </div>

                <div className="hidden md:block absolute bottom-2 right-3 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm pointer-events-none">
                  {item.type}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredResources.length === 0 && (
          <div className="bg-white/20 rounded-[2rem] p-20 text-center border-2 border-dashed border-[#3B2A1F]/10 mt-10">
            <p className="font-black opacity-30 italic text-xl">
              No results for "{searchQuery}" in {selectedType}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trash;
