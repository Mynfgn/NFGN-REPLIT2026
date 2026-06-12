import { useState, useEffect } from "react";
import { BookOpen, Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Star, Plus, Search, Edit3, Mic, FileText, GraduationCap, BookMarked, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileUploadField } from "@/components/ui/FileUploadField";

const GREEN = "#2D6A4F";
const GREEN_D = "#1A4032";
const GREEN_M = "#c8e6d4";
const GOLD = "#C9A84C";
const DARK = "#0a0a0a";
const RED = "#8B3A3A";

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem("nfgn_token");
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const BOOK_CATEGORIES = [
  "Health & Wellness", "Faith & Spiritual Growth", "Marketplace Ministry",
  "Business & Leadership", "Herbal Education", "Nutrition", "Financial Education",
  "Personal Development", "NFGN Training", "Children's Books", "General",
];

const BOOK_TYPES = [
  { value: "ebook", label: "eBook", icon: BookOpen },
  { value: "audiobook", label: "Audiobook", icon: Mic },
  { value: "training_manual", label: "Training Manual", icon: FileText },
  { value: "guide", label: "Health/Wellness Guide", icon: GraduationCap },
  { value: "bible_study", label: "Bible Study", icon: BookMarked },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "#FEF3C7", color: "#92400E", label: "Pending" },
  approved: { bg: GREEN_M, color: GREEN_D, label: "Approved" },
  rejected: { bg: "#fdeaea", color: RED, label: "Rejected" },
  suspended:{ bg: "#f3f4f6", color: "#374151", label: "Suspended" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 800 }}>{s.label}</span>
  );
}

function KpiCard({ label, value, sub, color, icon: Icon, onClick }: { label: string; value: string | number; sub?: string; color: string; icon: any; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ background: "#fff", border: `1.5px solid ${color}44`, borderRadius: 12, padding: "16px 18px", cursor: onClick ? "pointer" : "default", transition: "box-shadow .15s" }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px ${color}33`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: DARK }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{sub}</div>}
      {onClick && <div style={{ fontSize: 10, color: color, marginTop: 6, fontWeight: 700 }}>Click to view →</div>}
    </div>
  );
}

interface Book {
  id: number; title: string; subtitle?: string; authorName: string; category: string; type: string;
  price: number; cv: number; isFree: boolean; status: string; isFeatured: boolean; isBestSeller: boolean; isStaffPick: boolean;
  totalSales: number; createdAt: string; authorRoyaltyPct: number; platformFeePct: number;
  description?: string; shortDescription?: string; coverImage?: string; fileUrl?: string; sampleFileUrl?: string; audioUrl?: string;
  pageCount?: number; duration?: string; language?: string; tags?: string; isbn?: string; adminNote?: string;
}
interface AuthorApp { id: number; userId: number; name: string; bio?: string; website?: string; writingExperience?: string; categories?: string; status: string; adminNote?: string; createdAt: string; }
interface Stats { totalBooks: number; pendingBooks: number; approvedBooks: number; totalPurchases: number; totalAuthors: number; pendingAuthors: number; totalRevenue: number; monthlyRevenue: number; }

const BLANK_FORM = { title: "", subtitle: "", authorName: "", shortDescription: "", description: "", category: "Health & Wellness", type: "ebook", price: "", cv: "0", isFree: false, authorRoyaltyPct: "70", platformFeePct: "30", coverImage: "", fileUrl: "", sampleFileUrl: "", audioUrl: "", language: "English", tags: "", isbn: "", pageCount: "", duration: "", isFeatured: false, isStaffPick: false };

function BookForm({ value, onChange, onSubmit, saving, submitLabel }: {
  value: typeof BLANK_FORM;
  onChange: (f: typeof BLANK_FORM) => void;
  onSubmit: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  const set = (k: string, v: unknown) => onChange({ ...value, [k as keyof typeof value]: v } as typeof BLANK_FORM);

  return (
    <div>
      {/* Cover image preview */}
      {value.coverImage && (
        <div style={{ marginBottom: 18, textAlign: "center" }}>
          <img src={value.coverImage} alt="Cover preview" style={{ maxHeight: 200, maxWidth: 140, objectFit: "cover", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }} />
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Cover preview</div>
        </div>
      )}

      {[
        { label: "Book Title *", key: "title", placeholder: "e.g. The Healing Power of Nature" },
        { label: "Subtitle", key: "subtitle", placeholder: "Optional subtitle" },
        { label: "Author Name *", key: "authorName", placeholder: "e.g. Dr. Jane Smith" },
        { label: "ISBN / Reference", key: "isbn", placeholder: "Optional" },
      ].map(f => (
        <div key={f.key} style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>{f.label}</label>
          <Input value={(value as any)[f.key] ?? ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Category</label>
          <select value={value.category} onChange={e => set("category", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
            {BOOK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Content Type</label>
          <select value={value.type} onChange={e => set("type", e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
            {BOOK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Short Description (shown in store listing)</label>
        <textarea value={value.shortDescription} onChange={e => set("shortDescription", e.target.value)} placeholder="2–3 sentences for the store card…" rows={2} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Full Description</label>
        <textarea value={value.description} onChange={e => set("description", e.target.value)} placeholder="Full book description…" rows={4} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
      </div>

      {/* Price / CV / Royalty row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Price ($)</label>
          <Input value={value.price} onChange={e => set("price", e.target.value)} placeholder="0.00" type="number" min="0" step="0.01" disabled={value.isFree} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>CV Points</label>
          <Input value={value.cv} onChange={e => set("cv", e.target.value)} placeholder="0" type="number" min="0" step="1" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Author Royalty %</label>
          <Input value={value.authorRoyaltyPct} onChange={e => { const v = e.target.value; set("authorRoyaltyPct", v); set("platformFeePct", String(Math.max(0, 100 - (parseFloat(v) || 0)))); }} type="number" min="0" max="100" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Platform Fee %</label>
          <Input value={value.platformFeePct} onChange={e => { const v = e.target.value; set("platformFeePct", v); set("authorRoyaltyPct", String(Math.max(0, 100 - (parseFloat(v) || 0)))); }} type="number" min="0" max="100" />
        </div>
      </div>

      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" id="isFreeBook" checked={value.isFree} onChange={e => { set("isFree", e.target.checked); if (e.target.checked) set("price", "0"); }} />
        <label htmlFor="isFreeBook" style={{ fontSize: 13, fontWeight: 700, color: "#555", cursor: "pointer" }}>This is a FREE book / resource</label>
      </div>

      {/* Extra metadata */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Language</label>
          <Input value={value.language} onChange={e => set("language", e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Pages (eBooks)</label>
          <Input value={value.pageCount} onChange={e => set("pageCount", e.target.value)} type="number" min="0" placeholder="e.g. 240" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Duration (audiobooks)</label>
          <Input value={value.duration} onChange={e => set("duration", e.target.value)} placeholder="e.g. 4h 30m" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Tags (comma-separated)</label>
        <Input value={value.tags} onChange={e => set("tags", e.target.value)} placeholder="health, wellness, naturopathic" />
      </div>

      {/* File uploads */}
      <div style={{ marginBottom: 14 }}>
        <FileUploadField label="Cover Image" value={value.coverImage} onChange={v => set("coverImage", v)} placeholder="https://… or upload from computer" kind="image" helperText="Recommended: 400×600px, JPG or PNG" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FileUploadField label="Book File (PDF / EPUB)" value={value.fileUrl} onChange={v => set("fileUrl", v)} placeholder="https://… or upload from computer" kind="document" helperText="Buyers access this file securely after purchase" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FileUploadField label="Sample / Preview File (PDF / EPUB — optional)" value={value.sampleFileUrl} onChange={v => set("sampleFileUrl", v)} placeholder="https://… or upload from computer" kind="document" helperText="Free preview — shown to non-purchasers as a 'Read Sample' teaser" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FileUploadField label="Audio File (MP3 / M4A)" value={value.audioUrl} onChange={v => set("audioUrl", v)} placeholder="https://… or upload from computer (audiobooks only)" kind="audio" helperText="Only required for Audiobook content type" />
      </div>

      {/* Flags */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { key: "isFeatured", label: "Featured Book" },
          { key: "isStaffPick", label: "Staff Pick" },
        ].map(c => (
          <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" id={`flag-${c.key}`} checked={(value as any)[c.key]} onChange={e => set(c.key, e.target.checked)} />
            <label htmlFor={`flag-${c.key}`} style={{ fontSize: 13, fontWeight: 700, color: "#555", cursor: "pointer" }}>{c.label}</label>
          </div>
        ))}
      </div>

      <Button onClick={onSubmit} disabled={saving} style={{ background: GREEN, color: "#fff", fontWeight: 800, padding: "12px 24px", borderRadius: 10, fontSize: 14 }}>
        {saving ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}

export function AdminBookstorePage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"overview" | "books" | "authors" | "royalties" | "add">("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [applications, setApplications] = useState<AuthorApp[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQ, setSearchQ] = useState("");

  // Add book form
  const [addForm, setAddForm] = useState<typeof BLANK_FORM>({ ...BLANK_FORM });
  const [addSaving, setAddSaving] = useState(false);

  // Edit modal
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [editForm, setEditForm] = useState<typeof BLANK_FORM>({ ...BLANK_FORM });
  const [editSaving, setEditSaving] = useState(false);

  // Default royalty
  const [defRoyalty, setDefRoyalty] = useState({ authorRoyaltyPct: "70", platformFeePct: "30" });
  const [defRoyaltySaving, setDefRoyaltySaving] = useState(false);

  async function loadStats() {
    try { const d = await apiFetch("/api/bookstore/admin/stats"); setStats(d); } catch {}
  }
  async function loadBooks() {
    setLoadingBooks(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQ) params.set("q", searchQ);
      const d = await apiFetch(`/api/bookstore/admin/books?${params}`);
      setBooks(d.books);
    } catch {}
    finally { setLoadingBooks(false); }
  }
  async function loadApplications() {
    try { const d = await apiFetch("/api/bookstore/admin/author-applications"); setApplications(d.applications); } catch {}
  }
  async function loadDefRoyalty() {
    try {
      const d = await apiFetch("/api/bookstore/admin/default-royalty");
      setDefRoyalty({ authorRoyaltyPct: String(d.authorRoyaltyPct), platformFeePct: String(d.platformFeePct) });
    } catch {}
  }

  useEffect(() => { loadStats(); loadBooks(); }, []);
  useEffect(() => { if (tab === "books") loadBooks(); }, [tab, statusFilter]);
  useEffect(() => { if (tab === "authors") loadApplications(); }, [tab]);
  useEffect(() => { if (tab === "royalties") loadDefRoyalty(); }, [tab]);

  async function buyBook(book: Book) {
    try {
      if (book.isFree) {
        await apiFetch(`/api/bookstore/books/${book.id}/purchase`, { method: "POST" });
        toast({ title: "Added to your library!", description: "Visit your library to read it." });
      } else {
        await apiFetch(`/api/bookstore/cart/books/${book.id}`, { method: "POST" });
        toast({ title: `"${book.title}" added to cart!`, description: "Go to your cart to complete checkout." });
        window.location.href = "/shop";
      }
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  }

  async function handleBookStatus(id: number, status: string, flag?: { key: string; val: boolean }) {
    try {
      const body: Record<string, unknown> = { status };
      if (flag) body[flag.key] = flag.val;
      await apiFetch(`/api/bookstore/admin/books/${id}/status`, { method: "PATCH", body: JSON.stringify(body) });
      toast({ title: `Book ${status}` });
      loadBooks(); loadStats();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  }

  async function toggleFlag(id: number, key: string, val: boolean) {
    try {
      await apiFetch(`/api/bookstore/admin/books/${id}/status`, { method: "PATCH", body: JSON.stringify({ [key]: val }) });
      toast({ title: "Updated" });
      loadBooks();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  }

  async function handleAppStatus(id: number, status: string) {
    try {
      await apiFetch(`/api/bookstore/admin/author-applications/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast({ title: `Application ${status}` });
      loadApplications(); loadStats();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  }

  async function handleAddBook() {
    if (!addForm.title || !addForm.authorName) { toast({ title: "Title and author name are required", variant: "destructive" }); return; }
    setAddSaving(true);
    try {
      await apiFetch("/api/bookstore/admin/books", {
        method: "POST",
        body: JSON.stringify({
          ...addForm,
          price: parseFloat(addForm.price) || 0,
          cv: parseFloat(addForm.cv) || 0,
          pageCount: addForm.pageCount ? parseInt(addForm.pageCount) : null,
          authorRoyaltyPct: parseFloat(addForm.authorRoyaltyPct),
          platformFeePct: parseFloat(addForm.platformFeePct),
        }),
      });
      toast({ title: "Book added to store!" });
      setTab("books"); loadBooks(); loadStats();
      setAddForm({ ...BLANK_FORM });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setAddSaving(false); }
  }

  function openEdit(book: Book) {
    setEditBook(book);
    setEditForm({
      title: book.title,
      subtitle: book.subtitle ?? "",
      authorName: book.authorName,
      shortDescription: book.shortDescription ?? "",
      description: book.description ?? "",
      category: book.category,
      type: book.type,
      price: String(book.price),
      cv: String(book.cv ?? 0),
      isFree: book.isFree,
      authorRoyaltyPct: String(book.authorRoyaltyPct),
      platformFeePct: String(book.platformFeePct),
      coverImage: book.coverImage ?? "",
      fileUrl: book.fileUrl ?? "",
      sampleFileUrl: book.sampleFileUrl ?? "",
      audioUrl: book.audioUrl ?? "",
      language: book.language ?? "English",
      tags: book.tags ?? "",
      isbn: book.isbn ?? "",
      pageCount: book.pageCount ? String(book.pageCount) : "",
      duration: book.duration ?? "",
      isFeatured: book.isFeatured,
      isStaffPick: book.isStaffPick,
    });
  }

  async function handleSaveEdit() {
    if (!editBook) return;
    setEditSaving(true);
    try {
      await apiFetch(`/api/bookstore/admin/books/${editBook.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...editForm,
          price: parseFloat(editForm.price) || 0,
          cv: parseFloat(editForm.cv) || 0,
          pageCount: editForm.pageCount ? parseInt(editForm.pageCount) : null,
          authorRoyaltyPct: parseFloat(editForm.authorRoyaltyPct),
          platformFeePct: parseFloat(editForm.platformFeePct),
        }),
      });
      toast({ title: "Book updated!" });
      setEditBook(null);
      loadBooks();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setEditSaving(false); }
  }

  async function handleSaveDefRoyalty() {
    setDefRoyaltySaving(true);
    try {
      await apiFetch("/api/bookstore/admin/default-royalty", {
        method: "PUT",
        body: JSON.stringify({ authorRoyaltyPct: parseFloat(defRoyalty.authorRoyaltyPct), platformFeePct: parseFloat(defRoyalty.platformFeePct) }),
      });
      toast({ title: "Default royalty split saved!" });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setDefRoyaltySaving(false); }
  }

  const filteredBooks = books.filter(b => !searchQ || b.title.toLowerCase().includes(searchQ.toLowerCase()) || b.authorName.toLowerCase().includes(searchQ.toLowerCase()));

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={24} color={GREEN} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>NFGN Books™</h1>
            <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Author Marketplace · Knowledge Library · Digital License Management</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, flexWrap: "wrap", background: "#f3f4f6", borderRadius: 12, padding: 4 }}>
        {([
          { key: "overview", label: "Overview" },
          { key: "books", label: `Books${stats?.pendingBooks ? ` (${stats.pendingBooks} pending)` : ""}` },
          { key: "authors", label: `Author Applications${stats?.pendingAuthors ? ` (${stats.pendingAuthors})` : ""}` },
          { key: "royalties", label: "Royalty Settings" },
          { key: "add", label: "+ Add Book" },
        ] as const).map(t => (
          <button
            key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13, transition: "all .15s", background: tab === t.key ? DARK : "transparent", color: tab === t.key ? "#fff" : "#555" }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
            <KpiCard label="Total Books" value={stats.totalBooks} sub={`${stats.approvedBooks} live`} color={GREEN} icon={BookOpen} onClick={() => setTab("books")} />
            <KpiCard label="Pending Approval" value={stats.pendingBooks} sub="awaiting review" color={GOLD} icon={Clock} onClick={stats.pendingBooks > 0 ? () => setTab("books") : undefined} />
            <KpiCard label="Total Sales" value={stats.totalPurchases} sub="all time" color="#1d6fa4" icon={TrendingUp} />
            <KpiCard label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} sub="platform + royalties" color="#7B2D8B" icon={DollarSign} />
            <KpiCard label="Monthly Revenue" value={`$${stats.monthlyRevenue.toFixed(2)}`} sub="this month" color={GREEN} icon={TrendingUp} />
            <KpiCard label="Approved Authors" value={stats.totalAuthors} sub={`${stats.pendingAuthors} pending`} color="#B5651D" icon={Users} onClick={stats.pendingAuthors > 0 ? () => setTab("authors") : undefined} />
          </div>

          {/* Latest books shelf */}
          {books.filter(b => b.status === "approved").length > 0 && (
            <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "20px 22px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 15, color: DARK }}>📚 Book Shelf — Latest Releases</div>
                <button onClick={() => setTab("books")} style={{ background: "none", border: "none", color: GREEN, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>View All →</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 14 }}>
                {books.filter(b => b.status === "approved").slice(0, 8).map(book => {
                  const BTypeIcon = ({ ebook: BookOpen, audiobook: Mic, training_manual: FileText, guide: GraduationCap, bible_study: BookMarked } as Record<string, any>)[book.type] ?? BookOpen;
                  return (
                    <div key={book.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setTab("books")}>
                      {/* Book cover */}
                      <div style={{ width: "100%", aspectRatio: "2/3", background: `linear-gradient(135deg, ${GREEN}22, ${GOLD}22)`, borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                        {book.coverImage ? (
                          <img src={book.coverImage} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <BTypeIcon size={32} color={GREEN} style={{ opacity: 0.4 }} />
                        )}
                        {book.isFeatured && <div style={{ position: "absolute", top: 4, left: 4, background: GOLD, color: "#fff", borderRadius: 4, padding: "1px 5px", fontSize: 9, fontWeight: 800 }}>★</div>}
                        {book.isBestSeller && <div style={{ position: "absolute", top: 4, right: 4, background: "#0369a1", color: "#fff", borderRadius: 4, padding: "1px 5px", fontSize: 9, fontWeight: 800 }}>🏆</div>}
                      </div>
                      <div style={{ textAlign: "center", width: "100%" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: DARK, lineHeight: 1.3, marginBottom: 2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{book.title}</div>
                        <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>{book.authorName}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: book.isFree ? GREEN : DARK }}>{book.isFree ? "Free" : `$${book.price.toFixed(2)}`}</div>
                        <button
                          onClick={e => { e.stopPropagation(); buyBook(book); }}
                          style={{ marginTop: 4, width: "100%", background: GOLD, color: "#fff", border: "none", borderRadius: 6, padding: "4px 0", fontSize: 10, fontWeight: 800, cursor: "pointer" }}
                        >🛒 Buy</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: DARK, marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button onClick={() => setTab("add")} style={{ background: GREEN, color: "#fff", fontWeight: 700 }}>
                <Plus size={15} style={{ marginRight: 6 }} /> Add New Book
              </Button>
              <Button onClick={() => setTab("books")} variant="outline" style={{ fontWeight: 700 }}>
                Review Pending Books ({stats.pendingBooks})
              </Button>
              <Button onClick={() => setTab("authors")} variant="outline" style={{ fontWeight: 700 }}>
                Author Applications ({stats.pendingAuthors})
              </Button>
              <a href="/dashboard/library" style={{ textDecoration: "none" }}>
                <Button variant="outline" style={{ fontWeight: 700 }}>
                  <BookOpen size={14} style={{ marginRight: 6 }} /> View Books Library
                </Button>
              </a>
            </div>
          </div>
        </>
      )}

      {/* ── BOOKS ── */}
      {tab === "books" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
              <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search by title or author…" style={{ paddingLeft: 32, fontSize: 13 }} />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
            <Button onClick={loadBooks} variant="outline" style={{ fontWeight: 700 }}>Refresh</Button>
          </div>

          {loadingBooks ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading…</div>
          ) : filteredBooks.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>No books found.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredBooks.map(book => (
                <div key={book.id} style={{ background: "#fff", border: `1.5px solid ${book.status === "pending" ? GOLD : "#e5e7eb"}`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    {/* Cover thumbnail */}
                    <div style={{ flexShrink: 0 }}>
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} style={{ width: 60, height: 80, objectFit: "cover", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }} />
                      ) : (
                        <div style={{ width: 60, height: 80, background: `linear-gradient(135deg, ${GREEN_M}, ${GREEN}33)`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <BookOpen size={22} color={GREEN} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: DARK }}>{book.title}</span>
                        <StatusBadge status={book.status} />
                        {book.isFeatured && <span style={{ background: `${GOLD}20`, color: "#7A6010", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>★ Featured</span>}
                        {book.isBestSeller && <span style={{ background: "#e0f2fe", color: "#0369a1", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>🏆 Bestseller</span>}
                        {book.isStaffPick && <span style={{ background: GREEN_M, color: GREEN_D, borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>👍 Staff Pick</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#555" }}>By {book.authorName} · {book.category} · {BOOK_TYPES.find(t => t.value === book.type)?.label ?? book.type}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        {book.isFree ? "Free" : `$${book.price.toFixed(2)}`}
                        {" · "}<span style={{ color: GREEN_D, fontWeight: 700 }}>{book.cv > 0 ? `${book.cv} CV` : "No CV"}</span>
                        {" · "}{book.totalSales} sales
                        {" · "}Royalty: {book.authorRoyaltyPct}% / Platform: {book.platformFeePct}%
                      </div>
                      {book.shortDescription && <div style={{ fontSize: 12, color: "#666", marginTop: 5, lineHeight: 1.5, maxWidth: 500 }}>{book.shortDescription}</div>}
                      {book.adminNote && <div style={{ fontSize: 11, color: RED, marginTop: 4, fontStyle: "italic" }}>Note: {book.adminNote}</div>}
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start", flexShrink: 0 }}>
                      <Button size="sm" onClick={() => openEdit(book)} variant="outline" style={{ fontWeight: 700, fontSize: 12, padding: "5px 12px", color: "#374151" }}>
                        <Edit3 size={12} style={{ marginRight: 4 }} /> Edit
                      </Button>
                      {book.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleBookStatus(book.id, "approved")} style={{ background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 12px" }}>
                            <CheckCircle size={12} style={{ marginRight: 4 }} /> Approve
                          </Button>
                          <Button size="sm" onClick={() => handleBookStatus(book.id, "rejected")} variant="outline" style={{ color: RED, borderColor: RED, fontWeight: 700, fontSize: 12, padding: "5px 12px" }}>
                            <XCircle size={12} style={{ marginRight: 4 }} /> Reject
                          </Button>
                        </>
                      )}
                      {book.status === "approved" && (
                        <>
                          <Button size="sm" onClick={() => buyBook(book)} style={{ background: GOLD, color: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 12px", border: "none" }}>
                            🛒 Buy
                          </Button>
                          <Button size="sm" onClick={() => toggleFlag(book.id, "isFeatured", !book.isFeatured)} variant="outline" style={{ fontWeight: 700, fontSize: 12, padding: "5px 12px", color: GOLD, borderColor: GOLD }}>
                            <Star size={12} style={{ marginRight: 4 }} /> {book.isFeatured ? "Unfeature" : "Feature"}
                          </Button>
                          <Button size="sm" onClick={() => toggleFlag(book.id, "isBestSeller", !book.isBestSeller)} variant="outline" style={{ fontWeight: 700, fontSize: 12, padding: "5px 12px" }}>
                            🏆 {book.isBestSeller ? "Remove" : "Best Seller"}
                          </Button>
                          <Button size="sm" onClick={() => handleBookStatus(book.id, "suspended")} variant="outline" style={{ fontWeight: 700, fontSize: 12, padding: "5px 12px", color: "#374151" }}>
                            Suspend
                          </Button>
                        </>
                      )}
                      {book.status === "suspended" && (
                        <Button size="sm" onClick={() => handleBookStatus(book.id, "approved")} style={{ background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 12px" }}>
                          Reinstate
                        </Button>
                      )}
                      {book.status === "rejected" && (
                        <Button size="sm" onClick={() => handleBookStatus(book.id, "approved")} style={{ background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 12px" }}>
                          Re-approve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── AUTHOR APPLICATIONS ── */}
      {tab === "authors" && (
        <>
          {applications.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#aaa" }}>No author applications yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {applications.map(app => (
                <div key={app.id} style={{ background: "#fff", border: `1.5px solid ${app.status === "pending" ? GOLD + "88" : "#e5e7eb"}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: DARK }}>{app.name}</span>
                        <StatusBadge status={app.status} />
                      </div>
                      {app.bio && <div style={{ fontSize: 12, color: "#555", marginBottom: 4, lineHeight: 1.5 }}>{app.bio}</div>}
                      {app.categories && <div style={{ fontSize: 11, color: "#777" }}>Categories: {app.categories}</div>}
                      {app.website && <div style={{ fontSize: 11, color: "#1d6fa4" }}>{app.website}</div>}
                      {app.writingExperience && <div style={{ fontSize: 11, color: "#555", marginTop: 4, fontStyle: "italic" }}>{app.writingExperience}</div>}
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Applied {new Date(app.createdAt).toLocaleDateString()}</div>
                    </div>
                    {app.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button size="sm" onClick={() => handleAppStatus(app.id, "approved")} style={{ background: GREEN, color: "#fff", fontWeight: 700 }}>
                          <CheckCircle size={12} style={{ marginRight: 4 }} /> Approve
                        </Button>
                        <Button size="sm" onClick={() => handleAppStatus(app.id, "rejected")} variant="outline" style={{ color: RED, borderColor: RED, fontWeight: 700 }}>
                          <XCircle size={12} style={{ marginRight: 4 }} /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ROYALTY SETTINGS ── */}
      {tab === "royalties" && (
        <div>
          <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "22px 24px", marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: DARK, marginBottom: 4 }}>Platform Default Royalty Split</div>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 20, lineHeight: 1.6 }}>
              This default is applied to all new books. You can override the split per-book when adding or editing a book.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 14, maxWidth: 480, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Author Royalty %</label>
                <Input
                  value={defRoyalty.authorRoyaltyPct}
                  onChange={e => { const v = e.target.value; setDefRoyalty(p => ({ authorRoyaltyPct: v, platformFeePct: String(Math.max(0, 100 - (parseFloat(v) || 0))) })); }}
                  type="number" min="0" max="100"
                  style={{ fontSize: 18, fontWeight: 900, textAlign: "center", color: GREEN_D }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 6 }}>Platform Fee %</label>
                <Input
                  value={defRoyalty.platformFeePct}
                  onChange={e => { const v = e.target.value; setDefRoyalty(p => ({ platformFeePct: v, authorRoyaltyPct: String(Math.max(0, 100 - (parseFloat(v) || 0))) })); }}
                  type="number" min="0" max="100"
                  style={{ fontSize: 18, fontWeight: 900, textAlign: "center", color: "#7A6010" }}
                />
              </div>
              <Button onClick={handleSaveDefRoyalty} disabled={defRoyaltySaving} style={{ background: GREEN, color: "#fff", fontWeight: 800 }}>
                <Save size={14} style={{ marginRight: 6 }} /> {defRoyaltySaving ? "Saving…" : "Save"}
              </Button>
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: "#888" }}>
              Total must equal 100%. Currently: {parseFloat(defRoyalty.authorRoyaltyPct) + parseFloat(defRoyalty.platformFeePct)}%
              {parseFloat(defRoyalty.authorRoyaltyPct) + parseFloat(defRoyalty.platformFeePct) !== 100 && (
                <span style={{ color: RED, fontWeight: 700 }}> — Warning: does not total 100%</span>
              )}
            </div>
          </div>

          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: DARK, marginBottom: 8 }}>Custom Per-Book Splits</div>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, margin: 0 }}>
              To set a custom royalty split for a specific book, click <strong>Edit</strong> on that book in the Books tab and update its Author Royalty % and Platform Fee % directly.
            </p>
          </div>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: DARK, marginBottom: 8 }}>License Agreement</div>
            <div style={{ fontSize: 12, color: "#444", lineHeight: 1.8, fontStyle: "italic", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px" }}>
              "By purchasing this digital content, you are purchasing a limited, non-exclusive, non-transferable license to access and read the content through your NFGN account. Copyright ownership remains with the author and/or NFGN. Redistribution, resale, reproduction, sharing, uploading, copying, or commercial use is strictly prohibited without written permission."
            </div>
          </div>
        </div>
      )}

      {/* ── ADD BOOK ── */}
      {tab === "add" && (
        <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "24px 28px", maxWidth: 700 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: DARK, marginBottom: 6 }}>Add New Book to Store</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 20, background: "#fffbea", border: `1px solid ${GOLD}44`, borderRadius: 8, padding: "8px 12px" }}>
            Books added by Admin are published immediately (Approved). Author-submitted books require your review.
          </div>
          <BookForm value={addForm} onChange={setAddForm} onSubmit={handleAddBook} saving={addSaving} submitLabel="Publish Book to Store" />
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editBook && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "32px 16px" }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 700, padding: "28px 32px", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: DARK }}>Edit Book</div>
                <div style={{ fontSize: 12, color: "#888" }}>{editBook.title}</div>
              </div>
              <button onClick={() => setEditBook(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 8, color: "#555" }}>
                <X size={20} />
              </button>
            </div>
            <BookForm value={editForm} onChange={setEditForm} onSubmit={handleSaveEdit} saving={editSaving} submitLabel="Save Changes" />
          </div>
        </div>
      )}
    </div>
  );
}
