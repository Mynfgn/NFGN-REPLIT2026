import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Users, Plus, Search, Star, Edit2, RefreshCw, CheckCircle2, AlertCircle, DollarSign
} from "lucide-react";

import { BAP_CATEGORIES } from "@/lib/bapCategories";

const BRAND_GOLD = "#C9A84C";
const BRAND_GREEN = "#2D6A4F";

interface Professional {
  id: number;
  name: string;
  bio: string;
  specialty: string;
  avatar: string | null;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  hourlyRate: number;
  cv: number;
  proPayoutPercent: number;
  services: string[];
  createdAt: string;
}

function ProModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Professional | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [category, setCategory] = useState(initial?.specialty ?? "");
  const [selectedServices, setSelectedServices] = useState<string[]>(initial?.services ?? []);
  const [customService, setCustomService] = useState("");
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    bio: initial?.bio ?? "",
    avatar: initial?.avatar ?? "",
    hourlyRate: String(initial?.hourlyRate ?? ""),
    cv: String(initial?.cv ?? "0"),
    proPayoutPercent: initial?.proPayoutPercent ?? 80,
    isAvailable: initial?.isAvailable ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = BAP_CATEGORIES[category] ?? [];

  const toggleService = (s: string) =>
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const addCustom = () => {
    const s = customService.trim();
    if (s && !selectedServices.includes(s)) setSelectedServices(prev => [...prev, s]);
    setCustomService("");
  };

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim() || !category) { setError("Name and service category are required."); return; }
    const rate = parseFloat(form.hourlyRate);
    if (isNaN(rate) || rate < 0) { setError("Enter a valid hourly rate."); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      bio: form.bio.trim(),
      specialty: category,
      avatar: form.avatar.trim() || undefined,
      hourlyRate: rate,
      cv: parseInt(form.cv) || 0,
      proPayoutPercent: form.proPayoutPercent,
      services: selectedServices,
      isAvailable: form.isAvailable,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Professional" : "Add New Professional"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <Label>Full Name *</Label>
              <Input className="mt-1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Jane Smith" />
            </div>

            {/* Category (Specialty) */}
            <div>
              <Label>Service Category *</Label>
              <Select value={category} onValueChange={v => { setCategory(v); setSelectedServices([]); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(BAP_CATEGORIES).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">e.g. Beauty & Hair, Barbering, Mental Health…</p>
            </div>

            {/* Sub-services */}
            {category && (
              <div>
                <Label>Services Offered</Label>
                <p className="text-xs text-muted-foreground mb-2 mt-1">Check all services this professional offers in the <strong>{category}</strong> category.</p>
                <div className="grid grid-cols-2 gap-1.5 p-3 border rounded-lg bg-muted/10">
                  {categoryOptions.map(svc => (
                    <label key={svc} className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted/40 transition-colors">
                      <Checkbox
                        checked={selectedServices.includes(svc)}
                        onCheckedChange={() => toggleService(svc)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs">{svc}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add custom service…"
                    value={customService}
                    onChange={e => setCustomService(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
                    className="text-sm h-8"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={addCustom} className="h-8 text-xs">Add</Button>
                </div>
                {selectedServices.filter(s => !categoryOptions.includes(s)).map(s => (
                  <Badge key={s} variant="secondary" className="mr-1 mt-1 text-xs">{s} ×</Badge>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hourly Rate (USD)</Label>
                <div className="relative mt-1">
                  <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-8" type="number" min={0} value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} placeholder="150" />
                </div>
              </div>
              <div>
                <Label>CV (Commissionable Volume)</Label>
                <Input className="mt-1" type="number" min={0} step={1} value={form.cv} onChange={e => setForm(f => ({ ...f, cv: e.target.value }))} placeholder="0" />
                <p className="text-xs text-muted-foreground mt-1">CV credited to the member per booking session.</p>
              </div>
            </div>
            {/* Payout Split Slider */}
            <div className="space-y-2 p-4 rounded-lg border bg-muted/10">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Payout Split</Label>
                <div className="flex gap-3 text-xs font-mono">
                  <span className="font-bold" style={{ color: BRAND_GOLD }}>{form.proPayoutPercent}% → Pro</span>
                  <span className="text-muted-foreground">{100 - form.proPayoutPercent}% → Pool</span>
                </div>
              </div>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={form.proPayoutPercent}
                onChange={e => setForm(f => ({ ...f, proPayoutPercent: parseInt(e.target.value) }))}
                className="w-full accent-[#C9A84C]"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50% Pro / 50% Pool</span>
                <span>95% Pro / 5% Pool</span>
              </div>
              <p className="text-xs text-muted-foreground">The pool funds member referral commissions &amp; NFGN fees. Default is 80/20.</p>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.isAvailable} onCheckedChange={v => setForm(f => ({ ...f, isAvailable: v }))} />
              <Label className="text-sm">Available for Bookings</Label>
            </div>

            <div>
              <Label>Professional Bio</Label>
              <Textarea className="mt-1" rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Professional background, certifications, approach, years of experience…" />
            </div>

            <div>
              <Label>Avatar URL (optional)</Label>
              <Input className="mt-1" value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} placeholder="https://…" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save Professional"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminProfessionalsPage() {
  const [pros, setPros] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalPro, setModalPro] = useState<Professional | "new" | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await customFetch("/api/professionals");
    if (res.ok) setPros(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = pros.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaved = (msg: string) => {
    setModalPro(null);
    setSuccess(msg);
    load();
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Manage Professionals</h1>
          <p className="text-muted-foreground text-sm mt-1">Add and manage Book-A-Professional consultants.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setModalPro("new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Professional
          </Button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />{success}
        </div>
      )}

      <div className="relative w-full md:w-80">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or specialty…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No professionals found. {search ? "" : "Click \"Add Professional\" to get started."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(pro => (
            <Card key={pro.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  {pro.avatar ? (
                    <img src={pro.avatar} alt={pro.name} className="h-14 w-14 rounded-full object-cover flex-shrink-0 border-2 border-primary/30" />
                  ) : (
                    <div className="h-14 w-14 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 border-2 border-primary/30"
                      style={{ background: `linear-gradient(135deg, ${BRAND_GOLD}, ${BRAND_GREEN})` }}>
                      {pro.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{pro.name}</h3>
                        <p className="text-xs text-primary">{pro.specialty}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-xs ${pro.isAvailable ? "text-green-600 border-green-300" : "text-muted-foreground"}`}>
                          {pro.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setModalPro(pro)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`h-3 w-3 ${n <= Math.round(pro.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{pro.reviewCount} reviews</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <p className="text-sm font-bold" style={{ color: BRAND_GOLD }}>${pro.hourlyRate}/hr</p>
                      {pro.cv > 0 && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.12)", color: BRAND_GOLD, border: "1px solid rgba(201,168,76,0.3)" }}>
                          {pro.cv} CV
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.08)", color: BRAND_GOLD, border: "1px solid rgba(201,168,76,0.2)" }}>
                        {pro.proPayoutPercent ?? 80}% / {100 - (pro.proPayoutPercent ?? 80)}%
                      </span>
                    </div>
                  </div>
                </div>

                {pro.bio && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{pro.bio}</p>}

                {pro.services.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {pro.services.slice(0, 4).map(s => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                    {pro.services.length > 4 && (
                      <Badge variant="secondary" className="text-xs">+{pro.services.length - 4} more</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(modalPro === "new" || (modalPro && typeof modalPro === "object")) && (
        <ProModal
          initial={modalPro === "new" ? null : modalPro as Professional}
          onClose={() => setModalPro(null)}
          onSaved={() => handleSaved(modalPro === "new" ? "Professional added successfully." : "Professional updated successfully.")}
        />
      )}
    </div>
  );
}
