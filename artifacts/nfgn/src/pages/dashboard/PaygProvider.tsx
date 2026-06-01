import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Plus, Pencil, Trash2, CalendarDays, Zap, Clock,
  CheckCircle2, XCircle, AlertCircle, RefreshCw, DollarSign,
  ShieldCheck, Building2, Upload, X, Star, ChevronRight, ChevronLeft,
  Ban, FileText, Image, Info,
} from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Service { id: number; name: string; description: string | null; price: number; cv: number; isActive: boolean; sortOrder: number; }
interface Slot { id: number; availableDate: string; startTime: string; endTime: string; maxChairs: number; notes: string | null; isBlocked: boolean; }
interface Booking { id: number; customerId: number; bookingDate: string; startTime: string; numHours: number; serviceName: string; providerName: string; totalPrice: number; cvGenerated: number; status: string; paymentStatus: string; notes: string | null; adminNote: string | null; createdAt: string; }
interface Application {
  id: number; userId: number; status: string;
  businessName: string | null; businessAddress: string | null; city: string | null;
  state: string | null; zipCode: string | null; country: string | null;
  businessPhone: string | null; businessEmail: string | null; website: string | null;
  businessDescription: string | null; businessType: string | null;
  facebook: string | null; instagram: string | null; googleBusiness: string | null; otherListings: string | null;
  ownerName: string | null; ownerContact: string | null;
  businessLicense: string | null; certifications: string[] | null;
  licenses: string[] | null; insurance: string | null; taxDocs: string[] | null;
  locationPhotos: string[] | null; certifiedAccurate: boolean; adminNotes: string | null;
  submittedAt: string | null;
}

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("nfgn_token")}` };
}
function fmt(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtTime(t: string) { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${m.toString().padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`; }

const BUSINESS_TYPES = [
  "Hair Salon", "Barber Shop", "Nail Salon", "Day Spa", "Massage Therapy Business",
  "Wellness Center", "Fitness Studio", "Dance Studio", "Tutoring Center",
  "Photography Studio", "Event Venue", "Professional Service Provider", "Other",
];

// ── Upload helper ─────────────────────────────────────────────────────────────
async function uploadFile(file: File): Promise<string> {
  const res = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("nfgn_token")}` },
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  });
  if (!res.ok) throw new Error("Could not get upload URL");
  const { uploadURL, objectPath } = await res.json();
  await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return objectPath as string;
}

// ── File Upload Button ────────────────────────────────────────────────────────
function FileUploadButton({ label, accept, onUploaded, current }: {
  label: string; accept?: string;
  onUploaded: (path: string) => void;
  current?: string | null;
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file);
      onUploaded(path);
    } catch { alert("Upload failed. Please try again."); }
    finally { setUploading(false); if (ref.current) ref.current.value = ""; }
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input ref={ref} type="file" accept={accept ?? "*"} onChange={handle} style={{ display: "none" }} />
      <button type="button" onClick={() => ref.current?.click()}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fafafa", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#555" }}>
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {uploading ? "Uploading…" : label}
      </button>
      {current && <a href={`/api/storage/objects/${current}`} target="_blank" rel="noreferrer"
        style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>View ↗</a>}
    </div>
  );
}

// ── Multi-file upload ─────────────────────────────────────────────────────────
function MultiFileUpload({ label, accept, urls, onAdd, onRemove }: {
  label: string; accept?: string;
  urls: string[]; onAdd: (path: string) => void; onRemove: (idx: number) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) { const p = await uploadFile(f); onAdd(p); }
    } catch { alert("Upload failed. Please try again."); }
    finally { setUploading(false); if (ref.current) ref.current.value = ""; }
  }
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {urls.map((u, i) => (
          <div key={i} style={{ position: "relative", width: 72, height: 72 }}>
            <img src={`/api/storage/objects/${u}`} alt={`${label} ${i+1}`}
              style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e5e5" }}
              onError={e => { (e.target as HTMLImageElement).src = ""; }} />
            <button onClick={() => onRemove(i)} type="button"
              style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
      <input ref={ref} type="file" accept={accept ?? "image/*"} multiple onChange={handle} style={{ display: "none" }} />
      <button type="button" onClick={() => ref.current?.click()}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px dashed #C9A84C", background: "rgba(201,168,76,0.06)", cursor: "pointer", fontSize: 12, fontWeight: 600, color: GOLD }}>
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {uploading ? "Uploading…" : label}
      </button>
    </div>
  );
}

function statusBadge(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    pending:   { label: "Pending",   color: "#F59E0B" },
    approved:  { label: "Approved",  color: "#10B981" },
    completed: { label: "Completed", color: "#6366F1" },
    cancelled: { label: "Cancelled", color: "#EF4444" },
  };
  const { label, color } = map[s] ?? { label: s, color: "#888" };
  return <span style={{ background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{label}</span>;
}

// ── Verification Wizard ───────────────────────────────────────────────────────
const STEPS = ["Notice", "Business Info", "Online Presence", "Documents & Photos", "Submit"];

interface WizardForm {
  businessName: string; businessAddress: string; city: string; state: string;
  zipCode: string; country: string; businessPhone: string; businessEmail: string;
  businessType: string; businessDescription: string; ownerName: string; ownerContact: string;
  website: string; facebook: string; instagram: string; googleBusiness: string; otherListings: string;
  businessLicense: string; certifications: string[]; licenses: string[]; insurance: string;
  taxDocs: string[]; locationPhotos: string[]; certifiedAccurate: boolean;
}

function ProviderVerificationWizard({
  application, onRefresh,
}: { application: Application | null; onRefresh: () => void; }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<WizardForm>({
    businessName: application?.businessName ?? "",
    businessAddress: application?.businessAddress ?? "",
    city: application?.city ?? "",
    state: application?.state ?? "",
    zipCode: application?.zipCode ?? "",
    country: application?.country ?? "US",
    businessPhone: application?.businessPhone ?? "",
    businessEmail: application?.businessEmail ?? "",
    businessType: application?.businessType ?? "",
    businessDescription: application?.businessDescription ?? "",
    ownerName: application?.ownerName ?? "",
    ownerContact: application?.ownerContact ?? "",
    website: application?.website ?? "",
    facebook: application?.facebook ?? "",
    instagram: application?.instagram ?? "",
    googleBusiness: application?.googleBusiness ?? "",
    otherListings: application?.otherListings ?? "",
    businessLicense: application?.businessLicense ?? "",
    certifications: application?.certifications ?? [],
    licenses: application?.licenses ?? [],
    insurance: application?.insurance ?? "",
    taxDocs: application?.taxDocs ?? [],
    locationPhotos: application?.locationPhotos ?? [],
    certifiedAccurate: application?.certifiedAccurate ?? false,
  });

  async function ensureApplication() {
    if (!application) {
      const res = await fetch("/api/payg/provider/application", { method: "POST", headers: authHeaders(), body: JSON.stringify({}) });
      if (!res.ok && res.status !== 409) throw new Error("Could not create application");
    }
  }

  async function saveDraft(data: Partial<WizardForm>) {
    setSaving(true);
    try {
      await ensureApplication();
      const res = await fetch("/api/payg/provider/application", {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(data),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Save failed"); }
    } catch (e: any) {
      toast({ title: e.message ?? "Save failed", variant: "destructive" });
      throw e;
    } finally { setSaving(false); }
  }

  async function nextStep() {
    try {
      if (step === 1) await saveDraft({
        businessName: form.businessName, businessAddress: form.businessAddress, city: form.city,
        state: form.state, zipCode: form.zipCode, country: form.country,
        businessPhone: form.businessPhone, businessEmail: form.businessEmail,
        businessType: form.businessType, businessDescription: form.businessDescription,
        ownerName: form.ownerName, ownerContact: form.ownerContact,
      });
      if (step === 2) await saveDraft({
        website: form.website, facebook: form.facebook, instagram: form.instagram,
        googleBusiness: form.googleBusiness, otherListings: form.otherListings,
      });
      if (step === 3) await saveDraft({
        businessLicense: form.businessLicense, certifications: form.certifications,
        licenses: form.licenses, insurance: form.insurance, taxDocs: form.taxDocs,
        locationPhotos: form.locationPhotos,
      });
      setStep(s => s + 1);
    } catch { /* toast already shown */ }
  }

  async function submitApplication() {
    setSubmitting(true);
    try {
      await saveDraft({ certifiedAccurate: form.certifiedAccurate });
      const res = await fetch("/api/payg/provider/application/submit", {
        method: "POST", headers: authHeaders(), body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Submission failed", variant: "destructive" }); return; }
      toast({ title: "Application submitted!", description: "Your application is now under review. Approval may take up to 14 business days." });
      onRefresh();
    } finally { setSubmitting(false); }
  }

  const setF = (k: keyof WizardForm) => (v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Step indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 13,
                background: i < step ? GREEN : i === step ? GOLD : "#e5e5e5",
                color: i <= step ? "#fff" : "#999",
              }}>
                {i < step ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span style={{ fontSize: 10, color: i === step ? GOLD : "#999", fontWeight: i === step ? 700 : 400, whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < step ? GREEN : "#e5e5e5", margin: "0 4px", marginBottom: 18 }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Important Notice ─────────────────────────────────────── */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff8e6", border: "2px solid #C9A84C", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <AlertCircle size={20} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ fontWeight: 900, fontSize: 15, margin: "0 0 6px", color: "#92400E" }}>IMPORTANT NOTICE</h3>
                <p style={{ fontSize: 13, color: "#78350F", margin: "0 0 8px", lineHeight: 1.6 }}>
                  Before your Pay As You Go services can be listed on the NFGN platform, your business must successfully complete the <strong>NFGN Provider Verification and Approval Process</strong>.
                </p>
                <p style={{ fontSize: 13, color: "#78350F", margin: "0 0 8px", lineHeight: 1.6 }}>
                  Only verified and approved <strong>Pro Member</strong> business accounts are permitted to offer Pay As You Go services. Your business must have a legitimate operating business location before services can be made available to the public.
                </p>
                <p style={{ fontSize: 13, color: "#78350F", margin: 0, fontWeight: 700 }}>Business locations may include: Commercial locations · Professional office locations · Salon suites · Shared workspaces · Home-based businesses (where legally permitted) · Mobile service businesses (subject to approval).</p>
              </div>
            </div>
          </div>

          <div style={{ background: "#fef2f2", border: "2px solid #ef444440", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <Clock size={20} style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ fontWeight: 900, fontSize: 15, margin: "0 0 6px", color: "#991B1B" }}>APPROVAL REQUIRED</h3>
                <p style={{ fontSize: 13, color: "#7F1D1D", margin: 0, lineHeight: 1.6 }}>
                  Provider approval can take up to <strong>14 business days</strong>. Services will remain in "Pending Approval" status until reviewed and approved by NFGN.
                  <br /><strong>Providers may not accept bookings, payments, appointments, or reservations through the NFGN platform until approval has been granted.</strong>
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: "#f0f4ff", border: "1px solid #3B82F640", borderRadius: 12, padding: 16 }}>
            <p style={{ fontSize: 13, color: "#1e40af", margin: 0, lineHeight: 1.7 }}>
              <strong>Eligible business types include:</strong> Hair Salons · Barber Shops · Nail Salons · Day Spas · Massage Therapy Businesses · Wellness Centers · Fitness Studios · Dance Studios · Tutoring Centers · Photography Studios · Event Venues · Professional Service Providers · and other approved service-based businesses.
            </p>
          </div>

          <Button onClick={() => setStep(1)} style={{ background: GOLD, color: "#000", fontWeight: 800, alignSelf: "flex-end" }}>
            Begin Application <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}

      {/* ── Step 1: Business Information ─────────────────────────────────── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={18} style={{ color: GOLD }} /> Business Information
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="col-span-2 sm:col-span-1">
              <Label>Business Name *</Label>
              <Input value={form.businessName} onChange={e => setF("businessName")(e.target.value)} placeholder="Your Business Name" />
            </div>
            <div>
              <Label>Business Type *</Label>
              <select value={form.businessType} onChange={e => setF("businessType")(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e5e5", fontSize: 14, background: "#fff" }}>
                <option value="">Select type…</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Business Address *</Label>
            <Input value={form.businessAddress} onChange={e => setF("businessAddress")(e.target.value)} placeholder="Street Address" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
            <div><Label>City *</Label><Input value={form.city} onChange={e => setF("city")(e.target.value)} placeholder="City" /></div>
            <div><Label>State *</Label><Input value={form.state} onChange={e => setF("state")(e.target.value)} placeholder="State" /></div>
            <div><Label>ZIP</Label><Input value={form.zipCode} onChange={e => setF("zipCode")(e.target.value)} placeholder="ZIP" /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><Label>Business Phone *</Label><Input value={form.businessPhone} onChange={e => setF("businessPhone")(e.target.value)} placeholder="(555) 000-0000" /></div>
            <div><Label>Business Email</Label><Input type="email" value={form.businessEmail} onChange={e => setF("businessEmail")(e.target.value)} placeholder="info@yourbusiness.com" /></div>
            <div><Label>Owner / Contact Name *</Label><Input value={form.ownerName} onChange={e => setF("ownerName")(e.target.value)} placeholder="Full Name" /></div>
            <div><Label>Owner Phone / Email</Label><Input value={form.ownerContact} onChange={e => setF("ownerContact")(e.target.value)} placeholder="Contact info" /></div>
          </div>
          <div>
            <Label>Business Description *</Label>
            <Textarea value={form.businessDescription} onChange={e => setF("businessDescription")(e.target.value)}
              placeholder="Describe your business, the services you offer, and who your customers are…" rows={4} />
          </div>
        </div>
      )}

      {/* ── Step 2: Online Presence ───────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 18, margin: "0 0 2px", display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={18} style={{ color: GOLD }} /> Website & Online Presence
            </h2>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px" }}>These fields are optional but strongly encouraged to support your application.</p>
          </div>
          <div><Label>Website URL</Label><Input value={form.website} onChange={e => setF("website")(e.target.value)} placeholder="https://yourbusiness.com" /></div>
          <div><Label>Facebook Page</Label><Input value={form.facebook} onChange={e => setF("facebook")(e.target.value)} placeholder="https://facebook.com/yourbusiness" /></div>
          <div><Label>Instagram</Label><Input value={form.instagram} onChange={e => setF("instagram")(e.target.value)} placeholder="https://instagram.com/yourbusiness" /></div>
          <div><Label>Google Business Profile</Label><Input value={form.googleBusiness} onChange={e => setF("googleBusiness")(e.target.value)} placeholder="https://g.co/…" /></div>
          <div><Label>Other Business Listings</Label><Textarea value={form.otherListings} onChange={e => setF("otherListings")(e.target.value)} placeholder="Yelp, LinkedIn, BBB, etc. — list any other business profile links" rows={3} /></div>
        </div>
      )}

      {/* ── Step 3: Documents & Photos ────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: 18, margin: "0 0 2px", display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={18} style={{ color: GOLD }} /> Business Documentation
            </h2>
            <p style={{ color: "#888", fontSize: 13, margin: "0 0 4px" }}>Upload relevant documents. Business License is required if you have one.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div><Label style={{ display: "block", marginBottom: 6 }}>Business License (if applicable)</Label>
              <FileUploadButton label="Upload Business License" accept="image/*,application/pdf"
                onUploaded={path => setF("businessLicense")(path)} current={form.businessLicense} /></div>
            <div><Label style={{ display: "block", marginBottom: 6 }}>Professional Certifications</Label>
              <MultiFileUpload label="Upload Certifications" accept="image/*,application/pdf"
                urls={form.certifications} onAdd={p => setF("certifications")([...form.certifications, p])}
                onRemove={i => setF("certifications")(form.certifications.filter((_, idx) => idx !== i))} /></div>
            <div><Label style={{ display: "block", marginBottom: 6 }}>Professional Licenses</Label>
              <MultiFileUpload label="Upload Licenses" accept="image/*,application/pdf"
                urls={form.licenses} onAdd={p => setF("licenses")([...form.licenses, p])}
                onRemove={i => setF("licenses")(form.licenses.filter((_, idx) => idx !== i))} /></div>
            <div><Label style={{ display: "block", marginBottom: 6 }}>Insurance Documents (optional)</Label>
              <FileUploadButton label="Upload Insurance Doc" accept="image/*,application/pdf"
                onUploaded={path => setF("insurance")(path)} current={form.insurance} /></div>
          </div>

          <div style={{ borderTop: "1px dashed #e5e5e5", paddingTop: 20 }}>
            <h3 style={{ fontWeight: 800, fontSize: 15, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
              <Image size={16} style={{ color: GOLD }} /> Location Verification Photos *
            </h3>
            <div style={{ background: "#f0f9ff", border: "1px solid #3B82F620", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: "#1e3a5f", margin: 0, lineHeight: 1.7 }}>
                <strong>Please provide clear photos of your business location.</strong><br />
                Examples: Exterior entrance · Reception/waiting area · Service area · Treatment/massage rooms ·
                Salon/barber stations · Equipment areas · Home-based setup (if applicable).<br />
                <em>NFGN reserves the right to request additional verification photos if necessary.</em>
              </p>
            </div>
            <MultiFileUpload label="Upload Location Photos" accept="image/*"
              urls={form.locationPhotos} onAdd={p => setF("locationPhotos")([...form.locationPhotos, p])}
              onRemove={i => setF("locationPhotos")(form.locationPhotos.filter((_, idx) => idx !== i))} />
            <p style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>{form.locationPhotos.length} photo(s) uploaded</p>
          </div>
        </div>
      )}

      {/* ── Step 4: Legal & Submit ────────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} style={{ color: GOLD }} /> Legal Certification
          </h2>
          <div style={{ background: "#0a0a0a", color: "#e5e5e5", borderRadius: 12, padding: 20, fontSize: 12, lineHeight: 1.8 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: "#C9A84C", margin: "0 0 8px" }}>⚖ LEGAL NOTICE</p>
            <p style={{ margin: "0 0 8px" }}>All information submitted to NFGN must be truthful, accurate, and complete. By submitting information through this platform, you certify that all information provided is true and correct to the best of your knowledge.</p>
            <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#fca5a5" }}>Providing false, misleading, fraudulent, stolen, or fabricated information may result in:</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              {["Immediate denial of approval","Removal from the NFGN platform","Suspension of account privileges","Permanent account termination","Loss of commissions and earnings","Reporting to applicable authorities","Civil legal action where permitted by law"].map(item => (
                <li key={item} style={{ marginBottom: 3 }}>{item}</li>
              ))}
            </ul>
            <p style={{ margin: 0, color: "#aaa" }}>NFGN reserves the right to investigate any submitted information and verify business legitimacy before granting approval.</p>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #10B98130", borderRadius: 10, padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <input type="checkbox" id="certify" checked={form.certifiedAccurate}
              onChange={e => setF("certifiedAccurate")(e.target.checked)}
              style={{ marginTop: 3, width: 16, height: 16, accentColor: GREEN, flexShrink: 0 }} />
            <label htmlFor="certify" style={{ fontSize: 13, color: "#166534", lineHeight: 1.6, cursor: "pointer" }}>
              <strong>I certify that all information provided in this application is true, accurate, and complete to the best of my knowledge.</strong> I understand that providing false or misleading information may result in the rejection or revocation of my provider status.
            </label>
          </div>

          <Button onClick={submitApplication}
            disabled={!form.certifiedAccurate || submitting}
            style={{ background: form.certifiedAccurate ? GREEN : "#aaa", color: "#fff", fontWeight: 800, padding: "12px 24px", fontSize: 15 }}>
            {submitting ? <><Loader2 size={16} className="animate-spin mr-2" />Submitting…</> : <><ShieldCheck size={16} className="mr-2" />Submit Provider Application</>}
          </Button>
        </div>
      )}

      {/* Navigation */}
      {step > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
          <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={saving}>
            <ChevronLeft size={15} className="mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 && (
            <Button onClick={nextStep} disabled={saving} style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Save & Continue <ChevronRight size={15} className="ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Application Status Card ────────────────────────────────────────────────────
function ApplicationStatusCard({ application, onRefresh }: { application: Application; onRefresh: () => void }) {
  const statusInfo: Record<string, { icon: React.ReactNode; title: string; desc: string; color: string; bg: string }> = {
    pending_review: {
      icon: <Clock size={28} style={{ color: "#3B82F6" }} />,
      title: "Application Under Review",
      desc: "Your provider application has been submitted and is currently being reviewed by the NFGN team. This process may take up to 14 business days. You will be notified once a decision has been made.",
      color: "#1D4ED8", bg: "#eff6ff",
    },
    additional_info_requested: {
      icon: <AlertCircle size={28} style={{ color: "#8B5CF6" }} />,
      title: "Additional Information Required",
      desc: "The NFGN team has reviewed your application and requires additional information before a final decision can be made. Please review the admin notes below and resubmit your updated application.",
      color: "#6D28D9", bg: "#f5f3ff",
    },
    rejected: {
      icon: <XCircle size={28} style={{ color: "#EF4444" }} />,
      title: "Application Rejected",
      desc: "Unfortunately your provider application was not approved at this time. Please review any feedback below. You may contact NFGN support for further assistance.",
      color: "#B91C1C", bg: "#fef2f2",
    },
    suspended: {
      icon: <Ban size={28} style={{ color: "#F97316" }} />,
      title: "Provider Account Suspended",
      desc: "Your provider account has been suspended. Please contact NFGN support for assistance.",
      color: "#C2410C", bg: "#fff7ed",
    },
  };

  const info = statusInfo[application.status];
  if (!info) return null;

  const canResubmit = application.status === "additional_info_requested";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: info.bg, border: `2px solid ${info.color}30`, borderRadius: 16, padding: 28, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>{info.icon}</div>
        <h2 style={{ fontWeight: 900, fontSize: 20, color: info.color, margin: "0 0 10px", fontFamily: "'Georgia',serif" }}>{info.title}</h2>
        <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, margin: "0 0 16px" }}>{info.desc}</p>
        {application.adminNotes && (
          <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, textAlign: "left", marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#888", margin: "0 0 6px" }}>NFGN NOTES:</p>
            <p style={{ fontSize: 13, color: "#333", margin: 0, lineHeight: 1.6 }}>{application.adminNotes}</p>
          </div>
        )}
        {canResubmit && (
          <Button onClick={onRefresh} style={{ marginTop: 16, background: GOLD, color: "#000", fontWeight: 700 }}>
            Update & Resubmit Application
          </Button>
        )}
        {application.submittedAt && (
          <p style={{ fontSize: 11, color: "#aaa", marginTop: 14 }}>Submitted: {fmt(application.submittedAt.split("T")[0])}</p>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function PaygProviderPage() {
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const [application, setApplication] = useState<Application | null | undefined>(undefined);
  const [loadingApp, setLoadingApp] = useState(true);
  const [tab, setTab] = useState<"services" | "availability" | "bookings">("services");

  // Services
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [svcDialog, setSvcDialog] = useState<null | Partial<Service>>(null);
  const [savingSvc, setSavingSvc] = useState(false);

  // Availability
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotDialog, setSlotDialog] = useState<boolean>(false);
  const [slotForm, setSlotForm] = useState({ availableDate: "", startTime: "09:00", endTime: "17:00", maxChairs: "1", notes: "", isBlocked: false });
  const [savingSlot, setSavingSlot] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bkFilter, setBkFilter] = useState<string>("all");

  // ── Fetch application ──────────────────────────────────────────────────────
  function loadApplication() {
    setLoadingApp(true);
    fetch("/api/payg/provider/application", { headers: authHeaders() })
      .then(r => r.json()).then(d => setApplication(d.application ?? null))
      .catch(() => setApplication(null))
      .finally(() => setLoadingApp(false));
  }
  useEffect(() => { loadApplication(); }, []);

  // ── Fetch services/slots/bookings (only when approved) ────────────────────
  function loadServices() {
    setLoadingServices(true);
    fetch("/api/payg/provider/services", { headers: authHeaders() })
      .then(r => r.json()).then(d => setServices(d.services ?? []))
      .catch(() => {}).finally(() => setLoadingServices(false));
  }
  function loadSlots() {
    setLoadingSlots(true);
    fetch("/api/payg/provider/availability", { headers: authHeaders() })
      .then(r => r.json()).then(d => setSlots(d.slots ?? []))
      .catch(() => {}).finally(() => setLoadingSlots(false));
  }
  function loadBookings() {
    setLoadingBookings(true);
    fetch("/api/payg/provider/bookings", { headers: authHeaders() })
      .then(r => r.json()).then(d => setBookings(d.bookings ?? []))
      .catch(() => {}).finally(() => setLoadingBookings(false));
  }
  useEffect(() => {
    if (application?.status === "approved") {
      loadServices(); loadSlots(); loadBookings();
    }
  }, [application?.status]);

  // ── Service CRUD ─────────────────────────────────────────────────────────────
  async function saveService() {
    if (!svcDialog) return;
    const { id, name, description, price, isActive } = svcDialog;
    if (!name || price == null) { toast({ title: "Name and price required", variant: "destructive" }); return; }
    setSavingSvc(true);
    try {
      const res = await fetch(id ? `/api/payg/provider/services/${id}` : "/api/payg/provider/services", {
        method: id ? "PATCH" : "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name, description, price: parseFloat(String(price)), isActive: isActive ?? true }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Failed", variant: "destructive" }); return; }
      toast({ title: id ? "Service updated" : "Service added" });
      setSvcDialog(null);
      loadServices();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSavingSvc(false); }
  }

  async function deleteService(id: number) {
    if (!confirm("Delete this service?")) return;
    await fetch(`/api/payg/provider/services/${id}`, { method: "DELETE", headers: authHeaders() });
    loadServices();
    toast({ title: "Service deleted" });
  }

  // ── Availability CRUD ────────────────────────────────────────────────────────
  async function addSlot() {
    if (!slotForm.availableDate || !slotForm.startTime || !slotForm.endTime) {
      toast({ title: "Date and times required", variant: "destructive" }); return;
    }
    setSavingSlot(true);
    try {
      const res = await fetch("/api/payg/provider/availability", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ ...slotForm, maxChairs: parseInt(slotForm.maxChairs) || 1 }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error ?? "Failed", variant: "destructive" }); return; }
      toast({ title: "Availability added" });
      setSlotDialog(false);
      setSlotForm({ availableDate: "", startTime: "09:00", endTime: "17:00", maxChairs: "1", notes: "", isBlocked: false });
      loadSlots();
    } catch { toast({ title: "Error", variant: "destructive" }); }
    finally { setSavingSlot(false); }
  }

  async function removeSlot(id: number) {
    if (!confirm("Remove this availability slot?")) return;
    await fetch(`/api/payg/provider/availability/${id}`, { method: "DELETE", headers: authHeaders() });
    loadSlots();
    toast({ title: "Slot removed" });
  }

  async function toggleBlock(slot: Slot) {
    await fetch(`/api/payg/provider/availability/${slot.id}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ isBlocked: !slot.isBlocked }),
    });
    loadSlots();
  }

  // ── Booking status update ───────────────────────────────────────────────────
  async function updateBookingStatus(id: number, status: string) {
    const res = await fetch(`/api/payg/provider/bookings/${id}`, {
      method: "PATCH", headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) { toast({ title: `Booking marked as ${status}` }); loadBookings(); }
  }

  const filteredBookings = bkFilter === "all" ? bookings : bookings.filter(b => b.status === bkFilter);
  const pendingCount = bookings.filter(b => b.status === "pending").length;

  const isFreeMember = me && me.role === "customer";

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingApp) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Zap size={22} style={{ color: GOLD }} />
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, fontWeight: 900, margin: 0 }}>Pay As You Go Back-Office</h1>
        </div>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Manage your services, availability, and incoming bookings.</p>
      </div>

      {/* ── Free Member Gate ──────────────────────────────────────────────────── */}
      {isFreeMember && (
        <div style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)", borderRadius: 16, padding: 32, textAlign: "center", color: "#fff" }}>
          <Star size={40} style={{ color: GOLD, margin: "0 auto 16px" }} />
          <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 22, fontWeight: 900, margin: "0 0 10px", color: GOLD }}>Pro Membership Required</h2>
          <p style={{ color: "#aaa", fontSize: 14, maxWidth: 420, margin: "0 auto 20px", lineHeight: 1.7 }}>
            Only verified and approved <strong style={{ color: "#fff" }}>Pro Member</strong> business accounts are permitted to offer Pay As You Go services on the NFGN platform.
          </p>
          <a href="/join/pro">
            <Button style={{ background: GOLD, color: "#000", fontWeight: 800, padding: "10px 24px" }}>
              Upgrade to Pro Member <ChevronRight size={16} className="ml-1" />
            </Button>
          </a>
        </div>
      )}

      {/* ── Verified Provider: Approval Wizard or Status ───────────────────── */}
      {!isFreeMember && (application === null || ["draft", "pending_submission"].includes(application?.status ?? "")) && (
        <div>
          <div style={{ background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <ShieldCheck size={18} style={{ color: GOLD }} />
              <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Provider Verification & Approval</h2>
            </div>
            <p style={{ color: "#666", fontSize: 13, margin: 0 }}>
              Complete the verification process to start offering Pay As You Go services. All required information will be reviewed by the NFGN team before your services go live.
            </p>
          </div>
          <ProviderVerificationWizard application={application ?? null} onRefresh={loadApplication} />
        </div>
      )}

      {!isFreeMember && ["pending_review", "additional_info_requested", "rejected", "suspended"].includes(application?.status ?? "") && (
        <ApplicationStatusCard application={application!} onRefresh={loadApplication} />
      )}

      {/* ── Approved: Full Provider Dashboard ────────────────────────────── */}
      {!isFreeMember && application?.status === "approved" && (
        <>
          {/* Approved badge */}
          <div style={{ background: "#f0fdf4", border: "1px solid #10B98130", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} style={{ color: "#10B981" }} />
            <span style={{ fontSize: 13, color: "#166534", fontWeight: 700 }}>Provider Verified & Approved — Your services are live on the NFGN platform.</span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#f4f4f4", borderRadius: 10, padding: 4, marginBottom: 28, width: "fit-content" }}>
            {(["services", "availability", "bookings"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0a0a0a" : "#666", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s", position: "relative" }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === "bookings" && pendingCount > 0 && (
                  <span style={{ position: "absolute", top: 4, right: 4, background: GOLD, color: "#000", borderRadius: 99, width: 16, height: 16, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── SERVICES TAB ───────────────────────────────────────────────── */}
          {tab === "services" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>My Services</h2>
                  <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>Up to 4 services. CV = Price × 0.10 (auto-calculated).</p>
                </div>
                {services.length < 4 && (
                  <Button onClick={() => setSvcDialog({})} style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
                    <Plus size={14} className="mr-1" /> Add Service
                  </Button>
                )}
              </div>
              {loadingServices ? <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="animate-spin" style={{ color: GOLD }} /></div> : (
                services.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "#fafafa", borderRadius: 12, border: "1px dashed #ddd" }}>
                    <DollarSign size={32} style={{ color: "#ddd", margin: "0 auto 12px" }} />
                    <p style={{ color: "#888", fontSize: 14 }}>No services yet. Add up to 4 services to start accepting bookings.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {services.map((svc, i) => (
                      <div key={svc.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${GOLD}15`, color: GOLD, fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, fontSize: 15 }}>{svc.name}</span>
                            {!svc.isActive && <Badge variant="secondary" style={{ fontSize: 10 }}>Inactive</Badge>}
                          </div>
                          {svc.description && <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{svc.description}</div>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: GOLD }}>${svc.price.toFixed(2)}<span style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>/hr</span></div>
                          <div style={{ fontSize: 11, color: "#888" }}>{svc.cv.toFixed(2)} CV/hr</div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <Button size="sm" variant="outline" onClick={() => setSvcDialog({ ...svc })}><Pencil size={13} /></Button>
                          <Button size="sm" variant="outline" onClick={() => deleteService(svc.id)} style={{ color: "#ef4444", borderColor: "#ef444440" }}><Trash2 size={13} /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
              {services.length === 4 && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbf0", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, fontSize: 13, color: "#92400E" }}>
                  <AlertCircle size={13} style={{ display: "inline", marginRight: 6 }} />
                  Maximum of 4 services reached. Delete one to add another.
                </div>
              )}
            </div>
          )}

          {/* ── AVAILABILITY TAB ───────────────────────────────────────────── */}
          {tab === "availability" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>My Availability</h2>
                  <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>Set the dates and time windows when customers can book you.</p>
                </div>
                <Button onClick={() => setSlotDialog(true)} style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
                  <Plus size={14} className="mr-1" /> Add Date
                </Button>
              </div>
              {loadingSlots ? <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="animate-spin" style={{ color: GOLD }} /></div> : (
                slots.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "#fafafa", borderRadius: 12, border: "1px dashed #ddd" }}>
                    <CalendarDays size={32} style={{ color: "#ddd", margin: "0 auto 12px" }} />
                    <p style={{ color: "#888", fontSize: 14 }}>No availability set. Add dates to start accepting bookings.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {slots.map(slot => (
                      <div key={slot.id} style={{ background: slot.isBlocked ? "#fef2f2" : "#fff", borderRadius: 12, border: `1px solid ${slot.isBlocked ? "#fecaca" : "#e5e5e5"}`, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                        <CalendarDays size={16} style={{ color: slot.isBlocked ? "#ef4444" : GOLD, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{fmt(slot.availableDate)}</div>
                          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                            <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
                            {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                            {slot.maxChairs > 1 && ` · ${slot.maxChairs} chairs`}
                            {slot.notes && ` · ${slot.notes}`}
                          </div>
                        </div>
                        {slot.isBlocked && <span style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fee2e2", padding: "2px 8px", borderRadius: 6 }}>BLOCKED</span>}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <Button size="sm" variant="outline" onClick={() => toggleBlock(slot)} style={{ fontSize: 11, color: slot.isBlocked ? "#10b981" : "#ef4444" }}>
                            {slot.isBlocked ? "Unblock" : "Block"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => removeSlot(slot.id)} style={{ color: "#ef4444", borderColor: "#ef444440" }}><Trash2 size={13} /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* ── BOOKINGS TAB ───────────────────────────────────────────────── */}
          {tab === "bookings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Received Bookings</h2>
                  <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>Customers who have booked your services.</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["all", "pending", "approved", "completed", "cancelled"].map(f => (
                    <button key={f} onClick={() => setBkFilter(f)}
                      style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #e5e5e5", background: bkFilter === f ? GOLD : "#fff", color: bkFilter === f ? "#000" : "#555", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {loadingBookings ? <div style={{ padding: 40, textAlign: "center" }}><Loader2 className="animate-spin" style={{ color: GOLD }} /></div> : (
                filteredBookings.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", background: "#fafafa", borderRadius: 12, border: "1px dashed #ddd" }}>
                    <RefreshCw size={32} style={{ color: "#ddd", margin: "0 auto 12px" }} />
                    <p style={{ color: "#888", fontSize: 14 }}>No {bkFilter !== "all" ? bkFilter : ""} bookings yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filteredBookings.map(bk => (
                      <div key={bk.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e5e5", padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>PAYG-{String(bk.id).padStart(4, "0")}</span>
                              {statusBadge(bk.status)}
                            </div>
                            <div style={{ fontSize: 13, color: "#555" }}>{bk.serviceName} · {fmt(bk.bookingDate)} at {fmtTime(bk.startTime)}</div>
                            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{bk.numHours} hrs · <strong>${bk.totalPrice.toFixed(2)}</strong> · {bk.cvGenerated.toFixed(2)} CV</div>
                            {bk.notes && <div style={{ fontSize: 12, color: "#888", marginTop: 4, fontStyle: "italic" }}>"{bk.notes}"</div>}
                          </div>
                          {bk.status === "pending" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <Button size="sm" onClick={() => updateBookingStatus(bk.id, "approved")}
                                style={{ background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                                <CheckCircle2 size={13} className="mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateBookingStatus(bk.id, "cancelled")}
                                style={{ color: "#ef4444", borderColor: "#ef444440", fontSize: 12 }}>
                                <XCircle size={13} className="mr-1" /> Decline
                              </Button>
                            </div>
                          )}
                          {bk.status === "approved" && (
                            <Button size="sm" onClick={() => updateBookingStatus(bk.id, "completed")}
                              style={{ background: "#6366f1", color: "#fff", fontWeight: 700, fontSize: 12 }}>
                              <CheckCircle2 size={13} className="mr-1" /> Mark Completed
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

          {/* ── Service Dialog ─────────────────────────────────────────────── */}
          <Dialog open={!!svcDialog} onOpenChange={o => { if (!o) setSvcDialog(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>{svcDialog?.id ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Service Name *</Label><Input value={svcDialog?.name ?? ""} onChange={e => setSvcDialog(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chair Rental, Styling Station…" /></div>
                <div><Label>Description</Label><Input value={svcDialog?.description ?? ""} onChange={e => setSvcDialog(p => ({ ...p, description: e.target.value }))} placeholder="Brief description…" /></div>
                <div>
                  <Label>Price Per Hour ($) *</Label>
                  <Input type="number" min={1} step={0.01} value={svcDialog?.price ?? ""} onChange={e => setSvcDialog(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} placeholder="e.g. 40" />
                  {svcDialog?.price != null && (svcDialog.price as number) > 0 && (
                    <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>CV = ${(svcDialog.price as number).toFixed(2)} × 0.10 = <strong>{((svcDialog.price as number) * 0.10).toFixed(2)} CV</strong>/hr</p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Switch checked={svcDialog?.isActive ?? true} onCheckedChange={v => setSvcDialog(p => ({ ...p, isActive: v }))} id="svc-active" />
                  <Label htmlFor="svc-active">Active (visible to customers)</Label>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSvcDialog(null)}>Cancel</Button>
                <Button onClick={saveService} disabled={savingSvc} style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
                  {savingSvc ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  {svcDialog?.id ? "Save Changes" : "Add Service"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ── Availability Dialog ────────────────────────────────────────── */}
          <Dialog open={slotDialog} onOpenChange={setSlotDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add Available Date</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Date *</Label><Input type="date" value={slotForm.availableDate} onChange={e => setSlotForm(f => ({ ...f, availableDate: e.target.value }))} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><Label>Start Time *</Label><Input type="time" value={slotForm.startTime} onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))} /></div>
                  <div><Label>End Time *</Label><Input type="time" value={slotForm.endTime} onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))} /></div>
                </div>
                <div><Label>Max Simultaneous Chairs/Stations</Label><Input type="number" min={1} max={20} value={slotForm.maxChairs} onChange={e => setSlotForm(f => ({ ...f, maxChairs: e.target.value }))} /></div>
                <div><Label>Notes (optional)</Label><Input value={slotForm.notes} onChange={e => setSlotForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special notes for this date…" /></div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSlotDialog(false)}>Cancel</Button>
                <Button onClick={addSlot} disabled={savingSlot} style={{ background: GOLD, color: "#000", fontWeight: 700 }}>
                  {savingSlot ? <Loader2 size={14} className="animate-spin mr-1" /> : null} Add Date
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
