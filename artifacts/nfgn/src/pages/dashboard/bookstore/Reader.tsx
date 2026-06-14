import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Sun, Moon, Minus, Plus, BookOpen, Mic, Loader2, AlertTriangle, ChevronLeft, ChevronRight, ShoppingCart, Library, Volume2, Play, Pause, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";

const GREEN   = "#2D6A4F";
const GREEN_D  = "#1A4032";
const DARK    = "#0a0a0a";
const GOLD    = "#C9A84C";
const SPIN    = `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;

// 3-D page-flip animation (matches Apple Books / shared reference code)
// Forward: right edge folds away at the spine (left centre origin).
// Backward: left edge folds away from the spine (right centre origin).
// epub.js navigation is called at the 50 % point when the page is edge-on
// (invisible due to backface-visibility:hidden) so the new content is
// already loaded before the page "unfolds" back to 0 deg.
const FLIP_CSS = `
@keyframes epubFlipFwd {
  0%   { transform: rotateY(0deg); }
  50%  { box-shadow: -10px 4px 35px rgba(0,0,0,0.55); }
  100% { transform: rotateY(-180deg); }
}
@keyframes epubFlipBwd {
  0%   { transform: rotateY(0deg); }
  50%  { box-shadow:  10px 4px 35px rgba(0,0,0,0.55); }
  100% { transform: rotateY(180deg); }
}
.epub-flip-fwd {
  animation: epubFlipFwd 0.55s cubic-bezier(0.645,0.045,0.355,1.000) forwards;
  transform-origin: left center !important;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
}
.epub-flip-bwd {
  animation: epubFlipBwd 0.55s cubic-bezier(0.645,0.045,0.355,1.000) forwards;
  transform-origin: right center !important;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
}
`;

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("nfgn_token");
  const res = await fetch(path, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

interface Book {
  id: number;
  title: string;
  authorName: string;
  type: string;
  hasFile: boolean;
  hasAudio: boolean;
  hasSample: boolean;
  fileType: "pdf" | "epub" | null;
  coverImage?: string;
  pageCount?: number;
  duration?: string;
  purchased: boolean;
  isFree: boolean;
  price?: number;
}

interface Props { bookId: string }

// ── EPUB viewer — Apple Books-style professional reader ───────────────────────
function EpubViewer({ streamUrl, fontSize, darkMode, bookTitle, readAloud, onReadAloudStop, bookId }: {
  streamUrl: string;
  fontSize: number;
  darkMode: boolean;
  bookTitle: string;
  readAloud: boolean;
  onReadAloudStop: () => void;
  spreadMode?: boolean;
  bookId?: string;
}) {
  // Native 6×9 book page dimensions — epub.js renders at full size so the
  // EPUB's own CSS (flex footers, absolute elements) lays out correctly.
  // We then CSS-scale the result down to fit the viewport.
  const EPUB_PAGE_W = 450;
  const EPUB_PAGE_H = 675;

  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef      = useRef<any>(null);
  const renditionRef = useRef<any>(null);

  // Core state
  const [epubReady,   setEpubReady]   = useState(false);
  const [epubError,   setEpubError]   = useState("");
  const [epubLoading, setEpubLoading] = useState(true);
  const [epubScale,   setEpubScale]   = useState(1);

  // 3-D page-flip
  const [flipClass, setFlipClass] = useState("");
  const [flipping,  setFlipping]  = useState(false);

  // TTS
  const [ttsStatus, setTtsStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [ttsSpeed,  setTtsSpeed]  = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ── Professional reader state ──────────────────────────────────────────────
  const [epubCurrentPage, setEpubCurrentPage] = useState(0);
  const [epubTotalPages,  setEpubTotalPages]  = useState(0);
  const [epubProgress,    setEpubProgress]    = useState(0);
  const [currentChapter,  setCurrentChapter]  = useState("");
  const tocRef        = useRef<any[]>([]);
  const currentCfiRef = useRef("");

  // TOC
  const [toc,     setToc]     = useState<any[]>([]);
  const [showToc, setShowToc] = useState(false);

  // Bookmarks
  const bmKey = bookId ? `nfgn_epub_bm_${bookId}` : null;
  const [bookmarks, setBookmarks] = useState<Array<{ cfi: string; chapter: string; page: number; date: number }>>(() => {
    if (!bmKey) return [];
    try { return JSON.parse(localStorage.getItem(bmKey) || "[]"); } catch { return []; }
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isBookmarked,  setIsBookmarked]  = useState(false);

  // Search
  const [showSearch,    setShowSearch]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ cfi: string; excerpt: string }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Resume
  const cfiKey = bookId ? `nfgn_epub_cfi_${bookId}` : null;
  const [showResume, setShowResume] = useState(false);
  const [resumeCfi,  setResumeCfi]  = useState<string | null>(null);

  // Fullscreen + font
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontFamily,   setFontFamily]   = useState<"serif" | "sans" | "dyslexia">("serif");

  // Touch tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const borderColor = darkMode ? "#333" : "#e5e7eb";
  const bg          = darkMode ? "#1a1a1a" : "#fff";
  const textColor   = darkMode ? "#e5e5e5" : DARK;

  // ── 3-D animated nav ────────────────────────────────────────────────────────
  const FLIP_MS = 550;
  const prev = useCallback(() => {
    if (flipping || !renditionRef.current) return;
    setFlipClass("epub-flip-bwd");
    setFlipping(true);
    setTimeout(() => renditionRef.current?.prev(), FLIP_MS / 2);
    setTimeout(() => { setFlipClass(""); setFlipping(false); }, FLIP_MS);
  }, [flipping]);
  const next = useCallback(() => {
    if (flipping || !renditionRef.current) return;
    setFlipClass("epub-flip-fwd");
    setFlipping(true);
    setTimeout(() => renditionRef.current?.next(), FLIP_MS / 2);
    setTimeout(() => { setFlipClass(""); setFlipping(false); }, FLIP_MS);
  }, [flipping]);

  // ── Init epub.js ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;
    setEpubLoading(true);
    setEpubError("");

    const ePub = (window as any).ePub;
    if (!ePub) {
      setEpubError("EPUB reader not available — please do a hard-refresh (Ctrl/Cmd+Shift+R).");
      setEpubLoading(false);
      return;
    }

    try {
      const epubBook = ePub(streamUrl, { openAs: "epub" });
      bookRef.current = epubBook;

      const nativeW = EPUB_PAGE_W * 2;
      const nativeH = EPUB_PAGE_H;

      const rendition = epubBook.renderTo(containerRef.current!, {
        width: nativeW, height: nativeH,
        spread: "always", flow: "paginated", minSpreadWidth: 0,
      });
      renditionRef.current = rendition;

      // Apply initial scale
      const calcScale = () => {
        const availW = Math.max(300, window.innerWidth  - 40);
        const availH = Math.max(300, window.innerHeight - 240);
        return Math.min(availW / nativeW, availH / nativeH, 1);
      };
      if (!destroyed) setEpubScale(calcScale());
      const onResize = () => { if (!destroyed) setEpubScale(calcScale()); };
      window.addEventListener("resize", onResize);

      rendition.themes.fontSize(`${fontSize}%`);

      // ── Track reading position on every page turn ──
      rendition.on("relocated", (location: any) => {
        if (destroyed) return;
        const page  = location.start.displayed?.page  ?? 0;
        const total = location.start.displayed?.total ?? 0;
        const pct   = (location.start.percentage ?? 0) * 100;
        const cfi   = location.start.cfi ?? "";
        setEpubCurrentPage(page);
        setEpubTotalPages(total);
        setEpubProgress(pct);
        currentCfiRef.current = cfi;
        if (cfiKey && cfi) localStorage.setItem(cfiKey, cfi);
        // Match chapter from TOC
        const rawHref  = location.start.href ?? "";
        const baseHref = rawHref.split("#")[0].split("/").pop() ?? "";
        const findCh = (items: any[]): string => {
          for (const item of items) {
            const h = (item.href ?? "").split("#")[0].split("/").pop() ?? "";
            if (h && baseHref && h === baseHref) return item.label ?? "";
            const found = findCh(item.subitems ?? []);
            if (found) return found;
          }
          return "";
        };
        if (tocRef.current.length) {
          const ch = findCh(tocRef.current);
          if (ch) setCurrentChapter(ch);
        }
      });

      // ── Load TOC ──
      epubBook.loaded.navigation.then((nav: any) => {
        if (destroyed) return;
        const items = nav.toc ?? [];
        setToc(items);
        tocRef.current = items;
      });

      // ── Display + resume ──
      rendition.display()
        .then(() => {
          if (destroyed) return;
          setEpubReady(true);
          setEpubLoading(false);
          if (cfiKey) {
            const saved = localStorage.getItem(cfiKey);
            if (saved) { setResumeCfi(saved); setShowResume(true); }
          }
        })
        .catch((e: any) => {
          if (!destroyed) { setEpubError(e?.message ?? "Could not open this book."); setEpubLoading(false); }
        });

      epubBook.ready.catch((e: any) => {
        if (!destroyed) { setEpubError(e?.message ?? "Book failed to load."); setEpubLoading(false); }
      });

      return () => {
        destroyed = true;
        window.removeEventListener("resize", onResize);
        window.speechSynthesis?.cancel();
        try { epubBook.destroy(); } catch {}
        renditionRef.current = null;
        bookRef.current = null;
      };
    } catch (e: any) {
      setEpubError(e?.message ?? "Failed to open book.");
      setEpubLoading(false);
      return;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamUrl]);

  // ── Combined dark + font theme ──────────────────────────────────────────────
  useEffect(() => {
    const r = renditionRef.current;
    if (!r || !epubReady) return;
    const fontMap: Record<string, string> = {
      serif:    "Georgia, 'Times New Roman', serif",
      sans:     "system-ui, -apple-system, sans-serif",
      dyslexia: "'OpenDyslexic', Arial, sans-serif",
    };
    const rules: Record<string, Record<string, string>> = {
      "html, body, p, div, span, li, td, h1, h2, h3, h4, h5, h6": {
        "font-family": `${fontMap[fontFamily]} !important`,
      },
    };
    if (darkMode) {
      rules["html, body"] = { background: "#1a1a1a !important", color: "#e8e8e8 !important" };
    } else {
      rules["html, body"] = { background: "#ffffff !important", color: "#1a1a1a !important" };
    }
    r.themes.register("active", rules);
    r.themes.select("active");
  }, [darkMode, fontFamily, epubReady]);

  // ── Font size ──
  useEffect(() => {
    if (renditionRef.current && epubReady) renditionRef.current.themes.fontSize(`${fontSize}%`);
  }, [fontSize, epubReady]);

  // ── Keyboard nav ──
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   prev();
      if (e.key === "ArrowRight" || e.key === "ArrowDown")  next();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [prev, next]);

  // ── Fullscreen listener ──
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── Bookmark state sync ──
  useEffect(() => {
    setIsBookmarked(bookmarks.some(b => b.cfi === currentCfiRef.current));
  }, [bookmarks, epubCurrentPage]);

  // ── TTS ──
  useEffect(() => {
    if (!readAloud || !epubReady) return;
    let cancelled = false;
    window.speechSynthesis.cancel();

    function extractAndSpeak() {
      try {
        const contents = renditionRef.current?.getContents?.() ?? [];
        let text = "";
        for (const c of contents) {
          text += (c.document?.body?.innerText ?? c.document?.body?.textContent ?? "") + " ";
        }
        const clean = text.replace(/\s+/g, " ").trim();
        if (!clean || cancelled) { onReadAloudStop(); return; }
        const utter = new SpeechSynthesisUtterance(clean);
        utter.rate     = ttsSpeed;
        utter.onpause  = () => { if (!cancelled) setTtsStatus("paused"); };
        utter.onresume = () => { if (!cancelled) setTtsStatus("playing"); };
        utter.onend    = () => { if (!cancelled) renditionRef.current?.next?.(); };
        utter.onerror  = () => { if (!cancelled) { setTtsStatus("idle"); onReadAloudStop(); } };
        utteranceRef.current = utter;
        window.speechSynthesis.speak(utter);
        if (!cancelled) setTtsStatus("playing");
      } catch { if (!cancelled) { setTtsStatus("idle"); onReadAloudStop(); } }
    }

    extractAndSpeak();
    renditionRef.current?.on?.("rendered", extractAndSpeak);
    return () => {
      cancelled = true;
      window.speechSynthesis.cancel();
      renditionRef.current?.off?.("rendered", extractAndSpeak);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readAloud, epubReady, ttsSpeed]);

  useEffect(() => {
    if (!readAloud) { window.speechSynthesis.cancel(); setTtsStatus("idle"); }
  }, [readAloud]);

  // ── Bookmark toggle ──────────────────────────────────────────────────────────
  const toggleBookmark = useCallback(() => {
    const cfi = currentCfiRef.current;
    if (!cfi || !bmKey) return;
    const idx = bookmarks.findIndex(b => b.cfi === cfi);
    const updated = idx >= 0
      ? bookmarks.filter((_, i) => i !== idx)
      : [...bookmarks, { cfi, chapter: currentChapter, page: epubCurrentPage, date: Date.now() }];
    setBookmarks(updated);
    localStorage.setItem(bmKey, JSON.stringify(updated));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks, currentChapter, epubCurrentPage, bmKey]);

  // ── Search ──────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async () => {
    if (!bookRef.current || !searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const res = await bookRef.current.search(searchQuery.trim());
      setSearchResults((Array.isArray(res) ? res : []).map((r: any) => ({
        cfi: r.cfi ?? "", excerpt: r.excerpt ?? "",
      })));
    } catch {}
    setSearchLoading(false);
  }, [searchQuery]);

  // ── Fullscreen ──────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }, []);

  // ── Touch handlers ──────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: any) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);
  const onTouchEnd = useCallback((e: any) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
  }, [next, prev]);

  // ── Estimated reading time (30 sec/spread ≈ 0.5 min/page) ──────────────────
  const minsLeft = epubTotalPages > 0 && epubCurrentPage > 0
    ? Math.max(1, Math.ceil((epubTotalPages - epubCurrentPage) * 0.5)) : null;

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 500, position: "relative" }}>
      <style>{SPIN}</style>
      <style>{FLIP_CSS}</style>

      {/* ── Secondary EPUB toolbar ── */}
      {epubReady && !epubError && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, padding: "6px 12px", background: darkMode ? "#111" : "#f0f0f0", borderBottom: `1px solid ${borderColor}`, borderRadius: "8px 8px 0 0", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setShowToc(t => !t)} aria-label="Table of contents"
              style={{ display: "flex", alignItems: "center", gap: 4, background: showToc ? GREEN : "none", border: `1px solid ${showToc ? GREEN : borderColor}`, color: showToc ? "#fff" : textColor, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              ☰ Contents
            </button>
            <button onClick={() => { setShowSearch(s => !s); if (showSearch) { setSearchResults([]); setSearchQuery(""); } }} aria-label="Search in book"
              style={{ display: "flex", alignItems: "center", gap: 4, background: showSearch ? GREEN : "none", border: `1px solid ${showSearch ? GREEN : borderColor}`, color: showSearch ? "#fff" : textColor, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              🔍 Search
            </button>
          </div>
          <div style={{ flex: 1, textAlign: "center", minWidth: 0, padding: "0 8px" }}>
            {currentChapter && <div style={{ fontSize: 11, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentChapter}</div>}
            {minsLeft && <div style={{ fontSize: 10, color: "#aaa" }}>~{minsLeft} min left in section</div>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <select value={fontFamily} onChange={e => setFontFamily(e.target.value as any)} aria-label="Font family"
              style={{ border: `1px solid ${borderColor}`, borderRadius: 6, padding: "3px 6px", fontSize: 11, background: darkMode ? "#222" : "#fff", color: textColor, cursor: "pointer" }}>
              <option value="serif">Serif</option>
              <option value="sans">Sans</option>
              <option value="dyslexia">Dyslexia</option>
            </select>
            {bmKey && (
              <button onClick={toggleBookmark} aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this page"}
                style={{ background: isBookmarked ? GOLD : "none", border: `1px solid ${isBookmarked ? GOLD : borderColor}`, color: isBookmarked ? "#fff" : textColor, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {isBookmarked ? "🔖 Saved" : "🔖 Save"}
              </button>
            )}
            {bmKey && (
              <button onClick={() => setShowBookmarks(s => !s)} aria-label="View bookmarks"
                style={{ background: showBookmarks ? GREEN : "none", border: `1px solid ${showBookmarks ? GREEN : borderColor}`, color: showBookmarks ? "#fff" : textColor, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Bookmarks{bookmarks.length > 0 ? ` (${bookmarks.length})` : ""}
              </button>
            )}
            <button onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              style={{ background: "none", border: `1px solid ${borderColor}`, color: textColor, borderRadius: 6, padding: "4px 9px", fontSize: 13, cursor: "pointer" }} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? "⤓" : "⤢"}
            </button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {epubLoading && (
        <div style={{ height: "calc(100vh - 280px)", minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
          <Loader2 size={28} color={GREEN} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: 13, color: "#888" }}>Opening <em>{bookTitle}</em>…</div>
          <div style={{ fontSize: 11, color: "#bbb" }}>This may take a moment on first open</div>
        </div>
      )}

      {/* ── Error ── */}
      {epubError && !epubLoading && (
        <div style={{ height: "calc(100vh - 280px)", minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 32 }}>
          <AlertTriangle size={32} color={GOLD} />
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>Could not display this book</div>
          <div style={{ fontSize: 12, color: "#888", textAlign: "center" }}>{epubError}</div>
        </div>
      )}

      {/* ── Reader area: touch events + tap zones + 3-layer flip/clip/scale ── */}
      <div
        style={{ height: "calc(100vh - 280px)", minHeight: 400, display: "flex", justifyContent: "center", alignItems: "flex-start", overflow: "hidden", visibility: epubLoading || epubError ? "hidden" : "visible", perspective: "2500px", position: "relative" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Tap zones: left 30% = prev, right 30% = next (like Kindle / Apple Books) */}
        {epubReady && (
          <>
            <div onClick={flipping ? undefined : prev} aria-label="Previous page"
              style={{ position: "absolute", left: 0, top: 0, width: "30%", height: "100%", cursor: flipping ? "default" : "pointer", zIndex: 20 }} />
            <div onClick={flipping ? undefined : next} aria-label="Next page"
              style={{ position: "absolute", right: 0, top: 0, width: "30%", height: "100%", cursor: flipping ? "default" : "pointer", zIndex: 20 }} />
          </>
        )}

        {/* FLIP layer — rotateY animation */}
        <div className={flipClass}
          style={{ width: EPUB_PAGE_W * 2 * epubScale, height: EPUB_PAGE_H * epubScale, flexShrink: 0, transformStyle: "preserve-3d", willChange: "transform" }}>
          {/* CLIP layer */}
          <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            {/* SCALE layer — epub.js target at native size, CSS-scaled to fit */}
            <div ref={containerRef}
              style={{ width: EPUB_PAGE_W * 2, height: EPUB_PAGE_H, transform: `scale(${epubScale})`, transformOrigin: "top left" }} />
          </div>
        </div>
      </div>

      {/* ── Page nav + page numbers ── */}
      {epubReady && !epubError && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, padding: "10px 0 4px", flexShrink: 0 }}>
          <button onClick={prev} disabled={flipping} aria-label="Previous page"
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1.5px solid ${GREEN}`, color: GREEN, borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 12, cursor: flipping ? "default" : "pointer", opacity: flipping ? 0.4 : 1 }}>
            <ChevronLeft size={13} /> Prev
          </button>
          <div style={{ textAlign: "center" }}>
            {epubCurrentPage > 0 && (
              <div style={{ fontSize: 12, color: textColor, fontWeight: 600 }}>
                Page {epubCurrentPage}{epubTotalPages > 0 ? ` of ${epubTotalPages}` : ""}
              </div>
            )}
            <div style={{ fontSize: 10, color: "#aaa" }}>← → keys · tap edges to turn</div>
          </div>
          <button onClick={next} disabled={flipping} aria-label="Next page"
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: `1.5px solid ${GREEN}`, color: GREEN, borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 12, cursor: flipping ? "default" : "pointer", opacity: flipping ? 0.4 : 1 }}>
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* ── Progress bar ── */}
      {epubReady && !epubError && (
        <div style={{ height: 4, background: borderColor, borderRadius: 2, flexShrink: 0 }}>
          <div style={{ height: "100%", width: `${Math.min(100, epubProgress)}%`, background: GOLD, borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>
      )}

      {/* ── Read Aloud bar ── */}
      {readAloud && ttsStatus !== "idle" && (
        <ReadAloudBar
          status={ttsStatus as "playing" | "paused"} speed={ttsSpeed}
          darkMode={darkMode} borderColor={borderColor}
          onPause={() => window.speechSynthesis.pause()}
          onResume={() => window.speechSynthesis.resume()}
          onStop={() => { window.speechSynthesis.cancel(); setTtsStatus("idle"); onReadAloudStop(); }}
          onSpeedChange={(s) => { setTtsSpeed(s); window.speechSynthesis.cancel(); }}
        />
      )}

      {/* ══════════════════════ OVERLAYS ══════════════════════ */}

      {/* ── TOC sidebar (slides in from left) ── */}
      {showToc && (
        <>
          <div onClick={() => setShowToc(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400 }} />
          <div style={{ position: "fixed", left: 0, top: 0, height: "100vh", width: 300, maxWidth: "85vw", background: bg, zIndex: 401, display: "flex", flexDirection: "column", boxShadow: "4px 0 28px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: textColor }}>📑 Contents</span>
              <button onClick={() => setShowToc(false)} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: textColor, fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
              {toc.length === 0 && <div style={{ padding: 20, fontSize: 12, color: "#888", textAlign: "center" }}>Loading contents…</div>}
              {toc.map((item: any, i: number) => (
                <div key={i}>
                  <button onClick={() => { renditionRef.current?.display(item.href); setShowToc(false); }}
                    style={{ display: "block", width: "100%", textAlign: "left", background: item.label === currentChapter ? `${GREEN}18` : "none", border: "none", borderLeft: item.label === currentChapter ? `3px solid ${GREEN}` : "3px solid transparent", padding: "10px 20px", cursor: "pointer", color: item.label === currentChapter ? GREEN : textColor, fontWeight: item.label === currentChapter ? 700 : 400, fontSize: 13 }}>
                    {item.label}
                  </button>
                  {(item.subitems ?? []).map((sub: any, j: number) => (
                    <button key={j} onClick={() => { renditionRef.current?.display(sub.href); setShowToc(false); }}
                      style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderLeft: "3px solid transparent", padding: "7px 20px 7px 36px", cursor: "pointer", color: sub.label === currentChapter ? GREEN : "#888", fontSize: 12 }}>
                      {sub.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Bookmarks panel (slides in from right) ── */}
      {showBookmarks && (
        <>
          <div onClick={() => setShowBookmarks(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 400 }} />
          <div style={{ position: "fixed", right: 0, top: 0, height: "100vh", width: 300, maxWidth: "85vw", background: bg, zIndex: 401, display: "flex", flexDirection: "column", boxShadow: "-4px 0 28px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: textColor }}>🔖 Bookmarks</span>
              <button onClick={() => setShowBookmarks(false)} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: textColor, fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 20px" }}>
              {bookmarks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#888", fontSize: 12, lineHeight: 2 }}>
                  No bookmarks yet.<br />Tap <strong>🔖 Save</strong> while reading<br />to save your place.
                </div>
              ) : [...bookmarks].reverse().map((bm, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${borderColor}` }}>
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => { renditionRef.current?.display(bm.cfi); setShowBookmarks(false); }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{bm.chapter || "Saved page"}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Page {bm.page} · {new Date(bm.date).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => {
                    const updated = bookmarks.filter(b => b.cfi !== bm.cfi);
                    setBookmarks(updated);
                    if (bmKey) localStorage.setItem(bmKey, JSON.stringify(updated));
                  }} aria-label="Delete bookmark"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Search panel (dropdown from top) ── */}
      {showSearch && (
        <>
          <div onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(""); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 400 }} />
          <div style={{ position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)", width: 440, maxWidth: "92vw", background: bg, border: `1px solid ${borderColor}`, borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.25)", zIndex: 401, display: "flex", flexDirection: "column", maxHeight: "60vh" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && doSearch()} placeholder="Search in book…" aria-label="Search"
                  style={{ flex: 1, border: `1px solid ${borderColor}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, background: darkMode ? "#222" : "#f9f9f9", color: textColor, outline: "none" }} />
                <button onClick={doSearch}
                  style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Go</button>
                <button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(""); }} aria-label="Close search"
                  style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: textColor, fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
              {searchLoading && <div style={{ textAlign: "center", padding: 20, color: "#888", fontSize: 13 }}>Searching…</div>}
              {!searchLoading && searchQuery && searchResults.length === 0 && (
                <div style={{ textAlign: "center", padding: 20, color: "#888", fontSize: 13 }}>No results for &ldquo;<em>{searchQuery}</em>&rdquo;</div>
              )}
              {searchResults.map((r, i) => (
                <div key={i} onClick={() => { renditionRef.current?.display(r.cfi); setShowSearch(false); }}
                  style={{ padding: "10px 16px", borderBottom: `1px solid ${borderColor}`, cursor: "pointer", fontSize: 12, color: textColor, lineHeight: 1.6 }}>
                  {r.excerpt}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Resume toast ── */}
      {showResume && resumeCfi && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: bg, border: `2px solid ${GREEN}`, borderRadius: 14, padding: "14px 22px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 36px rgba(45,106,79,0.3)", zIndex: 500, maxWidth: "90vw", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: textColor, fontWeight: 600 }}>📖 Resume where you left off?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { renditionRef.current?.display(resumeCfi); setShowResume(false); }}
              style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>Resume</button>
            <button onClick={() => setShowResume(false)}
              style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 8, padding: "7px 14px", cursor: "pointer", color: textColor, fontSize: 12 }}>Start fresh</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Read-Aloud floating control bar ───────────────────────────────────────────
function ReadAloudBar({ status, speed, onPause, onResume, onStop, onSpeedChange, darkMode, borderColor }: {
  status: "playing" | "paused";
  speed: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSpeedChange: (s: number) => void;
  darkMode: boolean;
  borderColor: string;
}) {
  const bg  = darkMode ? "#1e1e1e" : "#fff";
  const txt = darkMode ? "#e5e5e5" : "#0a0a0a";
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: bg, border: `2px solid ${GREEN}`, borderRadius: 16,
      padding: "10px 18px", display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 8px 36px rgba(45,106,79,0.25)", zIndex: 300,
      flexWrap: "wrap", justifyContent: "center", maxWidth: "90vw",
    }}>
      <Volume2 size={16} color={GREEN} />
      <span style={{ fontSize: 12, fontWeight: 800, color: GREEN, marginRight: 4 }}>
        {status === "playing" ? "Reading…" : "Paused"}
      </span>
      <div style={{ width: 1, height: 22, background: borderColor }} />
      <button
        onClick={status === "playing" ? onPause : onResume}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 13px", borderRadius: 8, border: `1.5px solid ${GREEN}`, background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
      >
        {status === "playing" ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
      </button>
      <button
        onClick={onStop}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 13px", borderRadius: 8, border: `1.5px solid #ccc`, background: "transparent", color: txt, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
      >
        <Square size={12} /> Stop
      </button>
      <div style={{ width: 1, height: 22, background: borderColor }} />
      <span style={{ fontSize: 11, color: "#888" }}>Speed:</span>
      {[0.75, 1, 1.25, 1.5, 2].map(s => (
        <button key={s} onClick={() => onSpeedChange(s)} style={{ padding: "3px 9px", borderRadius: 12, border: `1.5px solid ${speed === s ? GREEN : borderColor}`, background: speed === s ? GREEN : "transparent", color: speed === s ? "#fff" : txt, fontWeight: 800, fontSize: 11, cursor: "pointer" }}>{s}x</button>
      ))}
    </div>
  );
}

// ── Watermark overlay ──────────────────────────────────────────────────────────
function WatermarkOverlay({ text }: { text: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", zIndex: 2 }}>
      <div style={{ transform: "rotate(-35deg)", opacity: 0.045, fontSize: 14, fontWeight: 900, color: DARK, userSelect: "none", whiteSpace: "nowrap", width: "250%", textAlign: "center", lineHeight: 3.5 }}>
        {Array.from({ length: 12 }).map((_, i) => <div key={i}>{text} — NFGN Licensed</div>)}
      </div>
    </div>
  );
}

// ── PDF viewer — two-page spread + single page mode ────────────────────────────
function PdfViewer({ streamUrl, darkMode, currentPage, onPageChange, onTotalPages, watermarkText, readAloud, onReadAloudStop, spreadMode }: {
  streamUrl: string;
  darkMode: boolean;
  currentPage: number;
  onPageChange: (n: number) => void;
  onTotalPages: (n: number) => void;
  watermarkText: string;
  readAloud: boolean;
  onReadAloudStop: () => void;
  spreadMode: boolean;
}) {
  const leftCanvasRef  = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef      = useRef<any>(null);
  const leftTaskRef    = useRef<any>(null);
  const rightTaskRef   = useRef<any>(null);
  const [totalPages,    setTotalPages]    = useState(0);
  const [pdfError,      setPdfError]      = useState("");
  const [pdfLoading,    setPdfLoading]    = useState(true);
  const [pdfLoaded,     setPdfLoaded]     = useState(false);
  const [pageRendering, setPageRendering] = useState(false);

  // ── TTS state ──
  const [ttsStatus, setTtsStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [ttsSpeed,  setTtsSpeed]  = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const borderColor = darkMode ? "#333" : "#e5e7eb";
  const textColor   = darkMode ? "#e5e5e5" : "#0a0a0a";
  const pageBg      = darkMode ? "#1c1c1c" : "#ffffff";
  const shadowColor = darkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.18)";

  /* ── Load PDF ── */
  useEffect(() => {
    let cancelled = false;
    setPdfLoading(true);
    setPdfLoaded(false);
    setPdfError("");

    (async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error("PDF renderer not available — please hard-refresh.");
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const pdf = await pdfjsLib.getDocument({ url: streamUrl }).promise;
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        onTotalPages(pdf.numPages);
        setPdfLoading(false);
        setPdfLoaded(true);
      } catch (e: any) {
        if (!cancelled) { setPdfError(e?.message ?? "Failed to load PDF."); setPdfLoading(false); }
      }
    })();

    return () => {
      cancelled = true;
      leftTaskRef.current?.cancel?.();
      rightTaskRef.current?.cancel?.();
      pdfDocRef.current?.destroy?.();
      pdfDocRef.current = null;
    };
  }, [streamUrl]);

  /* ── Render pages ── */
  useEffect(() => {
    if (!pdfLoaded || !pdfDocRef.current) return;
    let cancelled = false;
    leftTaskRef.current?.cancel?.();
    rightTaskRef.current?.cancel?.();
    setPageRendering(true);

    const pdf = pdfDocRef.current;

    async function renderToCanvas(canvas: HTMLCanvasElement, pageNum: number) {
      const pg   = await pdf.getPage(Math.max(1, Math.min(pageNum, pdf.numPages)));
      if (cancelled) return null;
      const ctx  = canvas.getContext("2d")!;
      const dpr  = window.devicePixelRatio || 1;
      const cssW = canvas.parentElement?.clientWidth || (spreadMode ? 400 : 800);
      const base = pg.getViewport({ scale: 1 });
      // Compute the scale that fills the CSS width, then multiply by DPR
      // so the canvas pixel buffer is crisp on high-DPI screens.
      const cssScale = cssW / base.width;
      const renderScale = cssScale * dpr;
      const vp   = pg.getViewport({ scale: renderScale });
      canvas.width  = vp.width;         // physical pixels
      canvas.height = vp.height;
      canvas.style.width  = `${cssW}px`;               // CSS (logical) size
      canvas.style.height = `${base.height * cssScale}px`;
      const task = pg.render({ canvasContext: ctx, viewport: vp });
      return task;
    }

    (async () => {
      try {
        if (spreadMode) {
          const lc = leftCanvasRef.current;
          const rc = rightCanvasRef.current;
          if (!lc) return;
          const lTask = await renderToCanvas(lc, currentPage);
          if (cancelled) return;
          leftTaskRef.current = lTask;
          if (lTask) await lTask.promise;
          if (cancelled) return;
          const hasRight = currentPage + 1 <= totalPages;
          if (rc && hasRight) {
            const rTask = await renderToCanvas(rc, currentPage + 1);
            if (cancelled) return;
            rightTaskRef.current = rTask;
            if (rTask) await rTask.promise;
          } else if (rc) {
            const ctx = rc.getContext("2d")!;
            rc.width  = lc.width;
            rc.height = lc.height;
            ctx.fillStyle = darkMode ? "#1a1a1a" : "#f7f5f0";
            ctx.fillRect(0, 0, rc.width, rc.height);
          }
        } else {
          const lc = leftCanvasRef.current;
          if (!lc) return;
          const task = await renderToCanvas(lc, currentPage);
          if (cancelled) return;
          leftTaskRef.current = task;
          if (task) await task.promise;
        }
        if (!cancelled) setPageRendering(false);
      } catch (e: any) {
        if (!cancelled && e?.name !== "RenderingCancelledException") {
          setPdfError(e?.message ?? "Could not render page.");
          setPageRendering(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [pdfLoaded, currentPage, darkMode, spreadMode, totalPages]);

  /* ── TTS: speak current page(s) whenever readAloud is on ── */
  useEffect(() => {
    if (!readAloud || !pdfLoaded || !pdfDocRef.current) return;
    let cancelled = false;
    window.speechSynthesis.cancel();
    setTtsStatus("playing");

    const pdf = pdfDocRef.current;
    const pagesToRead = spreadMode
      ? [currentPage, currentPage + 1].filter(p => p <= totalPages)
      : [currentPage];

    (async () => {
      let fullText = "";
      for (const pn of pagesToRead) {
        try {
          const pg = await pdf.getPage(pn);
          const content = await pg.getTextContent();
          const items = content.items as Array<{ str: string; hasEOL?: boolean }>;
          let prev: any = null;
          for (const item of items) {
            // insert space between words not already separated
            if (prev && item.str && !prev.str.endsWith(" ") && !item.str.startsWith(" ")) {
              fullText += " ";
            }
            fullText += item.str;
            if (item.hasEOL) fullText += " ";
            prev = item;
          }
          fullText += "  ";
        } catch { /* skip unreadable pages */ }
      }

      if (cancelled) return;
      const clean = fullText.replace(/\s+/g, " ").trim();
      if (!clean) { onReadAloudStop(); return; }

      const utter = new SpeechSynthesisUtterance(clean);
      utter.rate = ttsSpeed;
      utter.onpause  = () => { if (!cancelled) setTtsStatus("paused"); };
      utter.onresume = () => { if (!cancelled) setTtsStatus("playing"); };
      utter.onend    = () => {
        if (cancelled) return;
        const step = spreadMode ? 2 : 1;
        if (currentPage + step <= totalPages) {
          onPageChange(currentPage + step);
        } else {
          setTtsStatus("idle");
          onReadAloudStop();
        }
      };
      utter.onerror  = () => { if (!cancelled) { setTtsStatus("idle"); onReadAloudStop(); } };
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    })();

    return () => {
      cancelled = true;
      window.speechSynthesis.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readAloud, pdfLoaded, currentPage, ttsSpeed]);

  /* ── Stop TTS when readAloud is toggled off ── */
  useEffect(() => {
    if (!readAloud) {
      window.speechSynthesis.cancel();
      setTtsStatus("idle");
    }
  }, [readAloud]);

  /* ── Navigation ── */
  const step     = spreadMode ? 2 : 1;
  const canPrev  = currentPage > 1;
  const canNext  = currentPage + step - 1 < totalPages;
  const handlePrev = () => onPageChange(Math.max(1, currentPage - step));
  const handleNext = () => onPageChange(Math.min(totalPages, currentPage + step));

  const rightPageNum = currentPage + 1;
  const hasRightPage = spreadMode && rightPageNum <= totalPages;
  const pageLabel    = spreadMode && hasRightPage
    ? `Pages ${currentPage}–${rightPageNum} of ${totalPages}`
    : `Page ${currentPage}${totalPages > 0 ? ` of ${totalPages}` : ""}`;

  if (pdfLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 10, flexDirection: "column" }}>
      <style>{SPIN}</style>
      <Loader2 size={28} color={GREEN} style={{ animation: "spin 1s linear infinite" }} />
      <span style={{ fontSize: 13, color: "#888" }}>Loading PDF…</span>
    </div>
  );
  if (pdfError) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, flexDirection: "column", gap: 10 }}>
      <AlertTriangle size={28} color={GOLD} />
      <div style={{ fontSize: 13, color: "#888", textAlign: "center", maxWidth: 320 }}>{pdfError}</div>
    </div>
  );

  return (
    <div>
      <style>{SPIN}</style>

      {/* ── Book spread ── */}
      {spreadMode ? (
        <div style={{ position: "relative", display: "flex", boxShadow: `0 12px 48px ${shadowColor}`, borderRadius: 6 }}>
          {pageRendering && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, background: darkMode ? "rgba(20,20,20,0.55)" : "rgba(255,255,255,0.55)", borderRadius: 6 }}>
              <Loader2 size={24} color={GREEN} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          {/* Left page */}
          <div style={{ flex: 1, position: "relative", background: pageBg, borderRadius: "6px 0 0 6px", overflow: "hidden", boxShadow: "inset -3px 0 10px rgba(0,0,0,0.08)" }}>
            <canvas ref={leftCanvasRef} style={{ display: "block", filter: darkMode ? "invert(1) hue-rotate(180deg)" : "none" }} />
            {watermarkText && <WatermarkOverlay text={watermarkText} />}
          </div>
          {/* Spine shadow */}
          <div style={{ width: 8, flexShrink: 0, background: darkMode ? "linear-gradient(to right, rgba(0,0,0,0.35), rgba(0,0,0,0.06))" : "linear-gradient(to right, rgba(0,0,0,0.12), rgba(0,0,0,0.03))", zIndex: 3 }} />
          {/* Right page */}
          <div style={{ flex: 1, position: "relative", background: pageBg, borderRadius: "0 6px 6px 0", overflow: "hidden", boxShadow: "inset 3px 0 10px rgba(0,0,0,0.08)" }}>
            <canvas ref={rightCanvasRef} style={{ display: "block", filter: darkMode ? "invert(1) hue-rotate(180deg)" : "none" }} />
            {watermarkText && hasRightPage && <WatermarkOverlay text={watermarkText} />}
          </div>
        </div>
      ) : (
        /* ── Single page ── */
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", boxShadow: `0 6px 28px ${shadowColor}`, background: pageBg }}>
          {pageRendering && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, background: darkMode ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.6)" }}>
              <Loader2 size={22} color={GREEN} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          <canvas ref={leftCanvasRef} style={{ display: "block", filter: darkMode ? "invert(1) hue-rotate(180deg)" : "none" }} />
          {watermarkText && <WatermarkOverlay text={watermarkText} />}
        </div>
      )}

      {/* ── Navigation ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20, padding: "10px 0" }}>
        <button onClick={handlePrev} disabled={!canPrev} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${borderColor}`, background: "none", cursor: canPrev ? "pointer" : "not-allowed", color: textColor, fontWeight: 700, opacity: canPrev ? 1 : 0.35 }}>← Prev</button>
        <span style={{ fontSize: 12, color: "#888", minWidth: 160, textAlign: "center" }}>{pageLabel}</span>
        <button onClick={handleNext} disabled={!canNext} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${borderColor}`, background: "none", cursor: canNext ? "pointer" : "not-allowed", color: textColor, fontWeight: 700, opacity: canNext ? 1 : 0.35 }}>Next →</button>
      </div>

      {/* ── Progress bar ── */}
      {totalPages > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{ width: "min(400px, 100%)", height: 4, background: borderColor, borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${Math.min(100, (currentPage / totalPages) * 100)}%`, background: GREEN, borderRadius: 2, transition: "width .3s" }} />
          </div>
        </div>
      )}

      {/* ── Read Aloud floating bar ── */}
      {readAloud && ttsStatus !== "idle" && (
        <ReadAloudBar
          status={ttsStatus as "playing" | "paused"}
          speed={ttsSpeed}
          darkMode={darkMode}
          borderColor={borderColor}
          onPause={() => window.speechSynthesis.pause()}
          onResume={() => window.speechSynthesis.resume()}
          onStop={() => { window.speechSynthesis.cancel(); setTtsStatus("idle"); onReadAloudStop(); }}
          onSpeedChange={(s) => {
            setTtsSpeed(s);
            // Restart at new speed — effect dependency on ttsSpeed handles it
            window.speechSynthesis.cancel();
          }}
        />
      )}
    </div>
  );
}

// ── Main Reader page ───────────────────────────────────────────────────────────
export function ReaderPage({ bookId }: Props) {
  const { data: me } = useGetMe();
  const [book, setBook]       = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [darkMode, setDarkMode]   = useState(false);
  const [fontSize, setFontSize]   = useState(100); // percentage; 100 = book's own CSS default
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(0);
  const [audioSpeed, setAudioSpeed]   = useState(1);
  const [readAloud,  setReadAloud]    = useState(false);
  const [spreadMode, setSpreadMode]  = useState(() => window.innerWidth >= 700);
  const audioRef = useRef<HTMLAudioElement>(null);

  const id       = parseInt(bookId);
  const isSample = new URLSearchParams(window.location.search).get("sample") === "true";

  useEffect(() => {
    apiFetch(`/api/bookstore/books/${id}`)
      .then(async (d) => {
        const b: Book = d.book;
        if (!isSample && !b.purchased && !b.isFree) {
          setError("You haven't purchased this book yet. Head to the bookstore to get it.");
          return;
        }
        setBook(b);
        if (!isSample) {
          try {
            const prog = await apiFetch(`/api/bookstore/reading-progress/${id}`);
            if (prog?.progress) {
              setCurrentPage(prog.progress.currentPage ?? 1);
              if (prog.progress.totalPages) setTotalPages(prog.progress.totalPages);
            }
          } catch {}
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isSample]);

  // Debounced progress save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handlePageChange(newPage: number) {
    setCurrentPage(newPage);
    if (isSample || !book) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await apiFetch(`/api/bookstore/reading-progress/${id}`, {
          method: "POST",
          body: JSON.stringify({ currentPage: newPage, totalPages }),
        });
      } catch {}
    }, 800);
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = audioSpeed;
  }, [audioSpeed]);

  const bg          = darkMode ? "#1a1a1a" : "#fff";
  const textColor   = darkMode ? "#e5e5e5" : DARK;
  const headerBg    = darkMode ? "#0a0a0a" : "#f9fafb";
  const borderColor = darkMode ? "#333" : "#e5e7eb";

  const token        = encodeURIComponent(localStorage.getItem("nfgn_token") ?? "");
  const streamBase   = `/api/bookstore/books/${id}/stream?token=${token}`;
  const fileStreamUrl = isSample ? `${streamBase}&sample=true` : `${streamBase}&type=file`;

  const watermarkText = me
    ? `${me.firstName} ${me.lastName} · ${me.email}`
    : "NFGN Licensed Content";

  const libraryHref  = isSample ? "/dashboard/bookstore" : "/dashboard/library";
  const libraryLabel = isSample ? "NFGN Books" : "My Library";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <style>{SPIN}</style>
      <div style={{ textAlign: "center" }}>
        <Loader2 size={32} color={GREEN} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: "#666" }}>Opening your book…</div>
      </div>
    </div>
  );

  if (error || !book) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <AlertTriangle size={36} color={GOLD} style={{ margin: "0 auto 14px", display: "block" }} />
        <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 8 }}>Book Unavailable</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>{error || "Book not found."}</div>
        <a href="/dashboard/library">
          <Button style={{ background: GREEN, color: "#fff", fontWeight: 700 }}>
            <Library size={14} style={{ marginRight: 6 }} /> Back to Library
          </Button>
        </a>
      </div>
    </div>
  );

  const isAudio = book.type === "audiobook";
  // Trust the server's magic-byte-detected fileType; fall back to epub if unknown
  const isEpub  = book.fileType !== "pdf";

  return (
    <div style={{ minHeight: "100vh", background: bg, transition: "background .2s" }}>

      {/* ── Sticky header ── */}
      <div style={{ background: headerBg, borderBottom: `1px solid ${borderColor}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href={libraryHref} style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", textDecoration: "none", fontWeight: 700, fontSize: 13, background: GREEN, borderRadius: 8, padding: "6px 14px" }}>
            <ArrowLeft size={14} /> {libraryLabel}
          </a>
          <div style={{ width: 1, height: 24, background: borderColor }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: textColor, lineHeight: 1.2 }}>{book.title}</div>
            <div style={{ fontSize: 11, color: "#888" }}>by {book.authorName}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isAudio && (
            <>
              <button onClick={() => setFontSize(s => Math.max(70, s - 10))} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: textColor }}><Minus size={12} /></button>
              <span style={{ fontSize: 12, color: textColor, fontWeight: 600, minWidth: 36, textAlign: "center" }}>{fontSize}%</span>
              <button onClick={() => setFontSize(s => Math.min(150, s + 10))} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: textColor }}><Plus size={12} /></button>
            </>
          )}
          {!isAudio && !isEpub && (
            <button
              onClick={() => setSpreadMode(s => !s)}
              style={{ display: "flex", alignItems: "center", gap: 5, background: spreadMode ? GREEN : "none", border: `1px solid ${spreadMode ? GREEN : borderColor}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: spreadMode ? "#fff" : textColor, fontSize: 12, fontWeight: 700 }}
            >
              <BookOpen size={14} /> {spreadMode ? "2 Pages" : "1 Page"}
            </button>
          )}
          {/* EPUB always renders 2-page spread (like Apple Books) — show passive indicator */}
          {!isAudio && isEpub && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, background: GREEN, border: `1px solid ${GREEN}`, borderRadius: 6, padding: "6px 10px", color: "#fff", fontSize: 12, fontWeight: 700 }}>
              <BookOpen size={14} /> 2 Pages
            </span>
          )}
          {!isAudio && (
            <button
              onClick={() => setReadAloud(r => !r)}
              style={{ display: "flex", alignItems: "center", gap: 5, background: readAloud ? GREEN : "none", border: `1px solid ${readAloud ? GREEN : borderColor}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: readAloud ? "#fff" : textColor, fontSize: 12, fontWeight: 700 }}
            >
              <Volume2 size={14} /> {readAloud ? "Stop" : "Read Aloud"}
            </button>
          )}
          <button onClick={() => setDarkMode(d => !d)} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: textColor, fontSize: 12, fontWeight: 700 }}>
            {darkMode ? <Sun size={14} /> : <Moon size={14} />} {darkMode ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      {/* Sample banner */}
      {isSample && (
        <div style={{ background: `${GOLD}18`, borderBottom: `2px solid ${GOLD}66`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7A6010" }}>📖 Sample Preview of <em>{book.title}</em> — Purchase to read the full book</div>
          <a href="/dashboard/bookstore" style={{ textDecoration: "none" }}>
            <button style={{ background: GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingCart size={13} /> Buy Full Book
            </button>
          </a>
        </div>
      )}

      {/* License ribbon */}
      {!isSample && (
        <div style={{ background: `${GREEN}0A`, borderBottom: `1px solid ${GREEN}22`, padding: "5px 20px", textAlign: "center", fontSize: 10, color: "#aaa", fontStyle: "italic", userSelect: "none" }}>
          🔒 Licensed to: {watermarkText} · NFGN Digital License · Unauthorized distribution prohibited
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ maxWidth: isAudio ? 700 : 900, margin: "0 auto", padding: "28px 24px", position: "relative" }}>

        {isAudio && book.hasAudio ? (
          <div>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              {book.coverImage ? (
                <img src={book.coverImage} alt={book.title} style={{ width: 200, height: 200, objectFit: "cover", borderRadius: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.2)", margin: "0 auto 20px" }} />
              ) : (
                <div style={{ width: 200, height: 200, background: `linear-gradient(135deg, ${GREEN}, ${GREEN_D})`, borderRadius: 16, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Mic size={60} color="rgba(255,255,255,0.6)" />
                </div>
              )}
              <div style={{ fontSize: 22, fontWeight: 900, color: textColor, fontFamily: "Georgia, serif", marginBottom: 4 }}>{book.title}</div>
              <div style={{ fontSize: 14, color: "#888" }}>by {book.authorName}</div>
              {book.duration && <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Duration: {book.duration}</div>}
            </div>
            <div style={{ background: darkMode ? "#222" : "#f3f4f6", borderRadius: 14, padding: "24px 28px" }}>
              <audio ref={audioRef} controls src={`${streamBase}&type=audio`} style={{ width: "100%", marginBottom: 16 }} onContextMenu={e => e.preventDefault()} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Speed:</span>
                {[0.75, 1, 1.25, 1.5, 2].map(s => (
                  <button key={s} onClick={() => setAudioSpeed(s)} style={{ padding: "4px 10px", borderRadius: 16, border: `1.5px solid ${audioSpeed === s ? GREEN : borderColor}`, background: audioSpeed === s ? GREEN : "transparent", color: audioSpeed === s ? "#fff" : textColor, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>{s}x</button>
                ))}
              </div>
            </div>
          </div>

        ) : book.hasFile || (isSample && book.hasSample) ? (
          <>
            {/* Book cover + title card above the content */}
            {book.coverImage && (
              <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, padding: "20px 24px", background: darkMode ? "#111" : "#f8f8f8", borderRadius: 16, border: `1px solid ${borderColor}` }}>
                <img
                  src={book.coverImage}
                  alt={book.title}
                  style={{ width: 90, height: 120, objectFit: "cover", borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.2)", flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: textColor, fontFamily: "Georgia, serif", marginBottom: 4 }}>{book.title}</div>
                  <div style={{ fontSize: 13, color: "#888" }}>by {book.authorName}</div>
                  {book.pageCount && <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>{book.pageCount} pages</div>}
                </div>
              </div>
            )}
            {isEpub ? (
              <EpubViewer
                streamUrl={fileStreamUrl}
                fontSize={fontSize}
                darkMode={darkMode}
                bookTitle={book.title}
                readAloud={readAloud}
                onReadAloudStop={() => setReadAloud(false)}
                spreadMode={spreadMode}
                bookId={bookId}
              />
            ) : (
              <PdfViewer
                streamUrl={fileStreamUrl}
                darkMode={darkMode}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onTotalPages={setTotalPages}
                watermarkText={isSample ? "" : watermarkText}
                readAloud={readAloud}
                onReadAloudStop={() => setReadAloud(false)}
                spreadMode={spreadMode}
              />
            )}
          </>

        ) : (
          <div style={{ textAlign: "center", padding: "60px 32px" }}>
            <BookOpen size={48} color="#ddd" style={{ margin: "0 auto 16px", display: "block" }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: textColor, marginBottom: 8 }}>{book.title}</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              The content for this book is being prepared and will be available soon.
            </div>
          </div>
        )}
      </div>

      {/* ── Floating "Back to Library" button ── */}
      <div style={{ display: "flex", justifyContent: "center", padding: "24px 24px 40px" }}>
        <a href={libraryHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: GREEN, color: "#fff", textDecoration: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 16px rgba(45,106,79,0.35)" }}>
          <Library size={16} /> Return to {libraryLabel}
        </a>
      </div>

    </div>
  );
}
