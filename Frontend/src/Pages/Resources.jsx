import React, { useState, useEffect, useRef } from "react";
import {
  FiSearch,
  FiPlus,
  FiChevronDown,
  FiChevronLeft,
  FiFolder,
  FiFile,
  FiFileText,
  FiImage,
  FiVideo,
  FiGrid,
  FiList,
  FiMoreVertical,
  FiExternalLink,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiDownload,
  FiCopy,
  FiFolderPlus,
  FiBookmark,
  FiX,
  FiArchive,
  FiTag,
} from "react-icons/fi";
import api from "../api";
import QuickAdd from "../Components/QuickAdd";
import ResourceThumbnail from "../Components/ResourceThumbnail";

const ResourcesPage = () => {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedTag, setSelectedTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [droppedFile, setDroppedFile] = useState(null);

  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [organizeItem, setOrganizeItem] = useState(null);
  const [editTagItem, setEditTagItem] = useState(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);

  const isArchivePage = window.location.pathname.includes('/archives');

  const fetchResources = async () => {
    try {
      const res = await api.get("/api/resources/");
      setResources(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await api.get("/api/folders/");
      setFolders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchFolders();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      url: res.url,
      file: res.file,
      tags: parsedTags,
      folderId: res.folder,
      is_archived: res.is_archived,
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
    url: null,
    file: null,
    tags: [],
    folderId: folder.parent_folder || null,
    is_archived: folder.is_archived || false,
  }));

  const allItems = [...mappedFolders, ...mappedResources];

  const allTags = ["All", ...new Set(resources.flatMap((r) => r.tags || []))];

  const currentFolder = folders.find(f => f.id === currentFolderId);

  const filteredResources = allItems.filter((item) => {
    const itemFId = item.folderId || null;
    const currFId = currentFolderId || null;
    if (itemFId != currFId) return false;

    const isArchived = item.is_archived === true;
    if (isArchivePage && !isArchived) return false;
    if (!isArchivePage && isArchived) return false;

    const matchesType = selectedType === "All" || (item.type && item.type.toLowerCase() === selectedType.toLowerCase());
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (item.name || "").toLowerCase().includes(searchLower) ||
      (Array.isArray(item.tags) && item.tags.some(t => typeof t === "string" && t.toLowerCase().includes(searchLower)));
    const matchesTag = selectedTag === "All" || (Array.isArray(item.tags) && item.tags.includes(selectedTag));
    return matchesType && matchesSearch && matchesTag;
  });

  const deleteResource = async (id, type) => {
    try {
      if (type === "folder") {
        const realId = id.split("-")[1];
        await api.delete(`/api/folders/${realId}/`);
        fetchFolders();
      } else {
        await api.delete(`/api/resources/${id}/`);
        fetchResources();
      }
      setActiveMenu(null);
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete");
    }
  };

  const saveResource = async (item) => {
    try {
      await api.post("/api/saved/", { resource: item.id });
      alert("Added to Saved for Later!");
      setActiveMenu(null);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) {
        alert("This item is already saved!");
      } else {
        alert("Failed to save item.");
      }
    }
  };

  const toggleArchive = async (item) => {
    try {
      if (item.type === "folder") {
        await api.patch(`/api/folders/${item.realId}/`, { is_archived: !item.is_archived });
        fetchFolders();
      } else {
        await api.patch(`/api/resources/${item.id}/`, { is_archived: !item.is_archived });
        fetchResources();
      }
      setActiveMenu(null);
    } catch (err) {
      console.error("Failed to archive item", err);
      alert("Failed to archive item");
    }
  };

  const openResource = (item) => {
    if (item.type === "folder") {
      setCurrentFolderId(item.realId);
    } else {
      let fileUrl = "";
      if (item.file) {
        fileUrl = item.file.startsWith("http") ? item.file : `http://${api.defaults.baseURL}$:8000${item.file}`;
      } else if (item.url) {
        fileUrl = item.url;
      }
      if (fileUrl) {
        window.open(`/viewer?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(item.name)}&type=${encodeURIComponent(item.type)}&id=${item.id}`, "_blank");
      } else {
        alert("No URL or file available for this resource.");
      }
    }
    setActiveMenu(null);
  };

  const downloadResource = async (item) => {
    if (item.file) {
      try {
        const response = await api.get(`/api/download/${item.id}/`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: response.data.type });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = item.name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (err) {
        console.error("Download failed:", err);
        alert("Download failed. Falling back to direct URL.");
        // Fallback
        const fileUrl = item.file.startsWith("http") ? item.file : `http://${api.defaults.baseURL}$:8000${item.file}`;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = item.name || "download";
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      alert("No file to download.");
    }
    setActiveMenu(null);
  };

  const ActionMenu = ({ item }) => (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border-2 border-[#3B2A1F]/10 z-[60] overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-100">
      <button onClick={() => openResource(item)} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F7EACD] flex items-center gap-3">
        <FiExternalLink /> Open
      </button>
      <hr className="my-1 border-[#3B2A1F]/10" />
      <button onClick={() => toggleArchive(item)} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F7EACD] flex items-center gap-3">
        <FiArchive /> {item.is_archived ? "Unarchive" : "Archive"}
      </button>
      {item.type !== "folder" && (
        <>
          <button onClick={() => downloadResource(item)} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F7EACD] flex items-center gap-3">
            <FiDownload /> Download
          </button>
          <button onClick={() => saveResource(item)} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F7EACD] flex items-center gap-3">
            <FiBookmark /> Add to Saved
          </button>
          <hr className="my-1 border-[#3B2A1F]/10" />
        </>
      )}
      <button onClick={() => {
        const newName = prompt("Enter new name:", item.name);
        if (newName && newName !== item.name) {
          if (item.type === "folder") {
            api.patch(`/api/folders/${item.realId}/`, { name: newName }).then(fetchFolders).catch(() => alert("Failed to rename"));
          } else {
            api.patch(`/api/resources/${item.id}/`, { title: newName }).then(fetchResources).catch(() => alert("Failed to rename"));
          }
        }
        setActiveMenu(null);
      }} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F7EACD] flex items-center gap-3">
        <FiEdit3 /> Rename
      </button>
      {item.type !== "folder" && (
        <button onClick={() => { setEditTagItem(item); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F7EACD] flex items-center gap-3">
          <FiTag /> Edit Tags
        </button>
      )}
      <hr className="my-1 border-[#3B2A1F]/10" />
      <button onClick={() => { setOrganizeItem(item); setActiveMenu(null); }} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#F7EACD] flex items-center gap-3">
        <FiFolderPlus /> Organize
      </button>
      <hr className="my-1 border-[#3B2A1F]/10" />
      <button onClick={() => deleteResource(item.id, item.type)} className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3">
        <FiTrash2 /> Move to Trash
      </button>
    </div>
  );

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setDroppedFile(e.dataTransfer.files[0]);
      setShowQuickAdd(true);
    }
  };

  return (
    <div
      className="ml-64 min-h-screen bg-[#F7EACD] p-6 font-inter text-[#3B2A1F]"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="w-full bg-[#FFE455] rounded-[3rem] p-10 border-4 border-white/20 min-h-[calc(100vh-3rem)] shadow-sm">
        <header className="py-2 px-4 bg-[#ffda20]/70 fixed top-12 z-20 flex items-center justify-between mb-10 w-[70.5rem] rounded-full">
          <div className="relative">
            <FiSearch className="relative top-6 left-4 z-20 opacity-40" />
            <input
              type="text"
              placeholder="Search tags, resources or notes..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white rounded-full py-3 px-12 outline-none shadow-inner text-sm placeholder:text-[#3B2A1F]/70 border border-transparent focus:border-[#3B2A1F]/10 transition relative bottom-2 w-2xl"
            />
          </div>
          {!isArchivePage && (
            <button
              onClick={() => setShowQuickAdd(true)}
              className="bg-white px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 shadow-lg hover:-translate-y-1 active:scale-95 transition relative"
            >
              <FiPlus strokeWidth={3} /> Quick Add
            </button>
          )}
        </header>

        {currentFolderId && (
          <div className="mt-24 mb-4 flex items-center gap-4">
            <button
              onClick={() => setCurrentFolderId(currentFolder?.parent_folder || null)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/60 hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all font-bold text-sm text-[#3B2A1F]"
            >
              <FiChevronLeft size={16} /> Back
            </button>
            <div className="flex items-center gap-2 font-black text-xl">
              <button onClick={() => setCurrentFolderId(null)} className="hover:text-[#3B2A1F]/70 transition-colors">
                {isArchivePage ? 'Archives' : 'Resources'}
              </button>
              <span className="opacity-40">/</span>
              <span>{currentFolder?.name}</span>
            </div>
          </div>
        )}

        <div className={`flex items-center justify-between ${currentFolderId ? 'mt-4' : 'mt-24'} mb-10`}>
          <div className="flex gap-4">
            <div className="relative">
              <button
                onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsTagDropdownOpen(false); }}
                className="flex items-center gap-8 bg-white/90 px-5 py-2 rounded-2xl font-black text-sm border-2 border-[#3B2A1F]/5 shadow-[4px_4px_0px_0px_rgba(59,42,31,0.1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
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

            <div className="relative">
              <button
                onClick={() => { setIsTagDropdownOpen(!isTagDropdownOpen); setIsDropdownOpen(false); }}
                className="flex items-center gap-8 bg-white/90 px-5 py-2 rounded-2xl font-black text-sm border-2 border-[#3B2A1F]/5 shadow-[4px_4px_0px_0px_rgba(59,42,31,0.1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
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

          {!isArchivePage && (
            <div className="relative left-72">
              <button
                onClick={() => setShowNewFolder(true)}
                className="flex items-center gap-4 bg-white/90 px-4 py-2 rounded-2xl font-bold text-sm border-2 border-[#3B2A1F]/5 shadow-[4px_4px_0px_0px_rgba(59,42,31,0.1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                <FiFolderPlus strokeWidth={3} /> New Folder
              </button>
            </div>
          )}

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

        {viewMode === "list" ? (
          <div className="w-full">
            <div className="grid grid-cols-12 px-6 mb-4 text-[#3B2A1F]/50 font-black uppercase text-xs tracking-widest">
              <div className="col-span-4">Name</div>
              <div className="col-span-4">Tags</div>
              <div className="col-span-2">Date Modified</div>
              <div className="col-span-1 text-right">Type</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-3">
              {filteredResources.map((item) => (
                <div
                  key={item.id}
                  onDoubleClick={() => { if (item.type === "folder") setCurrentFolderId(item.realId); else openResource(item); }}
                  className="grid grid-cols-12 items-center px-6 py-2 bg-white/40 hover:bg-white/90 rounded-2xl transition-all group border border-transparent hover:border-white/50 hover:shadow-md cursor-pointer"
                >
                  <div className="col-span-4 flex items-center gap-4 font-bold text-lg truncate pr-4">
                    <span className="opacity-70 group-hover:scale-125 group-hover:rotate-6 transition-all duration-300">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="col-span-4 flex gap-1 flex-wrap items-center">
                    {item.tags && item.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-[#3B2A1F]/10 text-[#3B2A1F] px-2 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap">
                        #{tag}
                      </span>
                    ))}
                    {item.tags && item.tags.length > 3 && (
                      <span className="text-[10px] bg-[#3B2A1F]/10 text-[#3B2A1F] px-2 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 font-medium opacity-50 italic text-sm">
                    {item.date}
                  </div>
                  <div className="col-span-1 text-right font-black text-xs opacity-70">
                    <span className="bg-[#3B2A1F]/5 px-3 py-1 rounded-full uppercase">
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
                onDoubleClick={() => { if (item.type === "folder") setCurrentFolderId(item.realId); else openResource(item); }}
                className="group bg-white/60 hover:bg-white rounded-[2rem] p-3 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-2 border-transparent hover:border-white relative cursor-pointer"
              >
                <div
                  className={`aspect-square rounded-[1.5rem] mb-4 flex items-center justify-center relative overflow-hidden ${item.color} bg-opacity-50`}
                >
                  <ResourceThumbnail item={item} />
                </div>
                <div className="px-2 pb-2">
                  <h3 className="font-black text-sm truncate pr-8">
                    {item.name}
                  </h3>
                  <p className="text-[10px] font-bold opacity-40 italic">
                    {item.date}
                  </p>
                </div>

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

                <div className="absolute bottom-2 right-3 bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shadow-sm pointer-events-none">
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

      {showQuickAdd && (
        <QuickAdd
          setShowQuickAdd={(val) => { setShowQuickAdd(val); if (!val) setDroppedFile(null); }}
          onSuccess={fetchResources}
          folders={folders}
          initialFile={droppedFile}
        />
      )}

      {showNewFolder && (
        <NewFolderModal
          setShowNewFolder={setShowNewFolder}
          onSuccess={fetchFolders}
        />
      )}

      {previewItem && (
        <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}

      {organizeItem && (
        <OrganizeModal
          item={organizeItem}
          folders={folders}
          onClose={() => setOrganizeItem(null)}
          onSuccess={fetchResources}
        />
      )}

      {editTagItem && (
        <EditTagsModal
          item={editTagItem}
          onClose={() => setEditTagItem(null)}
          onSuccess={fetchResources}
        />
      )}
    </div>
  );
};

export default ResourcesPage;

const PreviewModal = ({ item, onClose }) => {
  const fileUrl = item.file ? (item.file.startsWith("http") ? item.file : `http://${api.defaults.baseURL}$:8000${item.file}`) : item.url;

  return (
    <div className="fixed inset-0 bg-[#3B2A1F]/80 backdrop-blur-md z-[1000] flex items-center justify-center p-10" onClick={onClose}>
      <div className="relative w-full max-w-4xl max-h-full bg-[#FFE455] rounded-[2rem] p-4 flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -top-14 right-0 flex items-center gap-3">
          {item.type !== "folder" && (
            <>
              <button
                onClick={() => {
                  const newName = prompt("Enter new name:", item.name);
                  if (newName && newName !== item.name) {
                    api.patch(`/api/resources/${item.id}/`, { title: newName }).then(() => alert("Renamed successfully! Refresh to see changes.")).catch(() => alert("Failed to rename"));
                  }
                }}
                className="w-10 h-10 flex items-center justify-center bg-white text-[#3B2A1F] shadow-lg rounded-full transition-transform hover:scale-110 z-50"
                title="Rename"
              >
                <FiEdit3 size={18} strokeWidth={3} />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center bg-white text-[#3B2A1F] shadow-lg rounded-full transition-transform hover:scale-110 z-50 ml-2"
            title="Close"
          >
            <FiX size={24} strokeWidth={3} />
          </button>
        </div>
        {item.type === "image" || (fileUrl && fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
          <img src={fileUrl} alt={item.name} className="max-w-full max-h-[80vh] object-contain rounded-xl" />
        ) : item.type === "video" || (fileUrl && fileUrl.match(/\.(mp4|webm|ogg)$/i)) ? (
          <video src={fileUrl} controls className="max-w-full max-h-[80vh] rounded-xl outline-none" />
        ) : (
          <div className="w-full flex flex-col items-center gap-4">
            <iframe src={fileUrl} className="w-full h-[75vh] bg-white rounded-xl" title={item.name} />
            <p className="text-sm font-bold opacity-60 text-center">
              If the preview doesn't load, <a href={fileUrl} download={item.name || "download"} target="_blank" rel="noreferrer" className="underline text-blue-600 hover:text-blue-800">click here to download</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const OrganizeModal = ({ item, folders, onClose, onSuccess }) => {
  const [selectedFolder, setSelectedFolder] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    setLoading(true);
    try {
      await api.patch(`/api/resources/${item.id}/`, { folder: selectedFolder || null });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to move resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#3B2A1F]/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="relative bg-[#FFE455]/90 backdrop-blur-2xl border-4 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3rem] p-10 w-full max-w-sm flex flex-col gap-5 text-[#3B2A1F]">
        <button onClick={onClose} className="absolute top-6 right-8 w-10 h-10 flex items-center justify-center bg-white/40 hover:bg-white/80 rounded-full transition-all group">
          <span className="font-black text-lg group-hover:scale-110"><FiX /></span>
        </button>
        <div className="mb-2">
          <h2 className="text-2xl font-black italic tracking-tight">Organize</h2>
          <p className="text-sm font-bold opacity-60">Move "{item.name}"</p>
        </div>
        <div className="flex flex-col gap-3">
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="w-full bg-white/50 border-2 border-transparent focus:border-[#3B2A1F] rounded-2xl px-5 py-3 outline-none text-[#3B2A1F] font-bold transition-all shadow-inner text-sm"
          >
            <option value="">None (Root)</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleMove}
          disabled={loading}
          className="mt-2 w-full py-4 rounded-[2rem] font-black text-lg shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-2 bg-[#3B2A1F] text-[#FFE455] hover:-translate-y-1 active:scale-95"
        >
          {loading ? "Moving..." : "Move"}
        </button>
      </div>
    </div>
  );
};

const NewFolderModal = ({ setShowNewFolder, onSuccess }) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post("/api/folders/", { name });
      onSuccess();
      setShowNewFolder(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#3B2A1F]/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="relative bg-[#FFE455]/90 backdrop-blur-2xl border-4 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3rem] p-10 w-full max-w-sm flex flex-col gap-5 text-[#3B2A1F]">
        <button
          onClick={() => setShowNewFolder(false)}
          className="absolute top-6 right-8 w-10 h-10 flex items-center justify-center bg-white/40 hover:bg-white/80 rounded-full transition-all group"
        >
          <span className="font-black text-lg group-hover:scale-110">
            <FiX />
          </span>
        </button>

        <div className="mb-2">
          <h2 className="text-2xl font-black italic tracking-tight">New Folder</h2>
        </div>

        <input
          type="text"
          placeholder="Folder name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/50 border-2 border-transparent focus:border-[#3B2A1F] rounded-2xl px-5 py-3 outline-none placeholder:text-[#3B2A1F]/40 font-bold transition-all shadow-inner"
          autoFocus
        />

        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className={`mt-2 w-full py-4 rounded-[2rem] font-black text-lg shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-2
            ${name.trim() && !loading ? "bg-[#3B2A1F] text-[#FFE455] hover:-translate-y-1 active:scale-95" : "bg-[#3B2A1F]/20 text-[#3B2A1F]/40 cursor-not-allowed"}`}
        >
          {loading ? "Creating..." : "Create Folder"}
        </button>
      </div>
    </div>
  );
};

const EditTagsModal = ({ item, onClose, onSuccess }) => {
  const [tags, setTags] = useState(item.tags ? [...item.tags] : []);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch(`/api/resources/${item.id}/`, { tags: JSON.stringify(tags) });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update tags");
    } finally {
      setLoading(false);
    }
  };

  const addTag = (e) => {
    if (e.key === "Enter" && newTag.trim() !== "") {
      const formattedTag = newTag.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (formattedTag && !tags.includes(formattedTag)) {
        setTags([...tags, formattedTag]);
      }
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className="fixed inset-0 bg-[#3B2A1F]/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="relative bg-[#FFE455]/90 backdrop-blur-2xl border-4 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3rem] p-10 w-full max-w-md flex flex-col gap-5 text-[#3B2A1F]">
        <button onClick={onClose} className="absolute top-6 right-8 w-10 h-10 flex items-center justify-center bg-white/40 hover:bg-white/80 rounded-full transition-all group">
          <span className="font-black text-lg group-hover:scale-110"><FiX /></span>
        </button>
        <div className="mb-2">
          <h2 className="text-2xl font-black italic tracking-tight">Edit Tags</h2>
          <p className="text-sm font-bold opacity-60">Manage tags for "{item.name}"</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, idx) => (
            <span key={idx} className="flex items-center gap-1 bg-white/60 px-3 py-1 rounded-full text-sm font-bold">
              #{tag}
              <button onClick={() => removeTag(tag)} className="hover:text-red-500 rounded-full ml-1"><FiX size={14} /></button>
            </span>
          ))}
        </div>

        <input
          type="text"
          placeholder="Type tag and press Enter..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={addTag}
          className="w-full bg-white/50 border-2 border-transparent focus:border-[#3B2A1F] rounded-2xl px-5 py-3 outline-none placeholder:text-[#3B2A1F]/40 font-bold transition-all shadow-inner"
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-4 w-full py-4 rounded-[2rem] font-black text-lg shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-2 bg-[#3B2A1F] text-[#FFE455] hover:-translate-y-1 active:scale-95"
        >
          {loading ? "Saving..." : "Save Tags"}
        </button>
      </div>
    </div>
  );
};
