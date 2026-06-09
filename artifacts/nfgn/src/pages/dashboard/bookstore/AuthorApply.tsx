import { useState, useEffect } from "react";
import { Pen, CheckCircle2, Clock, XCircle, AlertTriangle, BookOpen } from "lucide-react";
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

const BOOK_CATEGORIES = [
  "Health & Wellness", "Faith & Spiritual Growth", "Marketplace Ministry",
  "Business & Leadership", "Herbal Education", "Nutrition", "Financial Education",
  "Personal Development", "NFGN Training", "Children's Books", "General",
];

interface Application {
  id: number; name: string; bio?: string; categories?: string; status: string;
  adminNote?: string; createdAt: string;
}

export function AuthorApplyPage() {
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "", bio: "", website: "", writingExperience: "",
    instagram: "", facebook: "", twitter: "", linkedin: "",
    agreedToTerms: false,
  });

  useEffect(() => {
    apiFetch("/api/bookstore/author/status")
      .then(d => { setApplication(d.application); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (me) setForm(f => ({ ...f, name: `${me.firstName} ${me.lastName}` }));
  }, [me]);

  function toggleCat(c: string) {
    setSelectedCats(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  async function handleSubmit() {
    if (!form.name || !form.agreedToTerms) {
      toast({ title: "Please complete all required fields and agree to terms", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const d = await apiFetch("/api/bookstore/author/apply", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          website: form.website,
          writingExperience: form.writingExperience,
          socialLinks: { instagram: form.instagram, facebook: form.facebook, twitter: form.twitter, linkedin: form.linkedin },
          categories: selectedCats.join(", "),
          agreedToTerms: true,
        }),
      });
      setApplication(d.application);
      toast({ title: "Application submitted! We'll review it shortly." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const STATUS_DISPLAY: Record<string, { icon: any; color: string; title: string; message: string }> = {
    pending: { icon: Clock, color: GOLD, title: "Application Under Review", message: "Thank you for applying! Our team is reviewing your application and will notify you shortly." },
    approved: { icon: CheckCircle2, color: GREEN, title: "Author Account Approved!", message: "Congratulations! You are now an approved NFGN author. You can submit books from the Author Dashboard." },
    rejected: { icon: XCircle, color: "#8B3A3A", title: "Application Not Approved", message: "Unfortunately your application was not approved at this time." },
    suspended: { icon: AlertTriangle, color: "#374151", title: "Account Suspended", message: "Your author account has been suspended. Please contact support for more information." },
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading…</div>;

  if (application) {
    const s = STATUS_DISPLAY[application.status] ?? STATUS_DISPLAY.pending;
    const Icon = s.icon;
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ background: "#fff", border: `2px solid ${s.color}44`, borderRadius: 16, padding: "36px 40px", textAlign: "center" }}>
          <Icon size={48} color={s.color} style={{ margin: "0 auto 16px", display: "block" }} />
          <div style={{ fontSize: 22, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", marginBottom: 8 }}>{s.title}</div>
          <div style={{ fontSize: 14, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>{s.message}</div>
          {application.adminNote && (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 16, fontStyle: "italic" }}>
              Admin note: "{application.adminNote}"
            </div>
          )}
          <div style={{ fontSize: 12, color: "#aaa" }}>Submitted {new Date(application.createdAt).toLocaleDateString()}</div>
          {application.status === "approved" && (
            <div style={{ marginTop: 24 }}>
              <a href="/dashboard/bookstore">
                <Button style={{ background: GREEN, color: "#fff", fontWeight: 800 }}>
                  <BookOpen size={14} style={{ marginRight: 6 }} /> Go to Bookstore
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: GREEN_M, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Pen size={22} color={GREEN} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: DARK, fontFamily: "Georgia, serif", margin: 0 }}>Become an NFGN Author</h1>
            <p style={{ fontSize: 13, color: "#666", margin: 0 }}>Share your knowledge and earn royalties on every sale</p>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(to right, ${GREEN}, transparent)`, borderRadius: 2 }} />
      </div>

      {/* Benefits */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Author Royalty", value: "Up to 80%", icon: "💰" },
          { label: "Your Audience", value: "NFGN Network", icon: "🌍" },
          { label: "Content Types", value: "Books & Audio", icon: "📚" },
          { label: "Your Rights", value: "Copyright Yours", icon: "🔒" },
        ].map(b => (
          <div key={b.label} style={{ background: GREEN_M, border: `1px solid ${GREEN}44`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{b.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: GREEN_D }}>{b.value}</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{b.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 14, padding: "28px 32px" }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: DARK, marginBottom: 20 }}>Author Application Form</div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Full Name / Pen Name *</label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name as you'd like it to appear on published works" />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Author Bio</label>
          <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell us about yourself, your background, and your expertise…" rows={4} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
        </div>

        {/* Website */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Website / Blog (optional)</label>
          <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://yourwebsite.com" />
        </div>

        {/* Writing Experience */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 4 }}>Writing Experience</label>
          <textarea value={form.writingExperience} onChange={e => setForm(f => ({ ...f, writingExperience: e.target.value }))} placeholder="Share any previous books, articles, courses, or teaching experience…" rows={3} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, resize: "vertical", fontFamily: "inherit" }} />
        </div>

        {/* Categories */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 8 }}>Writing Categories (select all that apply)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {BOOK_CATEGORIES.map(c => (
              <button
                key={c} type="button" onClick={() => toggleCat(c)}
                style={{
                  padding: "5px 12px", borderRadius: 16, border: `1.5px solid ${selectedCats.includes(c) ? GREEN : "#e5e7eb"}`,
                  background: selectedCats.includes(c) ? GREEN_M : "#f9f9f9",
                  color: selectedCats.includes(c) ? GREEN_D : "#555",
                  fontWeight: 700, fontSize: 12, cursor: "pointer",
                }}
              >{selectedCats.includes(c) && "✓ "}{c}</button>
            ))}
          </div>
        </div>

        {/* Social */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#555", display: "block", marginBottom: 10 }}>Social Media (optional)</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { key: "instagram", label: "Instagram" },
              { key: "facebook", label: "Facebook" },
              { key: "twitter", label: "Twitter/X" },
              { key: "linkedin", label: "LinkedIn" },
            ].map(s => (
              <div key={s.key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 3 }}>{s.label}</label>
                <Input value={(form as any)[s.key]} onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))} placeholder="@handle or URL" style={{ fontSize: 12 }} />
              </div>
            ))}
          </div>
        </div>

        {/* License / Terms */}
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#444", lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>
          As an NFGN Author, I understand that: (1) My submitted books require admin approval before publication. (2) I retain full copyright ownership of my work. (3) I am granting NFGN a non-exclusive license to distribute my content through the NFGN platform. (4) Royalties are paid per the agreed split (default 70% author / 30% platform) and may be modified per individual agreements. (5) NFGN may feature, promote, or spotlight my content at its discretion.
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 24 }}>
          <input type="checkbox" id="agree" checked={form.agreedToTerms} onChange={e => setForm(f => ({ ...f, agreedToTerms: e.target.checked }))} style={{ marginTop: 2, width: 16, height: 16 }} />
          <label htmlFor="agree" style={{ fontSize: 13, fontWeight: 700, color: DARK, cursor: "pointer", lineHeight: 1.5 }}>
            I agree to the Author Terms and understand the royalty structure and platform guidelines.
          </label>
        </div>

        <Button onClick={handleSubmit} disabled={saving || !form.agreedToTerms} style={{ background: form.agreedToTerms ? GREEN : "#ccc", color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px 28px", borderRadius: 10 }}>
          {saving ? "Submitting…" : "Submit Author Application"}
        </Button>
      </div>
    </div>
  );
}
