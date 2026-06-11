import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Sun, Moon, Minus, Plus, BookOpen, Mic, Loader2, AlertTriangle, ChevronLeft, ChevronRight, ShoppingCart, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";

const GREEN   = "#2D6A4F";
const GREEN_D  = "#1A4032";
const DARK    = "#0a0a0a";
const GOLD    = "#C9A84C";
const SPIN    = `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`;

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

// ── EPUB viewer — passes URL directly to epub.js (no pre-download) ────────────
function EpubViewer({ streamUrl, fontSize, darkMode, bookTitle }: {
  streamUrl: string;
  fontSize: number;
  darkMode: boolean;
  bookTitle: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef      = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const [epubReady,   setEpubReady]   = useState(false);
  const [epubError,   setEpubError]   = useState("");
  const [epubLoading, setEpubLoading] = useState(true);

  const prev = useCallback(() => renditionRef.current?.prev(), []);
  const next = useCallback(() => renditionRef.current?.next(), []);

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
      // Pass the stream URL directly — epub.js fetches it internally.
      // openAs:"epub" is required because our URL has no .epub extension;
      // without it epub.js treats the URL as a directory base and tries to
      // fetch META-INF/container.xml from it (resulting in 404s).
      // The server sends application/octet-stream so iOS Safari won't intercept it.
      const epubBook = ePub(streamUrl, { openAs: "epub" });
      bookRef.current = epubBook;

      const epubHeight = Math.max(500, window.innerHeight - 220);
      const rendition = epubBook.renderTo(containerRef.current!, {
        width: "100%",
        height: epubHeight,
        spread: "none",
        flow: "paginated",
      });
      renditionRef.current = rendition;

      rendition.themes.fontSize(`${fontSize}px`);
      if (darkMode) {
        rendition.themes.register("dark", { body: { background: "#1a1a1a !important", color: "#e5e5e5 !important" } });
        rendition.themes.select("dark");
      } else {
        rendition.themes.register("light", { body: { background: "#ffffff !important", color: "#1a1a1a !important" } });
        rendition.themes.select("light");
      }

      rendition.display()
        .then(() => { if (!destroyed) { setEpubReady(true); setEpubLoading(false); } })
        .catch((e: any) => { if (!destroyed) { setEpubError(e?.message ?? "Could not open this book."); setEpubLoading(false); } });

      epubBook.ready.catch((e: any) => {
        if (!destroyed) { setEpubError(e?.message ?? "Book failed to load."); setEpubLoading(false); }
      });
    } catch (e: any) {
      setEpubError(e?.message ?? "Failed to open book.");
      setEpubLoading(false);
    }

    return () => {
      destroyed = true;
      bookRef.current?.destroy?.();
    };
  }, [streamUrl]);

  useEffect(() => {
    if (!renditionRef.current || !epubReady) return;
    renditionRef.current.themes.fontSize(`${fontSize}px`);
  }, [fontSize, epubReady]);

  useEffect(() => {
    if (!renditionRef.current || !epubReady) return;
    if (darkMode) {
      renditionRef.current.themes.register("dark", { body: { background: "#1a1a1a !important", color: "#e5e5e5 !important" } });
      renditionRef.current.themes.select("dark");
    } else {
      renditionRef.current.themes.register("light", { body: { background: "#ffffff !important", color: "#1a1a1a !important" } });
      renditionRef.current.themes.select("light");
    }
  }, [darkMode, epubReady]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", minHeight: 500 }}>
      <style>{SPIN}</style>
      {epubLoading && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
          <Loader2 size={28} color={GREEN} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: 13, color: "#888" }}>Opening <em>{bookTitle}</em>…</div>
          <div style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>This may take a moment on first open</div>
        </div>
      )}
      {epubError && !epubLoading && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 32 }}>
          <AlertTriangle size={32} color={GOLD} />
          <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>Could not display this book</div>
          <div style={{ fontSize: 12, color: "#888", textAlign: "center" }}>{epubError}</div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ flex: 1, visibility: epubLoading || epubError ? "hidden" : "visible", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
      />
      {epubReady && !epubError && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, padding: "14px 0 4px" }}>
          <button onClick={prev} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1.5px solid ${GREEN}`, color: GREEN, borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ fontSize: 11, color: "#aaa" }}>← → keys also work</span>
          <button onClick={next} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1.5px solid ${GREEN}`, color: GREEN, borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── PDF viewer — passes URL directly to PDF.js (no pre-download) ──────────────
function PdfViewer({ streamUrl, darkMode, currentPage, onPageChange, onTotalPages, watermarkText }: {
  streamUrl: string;
  darkMode: boolean;
  currentPage: number;
  onPageChange: (n: number) => void;
  onTotalPages: (n: number) => void;
  watermarkText: string;
}) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const pdfDocRef     = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const [totalPages,    setTotalPages]    = useState(0);
  const [pdfError,      setPdfError]      = useState("");
  const [pdfLoading,    setPdfLoading]    = useState(true);
  const [pageRendering, setPageRendering] = useState(false);

  const borderColor = darkMode ? "#333" : "#e5e7eb";
  const textColor   = darkMode ? "#e5e5e5" : "#0a0a0a";

  useEffect(() => {
    let cancelled = false;
    setPdfLoading(true);
    setPdfError("");

    (async () => {
      try {
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) throw new Error("PDF renderer not available — please hard-refresh.");
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        // Pass URL directly — PDF.js streams it internally
        const pdf = await pdfjsLib.getDocument({ url: streamUrl }).promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        onTotalPages(pdf.numPages);
        setPdfLoading(false);
      } catch (e: any) {
        if (!cancelled) { setPdfError(e?.message ?? "Failed to load PDF."); setPdfLoading(false); }
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel?.();
      pdfDocRef.current?.destroy?.();
      pdfDocRef.current = null;
    };
  }, [streamUrl]);

  const [pdfLoaded, setPdfLoaded] = useState(false);
  useEffect(() => { if (!pdfLoading && pdfDocRef.current) setPdfLoaded(true); }, [pdfLoading]);

  useEffect(() => {
    if (!pdfLoaded || !canvasRef.current || !pdfDocRef.current) return;
    let cancelled = false;
    renderTaskRef.current?.cancel?.();
    setPageRendering(true);

    (async () => {
      try {
        const pdf  = pdfDocRef.current;
        const page = await pdf.getPage(Math.max(1, Math.min(currentPage, pdf.numPages)));
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const ctx    = canvas.getContext("2d")!;
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const base   = page.getViewport({ scale: 1 });
        const scale  = Math.min(containerWidth / base.width, 2);
        const vp     = page.getViewport({ scale });

        canvas.width  = vp.width;
        canvas.height = vp.height;

        const task = page.render({ canvasContext: ctx, viewport: vp });
        renderTaskRef.current = task;
        await task.promise;
        if (!cancelled) setPageRendering(false);
      } catch (e: any) {
        if (!cancelled && e?.name !== "RenderingCancelledException") {
          setPdfError(e?.message ?? "Could not render page.");
          setPageRendering(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [pdfLoaded, currentPage, darkMode]);

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
      <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", background: darkMode ? "#1a1a1a" : "#fff" }}>
        {pageRendering && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, background: darkMode ? "rgba(26,26,26,0.6)" : "rgba(255,255,255,0.6)" }}>
            <Loader2 size={22} color={GREEN} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div style={{ transform: "rotate(-35deg)", opacity: 0.055, fontSize: 22, fontWeight: 900, color: DARK, userSelect: "none", whiteSpace: "nowrap", width: "200%", textAlign: "center", lineHeight: 3.2 }}>
            {Array.from({ length: 10 }).map((_, i) => <div key={i}>{watermarkText} — NFGN Licensed</div>)}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20, padding: "12px 0" }}>
        <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${borderColor}`, background: "none", cursor: currentPage <= 1 ? "not-allowed" : "pointer", color: textColor, fontWeight: 700, opacity: currentPage <= 1 ? 0.4 : 1 }}>← Prev</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: textColor, fontWeight: 600 }}>Page</span>
          <input type="number" value={currentPage} min={1} max={totalPages || undefined} onChange={e => { const n = parseInt(e.target.value); if (!isNaN(n) && n >= 1) onPageChange(n); }} style={{ width: 60, textAlign: "center", padding: "6px 8px", border: `1px solid ${borderColor}`, borderRadius: 8, background: darkMode ? "#222" : "#fff", color: textColor, fontWeight: 700, fontSize: 13 }} />
          {totalPages > 0 && <span style={{ fontSize: 13, color: "#888" }}>of {totalPages}</span>}
        </div>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={totalPages > 0 && currentPage >= totalPages} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${borderColor}`, background: "none", cursor: totalPages > 0 && currentPage >= totalPages ? "not-allowed" : "pointer", color: textColor, fontWeight: 700, opacity: totalPages > 0 && currentPage >= totalPages ? 0.4 : 1 }}>Next →</button>
      </div>
      {totalPages > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <div style={{ width: 300, height: 4, background: borderColor, borderRadius: 2 }}>
            <div style={{ height: "100%", width: `${Math.min(100, (currentPage / totalPages) * 100)}%`, background: GREEN, borderRadius: 2, transition: "width .3s" }} />
          </div>
        </div>
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
  const [fontSize, setFontSize]   = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(0);
  const [audioSpeed, setAudioSpeed]   = useState(1);
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
  const libraryLabel = isSample ? "Bookstore" : "My Library";

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
              <button onClick={() => setFontSize(s => Math.max(10, s - 1))} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: textColor }}><Minus size={12} /></button>
              <span style={{ fontSize: 12, color: textColor, fontWeight: 600, minWidth: 30, textAlign: "center" }}>{fontSize}px</span>
              <button onClick={() => setFontSize(s => Math.min(28, s + 1))} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: textColor }}><Plus size={12} /></button>
            </>
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
          isEpub ? (
            <EpubViewer
              streamUrl={fileStreamUrl}
              fontSize={fontSize}
              darkMode={darkMode}
              bookTitle={book.title}
            />
          ) : (
            <PdfViewer
              streamUrl={fileStreamUrl}
              darkMode={darkMode}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onTotalPages={setTotalPages}
              watermarkText={isSample ? "" : watermarkText}
            />
          )

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
