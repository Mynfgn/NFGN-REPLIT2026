import { useState, useEffect, useRef } from "react";
import { BookOpen, Users, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Star, AlertTriangle, Plus, Search, Filter, Edit3, Eye, Trash2, ChevronDown, Percent, BookMarked, Mic, FileText, GraduationCap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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

function KpiCard({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub?: string; color: string; icon: any }) {
  return (
    <div style={{ background: "#fff", border: `1.5px solid ${color}44`, borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={color} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: DARK }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

interface Book {
  id: number; title: string; authorName: string; category: string; type: string;
  price: number; isFree: boolean; status: string; isFeatured: boolean; isBestSeller: boolean; isStaffPick: boolean;
  totalSales: number; createdAt: string; authorRoyaltyPct: number; platformFeePct: number;
  description?: string; shortDescription?: string; coverImage?: string; fileUrl?: string; audioUrl?: string;
  pageCount?: number; duration?: string; language?: string; tags?: string; isbn?: string; adminNote?: string;
}
interface AuthorApp { id: number; userId: number; name: string; bio?: string; website?: string; writingExperience?: string; categories?: string; status: string; adminNote?: string; createdAt: string; }
interface Stats { totalBooks: number; pendingBooks: number; approvedBooks: number; totalPurchases: number; totalAuthors: number; pendingAuthors: number; totalRevenue: number; monthlyRevenue: number; }

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
  const [form, setForm] = useState({ title: "", subtitle: "", authorName: "", shortDescription: "", description: "", category: "Health & Wellness", type: "ebook", price: "", isFree: false, authorRoyaltyPct: "70", platformFeePct: "30", coverImage: "", fileUrl: "", audioUrl: "", language: "English", tags: "", isbn: "", isFeatured: false, isStaffPick: false });
  const [saving, setSaving] = useState(false);

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

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { if (tab === "books") loadBooks(); }, [tab, statusFilter]);
  useEffect(() => { if (tab === "authors") loadApplications(); }, [tab]);

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
    if (!form.title || !form.authorName) { toast({ title: "Title and author name are required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await apiFetch("/api/bookstore/admin/books", { method: "POST", body: JSON.stringify({ ...form, price: parseFloat(form.price) || 0, authorRoyaltyPct: parseFloat(form.authorRoyaltyPct), platformFeePct: parseFloat(form.platformFeePct) }) });
      toast({ title: "Book added to store!" });
      setTab("books"); loadBooks(); loadStats();
      setForm({ title: "", subtitle: "", authorName: "", shortDescription: "", description: "", category: "Health & Wellness", type: "ebook", price: "", isFree: false, authorRoyaltyPct: "70", platformFeePct: "30", coverImage: "", fileUrl: "", audioUrl: "", language: "English", tags: "", isbn: "", isFeatured: false, isStaffPick: false });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setSaving(false); }
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
            <h1 style={{ fontSize: 24, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>NFGN Digital Book Store™</h1>
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
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 800, fontSize: 13, transition: "all .15s",
              background: tab === t.key ? DARK : "transparent",
              color: tab === t.key ? "#fff" : "#555",
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
            <KpiCard label="Total Books" value={stats.totalBooks} sub={`${stats.approvedBooks} live`} color={GREEN} icon={BookOpen} />
            <KpiCard label="Pending Approval" value={stats.pendingBooks} sub="awaiting review" color={GOLD} icon={Clock} />
            <KpiCard label="Total Sales" value={stats.totalPurchases} sub="all time" color="#1d6fa4" icon={TrendingUp} />
            <KpiCard label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} sub="platform + royalties" color="#7B2D8B" icon={DollarSign} />
            <KpiCard label="Monthly Revenue" value={`$${stats.monthlyRevenue.toFixed(2)}`} sub="this month" color={GREEN} icon={TrendingUp} />
            <KpiCard label="Approved Authors" value={stats.totalAuthors} sub={`${stats.pendingAuthors} pending`} color="#B5651D" icon={Users} />
          </div>
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
                <div key={book.id} style={{ background: "#fff", border: `1.5px solid ${book.status === "pending" ? GOLD : "#e5e7eb"}`, borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: DARK }}>{book.title}</span>
                        <StatusBadge status={book.status} />
                        {book.isFeatured && <span style={{ background: `${GOLD}20`, color: "#7A6010", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>★ Featured</span>}
                        {book.isBestSeller && <span style={{ background: "#e0f2fe", color: "#0369a1", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>🏆 Bestseller</span>}
                        {book.isStaffPick && <span style={{ background: GREEN_M, color: GREEN_D, borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>👍 Staff Pick</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "#555" }}>By {book.authorName} · {book.category} · {BOOK_TYPES.find(t => t.value === book.type)?.label ?? book.type}</div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                        {book.isFree ? "Free" : `$${book.price.toFixed(2)}`} · {book.totalSales} sales · Royalty: {book.authorRoyaltyPct}% / Platform: {book.platformFeePct}%
                      </div>
                      {book.shortDescription && <div style={{ fontSize: 12, color: "#666", marginTop: 6, lineHeight: 1.5, maxWidth: 500 }}>{book.shortDescription}</div>}
                      {book.adminNote && <div style={{ fontSize: 11, color: RED, marginTop: 4, fontStyle: "italic" }}>Admin note: {book.adminNote}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
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
              This is the default split applied to all new books. You can override this per-book, per-author, or per-category when adding or editing a book.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 400 }}>
              <div style={{ background: GREEN_M, border: `1px solid ${GREEN}44`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GREEN_D, textTransform: "uppercase", marginBottom: 4 }}>Author Royalty</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: GREEN_D }}>70%</div>
              </div>
              <div style={{ background: "#FBF5DC", border: `1px solid ${GOLD}44`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#7A6010", textTransform: "uppercase", marginBottom: 4 }}>Platform Fee</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#7A6010" }}>30%</div>
              </div>
            </div>
          </div>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: DARK, marginBottom: 8 }}>Custom Splits</div>
            <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, margin: 0 }}>
              To set a custom royalty split for a specific book, edit that book's royalty percentages directly in the Books tab. The platform supports per-book, per-author, and per-category overrides. A fixed dollar platform fee can also be applied by setting platform fee to 0 and managing the split manually.
            </p>
          </div>
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 22px", marginTop: 16 }}>
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
          <div style={{ fontSize: 16, fontWeight: 900, color: DARK, marginBottom: 20 }}>Add New Book to Store</div>

          {[
            { label: "Book Title *", key: "title", placeholder: "e.g. The Healing Power of Nature" },
            { label: "Subtitle", key: "subtitle", placeholder: "Optional subtitle" },
            { label: "Author Name *", key: "authorName", placeholder: "e.g. Dr. Jane Smith" },
            { label: "ISBN / Reference", key: "isbn", placeholder: "Optional" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>{f.label}</label>
              <Input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
                {BOOK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Content Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }}>
                {BOOK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Short Description (shown in store listing)</label>
            <textarea value={form.shortDescription} onChange={e => setForm(p => ({ ...p, shortDescription: e.target.value }))} placeholder="2–3 sentences for the store card…" rows={2} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Full Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Full book description…" rows={4} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Price ($)</label>
              <Input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0.00" type="number" min="0" step="0.01" disabled={form.isFree} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Author Royalty %</label>
              <Input value={form.authorRoyaltyPct} onChange={e => setForm(p => ({ ...p, authorRoyaltyPct: e.target.value, platformFeePct: String(100 - parseFloat(e.target.value) || 30) }))} type="number" min="0" max="100" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Platform Fee %</label>
              <Input value={form.platformFeePct} onChange={e => setForm(p => ({ ...p, platformFeePct: e.target.value, authorRoyaltyPct: String(100 - parseFloat(e.target.value) || 70) }))} type="number" min="0" max="100" />
            </div>
          </div>

          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" id="isFree" checked={form.isFree} onChange={e => setForm(p => ({ ...p, isFree: e.target.checked, price: e.target.checked ? "0" : p.price }))} />
            <label htmlFor="isFree" style={{ fontSize: 13, fontWeight: 700, color: "#555", cursor: "pointer" }}>This is a FREE book / resource</label>
          </div>

          {[
            { label: "Cover Image URL", key: "coverImage", placeholder: "https://…" },
            { label: "File URL (PDF / EPUB)", key: "fileUrl", placeholder: "https://… (accessible to buyers only)" },
            { label: "Audio URL (Audiobook MP3/M4A)", key: "audioUrl", placeholder: "https://… (audiobooks only)" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>{f.label}</label>
              <Input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
            </div>
          ))}

          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            {[
              { key: "isFeatured", label: "Featured Book" },
              { key: "isStaffPick", label: "Staff Pick" },
            ].map(c => (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="checkbox" id={c.key} checked={(form as any)[c.key]} onChange={e => setForm(p => ({ ...p, [c.key]: e.target.checked }))} />
                <label htmlFor={c.key} style={{ fontSize: 13, fontWeight: 700, color: "#555", cursor: "pointer" }}>{c.label}</label>
              </div>
            ))}
          </div>

          <div style={{ background: "#fffbea", border: `1px solid ${GOLD}44`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#7A6010", marginBottom: 20, lineHeight: 1.6 }}>
            <strong>Note:</strong> Books added by Admin are published immediately (Approved status). Author-submitted books require your approval before going live.
          </div>

          <Button onClick={handleAddBook} disabled={saving} style={{ background: GREEN, color: "#fff", fontWeight: 800, padding: "12px 24px", borderRadius: 10, fontSize: 14 }}>
            {saving ? "Adding…" : "Publish Book to Store"}
          </Button>
        </div>
      )}
    </div>
  );
}
