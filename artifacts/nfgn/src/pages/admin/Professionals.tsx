import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Plus, Search, Star, Edit2, RefreshCw, CheckCircle2, AlertCircle, X, DollarSign
} from "lucide-react";

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
  services: string[];
  createdAt: string;
}

const EMPTY_FORM = {
  name: "", bio: "", specialty: "", avatar: "", hourlyRate: "", services: "", isAvailable: true,
};

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
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    bio: initial?.bio ?? "",
    specialty: initial?.specialty ?? "",
    avatar: initial?.avatar ?? "",
    hourlyRate: String(initial?.hourlyRate ?? ""),
    services: (initial?.services ?? []).join(", "),
    isAvailable: initial?.isAvailable ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim() || !form.specialty.trim() || !form.hourlyRate) {
      setError("Name, specialty, and hourly rate are required.");
      return;
    }
    const rate = parseFloat(form.hourlyRate);
    if (isNaN(rate) || rate <= 0) { setError("Enter a valid hourly rate."); return; }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      bio: form.bio.trim(),
      specialty: form.specialty.trim(),
      avatar: form.avatar.trim() || undefined,
      hourlyRate: rate,
      services: form.services.split(",").map(s => s.trim()).filter(Boolean),
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

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.name} onChange={e => field("name", e.target.value)} placeholder="Dr. Jane Smith" />
            </div>
            <div className="col-span-2">
              <Label>Specialty *</Label>
              <Input value={form.specialty} onChange={e => field("specialty", e.target.value)} placeholder="Naturopathic Medicine" />
            </div>
            <div>
              <Label>Hourly Rate (USD) *</Label>
              <div className="relative">
                <DollarSign className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" type="number" min={1} value={form.hourlyRate} onChange={e => field("hourlyRate", e.target.value)} placeholder="150" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.isAvailable} onCheckedChange={v => field("isAvailable", v)} />
              <Label>Available for bookings</Label>
            </div>
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea rows={3} value={form.bio} onChange={e => field("bio", e.target.value)} placeholder="Professional background, certifications, approach…" />
          </div>

          <div>
            <Label>Services (comma-separated)</Label>
            <Input value={form.services} onChange={e => field("services", e.target.value)} placeholder="Naturopathic Consultation, Herb Protocol Design, Hormone Balancing" />
            <p className="text-xs text-muted-foreground mt-1">Separate each service with a comma.</p>
          </div>

          <div>
            <Label>Avatar URL (optional)</Label>
            <Input value={form.avatar} onChange={e => field("avatar", e.target.value)} placeholder="https://…" />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
            </div>
          )}
        </div>

        <DialogFooter>
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
                    <p className="text-sm font-bold mt-1" style={{ color: BRAND_GOLD }}>${pro.hourlyRate}/hr</p>
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
