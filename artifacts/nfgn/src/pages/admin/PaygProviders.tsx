import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Search, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  AlertCircle, Clock, ShieldCheck, ShieldX, Ban, RefreshCw,
  Building2, User, Globe, Phone, Mail, FileText, Image, ExternalLink,
} from "lucide-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:                      { label: "Draft",                color: "#888",    bg: "#f4f4f4" },
  pending_submission:         { label: "Incomplete",           color: "#F59E0B", bg: "#fffbeb" },
  pending_review:             { label: "Pending Review",       color: "#3B82F6", bg: "#eff6ff" },
  additional_info_requested:  { label: "Info Requested",       color: "#8B5CF6", bg: "#f5f3ff" },
  approved:                   { label: "Approved",             color: "#10B981", bg: "#f0fdf4" },
  rejected:                   { label: "Rejected",             color: "#EF4444", bg: "#fef2f2" },
  suspended:                  { label: "Suspended",            color: "#F97316", bg: "#fff7ed" },
};

interface Application {
  id: number;
  userId: number;
  status: string;
  businessName: string | null;
  businessAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  website: string | null;
  businessDescription: string | null;
  businessType: string | null;
  facebook: string | null;
  instagram: string | null;
  googleBusiness: string | null;
  otherListings: string | null;
  ownerName: string | null;
  ownerContact: string | null;
  businessLicense: string | null;
  certifications: string[] | null;
  licenses: string[] | null;
  insurance: string | null;
  taxDocs: string[] | null;
  locationPhotos: string[] | null;
  certifiedAccurate: boolean;
  adminNotes: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  // Joined
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  userRole?: string;
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("nfgn_token")}` };
}
function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#888", bg: "#f4f4f4" };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
      {cfg.label}
    </span>
  );
}

function DocLink({ label, url }: { label: string; url: string | null | undefined }) {
  if (!url) return <span style={{ color: "#bbb", fontSize: 12 }}>—</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: GOLD, fontWeight: 600, textDecoration: "none" }}>
      <ExternalLink size={11} /> {label}
    </a>
  );
}

function DocLinks({ label, urls }: { label: string; urls: string[] | null | undefined }) {
  if (!urls || urls.length === 0) return <span style={{ color: "#bbb", fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {urls.map((u, i) => <DocLink key={i} label={`${label} ${i + 1}`} url={u} />)}
    </div>
  );
}

export function PaygProvidersPage() {
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/payg/providers", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        setApps(d.applications ?? []);
        const initNotes: Record<number, string> = {};
        (d.applications ?? []).forEach((a: Application) => { initNotes[a.id] = a.adminNotes ?? ""; });
        setNotes(initNotes);
      })
      .catch(() => toast({ title: "Failed to load applications", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: number, status: string) {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/payg/providers/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status, adminNotes: notes[id] ?? "" }),
      });
      if (!res.ok) { toast({ title: "Update failed", variant: "destructive" }); return; }
      toast({ title: `Application ${status.replace(/_/g, " ")}` });
      load();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSaving(null); }
  }

  async function saveNotes(id: number) {
    setSaving(id);
    try {
      await fetch(`/api/admin/payg/providers/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ adminNotes: notes[id] ?? "" }),
      });
      toast({ title: "Notes saved" });
    } finally { setSaving(null); }
  }

  const filtered = apps.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (a.businessName ?? "").toLowerCase().includes(q) ||
      (a.ownerName ?? "").toLowerCase().includes(q) ||
      (a.userEmail ?? "").toLowerCase().includes(q) ||
      (a.businessEmail ?? "").toLowerCase().includes(q) ||
      (a.businessType ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: apps.length,
    pending_review: apps.filter(a => a.status === "pending_review").length,
    additional_info_requested: apps.filter(a => a.status === "additional_info_requested").length,
    approved: apps.filter(a => a.status === "approved").length,
    rejected: apps.filter(a => a.status === "rejected").length,
    suspended: apps.filter(a => a.status === "suspended").length,
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <ShieldCheck size={22} style={{ color: GOLD }} />
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, fontWeight: 900, margin: 0 }}>
            Pay As You Go Provider Approvals
          </h1>
        </div>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>
          Review, verify, and approve business provider applications for Pay As You Go services.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        {[
          { key: "all",                      label: "Total",         icon: FileText,    color: "#555" },
          { key: "pending_review",            label: "Pending Review",icon: Clock,       color: "#3B82F6" },
          { key: "additional_info_requested", label: "Info Needed",  icon: AlertCircle, color: "#8B5CF6" },
          { key: "approved",                  label: "Approved",     icon: CheckCircle2,color: "#10B981" },
          { key: "rejected",                  label: "Rejected",     icon: XCircle,     color: "#EF4444" },
          { key: "suspended",                 label: "Suspended",    icon: Ban,         color: "#F97316" },
        ].map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setFilterStatus(key)}
            style={{ background: filterStatus === key ? "#0a0a0a" : "#fff", color: filterStatus === key ? "#fff" : "#333", border: `1px solid ${filterStatus === key ? "#0a0a0a" : "#e5e5e5"}`, borderRadius: 10, padding: "12px 18px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, cursor: "pointer", minWidth: 110, transition: "all 0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon size={14} style={{ color: filterStatus === key ? "#fff" : color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: filterStatus === key ? "#aaa" : "#888" }}>{label}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900 }}>{counts[key as keyof typeof counts] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa" }} />
        <Input placeholder="Search by business name, owner, or email…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }} />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}><Loader2 className="animate-spin" style={{ color: GOLD, margin: "0 auto" }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "#fafafa", borderRadius: 12, border: "1px dashed #ddd" }}>
          <Building2 size={36} style={{ color: "#ddd", margin: "0 auto 12px" }} />
          <p style={{ color: "#888", fontSize: 14 }}>No applications found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(app => {
            const isOpen = expanded === app.id;
            const cfg = STATUS_CONFIG[app.status] ?? { label: app.status, color: "#888", bg: "#f4f4f4" };
            const isSavingThis = saving === app.id;
            return (
              <div key={app.id} style={{ background: "#fff", borderRadius: 12, border: `1px solid ${app.status === "pending_review" ? "#3B82F640" : "#e5e5e5"}`, overflow: "hidden", boxShadow: app.status === "pending_review" ? "0 0 0 2px #3B82F620" : undefined }}>
                {/* Row header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }}
                  onClick={() => setExpanded(isOpen ? null : app.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
                      <span style={{ fontWeight: 800, fontSize: 15 }}>{app.businessName ?? "(No Business Name)"}</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <div style={{ fontSize: 12, color: "#666", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>{app.userFirstName} {app.userLastName} · {app.userEmail}</span>
                      {app.businessType && <span style={{ color: GOLD, fontWeight: 600 }}>{app.businessType}</span>}
                      {app.city && app.state && <span>{app.city}, {app.state}</span>}
                      <span style={{ color: "#aaa" }}>Submitted: {fmtDate(app.submittedAt)}</span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={16} style={{ color: "#aaa", flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: "#aaa", flexShrink: 0 }} />}
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #f0f0f0", padding: "20px 18px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 20 }}>
                      {/* Business Info */}
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: 13, color: "#333", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <Building2 size={13} style={{ color: GOLD }} /> Business Information
                        </h4>
                        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px", fontSize: 12 }}>
                          {[
                            ["Business Name", app.businessName],
                            ["Type", app.businessType],
                            ["Address", [app.businessAddress, app.city, app.state, app.zipCode, app.country].filter(Boolean).join(", ")],
                            ["Phone", app.businessPhone],
                            ["Email", app.businessEmail],
                            ["Description", app.businessDescription],
                          ].map(([l, v]) => v && (
                            <><dt key={`dt-${l}`} style={{ color: "#888", fontWeight: 600, whiteSpace: "nowrap" }}>{l}</dt>
                            <dd key={`dd-${l}`} style={{ color: "#333", margin: 0 }}>{v}</dd></>
                          ))}
                        </dl>
                      </div>

                      {/* Owner & Membership */}
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: 13, color: "#333", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <User size={13} style={{ color: GOLD }} /> Owner & Account
                        </h4>
                        <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px", fontSize: 12 }}>
                          {[
                            ["Owner", app.ownerName],
                            ["Contact", app.ownerContact],
                            ["NFGN Account", `${app.userFirstName} ${app.userLastName}`],
                            ["Email", app.userEmail],
                            ["Role", app.userRole],
                            ["Certified", app.certifiedAccurate ? "✓ Yes" : "✗ No"],
                          ].map(([l, v]) => v && (
                            <><dt key={`dt-${l}`} style={{ color: "#888", fontWeight: 600, whiteSpace: "nowrap" }}>{l}</dt>
                            <dd key={`dd-${l}`} style={{ color: "#333", margin: 0 }}>{v}</dd></>
                          ))}
                        </dl>
                      </div>

                      {/* Online Presence */}
                      {(app.website || app.facebook || app.instagram || app.googleBusiness || app.otherListings) && (
                        <div>
                          <h4 style={{ fontWeight: 800, fontSize: 13, color: "#333", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                            <Globe size={13} style={{ color: GOLD }} /> Online Presence
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {app.website && <DocLink label="Website" url={app.website} />}
                            {app.facebook && <DocLink label="Facebook" url={app.facebook} />}
                            {app.instagram && <DocLink label="Instagram" url={app.instagram} />}
                            {app.googleBusiness && <DocLink label="Google Business" url={app.googleBusiness} />}
                            {app.otherListings && <span style={{ fontSize: 12, color: "#555" }}>{app.otherListings}</span>}
                          </div>
                        </div>
                      )}

                      {/* Documents */}
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: 13, color: "#333", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <FileText size={13} style={{ color: GOLD }} /> Submitted Documents
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div><span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Business License: </span><DocLink label="View" url={app.businessLicense} /></div>
                          <div><span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Certifications: </span><DocLinks label="Cert" urls={app.certifications} /></div>
                          <div><span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Licenses: </span><DocLinks label="License" urls={app.licenses} /></div>
                          <div><span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Insurance: </span><DocLink label="View" url={app.insurance} /></div>
                          <div><span style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>Tax Docs: </span><DocLinks label="Tax Doc" urls={app.taxDocs} /></div>
                        </div>
                      </div>

                      {/* Location Photos */}
                      <div>
                        <h4 style={{ fontWeight: 800, fontSize: 13, color: "#333", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <Image size={13} style={{ color: GOLD }} /> Location Photos ({app.locationPhotos?.length ?? 0})
                        </h4>
                        {app.locationPhotos && app.locationPhotos.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {app.locationPhotos.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer">
                                <img src={url} alt={`Location ${i + 1}`}
                                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e5e5" }}
                                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              </a>
                            ))}
                          </div>
                        ) : <span style={{ fontSize: 12, color: "#bbb" }}>No photos submitted</span>}
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#333", display: "block", marginBottom: 6 }}>Internal Admin Notes</label>
                      <Textarea
                        value={notes[app.id] ?? ""}
                        onChange={e => setNotes(n => ({ ...n, [app.id]: e.target.value }))}
                        placeholder="Add internal notes about this application…"
                        rows={3}
                        style={{ fontSize: 13 }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                      {app.status !== "approved" && (
                        <Button size="sm" disabled={isSavingThis} onClick={() => updateStatus(app.id, "approved")}
                          style={{ background: "#10B981", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                          {isSavingThis ? <Loader2 size={12} className="animate-spin mr-1" /> : <CheckCircle2 size={12} className="mr-1" />}
                          Approve
                        </Button>
                      )}
                      {app.status !== "rejected" && (
                        <Button size="sm" variant="outline" disabled={isSavingThis} onClick={() => updateStatus(app.id, "rejected")}
                          style={{ color: "#EF4444", borderColor: "#EF444440", fontWeight: 700, fontSize: 12 }}>
                          <XCircle size={12} className="mr-1" /> Reject
                        </Button>
                      )}
                      {app.status !== "additional_info_requested" && (
                        <Button size="sm" variant="outline" disabled={isSavingThis} onClick={() => updateStatus(app.id, "additional_info_requested")}
                          style={{ color: "#8B5CF6", borderColor: "#8B5CF640", fontWeight: 700, fontSize: 12 }}>
                          <AlertCircle size={12} className="mr-1" /> Request More Info
                        </Button>
                      )}
                      {app.status !== "suspended" && app.status === "approved" && (
                        <Button size="sm" variant="outline" disabled={isSavingThis} onClick={() => updateStatus(app.id, "suspended")}
                          style={{ color: "#F97316", borderColor: "#F9731640", fontWeight: 700, fontSize: 12 }}>
                          <Ban size={12} className="mr-1" /> Suspend
                        </Button>
                      )}
                      {app.status === "suspended" && (
                        <Button size="sm" variant="outline" disabled={isSavingThis} onClick={() => updateStatus(app.id, "approved")}
                          style={{ color: "#10B981", borderColor: "#10B98140", fontWeight: 700, fontSize: 12 }}>
                          <RefreshCw size={12} className="mr-1" /> Reinstate
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={isSavingThis} onClick={() => saveNotes(app.id)}
                        style={{ fontWeight: 700, fontSize: 12, marginLeft: "auto" }}>
                        {isSavingThis ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                        Save Notes
                      </Button>
                    </div>
                    {app.reviewedAt && (
                      <p style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>Last reviewed: {fmtDate(app.reviewedAt)}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
