import React, { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiPlay, FiPause, FiSquare, FiX, FiLoader, FiZoomIn, FiZoomOut, FiChevronUp, FiChevronDown, FiClock, FiEdit3, FiTrash2, FiEdit2, FiCheck } from "react-icons/fi";
import { Document, Page, pdfjs } from 'react-pdf';
import * as docx from "docx-preview";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import api from "../api";
import { TimerContext } from "../context/TimerContext";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const Viewer = () => {
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url");
  const name = searchParams.get("name") || "Document Viewer";
  const type = searchParams.get("type") || "document";
  const id = searchParams.get("id"); // Retrieve the resource ID
  const navigate = useNavigate();

  const {
    workTime: globalWorkTime,
    setWorkTime: setGlobalWorkTime,
    timeLeft: globalTimeLeft,
    isActive: isGlobalActive,
    toggleTimer: toggleGlobalTimer,
    resetTimer: resetGlobalTimer,
    isBreak: isGlobalBreak,
  } = useContext(TimerContext);

  const [showTimer, setShowTimer] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [docxBlob, setDocxBlob] = useState(null);
  const [pptxBuffer, setPptxBuffer] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  
  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  useEffect(() => {
    if (id && showNotes) {
      fetchNotes();
    }
  }, [id, showNotes]);

  const fetchNotes = async () => {
    try {
      setLoadingNotes(true);
      const res = await api.get(`/api/notes/?resource_id=${id}`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !id) return;
    try {
      const res = await api.post("/api/notes/", { resource: id, content: newNote });
      setNotes([res.data, ...notes]);
      setNewNote("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/api/notes/${noteId}/`);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editNoteContent.trim()) return;
    try {
      const res = await api.patch(`/api/notes/${noteId}/`, { content: editNoteContent });
      setNotes(notes.map(n => n.id === noteId ? res.data : n));
      setEditingNoteId(null);
      setEditNoteContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const docxContainerRef = React.useRef(null);
  const pptxContainerRef = React.useRef(null);
  const pptxRendered = React.useRef(false);

  // PDF Viewer State
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const checkExtension = (ext) => {
    return (name && name.toLowerCase().endsWith(ext)) || (url && url.toLowerCase().split('?')[0].endsWith(ext));
  };

  const isPdfDocument = checkExtension(".pdf") || (type === "document" && blobUrl && typeof blobUrl === 'string' && blobUrl.endsWith(".pdf")) || false;
  const isDocxDocument = checkExtension(".docx");
  const isPptxDocument = checkExtension(".pptx");
  const isTxtDocument = checkExtension(".txt");

  const displayTime = globalTimeLeft;
  const isTimerRunning = isGlobalActive;

  const handleToggleTimer = () => {
    toggleGlobalTimer();
  };

  const handleStopTimer = () => {
    resetGlobalTimer();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };



  useEffect(() => {
    if (!url) return;

    const isLocal = url.includes(api.defaults.baseURL) || url.includes("localhost") || url.startsWith("/");
    const isDoc = type !== "image" && type !== "video";

    if (isLocal && isDoc) {
      setLoading(true);
      
      const fetchUrl = id ? `/api/download/${id}/` : url;
      
      api.get(fetchUrl, { responseType: 'blob' })
        .then(response => {
           let blobType = response.data.type;
           if (isPdfDocument) blobType = "application/pdf";
           else if (isTxtDocument) blobType = "text/plain";
           else if (isDocxDocument) blobType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
           
           const blob = new Blob([response.data], { type: blobType });
           
           if (isDocxDocument) {
             setDocxBlob(blob);
             setLoading(false);
           } else if (isPptxDocument) {
             blob.arrayBuffer().then(buffer => {
               setPptxBuffer(buffer);
               setLoading(false);
             });
           } else {
             const objectUrl = URL.createObjectURL(blob);
             setBlobUrl(objectUrl);
             setLoading(false);
           }
        })
        .catch(err => {
           console.error("Failed to load file as blob", err);
           setBlobUrl(url);
           setLoading(false);
        });
    } else {
      setBlobUrl(url);
      setLoading(false);
    }

    return () => {
      // Intentionally not aggressively revoking since component unmounts might clash with async set calls if handled poorly,
      // but standard revoke is good practice. We can't strictly revoke blobUrl dynamically inside this scope safely without ref.
    };
  }, [url, type, name]);

  useEffect(() => {
    if (docxBlob && docxContainerRef.current) {
      docx.renderAsync(docxBlob, docxContainerRef.current, null, {
         className: "docx",
         inWrapper: false,
         ignoreWidth: false,
         ignoreHeight: false,
         ignoreFonts: false,
         breakPages: true,
         ignoreLastRenderedPageBreak: true,
         experimental: false,
         trimXmlDeclaration: true,
         useBase64URL: false,
      })
        .then(() => console.log("docx rendered"))
        .catch(err => console.error("docx render error", err));
    }
  }, [docxBlob]);

  useEffect(() => {
    if (pptxBuffer && pptxContainerRef.current) {
      if (pptxRendered.current) return;
      pptxRendered.current = true;
      pptxContainerRef.current.innerHTML = ""; // Prevent duplicate appending
      import('pptx-preview').then(({ init }) => {
        const viewer = init(pptxContainerRef.current, {
            width: 1000,
            height: 550
        });
        viewer.preview(pptxBuffer);
      }).catch(err => console.error("pptx-preview import error", err));
    }
  }, [pptxBuffer]);



  return (
    <div className="w-full h-screen bg-[#F7EACD] flex flex-col font-inter">
      <header className="px-6 py-4 bg-[#FFE455] border-b-2 border-[#3B2A1F]/10 flex items-center justify-between shadow-sm z-10">
        <h1 className="font-black text-[#3B2A1F] text-xl truncate pr-4">{name}</h1>
        <div className="flex gap-4 items-center">
          {id && (
            <button 
              onClick={() => setShowNotes(!showNotes)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-sm border-2 border-transparent ${showNotes ? 'bg-[#3B2A1F] text-[#FFE455]' : 'bg-white text-[#3B2A1F] hover:border-[#3B2A1F]/20'}`}
            >
              <FiEdit3 size={18} /> Notes
            </button>
          )}
          <button 
            onClick={() => { window.close(); navigate(-1); }} 
            className="p-2 bg-white rounded-full hover:bg-black/10 transition shadow-sm"
          >
            <FiX size={24} className="text-[#3B2A1F]" />
          </button>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden relative">
        <main className={`flex-1 relative overflow-hidden bg-white/50 flex flex-col transition-all duration-300 ${showNotes ? 'mr-[24rem]' : ''}`}>
        {loading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/50 gap-4">
            <FiLoader size={48} className="animate-spin text-[#3B2A1F]/40" />
            <p className="font-bold text-[#3B2A1F]/60 tracking-widest text-sm uppercase">Loading File...</p>
          </div>
        ) : isDocxDocument ? (
          <div className="w-full h-full flex flex-col bg-[#F7EACD] relative">
            {/* DOCX Controls (Zoom Only) */}
            <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col items-center gap-4 bg-[#3B2A1F] text-[#FFE455] px-4 py-6 rounded-[2rem] shadow-2xl z-50 border-4 border-[#FFE455]/20 hover:border-[#FFE455]/50 transition-colors animate-in fade-in slide-in-from-left-5">
              <div className="flex flex-col items-center gap-3 bg-white/10 rounded-full py-2 px-1 text-center">
                <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-2 hover:bg-white/20 rounded-full transition-colors"><FiZoomIn size={16} /></button>
                <span className="text-xs font-bold py-1">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 hover:bg-white/20 rounded-full transition-colors"><FiZoomOut size={16} /></button>
              </div>
              <div className="h-px w-8 bg-white/20 my-1"></div>
              <button 
                onClick={() => setShowTimer(!showTimer)} 
                className={`p-3 rounded-full transition-all ${showTimer ? 'bg-[#FFE455] text-[#3B2A1F] scale-110 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <FiClock size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex justify-center py-12 px-8 bg-[#F7EACD] custom-scrollbar pb-32">
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s' }} className="w-full max-w-4xl">
                 <div ref={docxContainerRef} className="bg-white shadow-2xl mx-auto overflow-hidden text-black min-h-max w-full p-10 rounded-lg" style={{ pointerEvents: 'auto' }} />
              </div>
            </div>
          </div>
        ) : isPptxDocument ? (
          <div className="w-full h-full flex flex-col bg-[#F7EACD] relative">
            {/* PPTX Controls */}
            <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col items-center gap-4 bg-[#3B2A1F] text-[#FFE455] px-4 py-6 rounded-[2rem] shadow-2xl z-50 border-4 border-[#FFE455]/20 hover:border-[#FFE455]/50 transition-colors animate-in fade-in slide-in-from-left-5">
              <div className="flex flex-col items-center gap-3 bg-white/10 rounded-full py-2 px-1 text-center">
                <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-2 hover:bg-white/20 rounded-full transition-colors"><FiZoomIn size={16} /></button>
                <span className="text-xs font-bold py-1">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 hover:bg-white/20 rounded-full transition-colors"><FiZoomOut size={16} /></button>
              </div>
              <div className="h-px w-8 bg-white/20 my-1"></div>
              <button 
                onClick={() => setShowTimer(!showTimer)} 
                className={`p-3 rounded-full transition-all ${showTimer ? 'bg-[#FFE455] text-[#3B2A1F] scale-110 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <FiClock size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex justify-center py-12 px-8 bg-[#F7EACD] custom-scrollbar pb-32">
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s' }} className="w-full flex justify-center items-start">
                 <div ref={pptxContainerRef} className="mx-auto overflow-hidden shadow-2xl rounded-lg" style={{ pointerEvents: 'auto' }} />
              </div>
            </div>
          </div>
        ) : isPdfDocument ? (
          <div className="w-full h-full flex flex-col bg-[#F7EACD] relative">
            {/* Floating Document Controls */}
            <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col items-center gap-4 bg-[#3B2A1F] text-[#FFE455] px-4 py-6 rounded-[2rem] shadow-2xl z-50 border-4 border-[#FFE455]/20 hover:border-[#FFE455]/50 transition-colors animate-in fade-in slide-in-from-left-5">
              <div className="flex flex-col items-center gap-2 bg-white/10 rounded-full py-2 px-1">
                <button disabled={pageNumber <= 1} onClick={() => {
                  const newPage = Math.max(1, pageNumber - 1);
                  setPageNumber(newPage);
                  document.getElementById(`pdf-page-${newPage}`)?.scrollIntoView({ behavior: 'smooth' });
                }} className="p-2 hover:bg-white/20 rounded-full disabled:opacity-50 transition-colors"><FiChevronUp size={18} /></button>
                <div className="flex flex-col items-center justify-center text-xs font-bold leading-none py-1 gap-2">
                  <span>{pageNumber}</span>
                  <div className="w-4 h-px bg-white/40"></div>
                  <span className="opacity-80">{numPages || '--'}</span>
                </div>
                <button disabled={pageNumber >= numPages} onClick={() => {
                  const newPage = Math.min(numPages, pageNumber + 1);
                  setPageNumber(newPage);
                  document.getElementById(`pdf-page-${newPage}`)?.scrollIntoView({ behavior: 'smooth' });
                }} className="p-2 hover:bg-white/20 rounded-full disabled:opacity-50 transition-colors"><FiChevronDown size={18} /></button>
              </div>
              <div className="h-px w-8 bg-white/20 my-1"></div>
              <div className="flex flex-col items-center gap-3 bg-white/10 rounded-full px-1 py-2">
                <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="p-2 hover:bg-white/20 rounded-full transition-colors"><FiZoomIn size={16} /></button>
                <span className="text-xs font-bold">{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="p-2 hover:bg-white/20 rounded-full transition-colors"><FiZoomOut size={16} /></button>
              </div>
              <div className="h-px w-8 bg-white/20 my-1"></div>
              <button 
                onClick={() => setShowTimer(!showTimer)} 
                className={`p-3 rounded-full transition-all ${showTimer ? 'bg-[#FFE455] text-[#3B2A1F] scale-110 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <FiClock size={18} />
              </button>
            </div>
            
            {/* Viewer Scroll Area */}
            <div 
              className="flex-1 overflow-auto flex justify-center py-12 px-8 bg-[#F7EACD] relative custom-scrollbar pb-32"
              onScroll={(e) => {
                if (!numPages) return;
                const container = e.target;
                const containerRect = container.getBoundingClientRect();
                const containerCenter = containerRect.top + container.clientHeight / 2;
                
                let closestPage = pageNumber;
                let minDistance = Infinity;

                for (let i = 1; i <= numPages; i++) {
                  const pageEl = document.getElementById(`pdf-page-${i}`);
                  if (pageEl) {
                    const rect = pageEl.getBoundingClientRect();
                    const pageCenter = rect.top + rect.height / 2;
                    const distance = Math.abs(containerCenter - pageCenter);
                    if (distance < minDistance) {
                      minDistance = distance;
                      closestPage = i;
                    }
                  }
                }
                
                if (closestPage !== pageNumber) {
                  setPageNumber(closestPage);
                }
              }}
            >
              <Document
                file={blobUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center gap-4 mt-20">
                    <FiLoader size={48} className="animate-spin text-[#3B2A1F]/40" />
                  </div>
                }
                className="max-w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out flex flex-col items-center gap-8"
              >
                {Array.from(new Array(numPages || 0), (el, index) => (
                  <div key={`page_${index + 1}`} id={`pdf-page-${index + 1}`}>
                    <Page 
                      pageNumber={index + 1} 
                      scale={scale} 
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="bg-white mx-auto overflow-hidden shadow-2xl rounded-lg border border-[#3B2A1F]/10"
                    />
                  </div>
                ))}
              </Document>
            </div>
          </div>
        ) : (type === "image" || (blobUrl && blobUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i))) ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <img src={blobUrl} alt={name} className="max-w-full max-h-full object-contain rounded-xl shadow-lg border-2 border-[#3B2A1F]/10" />
          </div>
        ) : (type === "video" || (blobUrl && blobUrl.match(/\.(mp4|webm|ogg)$/i))) ? (
          <div className="w-full h-full flex items-center justify-center p-4 bg-black">
            <video src={blobUrl} controls className="max-w-full max-h-full rounded-xl outline-none shadow-lg border-2 border-[#3B2A1F]/10" />
          </div>
        ) : (
          <iframe src={blobUrl} title={name} className="w-full h-full border-none bg-white" />
        )}
        
        {/* Timer Widget */}
        {showTimer && (
          <div className="absolute bottom-8 right-8 bg-[#3B2A1F] rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-4 text-[#FFE455] z-50 border-4 border-[#FFE455]/20 hover:border-[#FFE455]/50 transition-colors group animate-in fade-in slide-in-from-bottom-5">
            <div className="text-sm font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Focus Session</div>
            
            {!isGlobalActive && globalTimeLeft === globalWorkTime * 60 && !isGlobalBreak && (
              <div className="flex gap-2 text-xs font-bold bg-white/10 rounded-full p-1 mb-[-10px] mt-[-5px]">
                <button onClick={() => setGlobalWorkTime(15)} className={`px-2 py-1 rounded-full transition-colors ${globalWorkTime === 15 ? 'bg-[#FFE455] text-[#3B2A1F]' : 'hover:bg-white/20'}`}>15m</button>
                <button onClick={() => setGlobalWorkTime(25)} className={`px-2 py-1 rounded-full transition-colors ${globalWorkTime === 25 ? 'bg-[#FFE455] text-[#3B2A1F]' : 'hover:bg-white/20'}`}>25m</button>
                <button onClick={() => setGlobalWorkTime(45)} className={`px-2 py-1 rounded-full transition-colors ${globalWorkTime === 45 ? 'bg-[#FFE455] text-[#3B2A1F]' : 'hover:bg-white/20'}`}>45m</button>
                <button onClick={() => setGlobalWorkTime(60)} className={`px-2 py-1 rounded-full transition-colors ${globalWorkTime === 60 ? 'bg-[#FFE455] text-[#3B2A1F]' : 'hover:bg-white/20'}`}>1h</button>
              </div>
            )}

            <div className="font-black text-5xl tracking-tight maples">{formatTime(displayTime)}</div>
            
            <div className="flex gap-3 bg-white/10 p-2 rounded-2xl w-full justify-center">
              <button 
                onClick={handleToggleTimer} 
                className="p-3 bg-[#FFE455] text-[#3B2A1F] rounded-xl hover:-translate-y-1 transition active:scale-95 shadow-md"
              >
                {isTimerRunning ? <FiPause size={20} fill="currentColor" /> : <FiPlay size={20} fill="currentColor" className="ml-1" />}
              </button>
              <button 
                onClick={handleStopTimer}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition active:scale-95 text-white"
              >
                <FiSquare size={20} fill="currentColor" />
              </button>
            </div>
          </div>
        )}

        </main>
        
        {/* Notes Side Panel */}
        <aside className={`absolute top-0 right-0 h-full w-[24rem] bg-[#F7EACD] border-l-4 border-white/50 flex flex-col shadow-2xl transition-transform duration-300 z-40 ${showNotes ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 border-b-2 border-white/40 flex justify-between items-center bg-[#FFE455]">
            <h2 className="font-black text-xl text-[#3B2A1F] flex items-center gap-2"><FiEdit3 /> Document Notes</h2>
            <button onClick={() => setShowNotes(false)} className="p-2 bg-white/40 hover:bg-white rounded-full transition text-[#3B2A1F] shadow-sm"><FiX size={20} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
            {loadingNotes ? (
              <div className="flex justify-center py-10 opacity-50"><FiLoader className="animate-spin text-2xl" /></div>
            ) : notes.length === 0 ? (
              <div className="text-center font-bold opacity-50 italic py-10 flex flex-col items-center gap-2">
                <FiEdit3 size={32} />
                <p>No notes yet. Add one below!</p>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="bg-white/80 p-4 rounded-2xl shadow-sm border border-white relative group">
                  {editingNoteId === note.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editNoteContent}
                        onChange={(e) => setEditNoteContent(e.target.value)}
                        className="w-full resize-none h-20 p-3 rounded-xl bg-white border-2 border-[#3B2A1F]/20 focus:border-[#3B2A1F] outline-none text-sm font-medium custom-scrollbar"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingNoteId(null)} className="px-3 py-1 text-xs font-bold bg-black/10 hover:bg-black/20 rounded-lg transition">Cancel</button>
                        <button onClick={() => handleUpdateNote(note.id)} className="px-3 py-1 text-xs font-bold bg-[#3B2A1F] text-[#FFE455] hover:-translate-y-0.5 rounded-lg transition flex items-center gap-1"><FiCheck /> Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed text-[#3B2A1F]">{note.content}</p>
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-wider">{new Date(note.created_at).toLocaleString()}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => { setEditingNoteId(note.id); setEditNoteContent(note.content); }} className="text-[#3B2A1F]/50 hover:text-[#3B2A1F] hover:scale-110 p-1 bg-black/5 rounded-full"><FiEdit2 size={14}/></button>
                          <button onClick={() => handleDeleteNote(note.id)} className="text-red-500 hover:text-red-700 hover:scale-110 p-1 bg-red-100 rounded-full"><FiTrash2 size={14}/></button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 bg-[#FFE455]/30 border-t-2 border-white/40 flex flex-col gap-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a note..."
              className="w-full resize-none h-24 p-4 rounded-2xl bg-white border-2 border-transparent focus:border-[#3B2A1F] outline-none text-sm font-bold custom-scrollbar shadow-inner placeholder:text-[#3B2A1F]/40"
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="w-full py-4 bg-[#3B2A1F] text-[#FFE455] font-black rounded-xl hover:-translate-y-1 active:scale-95 transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
            >
              Add Note
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Viewer;
