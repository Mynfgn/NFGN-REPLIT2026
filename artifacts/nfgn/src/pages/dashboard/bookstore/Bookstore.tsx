import { useState, useEffect } from "react";
import { BookOpen, Search, Star, TrendingUp, Mic, FileText, BookMarked, GraduationCap, ShoppingCart, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useGetMe } from "@workspace/api-client-react";

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

const CATEGORIES = [
  "all", "Health & Wellness", "Faith & Spiritual Growth", "Marketplace Ministry",
  "Business & Leadership", "Herbal Education", "Nutrition", "Financial Education",
  "Personal Development", "NFGN Training", "Children's Books", "General",
];

const TYPE_ICONS: Record<string, any> = {
  ebook: BookOpen, audiobook: Mic, training_manual: FileText,
  guide: GraduationCap, bible_study: BookMarked,
};

const TYPE_LABELS: Record<string, string> = {
  ebook: "eBook", audiobook: "Audiobook", training_manual: "Manual",
  guide: "Guide", bible_study: "Bible Study",
};

interface Book {
  id: number; title: string; subtitle?: string; authorName: string; category: string; type: string;
  shortDescription?: string; description?: string; coverImage?: string;
  price: number; isFree: boolean; isFeatured: boolean; isBestSeller: boolean; isStaffPick: boolean;
  totalSales: number; purchased: boolean; hasSample: boolean;
}

function BookCard({ book, onPurchase, purchasing }: { book: Book; onPurchase: (b: Book) => void; purchasing: boolean }) {
  const TypeIcon = TYPE_ICONS[book.type] ?? BookOpen;
  return (
    <div style={{ background: "#fff", border: `1.5px solid ${book.isFeatured ? GOLD : "#e5e7eb"}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", transition: "box-shadow .15s" }}>
      {/* Cover */}
      <div style={{ height: 180, background: `linear-gradient(135deg, ${GREEN}22, ${GOLD}22)`, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {book.coverImage ? (
          <img src={book.coverImage} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <TypeIcon size={48} color={GREEN} style={{ opacity: 0.4 }} />
        )}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {book.isFeatured && <span style={{ background: GOLD, color: "#fff", borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>★ Featured</span>}
          {book.isBestSeller && <span style={{ background: "#0369a1", color: "#fff", borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>🏆 Bestseller</span>}
          {book.isStaffPick && <span style={{ background: GREEN_D, color: "#fff", borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>👍 Staff Pick</span>}
        </div>
        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 8, padding: "2px 8px", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <TypeIcon size={10} /> {TYPE_LABELS[book.type] ?? book.type}
        </div>
        {book.purchased && (
          <div style={{ position: "absolute", bottom: 8, right: 8, background: GREEN, color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
            <Check size={11} /> In Library
          </div>
        )}
      </div>
      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: DARK, marginBottom: 2, lineHeight: 1.3 }}>{book.title}</div>
        {book.subtitle && <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{book.subtitle}</div>}
        <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, marginBottom: 6 }}>by {book.authorName}</div>
        <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5, flex: 1, marginBottom: 12 }}>
          {book.shortDescription ?? book.description?.slice(0, 100) ?? ""}
          {(book.description ?? "").length > 100 ? "…" : ""}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: book.isFree ? GREEN : DARK }}>
            {book.isFree ? "Free" : `$${book.price.toFixed(2)}`}
          </div>
          {book.purchased ? (
            <a href={`/dashboard/read/${book.id}`} style={{ textDecoration: "none" }}>
              <Button size="sm" style={{ background: GREEN, color: "#fff", fontWeight: 700, fontSize: 12, padding: "6px 14px" }}>
                <BookOpen size={12} style={{ marginRight: 4 }} /> Read Now
              </Button>
            </a>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <Button size="sm" onClick={() => onPurchase(book)} disabled={purchasing} style={{ background: DARK, color: "#fff", fontWeight: 700, fontSize: 12, padding: "6px 14px" }}>
                {purchasing ? <Loader2 size={12} style={{ marginRight: 4, animation: "spin 1s linear infinite" }} /> : <ShoppingCart size={12} style={{ marginRight: 4 }} />}
                {book.isFree ? "Add Free" : "Buy Now"}
              </Button>
              {book.hasSample && (
                <a href={`/dashboard/read/${book.id}?sample=true`} style={{ textDecoration: "none" }}>
                  <button style={{ background: "none", border: `1.5px solid ${GREEN}`, color: GREEN, borderRadius: 6, padding: "4px 12px", fontWeight: 700, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <BookOpen size={10} /> Read Sample
                  </button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BookstorePage() {
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [licenseModal, setLicenseModal] = useState<Book | null>(null);
  const [licenseAgreed, setLicenseAgreed] = useState(false);

  async function loadBooks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("q", search);
      const d = await apiFetch(`/api/bookstore/books?${params}`);
      setBooks(d.books);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { loadBooks(); }, [category]);
  useEffect(() => {
    const t = setTimeout(loadBooks, 350);
    return () => clearTimeout(t);
  }, [search]);

  async function confirmPurchase() {
    if (!licenseModal || !licenseAgreed) return;
    const book = licenseModal;
    setLicenseModal(null);
    setPurchasingId(book.id);
    try {
      if (book.isFree) {
        // Free books: direct library grant
        const d = await apiFetch(`/api/bookstore/books/${book.id}/purchase`, {
          method: "POST", body: JSON.stringify({ licenseAgreed: true }),
        });
        toast({ title: d.message ?? "Added to library!" });
        loadBooks();
      } else {
        // Paid books: add to cart then go to checkout
        const d = await apiFetch(`/api/bookstore/cart/books/${book.id}`, { method: "POST" });
        if (d.alreadyOwned) {
          toast({ title: "Already in your library!" });
          loadBooks();
        } else {
          toast({ title: "Added to cart!", description: "Complete your purchase at checkout." });
          window.location.href = "/shop";
        }
      }
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setPurchasingId(null); setLicenseAgreed(false); }
  }

  const featured = books.filter(b => b.isFeatured);
  const bestsellers = books.filter(b => b.isBestSeller);
  const allBooks = books;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={24} color={GREEN} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>NFGN Digital Book Store™</h1>
            <p style={{ fontSize: 13, color: "#666", margin: 0 }}>eBooks · Audiobooks · Training · Health Guides · Bible Studies</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search books, authors, topics…" style={{ paddingLeft: 42, fontSize: 14, height: 44 }} />
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 28 }}>
        {CATEGORIES.map(c => (
          <button
            key={c} onClick={() => setCategory(c)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${category === c ? GREEN : "#e5e7eb"}`,
              background: category === c ? GREEN : "#fff",
              color: category === c ? "#fff" : "#555",
              fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all .12s",
            }}
          >{c === "all" ? "All Books" : c}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "#888" }}>
          <Loader2 size={28} color={GREEN} style={{ margin: "0 auto 12px", display: "block", animation: "spin 1s linear infinite" }} />
          Loading books…
        </div>
      ) : books.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "#aaa" }}>
          <BookOpen size={40} color="#ddd" style={{ margin: "0 auto 12px", display: "block" }} />
          No books found. Check back soon!
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured.length > 0 && !search && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Star size={16} color={GOLD} />
                <span style={{ fontSize: 16, fontWeight: 900, color: DARK }}>Featured Books</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {featured.map(b => <BookCard key={b.id} book={b} onPurchase={setLicenseModal} purchasing={purchasingId === b.id} />)}
              </div>
            </div>
          )}

          {/* Bestsellers */}
          {bestsellers.length > 0 && !search && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <TrendingUp size={16} color="#0369a1" />
                <span style={{ fontSize: 16, fontWeight: 900, color: DARK }}>Bestsellers</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {bestsellers.map(b => <BookCard key={b.id} book={b} onPurchase={setLicenseModal} purchasing={purchasingId === b.id} />)}
              </div>
            </div>
          )}

          {/* All Books */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: DARK, marginBottom: 14 }}>
              {search ? `Search Results (${books.length})` : category === "all" ? "All Books" : category}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {(search ? books : allBooks).map(b => <BookCard key={b.id} book={b} onPurchase={setLicenseModal} purchasing={purchasingId === b.id} />)}
            </div>
          </div>

          {/* Become an author CTA */}
          <div style={{ marginTop: 48, background: `linear-gradient(135deg, ${GREEN_D}, ${GREEN})`, borderRadius: 16, padding: "32px 36px", color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "Georgia, serif", marginBottom: 8 }}>Are You an Author?</div>
            <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 20, lineHeight: 1.6 }}>
              Share your knowledge with the NFGN community. Apply to become an author and earn royalties on every sale.
            </div>
            <a href="/dashboard/author/apply" style={{ textDecoration: "none" }}>
              <Button style={{ background: GOLD, color: DARK, fontWeight: 900, fontSize: 14, padding: "12px 28px", borderRadius: 10 }}>
                Apply to Become an Author
              </Button>
            </a>
          </div>
        </>
      )}

      {/* License Modal */}
      {licenseModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 32px", maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: DARK }}>{licenseModal.title}</div>
                <div style={{ fontSize: 13, color: "#666" }}>by {licenseModal.authorName} · {licenseModal.isFree ? "FREE" : `$${licenseModal.price.toFixed(2)}`}</div>
              </div>
              <button onClick={() => { setLicenseModal(null); setLicenseAgreed(false); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#aaa" />
              </button>
            </div>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#444", lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>
              By purchasing this digital content, you are purchasing a <strong>limited, non-exclusive, non-transferable license</strong> to access and read the content through your NFGN account. Copyright ownership remains with the author and/or NFGN. Redistribution, resale, reproduction, sharing, uploading, copying, or commercial use is strictly prohibited without written permission.
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24 }}>
              <input type="checkbox" id="license" checked={licenseAgreed} onChange={e => setLicenseAgreed(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16 }} />
              <label htmlFor="license" style={{ fontSize: 13, fontWeight: 700, color: DARK, cursor: "pointer", lineHeight: 1.5 }}>
                I agree to the Digital License Terms and understand that I am purchasing a license to read, not ownership of the content.
              </label>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={confirmPurchase} disabled={!licenseAgreed} style={{ flex: 1, background: licenseAgreed ? GREEN : "#ccc", color: "#fff", fontWeight: 800, fontSize: 14 }}>
                {licenseModal.isFree ? "Add to My Library (Free)" : `Purchase for $${licenseModal.price.toFixed(2)}`}
              </Button>
              <Button onClick={() => { setLicenseModal(null); setLicenseAgreed(false); }} variant="outline" style={{ fontWeight: 700 }}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
