import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiBell,
  FiPlus,
  FiClock,
  FiChevronLeft,
  FiChevronRight,
  FiBookmark,
} from "react-icons/fi";
import { FaFire } from "react-icons/fa";
import api from "../api";
import QuickAdd from "../Components/QuickAdd";
import ResourceThumbnail from "../Components/ResourceThumbnail";
import Bee from "../assets/HoneyBee.png";

const HomePage = () => {
  const [resources, setResources] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [stats, setStats] = useState({ total_resources: 0, reading_time: "0h 0m", progress: "0%", streaks: 0 });
  const [userName, setUserName] = useState("Researcher");
  const [folders, setFolders] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      const [dashRes, foldRes, savedRes] = await Promise.all([
        api.get("/dashboard/"),
        api.get("/api/folders/"),
        api.get("/api/saved/")
      ]);
      const parsedResources = (dashRes.data.resources || []).map(r => {
        let parsedTags = [];
        try {
          parsedTags = typeof r.tags === "string" ? JSON.parse(r.tags) : (r.tags || []);
        } catch (e) {
          parsedTags = [];
        }
        return { ...r, tags: parsedTags };
      });
      setResources(parsedResources);
      setStats(dashRes.data.stats || { total_resources: 0, reading_time: "0h 0m", progress: "0%", streaks: 0 });
      setUserName(dashRes.data.user_name || "Researcher");
      setFolders(foldRes.data || []);
      setSavedItems(savedRes.data || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("focus", fetchData);
    return () => window.removeEventListener("focus", fetchData);
  }, []);

  const filteredResources = resources.filter(r => 
    (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof r.tags === 'string' && r.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const savedResources = savedItems
    .map(item => {
      const r = item.resource_detail;
      if (!r) return null;
      let parsedTags = [];
      try {
        parsedTags = typeof r.tags === "string" ? JSON.parse(r.tags) : (r.tags || []);
      } catch (e) {
        parsedTags = [];
      }
      return { ...r, tags: parsedTags };
    })
    .filter(Boolean);

  const filteredSavedResources = savedResources.filter(r => 
    (r.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof r.tags === 'string' && r.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const recentResources = [...filteredResources]
    .sort((a, b) => new Date(b.last_used || b.created_at || 0) - new Date(a.last_used || a.created_at || 0))
    .slice(0, 6);

  return (
    <div className="ml-0 md:ml-64 min-h-screen bg-[#F7EACD] p-4 md:p-6 font-inter text-[#3B2A1F]">
      <div className="w-full h-full bg-[#FFE455] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border-4 border-white/20 min-h-[calc(100vh-3rem)]">
        {/* Top Header Bar */}
        <header className="py-2 px-3 md:px-4 bg-[#ffda20]/70 fixed top-20 md:top-12 z-20 flex items-center justify-between mb-10 w-[calc(100%-3rem)] md:w-[calc(100%-21rem)] lg:w-[calc(100%-24rem)] max-w-6xl rounded-full gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute top-1/2 -translate-y-1/2 left-4 z-20 opacity-40" />
            <input
              type="text"
              placeholder="Search tags, resources or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white rounded-full py-2.5 md:py-3 px-10 md:px-12 outline-none shadow-inner text-xs md:text-sm placeholder:text-[#3B2A1F]/70 border border-transparent focus:border-[#3B2A1F]/10 transition w-full md:w-96 lg:w-2xl"
            />
          </div>
          <div className="flex items-center">
            <button 
              onClick={() => setShowQuickAdd(true)}
              className="bg-white px-3 md:px-6 py-2.5 md:py-3 rounded-full font-black text-sm flex items-center gap-2 shadow-lg hover:-translate-y-1 active:scale-95 transition"
            >
              <FiPlus strokeWidth={3} /> <span className="hidden md:inline">Quick Add</span>
            </button>
          </div>
        </header>

        {/* Welcome Section */}
        <div className="my-16 md:my-16 mt-32 md:mt-16">
          <h2 className="text-3xl md:text-4xl font-black">Welcome, {userName}</h2>
          <p className="opacity-60 font-medium italic text-sm md:text-base">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard label="Total Resources" value={stats.total_resources} />
          <StatCard label="Reading Time" value={stats.reading_time} subtext="Total Spent" />
          <StatCard label="Streaks" value={<span className="flex items-center gap-2">{stats.streaks || 0} <img src={Bee} alt="Bee" className="w-15 h-15 object-contain" /></span>} subtext="Consecutive Days" />
        </div>

        {/* Content Section: Saved Resources */}
        <ContentSection title="Saved Resources" icon={<FiBookmark />} items={filteredSavedResources} emptyText="No saved resources" />

        {/* Content Section: Recently Opened */}
        <ContentSection title="Recently Opened" icon={<FiClock />} items={recentResources} emptyText="No recently opened resources" />
      </div>
      {showQuickAdd && (
        <QuickAdd 
          setShowQuickAdd={setShowQuickAdd} 
          onSuccess={fetchData} 
          folders={folders} 
        />
      )}
    </div>
  );
};

// --- Local Helpers ---

const StatCard = ({ label, value, subtext }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm relative group hover:shadow-md transition">
    <p className="text-[#3B2A1F]/40 uppercase tracking-tighter font-black text-xs mb-1">
      {label}
    </p>
    <p className="text-5xl font-black">{value}</p>
    {subtext && (
      <p className="absolute bottom-4 right-6 text-[10px] font-bold opacity-30 italic">
        {subtext}
      </p>
    )}
  </div>
);

// Updated ContentSection with Dynamic Arrows
const ContentSection = ({ title, icon, items = [], emptyText = "No items" }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-10 w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 font-black text-lg">
          {icon} <h3>{title}</h3>
        </div>
      </div>

      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-gray-900/20 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 text-[#3B2A1F]"
            aria-label="Scroll left"
          >
            <FiChevronLeft size={24} strokeWidth={3} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {items.length === 0 ? (
            <div className="w-full text-center p-10 opacity-50 font-bold italic">{emptyText}</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  api.patch(`/api/resources/${item.id}/`, {}).catch(err => {
                    console.error("Failed to update last_used", err);
                  });

                  let fileUrl = "";
                  if (item.file) {
                    fileUrl = item.file.startsWith("http") ? item.file : `${api.defaults.baseURL}${item.file}`;
                  } else if (item.url) {
                    fileUrl = item.url;
                  }
                  if (fileUrl) {
                    window.open(`/viewer?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(item.title)}&type=${encodeURIComponent(item.type)}&id=${item.id}`, "_blank");
                  }
                }}
                className="bg-white min-w-[280px] sm:min-w-[320px] aspect-video rounded-[2rem] shadow-sm hover:shadow-xl transition duration-300 cursor-pointer border border-white/50 snap-center shrink-0 p-6 flex flex-col justify-end relative overflow-hidden group"
              >
                {item.type !== 'folder' ? (
                  <div className="absolute inset-0 z-0 overflow-hidden rounded-[2rem] bg-white">
                    <ResourceThumbnail item={item} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <div className="absolute top-6 left-6 opacity-20 group-hover:opacity-100 transition-opacity">
                    <span className="text-4xl">📁</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0 pointer-events-none" />
                 <div className={`relative z-10 ${item.type !== 'folder' ? 'text-white drop-shadow-lg' : ''}`}>
                   <h4 className="font-black text-lg truncate mb-1">{item.title}</h4>
                   <div className="flex items-center justify-between mt-1">
                     <p className="text-xs font-bold opacity-60 uppercase tracking-widest">{item.type}</p>
                     {item.tags && item.tags.length > 0 && (
                       <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                         {item.tags.slice(0, 2).map((tag, idx) => (
                           <span key={idx} className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${item.type !== 'folder' ? 'bg-white/25 text-white' : 'bg-[#3B2A1F]/10 text-[#3B2A1F]'}`}>
                             #{tag}
                           </span>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
              </div>
            ))
          )}
        </div>

        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-gray-900/20 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 text-[#3B2A1F]"
            aria-label="Scroll right"
          >
            <FiChevronRight size={24} strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
};

export default HomePage;
