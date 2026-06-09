import { useState, useEffect } from "react";
import { BookOpen, Mic, FileText, BookMarked, GraduationCap, BookOpenCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const GREEN_M = "#c8e6d4";
const GOLD = "#C9A84C";
const DARK = "#0a0a0a";

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("nfgn_token");
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const TYPE_ICONS: Record<string, any> = {
  ebook: BookOpen, audiobook: Mic, training_manual: FileText,
  guide: GraduationCap, bible_study: BookMarked,
};
const TYPE_LABELS: Record<string, string> = {
  ebook: "eBook", audiobook: "Audiobook", training_manual: "Manual",
  guide: "Guide", bible_study: "Bible Study",
};

interface LibraryBook {
  id: number; title: string; subtitle?: string; authorName: string; category: string; type: string;
  shortDescription?: string; coverImage?: string; fileUrl?: string; audioUrl?: string;
  price: number; isFree: boolean; purchasedAt: string; pricePaid: number;
  readingProgress: { currentPage: number; totalPages: number | null; pct: number; lastReadAt: string } | null;
}

function ProgressBar({ pct, color = GREEN }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: color, borderRadius: 3, transition: "width .3s" }} />
    </div>
  );
}

function LibraryCard({ book }: { book: LibraryBook }) {
  const TypeIcon = TYPE_ICONS[book.type] ?? BookOpen;
  const pct = book.readingProgress?.pct ?? 0;
  const started = pct > 0;
  const finished = pct >= 100;

  return (
    <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Cover */}
      <div style={{ height: 160, background: `linear-gradient(135deg, ${GREEN}22, ${GOLD}22)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <TypeIcon size={44} color={GREEN} style={{ opacity: 0.35 }} />
        )}
        {finished && (
          <div style={{ position: "absolute", inset: 0, background: `${GREEN_D}cc`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "#fff" }}>
              <BookOpenCheck size={32} style={{ margin: "0 auto 4px" }} />
              <div style={{ fontSize: 11, fontWeight: 800 }}>Completed!</div>
            </div>
          </div>
        )}
        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.55)", color: "#fff", borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <TypeIcon size={10} /> {TYPE_LABELS[book.type] ?? book.type}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: DARK, marginBottom: 1, lineHeight: 1.3 }}>{book.title}</div>
        <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, marginBottom: 10 }}>by {book.authorName}</div>

        {/* Progress */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4, fontWeight: 600 }}>
            <span>{finished ? "Completed ✓" : started ? `${Math.round(pct)}% read` : "Not started"}</span>
            {book.readingProgress?.lastReadAt && (
              <span>Last: {new Date(book.readingProgress.lastReadAt).toLocaleDateString()}</span>
            )}
          </div>
          <ProgressBar pct={pct} color={finished ? GOLD : GREEN} />
        </div>

        <div style={{ fontSize: 11, color: "#aaa", marginBottom: 12 }}>
          Added {new Date(book.purchasedAt).toLocaleDateString()} · {book.pricePaid === 0 ? "Free" : `$${book.pricePaid.toFixed(2)}`}
        </div>

        <a href={`/dashboard/read/${book.id}`} style={{ textDecoration: "none", marginTop: "auto" }}>
          <Button style={{ width: "100%", background: GREEN, color: "#fff", fontWeight: 800, fontSize: 13, borderRadius: 8 }}>
            <BookOpen size={14} style={{ marginRight: 6 }} />
            {finished ? "Read Again" : started ? "Continue Reading" : "Start Reading"}
          </Button>
        </a>
      </div>
    </div>
  );
}

export function LibraryPage() {
  const [library, setLibrary] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "reading" | "completed" | "unstarted">("all");

  useEffect(() => {
    apiFetch("/api/bookstore/library").then(d => setLibrary(d.library)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = library.filter(b => {
    const pct = b.readingProgress?.pct ?? 0;
    if (filter === "reading") return pct > 0 && pct < 100;
    if (filter === "completed") return pct >= 100;
    if (filter === "unstarted") return pct === 0;
    return true;
  });

  const inProgress = library.filter(b => { const p = b.readingProgress?.pct ?? 0; return p > 0 && p < 100; })
    .sort((a, b) => new Date(b.readingProgress!.lastReadAt).getTime() - new Date(a.readingProgress!.lastReadAt).getTime());

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpenCheck size={24} color={GREEN} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>My Digital Library</h1>
            <p style={{ fontSize: 13, color: "#666", margin: 0 }}>{library.length} book{library.length !== 1 ? "s" : ""} in your collection</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#888" }}>
          <Loader2 size={28} color={GREEN} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }} />
          Loading your library…
        </div>
      ) : library.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center" }}>
          <BookOpen size={44} color="#ddd" style={{ margin: "0 auto 14px", display: "block" }} />
          <div style={{ fontSize: 16, fontWeight: 800, color: DARK, marginBottom: 8 }}>Your library is empty</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Browse the bookstore to add books to your collection.</div>
          <a href="/dashboard/bookstore">
            <Button style={{ background: GREEN, color: "#fff", fontWeight: 700 }}>Go to Bookstore</Button>
          </a>
        </div>
      ) : (
        <>
          {/* Continue reading */}
          {inProgress.length > 0 && (
            <div style={{ background: `linear-gradient(135deg, ${GREEN_D}, ${GREEN})`, borderRadius: 14, padding: "20px 24px", marginBottom: 32, color: "#fff" }}>
              <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>Continue Reading</div>
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
                {inProgress.slice(0, 4).map(b => (
                  <a key={b.id} href={`/dashboard/read/${b.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                    <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 16px", minWidth: 180, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2, lineHeight: 1.3 }}>{b.title}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>{Math.round(b.readingProgress!.pct)}% complete</div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${b.readingProgress!.pct}%`, background: GOLD, borderRadius: 2 }} />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {([
              { key: "all", label: `All (${library.length})` },
              { key: "reading", label: `In Progress (${library.filter(b => { const p = b.readingProgress?.pct ?? 0; return p > 0 && p < 100; }).length})` },
              { key: "completed", label: `Completed (${library.filter(b => (b.readingProgress?.pct ?? 0) >= 100).length})` },
              { key: "unstarted", label: `Unstarted (${library.filter(b => (b.readingProgress?.pct ?? 0) === 0).length})` },
            ] as const).map(f => (
              <button
                key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${filter === f.key ? GREEN : "#e5e7eb"}`, background: filter === f.key ? GREEN : "#fff", color: filter === f.key ? "#fff" : "#555", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >{f.label}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {filtered.map(b => <LibraryCard key={b.id} book={b} />)}
          </div>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
