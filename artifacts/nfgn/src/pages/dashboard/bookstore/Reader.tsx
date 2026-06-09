import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Sun, Moon, Minus, Plus, BookOpen, Mic, Loader2, AlertTriangle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const DARK = "#0a0a0a";
const GOLD = "#C9A84C";

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("nfgn_token");
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

interface Book {
  id: number; title: string; authorName: string; type: string;
  fileUrl: string | null; audioUrl: string | null; coverImage?: string;
  pageCount?: number; duration?: string; purchased: boolean;
}

interface Props { bookId: string }

export function ReaderPage({ bookId }: Props) {
  const { data: me } = useGetMe();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const id = parseInt(bookId);

  useEffect(() => {
    apiFetch(`/api/bookstore/books/${id}`)
      .then(d => {
        if (!d.book.purchased && !d.book.isFree) { setError("You don't have access to this book. Purchase it from the bookstore first."); setLoading(false); return; }
        setBook(d.book);
        // Load saved progress
        return apiFetch(`/api/bookstore/reading-progress/${id}`);
      })
      .then(d => { if (d?.progress) { setCurrentPage(d.progress.currentPage ?? 1); if (d.progress.totalPages) setTotalPages(d.progress.totalPages); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function saveProgress(page: number, total: number) {
    if (!book) return;
    try { await apiFetch(`/api/bookstore/reading-progress/${id}`, { method: "POST", body: JSON.stringify({ currentPage: page, totalPages: total }) }); } catch {}
  }

  function handlePageChange(newPage: number) {
    setCurrentPage(newPage);
    saveProgress(newPage, totalPages);
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = audioSpeed;
  }, [audioSpeed]);

  const bg = darkMode ? "#1a1a1a" : "#fff";
  const textColor = darkMode ? "#e5e5e5" : DARK;
  const headerBg = darkMode ? "#0a0a0a" : "#f9fafb";
  const borderColor = darkMode ? "#333" : "#e5e7eb";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ textAlign: "center" }}>
        <Loader2 size={32} color={GREEN} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: "#666" }}>Opening your book…</div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (error || !book) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 32 }}>
        <AlertTriangle size={36} color={GOLD} style={{ margin: "0 auto 14px", display: "block" }} />
        <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 8 }}>Access Denied</div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>{error || "Book not found."}</div>
        <a href="/dashboard/bookstore">
          <Button style={{ background: GREEN, color: "#fff", fontWeight: 700 }}>Browse Bookstore</Button>
        </a>
      </div>
    </div>
  );

  const isAudio = book.type === "audiobook";
  const watermarkText = me ? `${me.firstName} ${me.lastName} · ${me.email}` : "NFGN Licensed Content";

  return (
    <div style={{ minHeight: "100vh", background: bg, transition: "background .2s" }}>
      {/* Reader Header */}
      <div style={{ background: headerBg, borderBottom: `1px solid ${borderColor}`, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/dashboard/library" style={{ display: "flex", alignItems: "center", gap: 6, color: GREEN, textDecoration: "none", fontWeight: 700, fontSize: 13 }}>
            <ArrowLeft size={16} /> Library
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
              <button onClick={() => setFontSize(s => Math.max(12, s - 1))} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: textColor }}>
                <Minus size={12} />
              </button>
              <span style={{ fontSize: 12, color: textColor, fontWeight: 600, minWidth: 30, textAlign: "center" }}>{fontSize}px</span>
              <button onClick={() => setFontSize(s => Math.min(26, s + 1))} style={{ background: "none", border: `1px solid ${borderColor}`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: textColor }}>
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

      {/* License watermark ribbon */}
      <div style={{ background: `${GREEN}0A`, borderBottom: `1px solid ${GREEN}22`, padding: "5px 20px", textAlign: "center", fontSize: 10, color: "#aaa", fontStyle: "italic", userSelect: "none" }}>
        🔒 Licensed to: {watermarkText} · NFGN Digital License · Unauthorized distribution prohibited
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px", position: "relative" }}>

        {isAudio && book.audioUrl ? (
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
              <audio ref={audioRef} controls src={book.audioUrl} style={{ width: "100%", marginBottom: 16 }} />
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
        ) : book.fileUrl ? (
          /* ── PDF READER ── */
          <div>
            <div style={{ position: "relative" }}>
              <iframe
                src={`${book.fileUrl}#toolbar=0&navpanes=0&scrollbar=1&page=${currentPage}`}
                style={{ width: "100%", height: "calc(100vh - 200px)", minHeight: 600, border: "none", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                title={book.title}
              />
              {/* Watermark overlay */}
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <div style={{ transform: "rotate(-35deg)", opacity: 0.06, fontSize: 28, fontWeight: 900, color: DARK, userSelect: "none", whiteSpace: "nowrap", width: "200%", textAlign: "center", lineHeight: 3 }}>
                  {Array.from({ length: 8 }).map((_, i) => <div key={i}>{watermarkText} — NFGN Licensed</div>)}
                </div>
              </div>
            </div>

            {/* Page navigation */}
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
        ) : (
          /* ── NO FILE ── */
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <BookOpen size={44} color="#ddd" style={{ margin: "0 auto 14px", display: "block" }} />
            <div style={{ fontSize: 16, fontWeight: 800, color: textColor, marginBottom: 8 }}>Content Coming Soon</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>The author is preparing the digital file. Check back shortly.</div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
