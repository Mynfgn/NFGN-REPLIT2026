import { useState, useEffect, useRef, useCallback } from "react";
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
  Ban, FileText, Image, Info, Save, User, Globe,
} from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";
const RED = "#EF4444";

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
function fmtTime(t: string) { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; }

const BUSINESS_TYPES = [
  "Hair Salon", "Barber Shop", "Nail Salon", "Day Spa", "Massage Therapy Business",
  "Wellness Center", "Fitness Studio", "Dance Studio", "Tutoring Center",
  "Photography Studio", "Event Venue", "Professional Service Provider", "Other",
];

// ── Wizard steps ───────────────────────────────────────────────────────────────
const STEP_COUNT = 8;
const STEP_LABELS = [
  "Before You Begin",
  "Business Information",
  "Owner Information",
  "Business Verification",
  "Insurance & Certs",
  "Location Photos",
  "Online Presence",
  "Review & Submit",
];

const PREREQ_TEXTS = [
  "I understand that only approved Pro Member business accounts may offer Pay As You Go services.",
  "I understand that approval may take up to fourteen (14) business days.",
  "I understand that my application will not be reviewed until all required information is submitted.",
  "I understand that false or misleading information may result in denial, suspension, account termination, and possible legal action.",
  "I understand that my services cannot go live until approved by NFGN.",
];

// ── Form type ─────────────────────────────────────────────────────────────────
interface WizardForm {
  businessName: string; businessAddress: string; city: string; state: string;
  zipCode: string; country: string; businessPhone: string; businessEmail: string;
  businessType: string; businessDescription: string; ownerName: string; ownerContact: string;
  website: string; facebook: string; instagram: string; googleBusiness: string; otherListings: string;
  businessLicense: string; certifications: string[]; licenses: string[]; insurance: string;
  taxDocs: string[]; locationPhotos: string[]; certifiedAccurate: boolean;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateStep(step: number, form: WizardForm, prereqs: boolean[]): Record<string, string> {
  const errs: Record<string, string> = {};
  if (step === 0) {
    prereqs.forEach((c, i) => { if (!c) errs[`prereq_${i}`] = "This acknowledgment is required to proceed."; });
  }
  if (step === 1) {
    if (!form.businessName.trim()) errs.businessName = "Business name is required.";
    if (!form.businessType) errs.businessType = "Please select a business type.";
    if (!form.businessAddress.trim()) errs.businessAddress = "Business address is required.";
    if (!form.city.trim()) errs.city = "City is required.";
    if (!form.state.trim()) errs.state = "State / Province is required.";
    if (!form.zipCode.trim()) errs.zipCode = "ZIP / Postal code is required.";
    if (!form.businessPhone.trim()) errs.businessPhone = "Business phone number is required.";
    if (!form.businessDescription.trim()) errs.businessDescription = "Business description is required.";
  }
  if (step === 2) {
    if (!form.ownerName.trim()) errs.ownerName = "Owner name is required.";
    if (!form.ownerContact.trim()) errs.ownerContact = "Owner contact information is required.";
  }
  if (step === 3) {
    const hasDoc = !!form.businessLicense || (form.licenses ?? []).length > 0 || (form.taxDocs ?? []).length > 0;
    if (!hasDoc) errs.documents = "Please upload at least one business document (Business License, Professional License, or Business Registration Document) to continue.";
  }
  if (step === 5) {
    if ((form.locationPhotos ?? []).length === 0) errs.locationPhotos = "At least one location photo is required. Please upload photos of your business location.";
  }
  if (step === 7) {
    if (!form.certifiedAccurate) errs.certifiedAccurate = "You must certify that all information provided is true and accurate before submitting.";
  }
  return errs;
}

// ── File upload helper ────────────────────────────────────────────────────────
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

// ── File upload components ────────────────────────────────────────────────────
function FileUploadButton({ label, accept, onUploaded, current, error }: {
  label: string; accept?: string;
  onUploaded: (path: string) => void;
  current?: string | null;
  error?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { const path = await uploadFile(file); onUploaded(path); }
    catch { alert("Upload failed. Please try again."); }
    finally { setUploading(false); if (ref.current) ref.current.value = ""; }
  }
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input ref={ref} type="file" accept={accept ?? "*"} onChange={handle} style={{ display: "none" }} />
        <button type="button" onClick={() => ref.current?.click()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${error ? RED : "#ddd"}`, background: "#fafafa", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#555" }}>
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {uploading ? "Uploading…" : label}
        </button>
        {current && (
          <a href={`/api/storage/objects/${current}`} target="_blank" rel="noreferrer"
            style={{ fontSize: 11, color: GOLD, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
            <CheckCircle2 size={11} style={{ color: GREEN }} /> Uploaded ↗
          </a>
        )}
      </div>
      {error && <p style={{ color: RED, fontSize: 11, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function MultiFileUpload({ label, accept, urls, onAdd, onRemove, error, accept2 }: {
  label: string; accept?: string; accept2?: string;
  urls: string[]; onAdd: (path: string) => void; onRemove: (idx: number) => void;
  error?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try { for (const f of files) { const p = await uploadFile(f); onAdd(p); } }
    catch { alert("Upload failed. Please try again."); }
    finally { setUploading(false); if (ref.current) ref.current.value = ""; }
  }
  const isImages = accept === "image/*";
  return (
    <div>
      {isImages && urls.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {urls.map((u, i) => (
            <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
              <img src={`/api/storage/objects/${u}`} alt={`Photo ${i + 1}`}
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e5e5" }}
                onError={e => { (e.target as HTMLImageElement).src = ""; }} />
              <button onClick={() => onRemove(i)} type="button"
                style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: 9, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      {!isImages && urls.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
          {urls.map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", borderRadius: 6, padding: "5px 10px" }}>
              <CheckCircle2 size={12} style={{ color: GREEN, flexShrink: 0 }} />
              <a href={`/api/storage/objects/${u}`} target="_blank" rel="noreferrer"
                style={{ fontSize: 11, color: GREEN, fontWeight: 600, flex: 1 }}>Document {i + 1} ↗</a>
              <button onClick={() => onRemove(i)} type="button"
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <input ref={ref} type="file" accept={accept ?? "*"} multiple onChange={handle} style={{ display: "none" }} />
      <button type="button" onClick={() => ref.current?.click()}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px dashed ${error ? RED : GOLD}`, background: `rgba(201,168,76,0.06)`, cursor: "pointer", fontSize: 12, fontWeight: 600, color: GOLD }}>
        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
        {uploading ? "Uploading…" : label}
      </button>
      {error && <p style={{ color: RED, fontSize: 11, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

// ── Field error display ───────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ color: RED, fontSize: 11, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}><AlertCircle size={11} /> {msg}</p>;
}

// ── Styled form field ─────────────────────────────────────────────────────────
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label style={{ display: "flex", gap: 2, marginBottom: 5 }}>
        {label}{required && <span style={{ color: RED }}>*</span>}
      </Label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function WizardProgress({ step, isAdmin }: { step: number; isAdmin: boolean }) {
  const pct = Math.round((step / (STEP_COUNT - 1)) * 100);
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#333" }}>
            Step {step + 1} of {STEP_COUNT}
          </span>
          <span style={{ fontSize: 12, color: "#888" }}>— {STEP_LABELS[step]}</span>
          {isAdmin && (
            <span style={{ fontSize: 10, fontWeight: 700, background: "#7c3aed", color: "#fff", padding: "2px 8px", borderRadius: 99 }}>
              ADMIN MODE — Validation Bypassed
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: pct === 100 ? GREEN : GOLD }}>{pct}% Complete</span>
      </div>
      <div style={{ background: "#f0f0f0", borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${GOLD}, ${GREEN})`, width: `${pct}%`, transition: "width 0.4s ease" }} />
      </div>
      {/* Step dots */}
      <div style={{ display: "flex", gap: 3, marginTop: 10, justifyContent: "space-between" }}>
        {STEP_LABELS.map((label, i) => (
          <div key={i} title={label}
            style={{ height: 4, flex: 1, borderRadius: 99, background: i <= step ? (i < step ? GREEN : GOLD) : "#e5e5e5", transition: "background 0.3s ease" }} />
        ))}
      </div>
    </div>
  );
}

// ── Verification Wizard ───────────────────────────────────────────────────────
export function ProviderVerificationWizard({
  application, onRefresh, isAdmin,
}: { application: Application | null; onRefresh: () => void; isAdmin: boolean; }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attemptedNext, setAttemptedNext] = useState(false);

  const [prereqs, setPrereqs] = useState<boolean[]>([false, false, false, false, false]);
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
    certifiedAccurate: false,
  });

  const errors = validateStep(step, form, prereqs);
  const hasErrors = Object.keys(errors).length > 0;
  const canProceed = isAdmin || !hasErrors;

  const setF = (k: keyof WizardForm) => (v: any) => setForm(f => ({ ...f, [k]: v }));

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

  const stepData: () => Partial<WizardForm> = () => {
    switch (step) {
      case 1: return { businessName: form.businessName, businessAddress: form.businessAddress, city: form.city, state: form.state, zipCode: form.zipCode, country: form.country, businessPhone: form.businessPhone, businessEmail: form.businessEmail, businessType: form.businessType, businessDescription: form.businessDescription };
      case 2: return { ownerName: form.ownerName, ownerContact: form.ownerContact };
      case 3: return { businessLicense: form.businessLicense, licenses: form.licenses, taxDocs: form.taxDocs };
      case 4: return { insurance: form.insurance, certifications: form.certifications };
      case 5: return { locationPhotos: form.locationPhotos };
      case 6: return { website: form.website, facebook: form.facebook, instagram: form.instagram, googleBusiness: form.googleBusiness, otherListings: form.otherListings };
      default: return {};
    }
  };

  async function goNext() {
    setAttemptedNext(true);
    const errs = validateStep(step, form, prereqs);
    if (!isAdmin && Object.keys(errs).length > 0) return;
    if (step > 0 && step < 7) {
      try { await saveDraft(stepData()); } catch { return; }
    }
    setAttemptedNext(false);
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  }

  async function saveAndExit() {
    if (step > 0) {
      try { await saveDraft(stepData()); toast({ title: "Progress saved", description: "Your application is saved. Return anytime to continue." }); }
      catch { return; }
    }
    onRefresh();
  }

  async function submitApplication() {
    if (!form.certifiedAccurate && !isAdmin) {
      toast({ title: "Please certify your application before submitting.", variant: "destructive" }); return;
    }
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

  const showErrors = attemptedNext && !isAdmin;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <WizardProgress step={step} isAdmin={isAdmin} />

      {/* ── Step 0: Before You Begin ─────────────────────────────────────────── */}
      {step === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#0a0a0a", borderRadius: 14, padding: 24, color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertCircle size={20} style={{ color: GOLD }} />
              <h2 style={{ fontFamily: "'Georgia',serif", fontSize: 20, fontWeight: 900, margin: 0, color: GOLD }}>Before You Begin</h2>
            </div>
            <div style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <p style={{ fontWeight: 800, fontSize: 13, color: GOLD, margin: "0 0 6px" }}>IMPORTANT: Please Read Before Starting Your Application</p>
              <p style={{ fontSize: 13, color: "#e5e5e5", margin: "0 0 8px", lineHeight: 1.7 }}>
                To help speed up the review and approval process, please gather all required information and documents before beginning this application.
              </p>
              <p style={{ fontSize: 13, color: "#e5e5e5", margin: 0, lineHeight: 1.7 }}>
                The Pay As You Go Provider Application must be <strong style={{ color: "#fff" }}>completed in its entirety</strong> before it can be submitted for review.
                Provider approval may take up to <strong style={{ color: "#fff" }}>fourteen (14) business days</strong>.
                Incomplete applications will not be reviewed. Only approved Pro Member business accounts may offer Pay As You Go services on the NFGN platform.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                {
                  icon: Building2, title: "Business Information", items: [
                    "Business Name", "Business Address", "City, State, ZIP, Country",
                    "Business Phone & Email", "Website URL (if applicable)", "Social Media Links (if applicable)",
                  ],
                },
                {
                  icon: User, title: "Owner Information", items: [
                    "Owner Name", "Contact Information",
                    "Government-Issued Identification (if requested)",
                  ],
                },
                {
                  icon: FileText, title: "Business Verification Docs", items: [
                    "Business License", "Occupational License", "Professional License",
                    "Cosmetology / Barber / Massage / Esthetician / Nail Tech License",
                    "Business Registration Documents", "Insurance Documentation",
                    "Other Professional Certifications",
                  ],
                },
                {
                  icon: Image, title: "Location Verification Photos", items: [
                    "Business Entrance", "Reception / Waiting Area",
                    "Service Areas & Workstations", "Equipment & Treatment Rooms",
                    "Salon / Barber Chairs", "Home-Based Setup (if applicable)",
                  ],
                },
              ].map(({ icon: Icon, title, items }) => (
                <div key={title} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Icon size={13} style={{ color: GOLD }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>{title}</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {items.map(it => (
                      <li key={it} style={{ fontSize: 11, color: "#ccc", marginBottom: 2, lineHeight: 1.5 }}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Required acknowledgments */}
          <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontWeight: 800, fontSize: 14, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={15} style={{ color: GOLD }} /> Required Acknowledgments
            </h3>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px" }}>You must check all boxes before proceeding.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PREREQ_TEXTS.map((text, i) => {
                const err = showErrors && errors[`prereq_${i}`];
                return (
                  <div key={i}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 12px", borderRadius: 8, background: prereqs[i] ? "#f0fdf4" : err ? "#fff5f5" : "#fafafa", border: `1px solid ${prereqs[i] ? "#10B98130" : err ? "#EF444430" : "#e5e5e5"}`, cursor: "pointer" }}
                      onClick={() => setPrereqs(p => { const n = [...p]; n[i] = !n[i]; return n; })}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${prereqs[i] ? GREEN : err ? RED : "#ccc"}`, background: prereqs[i] ? GREEN : "#fff", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {prereqs[i] && <CheckCircle2 size={12} style={{ color: "#fff" }} />}
                      </div>
                      <label style={{ fontSize: 13, color: "#333", lineHeight: 1.5, cursor: "pointer", userSelect: "none" }}>{text}</label>
                    </div>
                    {err && <FieldError msg={errors[`prereq_${i}`]} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Business Information ─────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 14, padding: "24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Building2 size={18} style={{ color: GOLD }} />
            <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Business Information</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Business Name" required error={showErrors ? errors.businessName : undefined}>
              <Input value={form.businessName} onChange={e => setF("businessName")(e.target.value)} placeholder="Your Business Name"
                style={{ border: showErrors && errors.businessName ? `1px solid ${RED}` : undefined }} />
            </Field>
            <Field label="Business Type" required error={showErrors ? errors.businessType : undefined}>
              <select value={form.businessType} onChange={e => setF("businessType")(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${showErrors && errors.businessType ? RED : "#e2e8f0"}`, fontSize: 14, background: "#fff", height: 38 }}>
                <option value="">Select business type…</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Business Address" required error={showErrors ? errors.businessAddress : undefined}>
            <Input value={form.businessAddress} onChange={e => setF("businessAddress")(e.target.value)} placeholder="Street Address"
              style={{ border: showErrors && errors.businessAddress ? `1px solid ${RED}` : undefined }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10 }}>
            <Field label="City" required error={showErrors ? errors.city : undefined}>
              <Input value={form.city} onChange={e => setF("city")(e.target.value)} placeholder="City"
                style={{ border: showErrors && errors.city ? `1px solid ${RED}` : undefined }} />
            </Field>
            <Field label="State / Province" required error={showErrors ? errors.state : undefined}>
              <Input value={form.state} onChange={e => setF("state")(e.target.value)} placeholder="State"
                style={{ border: showErrors && errors.state ? `1px solid ${RED}` : undefined }} />
            </Field>
            <Field label="ZIP / Postal" required error={showErrors ? errors.zipCode : undefined}>
              <Input value={form.zipCode} onChange={e => setF("zipCode")(e.target.value)} placeholder="ZIP"
                style={{ border: showErrors && errors.zipCode ? `1px solid ${RED}` : undefined }} />
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={e => setF("country")(e.target.value)} placeholder="US" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Business Phone" required error={showErrors ? errors.businessPhone : undefined}>
              <Input value={form.businessPhone} onChange={e => setF("businessPhone")(e.target.value)} placeholder="(555) 000-0000"
                style={{ border: showErrors && errors.businessPhone ? `1px solid ${RED}` : undefined }} />
            </Field>
            <Field label="Business Email Address">
              <Input type="email" value={form.businessEmail} onChange={e => setF("businessEmail")(e.target.value)} placeholder="info@yourbusiness.com" />
            </Field>
          </div>
          <Field label="Business Description" required error={showErrors ? errors.businessDescription : undefined}>
            <Textarea value={form.businessDescription} onChange={e => setF("businessDescription")(e.target.value)}
              placeholder="Describe your business, the services you offer, and who your customers are…" rows={4}
              style={{ border: showErrors && errors.businessDescription ? `1px solid ${RED}` : undefined }} />
          </Field>
        </div>
      )}

      {/* ── Step 2: Owner Information ─────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 14, padding: "24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <User size={18} style={{ color: GOLD }} />
            <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Owner Information</h2>
          </div>
          <Field label="Owner / Operator Full Name" required error={showErrors ? errors.ownerName : undefined}>
            <Input value={form.ownerName} onChange={e => setF("ownerName")(e.target.value)} placeholder="Full legal name of business owner"
              style={{ border: showErrors && errors.ownerName ? `1px solid ${RED}` : undefined }} />
          </Field>
          <Field label="Owner Contact Information" required error={showErrors ? errors.ownerContact : undefined}>
            <Input value={form.ownerContact} onChange={e => setF("ownerContact")(e.target.value)} placeholder="Phone number or email address"
              style={{ border: showErrors && errors.ownerContact ? `1px solid ${RED}` : undefined }} />
          </Field>
          <div style={{ background: "#fffbeb", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 10, padding: 14, display: "flex", gap: 10 }}>
            <Info size={15} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#78350F", margin: 0, lineHeight: 1.7 }}>
              <strong>Government-Issued Identification:</strong> NFGN reserves the right to request a government-issued photo ID (such as a Driver's License or Passport) during the verification process. If requested, you will be contacted directly by NFGN.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 3: Business Verification Documents ───────────────────────────── */}
      {step === 3 && (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 14, padding: "24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} style={{ color: GOLD }} />
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Business Verification Documents</h2>
              <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>Please upload copies of any applicable documents. At least one document is required.</p>
            </div>
          </div>

          {showErrors && errors.documents && (
            <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <AlertCircle size={15} style={{ color: RED, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#991B1B", margin: 0 }}>{errors.documents}</p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 8px" }}>BUSINESS LICENSE</p>
              <FileUploadButton label="Upload Business License" accept="image/*,application/pdf"
                onUploaded={p => setF("businessLicense")(p)} current={form.businessLicense} />
            </div>

            <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 4px" }}>PROFESSIONAL LICENSES</p>
              <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px" }}>
                Upload applicable professional licenses: Occupational License · Professional License · Cosmetology License · Barber License · Massage Therapy License · Esthetician License · Nail Technician License
              </p>
              <MultiFileUpload label="Upload Professional License(s)" accept="image/*,application/pdf"
                urls={form.licenses}
                onAdd={p => setF("licenses")([...form.licenses, p])}
                onRemove={i => setF("licenses")(form.licenses.filter((_, idx) => idx !== i))} />
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 4px" }}>BUSINESS REGISTRATION DOCUMENTS</p>
              <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px" }}>Articles of incorporation, DBA filing, business registration certificates, etc.</p>
              <MultiFileUpload label="Upload Business Registration Documents" accept="image/*,application/pdf"
                urls={form.taxDocs}
                onAdd={p => setF("taxDocs")([...form.taxDocs, p])}
                onRemove={i => setF("taxDocs")(form.taxDocs.filter((_, idx) => idx !== i))} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Insurance & Certifications ───────────────────────────────── */}
      {step === 4 && (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 14, padding: "24px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={18} style={{ color: GOLD }} />
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Insurance & Other Certifications</h2>
              <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>Upload applicable insurance documentation and any other professional certifications. This step is optional.</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 4px" }}>INSURANCE DOCUMENTATION</p>
              <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px" }}>General liability, professional liability, or any other applicable insurance documentation.</p>
              <FileUploadButton label="Upload Insurance Documentation" accept="image/*,application/pdf"
                onUploaded={p => setF("insurance")(p)} current={form.insurance} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#555", margin: "0 0 4px" }}>OTHER PROFESSIONAL CERTIFICATIONS</p>
              <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px" }}>Any additional professional certifications, training certificates, or credentials not covered above.</p>
              <MultiFileUpload label="Upload Other Certifications" accept="image/*,application/pdf"
                urls={form.certifications}
                onAdd={p => setF("certifications")([...form.certifications, p])}
                onRemove={i => setF("certifications")(form.certifications.filter((_, idx) => idx !== i))} />
            </div>
          </div>
          <div style={{ background: "#f0f9ff", border: "1px solid #3B82F620", borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 12, color: "#1e3a5f", margin: 0 }}><Info size={12} style={{ display: "inline", marginRight: 4 }} />This step is optional. If you have no insurance or additional certifications to submit at this time, you may click "Save & Continue" to proceed.</p>
          </div>
        </div>
      )}

      {/* ── Step 5: Location Verification Photos ─────────────────────────────── */}
      {step === 5 && (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 14, padding: "24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image size={18} style={{ color: GOLD }} />
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Location Verification Photos</h2>
              <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>At least one photo is required. Please upload clear photographs of your business location.</p>
            </div>
          </div>

          <div style={{ background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: 10, padding: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#333", margin: "0 0 6px" }}>PLEASE PROVIDE PHOTOS OF:</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              {[
                "Business Entrance", "Reception Area", "Waiting Area", "Service Area",
                "Workstations", "Equipment", "Treatment Rooms", "Salon Chairs",
                "Barber Chairs", "Massage Rooms", "Home-Based Business Setup (if applicable)", "Other relevant areas",
              ].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#555", padding: "2px 0" }}>
                  <div style={{ width: 5, height: 5, borderRadius: 99, background: GOLD, flexShrink: 0 }} /> {item}
                </div>
              ))}
            </div>
          </div>

          {showErrors && errors.locationPhotos && (
            <div style={{ background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 8 }}>
              <AlertCircle size={15} style={{ color: RED, flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "#991B1B", margin: 0 }}>{errors.locationPhotos}</p>
            </div>
          )}

          <MultiFileUpload label="Upload Location Photos" accept="image/*"
            urls={form.locationPhotos}
            onAdd={p => setF("locationPhotos")([...form.locationPhotos, p])}
            onRemove={i => setF("locationPhotos")(form.locationPhotos.filter((_, idx) => idx !== i))}
            error={showErrors ? errors.locationPhotos : undefined} />

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 99, background: form.locationPhotos.length > 0 ? GREEN : "#ddd" }} />
            <span style={{ fontSize: 12, color: form.locationPhotos.length > 0 ? "#166534" : "#888", fontWeight: 600 }}>
              {form.locationPhotos.length} photo(s) uploaded{form.locationPhotos.length === 0 ? " — minimum 1 required" : ""}
            </span>
          </div>

          <div style={{ background: "#fffbeb", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 11, color: "#78350F", margin: 0, lineHeight: 1.6 }}>
              <strong>Note:</strong> NFGN reserves the right to request additional verification photos if necessary. Please ensure photos are clear, well-lit, and accurately represent your business location.
            </p>
          </div>
        </div>
      )}

      {/* ── Step 6: Online Presence ───────────────────────────────────────────── */}
      {step === 6 && (
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 14, padding: "24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={18} style={{ color: GOLD }} />
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Online Presence Verification</h2>
              <p style={{ fontSize: 12, color: "#888", margin: "2px 0 0" }}>All fields are optional but strongly encouraged to support your application.</p>
            </div>
          </div>
          <Field label="Website URL">
            <Input value={form.website} onChange={e => setF("website")(e.target.value)} placeholder="https://yourbusiness.com" />
          </Field>
          <Field label="Facebook Business Page">
            <Input value={form.facebook} onChange={e => setF("facebook")(e.target.value)} placeholder="https://facebook.com/yourbusiness" />
          </Field>
          <Field label="Instagram Business Page">
            <Input value={form.instagram} onChange={e => setF("instagram")(e.target.value)} placeholder="https://instagram.com/yourbusiness" />
          </Field>
          <Field label="Google Business Profile">
            <Input value={form.googleBusiness} onChange={e => setF("googleBusiness")(e.target.value)} placeholder="https://g.co/kgs/…" />
          </Field>
          <Field label="Other Professional Listings">
            <Textarea value={form.otherListings} onChange={e => setF("otherListings")(e.target.value)}
              placeholder="Yelp, LinkedIn, Better Business Bureau, Angi, etc. — list any other professional business listings" rows={3} />
          </Field>
          <div style={{ background: "#f0f9ff", border: "1px solid #3B82F620", borderRadius: 8, padding: 12 }}>
            <p style={{ fontSize: 12, color: "#1e3a5f", margin: 0 }}><Info size={12} style={{ display: "inline", marginRight: 4 }} />This step is optional. Online presence can help verify your business and speed up approval. Click "Save & Continue" to proceed.</p>
          </div>
        </div>
      )}

      {/* ── Step 7: Review & Submit ───────────────────────────────────────────── */}
      {step === 7 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary review */}
          <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 14, padding: "20px 24px" }}>
            <h2 style={{ fontWeight: 800, fontSize: 17, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={18} style={{ color: GREEN }} /> Application Summary
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Business Name", value: form.businessName || "—" },
                { label: "Business Type", value: form.businessType || "—" },
                { label: "Address", value: [form.businessAddress, form.city, form.state, form.zipCode, form.country].filter(Boolean).join(", ") || "—" },
                { label: "Phone", value: form.businessPhone || "—" },
                { label: "Owner", value: form.ownerName || "—" },
                { label: "Owner Contact", value: form.ownerContact || "—" },
                { label: "Documents Uploaded", value: [form.businessLicense ? "Business License" : null, form.licenses.length ? `${form.licenses.length} Professional License(s)` : null, form.taxDocs.length ? `${form.taxDocs.length} Registration Doc(s)` : null, form.insurance ? "Insurance" : null, form.certifications.length ? `${form.certifications.length} Certification(s)` : null].filter(Boolean).join(" · ") || "None" },
                { label: "Location Photos", value: form.locationPhotos.length > 0 ? `${form.locationPhotos.length} photo(s)` : "None uploaded" },
                { label: "Website", value: form.website || "—" },
                { label: "Social Media", value: [form.facebook, form.instagram, form.googleBusiness].filter(Boolean).length > 0 ? "Provided" : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#aaa", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
                  <p style={{ fontSize: 13, color: "#333", margin: 0, wordBreak: "break-word" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Legal notice */}
          <div style={{ background: "#0a0a0a", color: "#e5e5e5", borderRadius: 14, padding: 20, fontSize: 12, lineHeight: 1.8 }}>
            <p style={{ fontWeight: 800, fontSize: 13, color: GOLD, margin: "0 0 8px" }}>⚖ LEGAL NOTICE — PLEASE READ CAREFULLY</p>
            <p style={{ margin: "0 0 8px" }}>All information submitted to NFGN must be truthful, accurate, and complete. By submitting this application, you certify that all information provided is true and correct to the best of your knowledge.</p>
            <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#fca5a5" }}>Providing false, misleading, fraudulent, or fabricated information may result in:</p>
            <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>
              {["Immediate denial of approval", "Removal from the NFGN platform", "Suspension or permanent termination of account and privileges", "Loss of commissions and earnings", "Reporting to applicable authorities", "Civil legal action where permitted by law"].map(item => (
                <li key={item} style={{ marginBottom: 3 }}>{item}</li>
              ))}
            </ul>
            <p style={{ margin: 0, color: "#aaa" }}>NFGN reserves the right to investigate any submitted information and verify business legitimacy before granting approval.</p>
          </div>

          {/* Certification checkbox */}
          <div style={{ background: "#fff", border: `2px solid ${showErrors && errors.certifiedAccurate ? RED : "#e5e5e5"}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}
              onClick={() => setF("certifiedAccurate")(!form.certifiedAccurate)}>
              <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${form.certifiedAccurate ? GREEN : showErrors && errors.certifiedAccurate ? RED : "#ccc"}`, background: form.certifiedAccurate ? GREEN : "#fff", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {form.certifiedAccurate && <CheckCircle2 size={13} style={{ color: "#fff" }} />}
              </div>
              <label style={{ fontSize: 13, color: "#166534", lineHeight: 1.6, cursor: "pointer", userSelect: "none", fontWeight: 600 }}>
                I certify that all information provided in this application is true, accurate, and complete to the best of my knowledge. I understand that providing false or misleading information may result in the rejection or revocation of my provider status and possible legal action.
              </label>
            </div>
            {showErrors && errors.certifiedAccurate && <FieldError msg={errors.certifiedAccurate} />}
          </div>

          <Button onClick={submitApplication}
            disabled={(!form.certifiedAccurate && !isAdmin) || submitting}
            style={{ background: (form.certifiedAccurate || isAdmin) ? GREEN : "#aaa", color: "#fff", fontWeight: 800, padding: "13px 24px", fontSize: 15 }}>
            {submitting ? <><Loader2 size={16} className="animate-spin mr-2" />Submitting Application…</> : <><ShieldCheck size={16} className="mr-2" />Submit Provider Application</>}
          </Button>
          <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: 0 }}>Once submitted, your application will be locked for editing. Approval may take up to 14 business days.</p>
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────────────────────────── */}
      {step < 8 && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0f0f0", gap: 10, flexWrap: "wrap" }}>
          {step > 0 ? (
            <Button variant="outline" onClick={() => { setStep(s => s - 1); setAttemptedNext(false); window.scrollTo(0, 0); }} disabled={saving}>
              <ChevronLeft size={15} className="mr-1" /> Back
            </Button>
          ) : <div />}

          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && step < 7 && (
              <Button variant="outline" onClick={saveAndExit} disabled={saving}
                style={{ color: "#555", fontSize: 13 }}>
                {saving ? <Loader2 size={13} className="animate-spin mr-1" /> : <Save size={13} className="mr-1" />}
                Save & Exit
              </Button>
            )}
            {step < 7 && (
              <Button onClick={goNext} disabled={saving}
                style={{ background: !hasErrors || isAdmin || !attemptedNext ? GOLD : "#f0f0f0", color: !hasErrors || isAdmin || !attemptedNext ? "#000" : "#aaa", fontWeight: 700 }}>
                {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                Save & Continue <ChevronRight size={15} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Application Status Card ────────────────────────────────────────────────────
function ApplicationStatusCard({ application, onRefresh }: { application: Application; onRefresh: () => void; }) {
  const isInfoRequested = application.status === "additional_info_requested";
  const statusMap: Record<string, { icon: React.ReactNode; title: string; desc: string; color: string; bg: string }> = {
    pending_review: {
      icon: <Clock size={28} style={{ color: "#3B82F6" }} />,
      title: "Application Under Review",
      desc: "Your provider application has been submitted and is currently being reviewed by the NFGN team. This process may take up to 14 business days. You will be notified once a decision has been made.",
      color: "#1D4ED8", bg: "#eff6ff",
    },
    additional_info_requested: {
      icon: <AlertCircle size={28} style={{ color: "#8B5CF6" }} />,
      title: "Additional Information Required",
      desc: "The NFGN team has reviewed your application and requires additional information. Please review the notes below and resubmit.",
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
  const info = statusMap[application.status];
  if (!info) return null;
  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <div style={{ background: info.bg, border: `2px solid ${info.color}30`, borderRadius: 16, padding: 28, textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>{info.icon}</div>
        <h2 style={{ fontWeight: 900, fontSize: 20, color: info.color, margin: "0 0 10px", fontFamily: "'Georgia',serif" }}>{info.title}</h2>
        <p style={{ fontSize: 14, color: "#444", lineHeight: 1.7, margin: "0 0 16px" }}>{info.desc}</p>
        {application.adminNotes && (
          <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 10, padding: 14, textAlign: "left" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#888", margin: "0 0 6px" }}>NFGN NOTES:</p>
            <p style={{ fontSize: 13, color: "#333", margin: 0, lineHeight: 1.6 }}>{application.adminNotes}</p>
          </div>
        )}
        {isInfoRequested && (
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

// ── Service badge ─────────────────────────────────────────────────────────────
function statusBadge(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "#F59E0B" },
    approved: { label: "Approved", color: "#10B981" },
    completed: { label: "Completed", color: "#6366F1" },
    cancelled: { label: "Cancelled", color: "#EF4444" },
  };
  const { label, color } = map[s] ?? { label: s, color: "#888" };
  return <span style={{ background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{label}</span>;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function PaygProviderPage() {
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const [application, setApplication] = useState<Application | null | undefined>(undefined);
  const [loadingApp, setLoadingApp] = useState(true);
  const [tab, setTab] = useState<"services" | "availability" | "bookings">("services");

  const isAdmin = me ? ["super_admin", "admin", "store_admin"].includes(me.role) : false;
  const isFreeMember = me ? me.role === "customer" : false;

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

  const loadApplication = useCallback(() => {
    setLoadingApp(true);
    fetch("/api/payg/provider/application", { headers: authHeaders() })
      .then(r => r.json()).then(d => setApplication(d.application ?? null))
      .catch(() => setApplication(null))
      .finally(() => setLoadingApp(false));
  }, []);

  useEffect(() => { loadApplication(); }, [loadApplication]);

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
    if (application?.status === "approved") { loadServices(); loadSlots(); loadBookings(); }
  }, [application?.status]);

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

  async function updateBookingStatus(id: number, status: string) {
    const res = await fetch(`/api/payg/provider/bookings/${id}`, {
      method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status }),
    });
    if (res.ok) { toast({ title: `Booking marked as ${status}` }); loadBookings(); }
  }

  const filteredBookings = bkFilter === "all" ? bookings : bookings.filter(b => b.status === bkFilter);
  const pendingCount = bookings.filter(b => b.status === "pending").length;

  if (loadingApp) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 80 }}>
        <Loader2 size={32} className="animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Zap size={22} style={{ color: GOLD }} />
          <h1 style={{ fontFamily: "'Georgia',serif", fontSize: 26, fontWeight: 900, margin: 0 }}>Pay As You Go Back-Office</h1>
        </div>
        <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Manage your services, availability, and incoming bookings.</p>
      </div>

      {/* ── Free member gate ───────────────────────────────────────────────── */}
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

      {/* ── Show wizard for pro members without approved application ──────── */}
      {!isFreeMember && (application === null || ["draft", "pending_submission"].includes(application?.status ?? "")) && (
        <div>
          <div style={{ background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <ShieldCheck size={18} style={{ color: GOLD }} />
              <h2 style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>Provider Verification & Approval</h2>
              {application && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: 99 }}>
                  Draft Saved — Complete all steps to submit
                </span>
              )}
            </div>
            <p style={{ color: "#666", fontSize: 13, margin: 0 }}>
              Complete all 8 steps of the verification process to submit your application. All required fields must be filled before you can proceed to the next step.
            </p>
          </div>
          <ProviderVerificationWizard application={application ?? null} onRefresh={loadApplication} isAdmin={isAdmin} />
        </div>
      )}

      {/* ── Status cards ──────────────────────────────────────────────────── */}
      {!isFreeMember && ["pending_review", "additional_info_requested", "rejected", "suspended"].includes(application?.status ?? "") && (
        <ApplicationStatusCard application={application!} onRefresh={loadApplication} />
      )}

      {/* ── Approved provider dashboard ───────────────────────────────────── */}
      {!isFreeMember && application?.status === "approved" && (
        <>
          <div style={{ background: "#f0fdf4", border: "1px solid #10B98130", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} style={{ color: "#10B981" }} />
            <span style={{ fontSize: 13, color: "#166534", fontWeight: 700 }}>Provider Verified & Approved — Your services are live on the NFGN platform.</span>
          </div>

          <div style={{ display: "flex", gap: 4, background: "#f4f4f4", borderRadius: 10, padding: 4, marginBottom: 28, width: "fit-content" }}>
            {(["services", "availability", "bookings"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer", background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0a0a0a" : "#666", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s", position: "relative" }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === "bookings" && pendingCount > 0 && (
                  <span style={{ position: "absolute", top: 4, right: 4, background: GOLD, color: "#000", borderRadius: 99, width: 16, height: 16, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Services tab */}
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
                  <AlertCircle size={13} style={{ display: "inline", marginRight: 6 }} />Maximum of 4 services reached. Delete one to add another.
                </div>
              )}
            </div>
          )}

          {/* Availability tab */}
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

          {/* Bookings tab */}
          {tab === "bookings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: 17, margin: 0 }}>Received Bookings</h2>
                  <p style={{ color: "#888", fontSize: 13, margin: "2px 0 0" }}>Customers who have booked your services.</p>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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

          {/* Service dialog */}
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

          {/* Availability dialog */}
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
