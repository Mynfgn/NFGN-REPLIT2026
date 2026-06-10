import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Sun, Moon, Minus, Plus, BookOpen, Mic, Loader2, AlertTriangle, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";

const GREEN  = "#2D6A4F";
const GREEN_D = "#1A4032";
const DARK   = "#0a0a0a";
const GOLD   = "#C9A84C";

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

function EpubViewer({ streamUrl, fontSize, darkMode, bookTitle }: {
  streamUrl: string;
  fontSize: number;
  darkMode: boolean;
  bookTitle: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef      = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const [epubReady, setEpubReady]   = useState(false);
  const [epubError, setEpubError]   = useState("");
  const [epubLoading, setEpubLoading] = useState(true);

  const prev = useCallback(() => renditionRef.current?.prev(), []);
  const next = useCallback(() => renditionRef.current?.next(), []);

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;
    let blobUrl: string | null = null;

    setEpubLoading(true);
    setEpubError("");

    // Fetch the EPUB as an ArrayBuffer first, then create a blob URL.
    // This prevents Safari iOS from intercepting application/epub+zip and
    // showing a native "Do you want to download stream.epub?" dialog.
    (async () => {
      try {
        const resp = await fetch(streamUrl);
        if (!resp.ok) throw new Error(`Could not load book (HTTP ${resp.status})`);
        const buffer = await resp.arrayBuffer();
        if (destroyed) return;

        blobUrl = URL.createObjectURL(new Blob([buffer], { type: "application/epub+zip" }));

        const ePub = (window as Window).ePub;
        if (!ePub) { setEpubError("EPUB reader not available. Please refresh the page."); setEpubLoading(false); return; }

        const epubBook = ePub(blobUrl);
        bookRef.current = epubBook;

        const rendition = epubBook.renderTo(containerRef.current!, {
          width: "100%",
          height: "100%",
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
        if (!destroyed) { setEpubError(e?.message ?? "Failed to download book."); setEpubLoading(false); }
      }
    })();

    return () => {
      destroyed = true;
      bookRef.current?.destroy?.();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [streamUrl]);

  useEffect(() => {
    if (!renditionRef.current || !epubReady) return;
    renditionRef.current.themes.fontSize(`${fontSize}px`);
  }, [fontSize, epubReady]);

  useEffect(() => {
    if (!renditionRef.current || !epubReady) return;
    if (darkMode) {
      renditionRef.current.themes.register("dark", {
        body: { background: "#1a1a1a !important", color: "#e5e5e5 !important" },
      });
      renditionRef.current.themes.select("dark");
    } else {
      renditionRef.current.themes.register("light", {
        body: { background: "#ffffff !important", color: "#1a1a1a !important" },
      });
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
      {epubLoading && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
          <Loader2 size={28} color={GREEN} style={{ animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: 13, color: "#888" }}>Opening <em>{bookTitle}</em>…</div>
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
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
        style={{ flex: 1, display: epubLoading || epubError ? "none" : "block", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
      />
      {epubReady && !epubError && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, padding: "14px 0 4px" }}>
          <button
            onClick={prev}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1.5px solid ${GREEN}`, color: GREEN, borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span style={{ fontSize: 11, color: "#aaa" }}>← → keys also work</span>
          <button
            onClick={next}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1.5px solid ${GREEN}`, color: GREEN, borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ReaderPage({ bookId }: Props) {
  const { data: me } = useGetMe();
  const [book, setBook]     = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(0);
  const [audioSpeed, setAudioSpeed]   = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const id      = parseInt(bookId);
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
          const prog = await apiFetch(`/api/bookstore/reading-progress/${id}`);
          if (prog?.progress) {
            setCurrentPage(prog.progress.currentPage ?? 1);
            if (prog.progress.totalPages) setTotalPages(prog.progress.totalPages);
          }
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isSample]);

  async function saveProgress(page: number, total: number) {
    if (!book || isSample) return;
    try {
      await apiFetch(`/api/bookstore/reading-progress/${id}`, {
        method: "POST",
        body: JSON.stringify({ currentPage: page, totalPages: total }),
      });
    } catch {}
  }

  function handlePageChange(newPage: number) {
    setCurrentPage(newPage);
    saveProgress(newPage, totalPages);
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = audioSpeed;
  }, [audioSpeed]);

  const bg          = darkMode ? "#1a1a1a" : "#fff";
  const textColor   = darkMode ? "#e5e5e5" : DARK;
  const headerBg    = darkMode ? "#0a0a0a" : "#f9fafb";
  const borderColor = darkMode ? "#333" : "#e5e7eb";

  const token = encodeURIComponent(localStorage.getItem("nfgn_token") ?? "");
  const streamBase = `/api/bookstore/books/${id}/stream?token=${token}`;
  const fileStreamUrl = isSample
    ? `${streamBase}&sample=true`
    : `${streamBase}&type=file`;

  const watermarkText = me
    ? `${me.firstName} ${me.lastName} · ${me.email}`
    : "NFGN Licensed Content";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ textAlign: "center" }}>
        <Loader2 size={32} color={GREEN} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: "#666" }}>Opening your book…</div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !book) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <AlertTriangle size={36} color={GOLD} style={{ margin: "0 auto 14px", display: "block" }} />
        <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 8 }}>Book Unavailable</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>{error || "Book not found."}</div>
        <a href="/dashboard/bookstore">
          <Button style={{ background: GREEN, color: "#fff", fontWeight: 700 }}>
            <ShoppingCart size={14} style={{ marginRight: 6 }} /> Browse Bookstore
          </Button>
        </a>
      </div>
    </div>
  );

  const isAudio  = book.type === "audiobook";
  const isEpub   = book.fileType === "epub";

  return (
    <div style={{ minHeight: "100vh", background: bg, transition: "background .2s" }}>

      {/* Reader Header */}
      <div style={{ background: headerBg, borderBottom: `1px solid ${borderColor}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href={isSample ? "/dashboard/bookstore" : "/dashboard/library"} style={{ display: "flex", alignItems: "center", gap: 6, color: GREEN, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
            <ArrowLeft size={16} /> {isSample ? "Bookstore" : "Library"}
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
              <button onClick={() => setFontSize(s => Math.max(10, s - 1))} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: textColor }}>
                <Minus size={12} />
              </button>
              <span style={{ fontSize: 12, color: textColor, fontWeight: 600, minWidth: 30, textAlign: "center" }}>{fontSize}px</span>
              <button onClick={() => setFontSize(s => Math.min(28, s + 1))} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: textColor }}>
                <Plus size={12} />
              </button>
            </>
          )}
          <button onClick={() => setDarkMode(d => !d)} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: textColor, fontSize: 12, fontWeight: 700 }}>
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      {/* Sample banner */}
      {isSample && (
        <div style={{ background: `${GOLD}18`, borderBottom: `2px solid ${GOLD}66`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#7A6010" }}>
            📖 Sample Preview of <em>{book.title}</em> — Purchase to read the full book
          </div>
          <a href="/dashboard/bookstore" style={{ textDecoration: "none" }}>
            <button style={{ background: GOLD, color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingCart size={13} /> Buy Full Book
            </button>
          </a>
        </div>
      )}

      {/* License watermark ribbon */}
      {!isSample && (
        <div style={{ background: `${GREEN}0A`, borderBottom: `1px solid ${GREEN}22`, padding: "5px 20px", textAlign: "center", fontSize: 10, color: "#aaa", fontStyle: "italic", userSelect: "none" }}>
          🔒 Licensed to: {watermarkText} · NFGN Digital License · Unauthorized distribution prohibited
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: isAudio ? 700 : 900, margin: "0 auto", padding: "28px 24px", position: "relative" }}>

        {isAudio && book.hasAudio ? (
          /* ── AUDIOBOOK PLAYER ── */
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
              <audio
                ref={audioRef}
                controls
                src={`${streamBase}&type=audio`}
                style={{ width: "100%", marginBottom: 16 }}
                onContextMenu={e => e.preventDefault()}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>Speed:</span>
                {[0.75, 1, 1.25, 1.5, 2].map(s => (
                  <button key={s} onClick={() => setAudioSpeed(s)} style={{ padding: "4px 10px", borderRadius: 16, border: `1.5px solid ${audioSpeed === s ? GREEN : borderColor}`, background: audioSpeed === s ? GREEN : "transparent", color: audioSpeed === s ? "#fff" : textColor, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

        ) : book.hasFile || (isSample && book.hasSample) ? (
          /* ── EBOOK / EPUB READER ── */
          isEpub ? (
            /* — epub.js renderer — */
            <div>
              <EpubViewer
                streamUrl={fileStreamUrl}
                fontSize={fontSize}
                darkMode={darkMode}
                bookTitle={book.title}
              />
            </div>
          ) : (
            /* — PDF iframe renderer — */
            <div>
              <div style={{ position: "relative" }}>
                <iframe
                  src={`${fileStreamUrl}#toolbar=0&navpanes=0&scrollbar=1&page=${currentPage}`}
                  style={{ width: "100%", height: "calc(100vh - 200px)", minHeight: 600, border: "none", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                  title={book.title}
                />
                {!isSample && (
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <div style={{ transform: "rotate(-35deg)", opacity: 0.06, fontSize: 28, fontWeight: 900, color: DARK, userSelect: "none", whiteSpace: "nowrap", width: "200%", textAlign: "center", lineHeight: 3 }}>
                      {Array.from({ length: 8 }).map((_, i) => <div key={i}>{watermarkText} — NFGN Licensed</div>)}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20, padding: "12px 0" }}>
                <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${borderColor}`, background: "none", cursor: currentPage <= 1 ? "not-allowed" : "pointer", color: textColor, fontWeight: 700, opacity: currentPage <= 1 ? 0.4 : 1 }}>
                  ← Prev
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: textColor, fontWeight: 600 }}>Page</span>
                  <input
                    type="number" value={currentPage} min={1} max={totalPages || undefined}
                    onChange={e => { const n = parseInt(e.target.value); if (!isNaN(n) && n > 0) handlePageChange(n); }}
                    style={{ width: 60, textAlign: "center", padding: "6px 8px", border: `1px solid ${borderColor}`, borderRadius: 8, background: bg, color: textColor, fontWeight: 700, fontSize: 13 }}
                  />
                  {totalPages > 0 && <span style={{ fontSize: 13, color: "#888" }}>of {totalPages}</span>}
                </div>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={totalPages > 0 && currentPage >= totalPages} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${borderColor}`, background: "none", cursor: "pointer", color: textColor, fontWeight: 700 }}>
                  Next →
                </button>
              </div>
              {totalPages > 0 && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ width: 300, height: 4, background: borderColor, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (currentPage / totalPages) * 100)}%`, background: GREEN, borderRadius: 2, transition: "width .3s" }} />
                  </div>
                </div>
              )}
            </div>
          )

        ) : (
          /* ── No file available ── */
          <div style={{ textAlign: "center", padding: "60px 32px" }}>
            <BookOpen size={48} color="#ddd" style={{ margin: "0 auto 16px", display: "block" }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: textColor, marginBottom: 8 }}>
              {book.title}
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              The content for this book is being prepared and will be available soon.
              <br />Check back later or contact support.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
