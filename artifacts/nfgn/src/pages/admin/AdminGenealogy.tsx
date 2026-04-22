import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Star, TrendingUp, Loader2, Search, Network, List, X } from "lucide-react";
import { roleLabel } from "@/lib/labels";
import { customFetch } from "@/lib/custom-fetch";

type TreeNode = {
  id: number;
  userId: number;
  name: string;
  email: string;
  role: string;
  isProMember: boolean;
  status: string;
  generation: number;
  teamSize: number;
  totalEarnings: number;
  personalVolume: number;
  groupVolume: number;
  joinedAt: string;
  children: TreeNode[];
  avatar?: string;
};

/* ── Layout constants ─────────────────────────────────────────── */
const CR = 28;
const CCY = 36;
const LABEL_H = 44;
const NODE_H = CCY + CR + LABEL_H;
const V_GAP = 52;
const LEVEL_H = NODE_H + V_GAP;
const MIN_NODE_W = CR * 2 + 24;
const H_GAP = 20;

type Measured = { node: TreeNode; w: number; kids: Measured[] };

function measure(node: TreeNode): Measured {
  if (!node.children?.length) return { node, w: MIN_NODE_W + H_GAP, kids: [] };
  const kids = node.children.map(measure);
  const w = Math.max(MIN_NODE_W + H_GAP, kids.reduce((s, k) => s + k.w, 0));
  return { node, w, kids };
}

type Pos = { node: TreeNode; x: number; y: number; kids: Pos[] };

function layout(m: Measured, ox: number, level: number): Pos {
  const x = ox + m.w / 2;
  const y = level * LEVEL_H;
  let cx = ox;
  const kids = m.kids.map(k => { const p = layout(k, cx, level + 1); cx += k.w; return p; });
  return { node: m.node, x, y, kids };
}

function flatNodes(p: Pos, acc: Pos[] = []): Pos[] {
  acc.push(p); p.kids.forEach(k => flatNodes(k, acc)); return acc;
}

type Edge = { x1: number; y1: number; x2: number; y2: number };
function flatEdges(p: Pos, acc: Edge[] = []): Edge[] {
  p.kids.forEach(k => {
    acc.push({ x1: p.x, y1: p.y + CCY + CR, x2: k.x, y2: k.y + CCY - CR });
    flatEdges(k, acc);
  });
  return acc;
}

function treeDepth(p: Pos): number {
  if (!p.kids.length) return 0;
  return 1 + Math.max(...p.kids.map(treeDepth));
}

function edgePath({ x1, y1, x2, y2 }: Edge) {
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
}

/* ── Member popup ─────────────────────────────────────────────── */
function MemberPopup({ pos, onClose }: { pos: Pos; onClose: () => void }) {
  const n = pos.node;
  const safeName = n.name ?? "";
  const firstName = safeName.split(" ")[0];
  const lastName = safeName.split(" ").slice(1).join(" ");
  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{ left: pos.x, top: pos.y + CCY - CR - 8, transform: "translateX(-50%) translateY(-100%)" }}
    >
      <div className="bg-white border border-border rounded-xl shadow-2xl w-64 text-sm overflow-hidden">
        <div className={`px-4 py-3 flex items-center gap-3 ${n.isProMember ? "bg-orange-50 border-b border-orange-100" : "bg-blue-50 border-b border-blue-100"}`}>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0 ${n.isProMember ? "bg-orange-500" : "bg-blue-500"}`}>
            {safeName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{safeName}</div>
            <div className={`text-xs font-medium ${n.isProMember ? "text-orange-600" : "text-blue-600"}`}>
              {n.isProMember ? "⭐ Pro Member" : "Member"}
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">First Name</span>
            <span className="font-medium">{firstName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Name</span>
            <span className="font-medium">{lastName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Signed Up</span>
            <span className="font-medium">{new Date(n.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium text-xs truncate max-w-[140px]">{n.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium">{roleLabel(n.role)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={`font-medium capitalize ${n.status === "active" ? "text-green-600" : "text-red-500"}`}>{n.status}</span>
          </div>
          <hr className="border-border" />
          <div className="flex justify-between">
            <span className="text-blue-600 font-medium">PCV <span className="font-normal text-xs">(Personal Commissionable Volume)</span></span>
            <span className="font-bold text-blue-700">{n.personalVolume ?? 0} PCV</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600 font-medium">GCV <span className="font-normal text-xs">(Group Commissionable Volume)</span></span>
            <span className="font-bold text-green-700">{n.groupVolume ?? 0} GCV</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 w-full text-center">⭐ Only Pro Members earn commissions from GCV</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Earnings</span>
            <span className="font-bold text-green-600">${n.totalEarnings.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Team Size</span>
            <span className="font-medium">{n.teamSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Generation</span>
            <span className="font-medium">{n.generation}</span>
          </div>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[-8px] w-4 h-4 bg-white border-r border-b border-border rotate-45" />
    </div>
  );
}

/* ── SVG node ─────────────────────────────────────────────────── */
function NodeEl({ pos, selected, onSelect }: { pos: Pos; selected: boolean; onSelect: (p: Pos | null) => void }) {
  const n = pos.node;
  const [hovered, setHovered] = useState(false);
  const isVirtualRoot = n.userId === 0;
  const safeName = n.name ?? "";
  const initials = isVirtualRoot ? "🌐" : safeName.split(" ").map((w: string) => w[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "?";

  if (isVirtualRoot) {
    return (
      <g transform={`translate(${pos.x},${pos.y + CCY})`}>
        <circle r={CR + 4} fill="#C9A84C22" stroke="#C9A84C" strokeWidth="2" strokeDasharray="5,3" />
        <circle r={CR} fill="#0a0a0a" stroke="#C9A84C" strokeWidth="2" />
        <text textAnchor="middle" dominantBaseline="central" fontSize="16">{initials}</text>
        <text y={CR + 14} textAnchor="middle" fill="#C9A84C" fontSize="10" fontWeight="700" fontFamily="system-ui, sans-serif">
          NFGN Network
        </text>
        <text y={CR + 26} textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="system-ui, sans-serif">
          All Members
        </text>
      </g>
    );
  }

  return (
    <g
      transform={`translate(${pos.x},${pos.y + CCY})`}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(selected ? null : pos)}
    >
      {(hovered || selected) && (
        <circle r={CR + 5} fill="none" stroke={n.isProMember ? "#f97316" : "#3b82f6"} strokeWidth="2.5" opacity="0.5" />
      )}
      <circle r={CR} fill={n.isProMember ? "#f97316" : "#3b82f6"} stroke={selected ? (n.isProMember ? "#ea580c" : "#1d4ed8") : "white"} strokeWidth={selected ? 3 : 2} />
      <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui, sans-serif">
        {initials}
      </text>
      {n.isProMember && (
        <g transform={`translate(${CR - 10},${-CR + 10})`}>
          <circle r="8" fill="#fff7ed" stroke="#f97316" strokeWidth="1.5" />
          <text textAnchor="middle" dominantBaseline="central" fontSize="9">⭐</text>
        </g>
      )}
      <text y={CR + 14} textAnchor="middle" fill="#111827" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">
        {safeName.length > 14 ? safeName.slice(0, 13) + "…" : safeName}
      </text>
      <text y={CR + 28} textAnchor="middle" fill={n.isProMember ? "#c2410c" : "#1d4ed8"} fontSize="9" fontFamily="system-ui, sans-serif">
        {n.isProMember ? "Pro Member" : "Member"}
      </text>
    </g>
  );
}

/* ── Uni-Level tree canvas ────────────────────────────────────── */
function UniLevelTree({ root }: { root: TreeNode }) {
  const [selected, setSelected] = useState<Pos | null>(null);

  const measured = measure(root);
  const positioned = layout(measured, 0, 0);
  const nodes = flatNodes(positioned);
  const edges = flatEdges(positioned);
  const depth = treeDepth(positioned);

  const svgW = Math.max(measured.w, 420);
  const svgH = (depth + 1) * LEVEL_H + 24;

  return (
    <div className="overflow-auto">
      <div className="flex items-center gap-6 mb-4 px-1">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-blue-500" />
          <span className="text-muted-foreground">Member</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-5 w-5 rounded-full bg-orange-500" />
          <span className="text-muted-foreground">Pro Member</span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">Click or hover a node for details</span>
      </div>

      <div className="relative" style={{ width: svgW, minWidth: "100%" }}>
        <svg width={svgW} height={svgH} style={{ display: "block", overflow: "visible" }}>
          {edges.map((e, i) => (
            <path key={i} d={edgePath(e)} fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
          ))}
          {nodes.map(pos => (
            <NodeEl key={pos.node.userId} pos={pos} selected={selected?.node.userId === pos.node.userId} onSelect={setSelected} />
          ))}
        </svg>
        {selected && <MemberPopup pos={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}

/* ── List row colors ──────────────────────────────────────────── */
const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800 border-purple-200",
  admin: "bg-red-100 text-red-800 border-red-200",
  store_admin: "bg-orange-100 text-orange-800 border-orange-200",
  pro_member: "bg-amber-100 text-amber-800 border-amber-200",
  affiliate: "bg-blue-100 text-blue-800 border-blue-200",
  customer: "bg-gray-100 text-gray-700 border-gray-200",
};

/* ── Page ─────────────────────────────────────────────────────── */
export function AdminGenealogyPage() {
  const [search, setSearch] = useState("");
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);

  useEffect(() => {
    setMembersLoading(true);
    setTreeLoading(true);
    Promise.allSettled([
      customFetch<any[]>("/api/genealogy/admin-all"),
      customFetch<any>("/api/genealogy/admin-stats"),
      customFetch<TreeNode>("/api/genealogy/admin-tree"),
    ]).then(([membersRes, statsRes, treeRes]) => {
      if (membersRes.status === "fulfilled" && Array.isArray(membersRes.value)) {
        setAllMembers(membersRes.value);
      }
      if (statsRes.status === "fulfilled" && statsRes.value && !("error" in statsRes.value)) {
        setAdminStats(statsRes.value);
      }
      if (treeRes.status === "fulfilled" && treeRes.value && !("error" in treeRes.value) && treeRes.value.name) {
        setTree(treeRes.value);
      }
    }).finally(() => {
      setMembersLoading(false);
      setTreeLoading(false);
    });
  }, []);

  const filteredFlat = allMembers.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Global Genealogy</h1>
        <p className="text-muted-foreground">Complete network organization — Uni-Level view across all 9 generations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Total Members
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{adminStats?.totalMembers ?? allMembers.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Members</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{adminStats?.activeMembers ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-500" /> Pro Members
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-500">{adminStats?.proMembers ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> No Sponsor
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-500">{adminStats?.noSponsor ?? 0}</div></CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or role…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="tree">
        <TabsList>
          <TabsTrigger value="tree" className="gap-2"><Network className="h-4 w-4" /> Tree View</TabsTrigger>
          <TabsTrigger value="list" className="gap-2"><List className="h-4 w-4" /> List View</TabsTrigger>
        </TabsList>

        {/* Tree view */}
        <TabsContent value="tree">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">
                Network Tree
                <span className="text-sm font-normal text-muted-foreground ml-2">Click or hover any node to view details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treeLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tree ? (
                <UniLevelTree root={tree as TreeNode} />
              ) : (
                <p className="text-center text-muted-foreground py-12">No genealogy data found.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* List view */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">
                All Network Members
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {filteredFlat.length} member{filteredFlat.length !== 1 ? "s" : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredFlat.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  {search ? "No members match your search." : "No members found."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-muted-foreground">Member</th>
                        <th className="pb-3 font-medium text-muted-foreground">Role</th>
                        <th className="pb-3 font-medium text-muted-foreground">Status</th>
                        <th className="pb-3 font-medium text-muted-foreground">Sponsor</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right text-blue-700">PCV</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Earnings</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredFlat.map((m: any) => (
                        <tr key={m.userId} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${m.isProMember ? "bg-orange-500" : "bg-blue-500"}`}>
                                {m.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-1">
                                  {m.name}
                                  {m.isProMember && <Star className="h-3 w-3 text-orange-500" />}
                                </div>
                                <div className="text-xs text-muted-foreground">{m.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${ROLE_COLORS[m.role] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                              {roleLabel(m.role)}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className={`text-xs font-medium capitalize ${m.status === "active" ? "text-green-600" : "text-red-500"}`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground text-xs">{m.sponsorName}</td>
                          <td className="py-3 text-right text-xs font-semibold text-blue-600">{m.personalVolume ?? 0} PCV</td>
                          <td className="py-3 text-right font-semibold text-green-600">${m.totalEarnings.toFixed(2)}</td>
                          <td className="py-3 text-right text-xs text-muted-foreground">{new Date(m.joinedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
