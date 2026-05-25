import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Clock, Church, HandHeart, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GOLD = "#C9A84C";

type Request = {
  id: number;
  userId: number;
  orgName: string;
  orgType: string;
  ein: string | null;
  website: string | null;
  description: string | null;
  status: string;
  adminNote: string | null;
  donationProductId: number | null;
  createdAt: string;
  userName: string | null;
  userLastName: string | null;
  userEmail: string | null;
  userRole: string | null;
};

function statusBadge(status: string) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: "Pending", bg: "rgba(201,168,76,0.15)", color: GOLD },
    approved: { label: "Approved", bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    rejected: { label: "Rejected", bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  };
  const s = map[status] ?? { label: status, bg: "#222", color: "#999" };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.06em", textTransform: "uppercase" }}>
      {s.label}
    </span>
  );
}

export function AdminNonprofitRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: number; action: "approved" | "rejected" } | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("nfgn_token");
      const res = await fetch("/api/nonprofit-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRequests(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleAction(id: number, status: "approved" | "rejected", note: string) {
    setActionId(id);
    try {
      const token = localStorage.getItem("nfgn_token");
      const res = await fetch(`/api/nonprofit-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, adminNote: note }),
      });
      if (res.ok) {
        toast({
          title: status === "approved" ? "Organization Approved!" : "Request Rejected",
          description: status === "approved"
            ? "A donation product has been created and the organization is now listed on the Gifts & Donations page."
            : "The nonprofit request has been rejected.",
        });
        fetchRequests();
      } else {
        const err = await res.json();
        toast({ variant: "destructive", title: "Error", description: err.error });
      }
    } finally {
      setActionId(null);
      setNoteModal(null);
      setAdminNote("");
    }
  }

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", padding: "32px 24px", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", padding: "5px 14px", borderRadius: 99, marginBottom: 12 }}>
              <HandHeart size={13} color={GOLD} />
              <span style={{ color: GOLD, fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase" }}>Admin Queue</span>
            </div>
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, margin: 0, fontFamily: "serif" }}>Nonprofit & Church Requests</h1>
            <p style={{ color: "#666", fontSize: 14, marginTop: 6 }}>Review, approve, or reject applications to be listed on the Gifts & Donations page.</p>
          </div>
          <button onClick={fetchRequests} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.10)", border: `1px solid rgba(201,168,76,0.3)`, color: GOLD, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {(["pending", "approved", "rejected", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: filter === f ? GOLD : "rgba(255,255,255,0.04)",
                color: filter === f ? "#000" : "#888",
                border: `1px solid ${filter === f ? GOLD : "rgba(255,255,255,0.10)"}`,
                transition: "all 0.18s",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#555" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <HandHeart size={48} color={GOLD} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
            <p style={{ color: "#555", fontSize: 15 }}>No {filter === "all" ? "" : filter} requests found.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map(req => (
              <div key={req.id} style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "24px", position: "relative" }}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "space-between" }}>

                  {/* Org info */}
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {req.orgType === "church" ? <Church size={20} color={GOLD} /> : <HandHeart size={20} color={GOLD} />}
                      </div>
                      <div>
                        <h3 style={{ color: "#fff", fontSize: 17, fontWeight: 800, margin: 0 }}>{req.orgName}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <span style={{ color: "#888", fontSize: 12, textTransform: "capitalize" }}>{req.orgType}</span>
                          {statusBadge(req.status)}
                        </div>
                      </div>
                    </div>

                    {req.description && (
                      <p style={{ color: "#9a9a9a", fontSize: 13, lineHeight: 1.6, margin: "0 0 12px" }}>{req.description}</p>
                    )}

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {req.ein && <span style={{ color: "#666", fontSize: 12 }}>EIN: <strong style={{ color: "#ccc" }}>{req.ein}</strong></span>}
                      {req.website && (
                        <a href={req.website} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, fontSize: 12, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                          <ExternalLink size={11} /> {req.website}
                        </a>
                      )}
                    </div>

                    {req.donationProductId && (
                      <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.25)", padding: "4px 12px", borderRadius: 99 }}>
                        <CheckCircle size={12} color="#22c55e" />
                        <span style={{ color: "#22c55e", fontSize: 11, fontWeight: 700 }}>Donation product created (ID: {req.donationProductId})</span>
                      </div>
                    )}

                    {req.adminNote && (
                      <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8, fontSize: 12, color: "#888" }}>
                        <strong style={{ color: "#ccc" }}>Admin note:</strong> {req.adminNote}
                      </div>
                    )}
                  </div>

                  {/* Applicant info */}
                  <div style={{ minWidth: 200 }}>
                    <p style={{ color: "#555", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Applicant</p>
                    <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>{req.userName} {req.userLastName}</p>
                    <p style={{ color: "#888", fontSize: 13, margin: "0 0 2px" }}>{req.userEmail}</p>
                    <p style={{ color: "#666", fontSize: 12, margin: "0 0 12px", textTransform: "capitalize" }}>Role: {req.userRole}</p>
                    <p style={{ color: "#555", fontSize: 11 }}>Submitted: {new Date(req.createdAt).toLocaleDateString()}</p>

                    {/* Actions */}
                    {req.status === "pending" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <button
                          disabled={actionId === req.id}
                          onClick={() => setNoteModal({ id: req.id, action: "approved" })}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                        <button
                          disabled={actionId === req.id}
                          onClick={() => setNoteModal({ id: req.id, action: "rejected" })}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note modal */}
      {noteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) { setNoteModal(null); setAdminNote(""); } }}>
          <div style={{ background: "#111", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 16, padding: "32px", maxWidth: 480, width: "100%" }}>
            <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 8px", fontFamily: "serif" }}>
              {noteModal.action === "approved" ? "✅ Approve Organization" : "❌ Reject Request"}
            </h3>
            {noteModal.action === "approved" && (
              <p style={{ color: "#9a9a9a", fontSize: 13, margin: "0 0 20px", lineHeight: 1.6 }}>
                Approving will automatically create a donation product for this organization and list it on the <strong style={{ color: "#fff" }}>Gifts & Donations</strong> page. The default split is 80% to the cause / 20% to the network. You can adjust this in Admin → Products.
              </p>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#888", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>
                Admin Note <span style={{ color: "#555", fontWeight: 400, textTransform: "none" }}>(optional)</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder={noteModal.action === "approved" ? "e.g. EIN verified, organization confirmed." : "e.g. Unable to verify EIN. Please reapply with documentation."}
                rows={3}
                style={{ width: "100%", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff", fontSize: 13, padding: "10px 12px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setNoteModal(null); setAdminNote(""); }}
                style={{ flex: 1, padding: "10px 0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "#888", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(noteModal.id, noteModal.action, adminNote)}
                disabled={actionId === noteModal.id}
                style={{
                  flex: 2, padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer",
                  background: noteModal.action === "approved" ? "#22c55e" : "#ef4444",
                  color: "#fff", border: "none",
                }}
              >
                {actionId === noteModal.id ? "Processing..." : noteModal.action === "approved" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
