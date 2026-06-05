import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as docx from "docx-preview";
import api from "../api";

// Setup pdf worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ResourceThumbnail = ({ item, className = "" }) => {
  const [iframeError, setIframeError] = useState(false);
  const docxRef = useRef(null);
  const pptxRef = useRef(null);
  const pptxRendered = useRef(false);

  let fileUrl = "";
  if (item.file) {
    fileUrl = item.file.startsWith("http") ? item.file : `${api.defaults.baseURL}${item.file}`;
  } else if (item.url) {
    fileUrl = item.url;
  }

  // Effect for rendering DOCX files to the reference container
  useEffect(() => {
    if (item.type === "document" && fileUrl && fileUrl.toLowerCase().endsWith('.docx')) {
      fetch(fileUrl)
        .then(res => res.blob())
        .then(blob => {
          if (docxRef.current) {
            docx.renderAsync(blob, docxRef.current, null, {
              inWrapper: false,
              ignoreWidth: true,
              ignoreHeight: true,
              ignoreFonts: true,
            }).catch(e => console.log(e));
          }
        })
        .catch(err => console.error(err));
    }
  }, [fileUrl, item.type]);

  // Effect for rendering PPTX files to the reference container
  useEffect(() => {
    if (item.type === "document" && fileUrl && fileUrl.toLowerCase().endsWith('.pptx')) {
      if (pptxRendered.current) return;
      pptxRendered.current = true;
      fetch(fileUrl)
        .then(res => res.arrayBuffer())
        .then(buffer => {
          if (pptxRef.current) {
            pptxRef.current.innerHTML = ""; // Prevent duplicate appending
            import('pptx-preview').then(({ init }) => {
              const viewer = init(pptxRef.current, {
                width: 960,
                height: 540
              });
              viewer.preview(buffer);
            }).catch(e => console.log(e));
          }
        })
        .catch(err => console.error(err));
    }
  }, [fileUrl, item.type]);

  if (item.type === "image" && fileUrl) {
    return (
      <img 
        src={fileUrl} 
        alt={item.name || item.title || "Preview"} 
        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${className}`} 
      />
    );
  }

  if (item.type === "video" && fileUrl) {
    return (
      <video 
        src={fileUrl} 
        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${className}`} 
        muted 
        loop 
        playsInline 
        onMouseEnter={(e) => { e.target.play().catch(()=>{} ) }}
        onMouseLeave={(e) => { e.target.pause() }}
      />
    );
  }

  const isPdf = fileUrl && fileUrl.toLowerCase().endsWith('.pdf');
  const isDocx = fileUrl && fileUrl.toLowerCase().endsWith('.docx');
  const isPptx = fileUrl && fileUrl.toLowerCase().endsWith('.pptx');

  if (item.type === "document" && isPdf) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ${className}`}>
        <Document 
          file={fileUrl} 
          loading={<span className="text-xs opacity-50 font-bold">PDF...</span>}
          error={<span className="text-xs opacity-50 font-bold">Error</span>}
        >
          <Page pageNumber={1} width={200} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      </div>
    );
  }

  if (item.type === "document" && isDocx) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-white ${className}`}>
        <div 
          ref={docxRef} 
          className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none group-hover:scale-[0.28] transition-transform duration-500 bg-white p-8 overflow-hidden text-xs"
        />
        <div className="absolute inset-0 z-10 cursor-pointer" />
      </div>
    );
  }

  if (item.type === "document" && isPptx) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-white ${className}`}>
        <div 
          ref={pptxRef} 
          className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none group-hover:scale-[0.28] transition-transform duration-500 bg-white overflow-hidden flex justify-center items-start pt-8"
        />
        <div className="absolute inset-0 z-10 cursor-pointer" />
      </div>
    );
  }

  if ((item.type === "document" || item.type === "link") && fileUrl && !iframeError) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <iframe 
          src={fileUrl} 
          title={item.name || item.title || "Preview"}
          className="absolute top-0 left-0 w-[400%] h-[400%] border-0 origin-top-left scale-[0.25] pointer-events-none group-hover:scale-[0.28] transition-transform duration-500 bg-white"
          sandbox="allow-scripts allow-same-origin"
          onError={() => setIframeError(true)}
        />
        <div className="absolute inset-0 z-10 cursor-pointer" />
      </div>
    );
  }

  // Fallback for non-media types, using the icon if provided, or an emoji if not
  return (
    <span className={`scale-[2.5] opacity-80 group-hover:scale-[3] transition-transform duration-500 flex items-center justify-center w-full h-full ${className}`}>
      {item.icon ? item.icon : (
        <span className="text-4xl">
          {item.type === 'document' ? '📄' : item.type === 'image' ? '🖼️' : item.type === 'video' ? '🎬' : item.type === 'folder' ? '📁' : '🔗'}
        </span>
      )}
    </span>
  );
};

export default ResourceThumbnail;
