import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2,
  Search, X, ChevronUp, ChevronDown, RotateCw, FileText, Loader2,
  PanelLeftClose, PanelLeftOpen, GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- PDF.js setup ---
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// --- Constants ---
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 5.0;
const THUMBNAIL_SCALE = 0.2;
const PIXEL_RATIO = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

// ============================================================
// Main NativePdfViewer Component
// ============================================================
export default function NativePdfViewer({ fileUrl, title, isFullscreen = false }) {
  // --- Core state ---
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageInputValue, setPageInputValue] = useState("1");

  // --- Sidebar state ---
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [thumbnails, setThumbnails] = useState({});

  // --- Search state ---
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [pageTextContents, setPageTextContents] = useState({});

  // --- Text extraction state ---
  const [extractedText, setExtractedText] = useState(null);

  // --- Refs ---
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const searchInputRef = useRef(null);
  const renderTaskRef = useRef(null);
  const thumbnailCacheRef = useRef({});

  // ============================================================
  // Load the PDF document
  // ============================================================
  useEffect(() => {
    if (!fileUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
          cMapPacked: true,
          enableXfa: true,
        });

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setPageInputValue("1");
        setLoading(false);
        setThumbnails({});
        thumbnailCacheRef.current = {};
        setPageTextContents({});
        setSearchResults([]);
        setExtractedText(null);
      } catch (err) {
        if (cancelled) return;
        console.error("PDF load error:", err);
        setError(err.message || "Failed to load PDF");
        setLoading(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [fileUrl]);

  // ============================================================
  // Render current page
  // ============================================================
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    // Cancel any in-flight render
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch (_) {}
      renderTaskRef.current = null;
    }

    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: scale * PIXEL_RATIO, rotation });
      const displayViewport = page.getViewport({ scale, rotation });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.width = `${displayViewport.width}px`;
      canvas.style.height = `${displayViewport.height}px`;

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;

      // --- Render text layer ---
      if (textLayerRef.current) {
        textLayerRef.current.innerHTML = "";
        textLayerRef.current.style.width = `${displayViewport.width}px`;
        textLayerRef.current.style.height = `${displayViewport.height}px`;

        const textContent = await page.getTextContent();

        // Cache text content for search
        setPageTextContents(prev => ({
          ...prev,
          [currentPage]: textContent.items.map(item => item.str).join(" ")
        }));

        // Build text layer spans
        const textItems = textContent.items;
        for (const item of textItems) {
          if (!item.str) continue;
          const tx = pdfjsLib.Util.transform(
            displayViewport.transform,
            item.transform
          );
          const span = window.document.createElement("span");
          span.textContent = item.str;
          span.style.position = "absolute";
          span.style.left = `${tx[4]}px`;
          span.style.top = `${tx[5] - item.height * scale}px`;
          span.style.fontSize = `${item.height * scale}px`;
          span.style.fontFamily = "sans-serif";
          span.style.color = "transparent";
          span.style.whiteSpace = "pre";
          span.style.transformOrigin = "0% 0%";
          textLayerRef.current.appendChild(span);
        }
      }
    } catch (err) {
      if (err.name !== "RenderingCancelled") {
        console.error("Render error:", err);
      }
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // ============================================================
  // Generate thumbnails for visible range
  // ============================================================
  const generateThumbnail = useCallback(async (pageNum) => {
    if (!pdfDoc || thumbnailCacheRef.current[pageNum]) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });

      const canvas = window.document.createElement("canvas");
      canvas.width = viewport.width * PIXEL_RATIO;
      canvas.height = viewport.height * PIXEL_RATIO;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      const ctx = canvas.getContext("2d");
      ctx.scale(PIXEL_RATIO, PIXEL_RATIO);
      await page.render({
        canvasContext: ctx,
        viewport
      }).promise;

      const dataUrl = canvas.toDataURL("image/png");
      thumbnailCacheRef.current[pageNum] = dataUrl;
      setThumbnails(prev => ({ ...prev, [pageNum]: dataUrl }));
    } catch (err) {
      console.error(`Thumbnail error page ${pageNum}:`, err);
    }
  }, [pdfDoc]);

  useEffect(() => {
    if (!showThumbnails || !pdfDoc) return;
    // Generate thumbnails in batches
    const generateBatch = async () => {
      for (let i = 1; i <= numPages; i++) {
        if (!thumbnailCacheRef.current[i]) {
          await generateThumbnail(i);
        }
      }
    };
    generateBatch();
  }, [showThumbnails, pdfDoc, numPages, generateThumbnail]);

  // ============================================================
  // Text extraction for AI integration
  // ============================================================
  const extractAllText = useCallback(async () => {
    if (!pdfDoc) return null;
    if (extractedText) return extractedText;

    const allText = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(" ");
      allText.push({ page: i, text: pageText });
    }

    const result = allText;
    setExtractedText(result);
    return result;
  }, [pdfDoc, numPages, extractedText]);

  // Expose extractAllText for parent components
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.__extractAllText = extractAllText;
    }
  }, [extractAllText]);

  // ============================================================
  // Search functionality
  // ============================================================
  const performSearch = useCallback(async () => {
    if (!searchText.trim() || !pdfDoc) return;

    setIsSearching(true);
    setSearchResults([]);
    setCurrentSearchIndex(-1);

    const results = [];
    const query = searchText.toLowerCase();

    for (let i = 1; i <= numPages; i++) {
      let pageText = pageTextContents[i];
      if (!pageText) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        pageText = content.items.map(item => item.str).join(" ");
        setPageTextContents(prev => ({ ...prev, [i]: pageText }));
      }

      const lowerText = pageText.toLowerCase();
      let startIdx = 0;
      while (true) {
        const idx = lowerText.indexOf(query, startIdx);
        if (idx === -1) break;
        results.push({
          page: i,
          index: idx,
          context: pageText.substring(Math.max(0, idx - 30), idx + query.length + 30)
        });
        startIdx = idx + 1;
      }
    }

    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      goToPage(results[0].page);
    }
    setIsSearching(false);
  }, [searchText, pdfDoc, numPages, pageTextContents]);

  const navigateSearch = useCallback((direction) => {
    if (searchResults.length === 0) return;
    let newIndex;
    if (direction === "next") {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    setCurrentSearchIndex(newIndex);
    goToPage(searchResults[newIndex].page);
  }, [searchResults, currentSearchIndex]);

  // ============================================================
  // Navigation helpers
  // ============================================================
  const goToPage = useCallback((page) => {
    const p = Math.max(1, Math.min(numPages, page));
    setCurrentPage(p);
    setPageInputValue(String(p));
  }, [numPages]);

  const handlePageInputChange = (e) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputSubmit = (e) => {
    if (e.key === "Enter") {
      const val = parseInt(pageInputValue, 10);
      if (!isNaN(val)) goToPage(val);
    }
  };

  const handlePageInputBlur = () => {
    const val = parseInt(pageInputValue, 10);
    if (!isNaN(val)) {
      goToPage(val);
    } else {
      setPageInputValue(String(currentPage));
    }
  };

  // --- Zoom helpers ---
  const zoomIn = () => setScale(s => Math.min(MAX_ZOOM, s + ZOOM_STEP));
  const zoomOut = () => setScale(s => Math.max(MIN_ZOOM, s - ZOOM_STEP));
  const zoomReset = () => setScale(1.0);

  const handleRotate = () => setRotation(r => (r + 90) % 360);

  // ============================================================
  // Keyboard shortcuts
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture if typing in inputs
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          goToPage(currentPage + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          goToPage(currentPage - 1);
          break;
        case "Home":
          e.preventDefault();
          goToPage(1);
          break;
        case "End":
          e.preventDefault();
          goToPage(numPages);
          break;
        case "+":
        case "=":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomReset();
          }
          break;
        case "f":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowSearch(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, numPages, goToPage]);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // ============================================================
  // Scroll wheel zoom
  // ============================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // ============================================================
  // Loading and error states
  // ============================================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <span className="text-sm text-slate-500">Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3">
        <FileText className="w-16 h-16 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">Failed to load PDF</h3>
        <p className="text-sm text-slate-500 max-w-md text-center">{error}</p>
        <Button variant="outline" onClick={() => window.open(fileUrl, "_blank")}>
          Download Instead
        </Button>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      {/* ---- Toolbar ---- */}
      <div className={`flex items-center justify-between px-2 py-1.5 border-b flex-shrink-0 flex-wrap gap-y-1 ${
        isFullscreen ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
      }`}>
        {/* Left: thumbnails toggle + page nav */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isFullscreen ? "text-slate-300 hover:text-white hover:bg-slate-700" : ""}`}
            onClick={() => setShowThumbnails(prev => !prev)}
            title="Toggle page thumbnails"
          >
            {showThumbnails ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>

          <div className="h-5 w-px bg-slate-300 mx-0.5 hidden sm:block" />

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isFullscreen ? "text-slate-300 hover:text-white hover:bg-slate-700" : ""}`}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            <input
              type="text"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputSubmit}
              onBlur={handlePageInputBlur}
              className={`w-10 sm:w-12 text-center text-xs sm:text-sm rounded border px-1 py-0.5 ${
                isFullscreen
                  ? "bg-slate-700 border-slate-600 text-white"
                  : "bg-white border-slate-300 text-slate-900"
              }`}
            />
            <span className={`text-xs sm:text-sm ${isFullscreen ? "text-slate-400" : "text-slate-500"}`}>
              / {numPages}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isFullscreen ? "text-slate-300 hover:text-white hover:bg-slate-700" : ""}`}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Center: zoom controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isFullscreen ? "text-slate-300 hover:text-white hover:bg-slate-700" : ""}`}
            onClick={zoomOut}
            disabled={scale <= MIN_ZOOM}
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <button
            onClick={zoomReset}
            className={`text-xs sm:text-sm font-medium px-2 py-0.5 rounded hover:bg-slate-200 min-w-[3rem] text-center ${
              isFullscreen ? "text-slate-300 hover:bg-slate-700" : "text-slate-700"
            }`}
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isFullscreen ? "text-slate-300 hover:text-white hover:bg-slate-700" : ""}`}
            onClick={zoomIn}
            disabled={scale >= MAX_ZOOM}
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <div className="h-5 w-px bg-slate-300 mx-0.5 hidden sm:block" />

          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isFullscreen ? "text-slate-300 hover:text-white hover:bg-slate-700" : ""}`}
            onClick={handleRotate}
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Right: search toggle */}
        <div className="flex items-center gap-1">
          <Button
            variant={showSearch ? "default" : "ghost"}
            size="icon"
            className={`h-8 w-8 ${
              showSearch
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : isFullscreen
                  ? "text-slate-300 hover:text-white hover:bg-slate-700"
                  : ""
            }`}
            onClick={() => setShowSearch(prev => !prev)}
            title="Search text (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ---- Search bar ---- */}
      {showSearch && (
        <div className={`flex items-center gap-2 px-3 py-2 border-b flex-shrink-0 ${
          isFullscreen ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        }`}>
          <Search className={`w-4 h-4 flex-shrink-0 ${isFullscreen ? "text-slate-400" : "text-slate-400"}`} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.shiftKey ? navigateSearch("prev") : searchText ? performSearch() : null;
              }
              if (e.key === "Escape") setShowSearch(false);
            }}
            placeholder="Search in document..."
            className={`flex-1 text-sm outline-none border-none bg-transparent ${
              isFullscreen ? "text-white placeholder:text-slate-500" : "text-slate-900 placeholder:text-slate-400"
            }`}
          />
          {isSearching && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
          {searchResults.length > 0 && (
            <span className={`text-xs whitespace-nowrap ${isFullscreen ? "text-slate-400" : "text-slate-500"}`}>
              {currentSearchIndex + 1} of {searchResults.length}
            </span>
          )}
          {searchResults.length > 0 && (
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateSearch("prev")}>
                <ChevronUp className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateSearch("next")}>
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setShowSearch(false);
              setSearchText("");
              setSearchResults([]);
              setCurrentSearchIndex(-1);
            }}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* ---- Main content area: thumbnails sidebar + canvas ---- */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Thumbnail sidebar */}
        {showThumbnails && (
          <div className={`w-[120px] sm:w-[150px] flex-shrink-0 overflow-y-auto border-r ${
            isFullscreen ? "bg-slate-850 border-slate-700 bg-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <div className="p-2 space-y-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-full rounded border-2 overflow-hidden transition-all ${
                    pageNum === currentPage
                      ? "border-indigo-500 shadow-md shadow-indigo-200"
                      : isFullscreen
                        ? "border-slate-600 hover:border-slate-500"
                        : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {thumbnails[pageNum] ? (
                    <img
                      src={thumbnails[pageNum]}
                      alt={`Page ${pageNum}`}
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full aspect-[3/4] flex items-center justify-center ${
                      isFullscreen ? "bg-slate-700" : "bg-slate-100"
                    }`}>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  )}
                  <div className={`text-[10px] py-0.5 text-center font-medium ${
                    pageNum === currentPage
                      ? "bg-indigo-50 text-indigo-700"
                      : isFullscreen
                        ? "bg-slate-700 text-slate-400"
                        : "bg-slate-50 text-slate-500"
                  }`}>
                    {pageNum}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas viewer area */}
        <div className={`flex-1 overflow-auto ${
          isFullscreen ? "bg-slate-900" : "bg-slate-100"
        }`}>
          <div className="flex justify-center py-4 px-2 min-h-full">
            <div className="relative inline-block shadow-lg">
              <canvas
                ref={canvasRef}
                className="block"
                style={{ imageRendering: "auto" }}
              />
              {/* Text selection layer */}
              <div
                ref={textLayerRef}
                className="absolute top-0 left-0 overflow-hidden"
                style={{
                  userSelect: "text",
                  cursor: "text",
                  lineHeight: 1,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
