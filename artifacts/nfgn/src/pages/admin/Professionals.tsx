import { useState, useEffect, useCallback } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users, Plus, Search, Star, Edit2, RefreshCw, CheckCircle2,
  AlertCircle, DollarSign, Trash2, Phone, Mail, Globe, MapPin,
  Building2, Ban, ShieldCheck, Clock, Filter, ChevronRight,
} from "lucide-react";

import {
  BAP_MAIN_CATEGORIES, BAP_SUBCATEGORIES, getCategoryLabel,
} from "@/lib/bapCategories";

const GOLD = "#C9A84C";
const GREEN = "#2D6A4F";

const PROVIDER_STATUSES = ["pending", "approved", "denied", "suspended"] as const;
type ProviderStatus = typeof PROVIDER_STATUSES[number];

function statusBadge(s: ProviderStatus) {
  const map: Record<ProviderStatus, { label: string; color: string; bg: string }> = {
    pending:   { label: "Pending",   color: "#D97706", bg: "#FEF3C7" },
    approved:  { label: "Approved",  color: GREEN,     bg: "#D1FAE5" },
    denied:    { label: "Denied",    color: "#DC2626", bg: "#FEE2E2" },
    suspended: { label: "Suspended", color: "#7C3AED", bg: "#EDE9FE" },
  };
  const m = map[s] ?? map.pending;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

interface Professional {
  id: number;
  userId: number | null;
  name: string;
  businessName: string | null;
  bio: string;
  specialty: string;
  category: string | null;
  subcategory: string | null;
  avatar: string | null;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  providerStatus: ProviderStatus;
  hourlyRate: number;
  cv: number;
  proPayoutPercent: number;
  commissionPercent: number;
  isPaygEligible: boolean;
  isCommissionable: boolean;
  services: string[];
  phone: string | null;
  email: string | null;
  website: string | null;
  location: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const BLANK_FORM = {
  name: "",
  businessName: "",
  bio: "",
  category: "",
  subcategory: "",
  avatar: "",
  hourlyRate: "",
  cv: "0",
  proPayoutPercent: 80,
  commissionPercent: "10",
  isPaygEligible: false,
  isCommissionable: true,
  isAvailable: true,
  providerStatus: "approved" as ProviderStatus,
  phone: "",
  email: "",
  website: "",
  location: "",
  adminNotes: "",
};

function ProModal({
  initial,
  defaultCategory,
  onClose,
  onSaved,
}: {
  initial: Professional | null;
  defaultCategory: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    ...BLANK_FORM,
    ...(initial ? {
      name: initial.name,
      businessName: initial.businessName ?? "",
      bio: initial.bio,
      category: initial.category ?? defaultCategory,
      subcategory: initial.subcategory ?? "",
      avatar: initial.avatar ?? "",
      hourlyRate: String(initial.hourlyRate),
      cv: String(initial.cv),
      proPayoutPercent: initial.proPayoutPercent,
      commissionPercent: String(initial.commissionPercent),
      isPaygEligible: initial.isPaygEligible,
      isCommissionable: initial.isCommissionable,
      isAvailable: initial.isAvailable,
      providerStatus: initial.providerStatus,
      phone: initial.phone ?? "",
      email: initial.email ?? "",
      website: initial.website ?? "",
      location: initial.location ?? "",
      adminNotes: initial.adminNotes ?? "",
    } : { category: defaultCategory }),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subcatOptions = BAP_SUBCATEGORIES[form.category] ?? [];

  const set = (k: keyof typeof form, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) { setError("Provider name is required."); return; }
    if (!form.category) { setError("Category is required."); return; }
    const rate = parseFloat(form.hourlyRate);
    if (isNaN(rate) || rate < 0) { setError("Enter a valid price / rate."); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      businessName: form.businessName.trim() || undefined,
      bio: form.bio.trim() || "See provider profile for details.",
      specialty: getCategoryLabel(form.category),
      category: form.category,
      subcategory: form.subcategory || undefined,
      avatar: form.avatar.trim() || undefined,
      hourlyRate: rate,
      cv: parseInt(form.cv) || 0,
      proPayoutPercent: form.proPayoutPercent,
      commissionPercent: parseFloat(form.commissionPercent) || 10,
      isPaygEligible: form.isPaygEligible,
      isCommissionable: form.isCommissionable,
      isAvailable: form.isAvailable,
      providerStatus: form.providerStatus,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      website: form.website.trim() || undefined,
      location: form.location.trim() || undefined,
      adminNotes: form.adminNotes.trim() || undefined,
    };

    const res = await customFetch(
      isEdit ? `/api/professionals/${initial!.id}` : "/api/professionals",
      { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
    );
    setSaving(false);
    if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? "Save failed"); return; }
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Provider" : "Add New Provider"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* ── Section: Identity ── */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Provider Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Provider Name *</Label>
                <Input className="mt-1" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Dr. Jane Smith" />
              </div>
              <div>
                <Label>Business Name</Label>
                <Input className="mt-1" value={form.businessName} onChange={e => set("businessName", e.target.value)} placeholder="Smith Wellness Studio" />
              </div>
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category…" /></SelectTrigger>
                  <SelectContent>
                    {BAP_MAIN_CATEGORIES.map(c => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Select value={form.subcategory} onValueChange={v => set("subcategory", v)} disabled={!form.category}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select subcategory…" /></SelectTrigger>
                  <SelectContent>
                    {subcatOptions.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status + Availability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Provider Status</Label>
                <Select value={form.providerStatus} onValueChange={v => set("providerStatus", v as ProviderStatus)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.isAvailable} onCheckedChange={v => set("isAvailable", v)} />
                <Label className="text-sm">Available for Bookings</Label>
              </div>
            </div>

            <div>
              <Label>Service Description / Bio</Label>
              <Textarea className="mt-1" rows={3} value={form.bio}
                onChange={e => set("bio", e.target.value)}
                placeholder="Professional background, certifications, years of experience, approach…" />
            </div>

            <div>
              <Label>Avatar / Logo URL</Label>
              <Input className="mt-1" value={form.avatar} onChange={e => set("avatar", e.target.value)} placeholder="https://…" />
            </div>
          </div>

          {/* ── Section: Contact ── */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact & Location</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <div className="relative mt-1">
                  <Phone className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="relative mt-1">
                  <Mail className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="provider@example.com" />
                </div>
              </div>
              <div>
                <Label>Website / Booking Link</Label>
                <div className="relative mt-1">
                  <Globe className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://provider.com" />
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <div className="relative mt-1">
                  <MapPin className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" value={form.location} onChange={e => set("location", e.target.value)} placeholder="Miami, FL" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Section: Pricing & Commissions ── */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pricing & Commissions</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price / Hourly Rate (USD)</Label>
                <div className="relative mt-1">
                  <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" type="number" min={0} value={form.hourlyRate}
                    onChange={e => set("hourlyRate", e.target.value)} placeholder="150" />
                </div>
              </div>
              <div>
                <Label>CV per Booking</Label>
                <Input className="mt-1" type="number" min={0} step={1} value={form.cv}
                  onChange={e => set("cv", e.target.value)} placeholder="0" />
                <p className="text-xs text-muted-foreground mt-1">Commissionable Volume credited to the referring member.</p>
              </div>
            </div>

            {/* Payout split */}
            <div className="p-4 rounded-lg border bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Payout Split</Label>
                <div className="flex gap-3 text-xs font-mono">
                  <span className="font-bold" style={{ color: GOLD }}>{form.proPayoutPercent}% → Provider</span>
                  <span className="text-muted-foreground">{100 - form.proPayoutPercent}% → NFGN Pool</span>
                </div>
              </div>
              <input type="range" min={50} max={95} step={5} value={form.proPayoutPercent}
                onChange={e => set("proPayoutPercent", parseInt(e.target.value))}
                className="w-full accent-[#C9A84C]" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50/50</span><span>95/5</span>
              </div>
            </div>

            {/* Commission % */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Commission % (Member Referral)</Label>
                <div className="relative mt-1">
                  <Input type="number" min={0} max={50} step={0.5} value={form.commissionPercent}
                    onChange={e => set("commissionPercent", e.target.value)} placeholder="10" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">% of booking paid as referral commission to member.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.isCommissionable} onCheckedChange={v => set("isCommissionable", v)} />
                <Label className="text-sm">Commissionable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isPaygEligible} onCheckedChange={v => set("isPaygEligible", v)} />
                <Label className="text-sm">PAYG Eligible</Label>
              </div>
            </div>
          </div>

          {/* ── Section: Admin Notes ── */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Admin Notes</p>
            <Textarea rows={2} value={form.adminNotes}
              onChange={e => set("adminNotes", e.target.value)}
              placeholder="Internal notes (not visible to members)…" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} style={{ background: GREEN }}>
            {saving ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Provider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProCard({
  pro,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  pro: Professional;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: ProviderStatus) => void;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex gap-3">
          {pro.avatar ? (
            <img src={pro.avatar} alt={pro.name}
              className="h-14 w-14 rounded-full object-cover flex-shrink-0 border-2"
              style={{ borderColor: `${GOLD}40` }} />
          ) : (
            <div className="h-14 w-14 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${GOLD}, ${GREEN})` }}>
              {pro.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm leading-snug">{pro.name}</h3>
                {pro.businessName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />{pro.businessName}
                  </p>
                )}
                <p className="text-xs font-medium mt-0.5" style={{ color: GOLD }}>
                  {getCategoryLabel(pro.category ?? "")}
                  {pro.subcategory && <span className="text-muted-foreground"> · {pro.subcategory}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {statusBadge(pro.providerStatus)}
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={onDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <Star key={n} className={`h-3 w-3 ${n <= Math.round(pro.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{pro.reviewCount} reviews</span>
            </div>

            <div className="flex items-center flex-wrap gap-2 mt-1.5">
              <span className="text-sm font-bold" style={{ color: GOLD }}>${pro.hourlyRate}/hr</span>
              {pro.cv > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${GOLD}15`, color: GOLD, border: `1px solid ${GOLD}40` }}>
                  {pro.cv} CV
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {pro.proPayoutPercent}%/{100 - pro.proPayoutPercent}% split
              </span>
              {pro.isPaygEligible && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${GREEN}15`, color: GREEN, border: `1px solid ${GREEN}40` }}>
                  PAYG
                </span>
              )}
              {!pro.isAvailable && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Unavailable</span>
              )}
            </div>
          </div>
        </div>

        {pro.bio && (
          <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{pro.bio}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {pro.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{pro.location}</span>}
          {pro.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{pro.phone}</span>}
          {pro.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{pro.email}</span>}
          {pro.website && (
            <a href={pro.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors">
              <Globe className="h-3 w-3" />Website
            </a>
          )}
        </div>

        {/* Quick status actions */}
        {pro.providerStatus !== "approved" && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs" style={{ borderColor: GREEN, color: GREEN }}
              onClick={() => onStatusChange("approved")}>
              <ShieldCheck className="h-3 w-3 mr-1" />Approve
            </Button>
          </div>
        )}
        {pro.providerStatus === "approved" && (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600 border-amber-300"
              onClick={() => onStatusChange("suspended")}>
              <Ban className="h-3 w-3 mr-1" />Suspend
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-300"
              onClick={() => onStatusChange("denied")}>
              <AlertCircle className="h-3 w-3 mr-1" />Deny
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminProfessionalsPage() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [pros, setPros] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalPro, setModalPro] = useState<Professional | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Professional | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab !== "all") params.set("cat", activeTab);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await customFetch(`/api/professionals?${params}`);
    if (res.ok) setPros(await res.json());
    setLoading(false);
  }, [activeTab, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? pros.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.businessName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.subcategory ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.location ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : pros;

  const handleSaved = () => {
    setModalPro(null);
    showToast(modalPro === "new" ? "Provider added successfully." : "Provider updated successfully.");
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await customFetch(`/api/professionals/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    showToast("Provider deleted.");
    load();
  };

  const handleStatusChange = async (pro: Professional, status: ProviderStatus) => {
    await customFetch(`/api/professionals/${pro.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerStatus: status }),
    });
    showToast(`Provider ${status}.`);
    load();
  };

  const pendingCount = pros.filter(p => p.providerStatus === "pending").length;

  const catCounts: Record<string, number> = {};
  pros.forEach(p => { if (p.category) catCounts[p.category] = (catCounts[p.category] ?? 0) + 1; });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Manage Providers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add, edit, approve, and manage Book-A-Professional providers across all 9 categories.
          </p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => setStatusFilter("pending")} className="border-amber-300 text-amber-700">
              <Clock className="h-4 w-4 mr-1.5" />
              {pendingCount} Pending
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" style={{ background: GREEN }}
            onClick={() => setModalPro("new")}>
            <Plus className="h-4 w-4 mr-2" />Add Provider
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 p-3 rounded-lg border text-sm"
          style={{ background: `${GREEN}10`, borderColor: `${GREEN}40`, color: GREEN }}>
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />{toast}
        </div>
      )}

      {/* Category Tabs */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1.5 min-w-max">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            style={activeTab === "all" ? { background: GOLD } : {}}
          >
            All ({pros.length})
          </button>
          {BAP_MAIN_CATEGORIES.map(cat => {
            const count = catCounts[cat.key] ?? 0;
            const active = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  active ? "text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                style={active ? { background: GREEN } : {}}
              >
                {cat.label} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search providers…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-36">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        {activeTab !== "all" && (
          <div className="p-3 rounded-lg flex-1 text-sm hidden md:block"
            style={{ background: `${GREEN}08`, borderLeft: `3px solid ${GREEN}` }}>
            <p className="font-semibold" style={{ color: GREEN }}>
              {BAP_MAIN_CATEGORIES.find(c => c.key === activeTab)?.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {BAP_MAIN_CATEGORIES.find(c => c.key === activeTab)?.description}
            </p>
          </div>
        )}
      </div>

      {/* Provider Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Users className="h-10 w-10 mx-auto opacity-20" />
            <p className="text-muted-foreground text-sm">
              {search ? "No providers match your search." : `No providers in this category yet.`}
            </p>
            <Button size="sm" style={{ background: GREEN }}
              onClick={() => setModalPro("new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add {activeTab !== "all" ? BAP_MAIN_CATEGORIES.find(c => c.key === activeTab)?.label + " " : ""}Provider
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(pro => (
            <ProCard
              key={pro.id}
              pro={pro}
              onEdit={() => setModalPro(pro)}
              onDelete={() => setDeleteTarget(pro)}
              onStatusChange={(s) => handleStatusChange(pro, s)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(modalPro === "new" || (modalPro && typeof modalPro === "object")) && (
        <ProModal
          initial={modalPro === "new" ? null : modalPro as Professional}
          defaultCategory={activeTab !== "all" ? activeTab : ""}
          onClose={() => setModalPro(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
