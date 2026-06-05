import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiX,
  FiFile,
  FiChevronDown,
  FiExternalLink,
} from "react-icons/fi";
import api from "../api";

const QuickAdd = ({ setShowQuickAdd, onSuccess, folders, initialFile = null }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialFile) {
      setImage(initialFile);
      if (initialFile.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(initialFile));
      } else {
        setPreview(initialFile.name);
      }
      setCaption(initialFile.name);
    }
  }, [initialFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(file.name);
    }
  };

  const handleTagInput = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/,/g, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const determineType = (file) => {
    if (!file) return "document";
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "document";
  };

  const handlePost = async () => {
    if (!image && !caption) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("title", caption || (image ? image.name : "Untitled"));
    formData.append("type", determineType(image));
    formData.append("tags", JSON.stringify(tags));
    if (selectedFolder) {
      formData.append("folder", selectedFolder.id);
    }
    if (image) {
      formData.append("file", image);
    }

    try {
      await api.post("/api/resources/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (onSuccess) onSuccess();
      setShowQuickAdd(false);
    } catch (error) {
      console.error(error);
      alert("Failed to upload resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#3B2A1F]/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="relative bg-[#FFE455]/90 backdrop-blur-2xl border-4 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 w-full max-w-md flex flex-col gap-5 text-[#3B2A1F]">
        <button
          onClick={() => setShowQuickAdd(false)}
          className="absolute top-6 right-8 w-10 h-10 flex items-center justify-center bg-white/40 hover:bg-white/80 rounded-full transition-all group"
        >
          <span className="font-black text-lg group-hover:scale-110">
            <FiX />
          </span>
        </button>

        <div className="mb-2">
          <h2 className="text-2xl font-black italic tracking-tight">
            Quick Add
          </h2>
          <p className="text-sm font-bold opacity-60">Upload a new resource</p>
        </div>

        <div className="relative group">
          <input
            type="file"
            id="imageInput"
            accept="*"
            onChange={handleFileChange}
            className="hidden"
          />
          {!preview ? (
            <button
              onClick={() => document.getElementById("imageInput").click()}
              className="w-full aspect-video border-4 border-dashed border-[#3B2A1F]/20 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-[#3B2A1F]/40 hover:bg-white/20 transition-all group"
            >
              <div className="p-4 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform">
                <FiPlus size={24} strokeWidth={3} />
              </div>
              <span className="font-black text-sm uppercase tracking-widest opacity-60">
                Select File
              </span>
            </button>
          ) : (
            <div className="relative w-full rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-[#F7EACD]">
              {image?.type?.startsWith("image/") ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex flex-col items-center justify-center gap-2">
                  <div className="p-4 bg-[#3B2A1F] text-[#FFE455] rounded-2xl">
                    <FiFile size={40} />
                  </div>
                  <p className="text-sm font-medium truncate max-w-[200px]">
                    {preview}
                  </p>
                </div>
              )}
              <button
                onClick={() => document.getElementById("imageInput").click()}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <span className="bg-white text-[#3B2A1F] px-4 py-2 rounded-full font-bold text-xs uppercase">
                  Change
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Name your resource..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full bg-white/50 border-2 border-transparent focus:border-[#3B2A1F] rounded-2xl px-5 py-3 outline-none placeholder:text-[#3B2A1F]/40 font-bold transition-all shadow-inner"
          />

          <div className="w-full bg-white/50 border-2 border-transparent focus-within:border-[#3B2A1F] rounded-2xl px-4 py-2 transition-all shadow-inner flex flex-wrap gap-2 items-center min-h-[56px]">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-[#3B2A1F] text-[#FFE455] px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 group"
              >
                #{tag}
                <button
                  onClick={() => removeTag(index)}
                  className="hover:text-white transition-colors"
                >
                  <FiX size={12} strokeWidth={4} />
                </button>
              </span>
            ))}
            <input
              type="text"
              placeholder={tags.length === 0 ? "Tags (press enter)" : ""}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              className="flex-1 bg-transparent outline-none placeholder:text-[#3B2A1F]/40 font-bold text-sm min-w-[80px]"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFolderOpen(!isFolderOpen)}
              className="w-full bg-white/50 border-2 border-transparent hover:border-[#3B2A1F]/20 rounded-2xl px-5 py-3 outline-none text-[#3B2A1F] font-bold transition-all shadow-inner text-sm flex items-center justify-between"
            >
              <span className="truncate">
                {selectedFolder ? selectedFolder.name : "Add to Folder"}
              </span>
              <FiChevronDown
                className={`transition-transform ${isFolderOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isFolderOpen && (
              <div className="absolute bottom-full mb-2 w-full bg-white rounded-2xl shadow-2xl border-2 border-[#3B2A1F]/10 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="max-h-40 overflow-y-auto [scrollbar-width:thin]">
                  <button
                    onClick={() => {
                      setSelectedFolder(null);
                      setIsFolderOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors ${!selectedFolder ? "bg-[#FFE455]" : "hover:bg-[#F7EACD]"}`}
                  >
                    None
                  </button>
                  {folders && folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setSelectedFolder(folder);
                        setIsFolderOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors ${selectedFolder?.id === folder.id ? "bg-[#FFE455]" : "hover:bg-[#F7EACD]"}`}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handlePost}
          disabled={(!image && !caption) || loading}
          className={`mt-2 w-full py-4 rounded-[2rem] font-black text-lg shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all flex items-center justify-center gap-2
            ${(image || caption) && !loading ? "bg-[#3B2A1F] text-[#FFE455] hover:-translate-y-1 active:scale-95" : "bg-[#3B2A1F]/20 text-[#3B2A1F]/40 cursor-not-allowed"}`}
        >
          {loading ? "Saving..." : <><FiExternalLink strokeWidth={3} /> Save Resource</>}
        </button>
      </div>
    </div>
  );
};

export default QuickAdd;
