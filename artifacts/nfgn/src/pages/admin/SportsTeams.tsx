import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy, Search, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Users, Star, Hash,
} from "lucide-react";

const GOLD = "#C9A84C";

type SportsTeam = {
  id: number;
  coachUserId: number;
  teamName: string;
  sport: string;
  sportOther: string | null;
  teamType: string;
  ageGroupType: string;
  ageGroup: string;
  isHeadCoach: boolean;
  isPrimaryContact: boolean;
  tin: string | null;
  approvalStatus: string;
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  coachName: string;
  coachEmail: string | null;
  coachPhone: string | null;
  membershipType: string;
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  pending:           { label: "Pending Review",       icon: Clock,         color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  approved:          { label: "Approved",              icon: CheckCircle,   color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  rejected:          { label: "Rejected",              icon: XCircle,       color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  needs_more_info:   { label: "Needs More Info",       icon: AlertCircle,   color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
};

const TEAM_TYPE_LABELS: Record<string, string> = { male: "Male", female: "Female", co_ed: "Co-Ed" };

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 99, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 700 }}>
      <Icon size={12} /> {cfg.label}
    </span>
  );
}

function TeamRow({ team, onUpdated }: { team: SportsTeam; onUpdated: (t: SportsTeam) => void }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(team.adminNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function updateStatus(approvalStatus: string) {
    setSaving(true);
    try {
      const res = await customFetch(`/api/admin/sports-teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus, adminNotes: notes }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onUpdated({ ...team, ...updated, coachName: team.coachName, coachEmail: team.coachEmail, coachPhone: team.coachPhone, membershipType: team.membershipType });
      toast({ title: "Team updated", description: `Status set to: ${STATUS_CONFIG[approvalStatus]?.label ?? approvalStatus}` });
    } catch {
      toast({ variant: "destructive", title: "Update failed", description: "Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    setSaving(true);
    try {
      const res = await customFetch(`/api/admin/sports-teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Notes saved" });
    } catch {
      toast({ variant: "destructive", title: "Failed to save notes" });
    } finally {
      setSaving(false);
    }
  }

  const sportDisplay = team.sport === "Other" && team.sportOther ? `Other: ${team.sportOther}` : team.sport;

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", background: "var(--card)" }}>
      {/* Summary row */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        style={{ width: "100%", background: "none", border: "none", padding: "14px 18px", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trophy size={18} color={GOLD} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: "var(--foreground)" }}>{team.teamName}</p>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                {sportDisplay} · {TEAM_TYPE_LABELS[team.teamType] ?? team.teamType} · {team.ageGroup} · Coach: {team.coachName}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <StatusBadge status={team.approvalStatus} />
            {team.tin && (
              <span style={{ fontSize: 11, color: GOLD, fontWeight: 700, background: "rgba(201,168,76,0.1)", padding: "3px 8px", borderRadius: 6 }}>
                {team.tin}
              </span>
            )}
            <Badge variant="outline" style={{ fontSize: 10 }}>{team.membershipType}</Badge>
            {expanded ? <ChevronUp size={16} color="#888" /> : <ChevronDown size={16} color="#888" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Detail grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "Coach Name", value: team.coachName },
              { label: "Coach Email", value: team.coachEmail ?? "—" },
              { label: "Phone", value: team.coachPhone ?? "—" },
              { label: "Membership", value: team.membershipType },
              { label: "Team Name", value: team.teamName },
              { label: "Team Type", value: TEAM_TYPE_LABELS[team.teamType] ?? team.teamType },
              { label: "Age Group / Grade", value: team.ageGroup },
              { label: "Sport", value: sportDisplay },
              { label: "Head Coach?", value: team.isHeadCoach ? "Yes" : "No" },
              { label: "Primary Contact?", value: team.isPrimaryContact ? "Yes" : "No" },
              { label: "Date Submitted", value: new Date(team.createdAt).toLocaleDateString() },
              { label: "Team ID (TIN)", value: team.tin ?? "Assigned on approval" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: "#666", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{label}</p>
                <p style={{ fontSize: 13, color: "var(--foreground)", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Admin Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
              Internal Notes
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add internal notes before approving or rejecting..."
              rows={3}
              className="text-sm"
            />
            <Button variant="outline" size="sm" className="mt-2" onClick={saveNotes} disabled={saving}>
              Save Notes
            </Button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              size="sm"
              onClick={() => updateStatus("approved")}
              disabled={saving || team.approvalStatus === "approved"}
              style={{ background: "#22c55e", color: "#fff", borderColor: "#22c55e" }}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => updateStatus("rejected")}
              disabled={saving || team.approvalStatus === "rejected"}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("needs_more_info")}
              disabled={saving || team.approvalStatus === "needs_more_info"}
            >
              <AlertCircle className="h-3.5 w-3.5 mr-1" /> Needs More Info
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("pending")}
              disabled={saving || team.approvalStatus === "pending"}
            >
              <Clock className="h-3.5 w-3.5 mr-1" /> Reset to Pending
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSportsTeamsPage() {
  const [teams, setTeams] = useState<SportsTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    customFetch("/api/admin/sports-teams")
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, []);

  function handleUpdated(updated: SportsTeam) {
    setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  const filtered = teams.filter(t => {
    const matchSearch = !search.trim() ||
      t.teamName.toLowerCase().includes(search.toLowerCase()) ||
      t.coachName.toLowerCase().includes(search.toLowerCase()) ||
      t.sport.toLowerCase().includes(search.toLowerCase()) ||
      (t.coachEmail ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || t.approvalStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: teams.length,
    pending: teams.filter(t => t.approvalStatus === "pending").length,
    approved: teams.filter(t => t.approvalStatus === "approved").length,
    rejected: teams.filter(t => t.approvalStatus === "rejected").length,
    needs_more_info: teams.filter(t => t.approvalStatus === "needs_more_info").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(201,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Trophy size={22} color={GOLD} />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold">NFGN Sports — Team Approval</h1>
          <p className="text-sm text-muted-foreground">Review and approve coach-submitted team registrations</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: "Total", count: counts.all, icon: Users, color: "#888" },
          { label: "Pending", count: counts.pending, icon: Clock, color: "#f59e0b" },
          { label: "Approved", count: counts.approved, icon: CheckCircle, color: "#22c55e" },
          { label: "Rejected", count: counts.rejected, icon: XCircle, color: "#ef4444" },
          { label: "Needs Info", count: counts.needs_more_info, icon: AlertCircle, color: "#3b82f6" },
        ].map(({ label, count, icon: Icon, color }) => (
          <Card key={label} className="text-center">
            <CardContent className="pt-4 pb-4">
              <Icon size={20} color={color} style={{ margin: "0 auto 6px" }} />
              <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0 }}>{count}</p>
              <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#888" }} />
          <Input
            placeholder="Search team, coach, sport…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", "pending", "approved", "rejected", "needs_more_info"].map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: filterStatus === s ? GOLD : "rgba(255,255,255,0.05)",
                color: filterStatus === s ? "#000" : "#aaa",
                border: `1.5px solid ${filterStatus === s ? GOLD : "rgba(255,255,255,0.12)"}`,
                transition: "all 0.15s",
              }}
            >
              {s === "all" ? `All (${counts.all})` : s === "needs_more_info" ? `Needs Info (${counts.needs_more_info})` : `${STATUS_CONFIG[s]?.label} (${counts[s as keyof typeof counts] ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Team list */}
      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading team registrations…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {teams.length === 0 ? "No team registrations yet." : "No teams match your filters."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(team => (
            <TeamRow key={team.id} team={team} onUpdated={handleUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}
