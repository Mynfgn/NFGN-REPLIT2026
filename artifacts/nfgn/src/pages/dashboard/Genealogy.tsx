import { useState, useRef, useEffect } from "react";
import { useGetGenealogyTree, useGetGenealogyStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Star, X, Loader2 } from "lucide-react";

type TreeNode = {
  id: number;
  userId: number;
  name: string;
  username?: string;
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
const CR = 28;           // circle radius
const CCY = 36;          // circle-center Y offset inside a level slot
const LABEL_H = 44;      // height below circle for name + badge
const NODE_H = CCY + CR + LABEL_H;  // 108 px total per node
const V_GAP = 52;        // vertical gap between bottom of one level and top of next
const LEVEL_H = NODE_H + V_GAP;     // 160 px per level
const MIN_NODE_W = CR * 2 + 24;     // 80 px minimum node footprint
const H_GAP = 20;        // horizontal gap between sibling nodes

/* ── Subtree width calculation ────────────────────────────────── */
type Measured = { node: TreeNode; w: number; kids: Measured[] };

function measure(node: TreeNode): Measured {
  if (!node.children?.length) return { node, w: MIN_NODE_W + H_GAP, kids: [] };
  const kids = node.children.map(measure);
  const w = Math.max(MIN_NODE_W + H_GAP, kids.reduce((s, k) => s + k.w, 0));
  return { node, w, kids };
}

/* ── Assign absolute (x, y) positions ────────────────────────── */
type Pos = { node: TreeNode; x: number; y: number; kids: Pos[] };

function layout(m: Measured, ox: number, level: number): Pos {
  const x = ox + m.w / 2;
  const y = level * LEVEL_H;
  let cx = ox;
  const kids = m.kids.map(k => { const p = layout(k, cx, level + 1); cx += k.w; return p; });
  return { node: m.node, x, y, kids };
}

/* ── Flatten tree into arrays ─────────────────────────────────── */
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

/* ── Connector bezier path ────────────────────────────────────── */
function edgePath({ x1, y1, x2, y2 }: Edge) {
  const my = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
}

const POPUP_W = 256; // w-64
const POPUP_H = 310; // approximate popup height

/* ── Member info popup ────────────────────────────────────────── */
function MemberPopup({ pos, onClose, svgW }: { pos: Pos; onClose: () => void; svgW: number }) {
  const n = pos.node;
  const firstName = n.name.split(" ")[0];
  const lastName = n.name.split(" ").slice(1).join(" ");

  // Default: centered above the node
  const nodeTopY = pos.y + CCY - CR - 8;
  const flipBelow = nodeTopY - POPUP_H < 4; // not enough room above → show below

  let left = pos.x - POPUP_W / 2;
  // Clamp horizontally so popup never exits the SVG canvas (with 8px padding)
  left = Math.max(8, Math.min(left, svgW - POPUP_W - 8));

  const top = flipBelow
    ? pos.y + CCY + CR + 10   // below the node circle
    : nodeTopY - POPUP_H;     // above the node circle

  // Arrow position relative to popup left edge
  const arrowLeft = Math.min(Math.max(pos.x - left - 8, 12), POPUP_W - 28);

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{ left, top, width: POPUP_W }}
    >
      {/* Arrow pointing down (when popup is above node) */}
      {!flipBelow && (
        <div
          className="absolute bottom-[-8px] w-4 h-4 bg-white border-r border-b border-border rotate-45"
          style={{ left: arrowLeft }}
        />
      )}

      <div className="bg-white border border-border rounded-xl shadow-2xl text-sm overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 flex items-center gap-3 ${n.isProMember ? "bg-orange-50 border-b border-orange-100" : "bg-blue-50 border-b border-blue-100"}`}>
          {n.avatar ? (
            <img
              src={n.avatar}
              alt={n.name}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0 ring-2 ring-white"
            />
          ) : (
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0 ${n.isProMember ? "bg-orange-500" : "bg-blue-500"}`}
            >
              {n.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate">{n.name}</div>
            <div className={`text-xs font-medium ${n.isProMember ? "text-orange-600" : "text-blue-600"}`}>
              {n.isProMember ? "⭐ Pro Member" : "Member"}
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Details */}
        <div className="px-4 py-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">First Name</span>
            <span className="font-medium">{firstName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Name</span>
            <span className="font-medium">{lastName || "—"}</span>
          </div>
          {n.username && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium text-primary">@{n.username}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Signed Up</span>
            <span className="font-medium">{new Date(n.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
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

      {/* Arrow pointing up (when popup is below node) */}
      {flipBelow && (
        <div
          className="absolute top-[-8px] w-4 h-4 bg-white border-l border-t border-border rotate-45"
          style={{ left: arrowLeft }}
        />
      )}
    </div>
  );
}

/* ── Single node element ──────────────────────────────────────── */
function NodeEl({
  pos,
  selected,
  onSelect,
}: {
  pos: Pos;
  selected: boolean;
  onSelect: (p: Pos | null) => void;
}) {
  const n = pos.node;
  const [hovered, setHovered] = useState(false);
  const initials = n.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const clipId = `avatar-clip-${n.userId}`;

  return (
    <g
      transform={`translate(${pos.x},${pos.y + CCY})`}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(selected ? null : pos)}
    >
      {/* Clip path for avatar photo */}
      <defs>
        <clipPath id={clipId}>
          <circle r={CR} />
        </clipPath>
      </defs>

      {/* Glow ring when hovered or selected */}
      {(hovered || selected) && (
        <circle
          r={CR + 5}
          fill="none"
          stroke={n.isProMember ? "#f97316" : "#3b82f6"}
          strokeWidth="2.5"
          opacity="0.5"
        />
      )}

      {/* Background circle (always shown — visible if avatar has transparent edges) */}
      <circle
        r={CR}
        fill={n.isProMember ? "#f97316" : "#3b82f6"}
        stroke={selected ? (n.isProMember ? "#ea580c" : "#1d4ed8") : "white"}
        strokeWidth={selected ? 3 : 2}
      />

      {n.avatar ? (
        /* Profile photo clipped to circle */
        <>
          <image
            href={n.avatar}
            x={-CR}
            y={-CR}
            width={CR * 2}
            height={CR * 2}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
          {/* Re-draw the border ring on top of the image */}
          <circle
            r={CR}
            fill="none"
            stroke={selected ? (n.isProMember ? "#ea580c" : "#1d4ed8") : "white"}
            strokeWidth={selected ? 3 : 2}
          />
        </>
      ) : (
        /* Initials fallback */
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="13"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {initials}
        </text>
      )}

      {/* Star badge for Pro Members */}
      {n.isProMember && (
        <g transform={`translate(${CR - 10},${-CR + 10})`}>
          <circle r="8" fill="#fff7ed" stroke="#f97316" strokeWidth="1.5" />
          <text textAnchor="middle" dominantBaseline="central" fontSize="9">⭐</text>
        </g>
      )}
      {/* Name label */}
      <text
        y={CR + 14}
        textAnchor="middle"
        fill="#111827"
        fontSize="10"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        {n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name}
      </text>
      {/* Role badge */}
      <text
        y={CR + 28}
        textAnchor="middle"
        fill={n.isProMember ? "#c2410c" : "#1d4ed8"}
        fontSize="9"
        fontFamily="system-ui, sans-serif"
      >
        {n.isProMember ? "Pro Member" : "Member"}
      </text>
    </g>
  );
}

/* ── Main Uni-Level tree canvas ───────────────────────────────── */
function UniLevelTree({ root }: { root: TreeNode }) {
  const [selected, setSelected] = useState<Pos | null>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop,  setScrollTop]  = useState(0);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const didFit = useRef(false);

  const measured = measure(root);
  const positioned = layout(measured, 0, 0);
  const nodes = flatNodes(positioned);
  const edges = flatEdges(positioned);
  const depth = treeDepth(positioned);

  const svgW = Math.max(measured.w, 320);
  const svgH = (depth + 1) * LEVEL_H + 24;

  /* Auto-fit to container width on first render */
  useEffect(() => {
    if (didFit.current) return;
    const el = wrapRef.current;
    if (!el) return;
    const containerW = el.clientWidth;
    if (containerW > 0 && svgW > containerW) {
      setZoom(Math.max(0.3, containerW / svgW));
    }
    didFit.current = true;
  }, [svgW]);

  const scaledW = Math.ceil(svgW * zoom);
  const scaledH = Math.ceil(svgH * zoom);

  const zoomIn  = () => setZoom(z => Math.min(2,   parseFloat((z + 0.1).toFixed(1))));
  const zoomOut = () => setZoom(z => Math.max(0.3, parseFloat((z - 0.1).toFixed(1))));
  const zoomFit = () => {
    const el = wrapRef.current;
    const containerW = el ? el.clientWidth : svgW;
    setZoom(containerW > 0 && svgW > containerW ? Math.max(0.3, containerW / svgW) : 1);
    setSelected(null);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollLeft(e.currentTarget.scrollLeft);
    setScrollTop(e.currentTarget.scrollTop);
  };

  /* Popup position — computed relative to outerRef so it escapes the
     overflow:auto container and is never clipped.                        */
  const popupPos = selected && wrapRef.current
    ? {
        ...selected,
        x: (wrapRef.current.offsetLeft ?? 0) + selected.x * zoom - scrollLeft,
        y: (wrapRef.current.offsetTop  ?? 0) + selected.y * zoom - scrollTop,
      }
    : null;

  return (
    <div ref={outerRef} style={{ position: "relative" }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3 px-1 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded-full bg-blue-500" />
          <span className="text-muted-foreground text-xs">Member</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-4 w-4 rounded-full bg-orange-500" />
          <span className="text-muted-foreground text-xs">Pro Member</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted-foreground mr-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={zoomOut}
            className="h-7 w-7 rounded border border-border flex items-center justify-center text-base font-bold hover:bg-muted transition-colors"
            title="Zoom out"
          >−</button>
          <button
            onClick={zoomIn}
            className="h-7 w-7 rounded border border-border flex items-center justify-center text-base font-bold hover:bg-muted transition-colors"
            title="Zoom in"
          >+</button>
          <button
            onClick={zoomFit}
            className="h-7 px-2 rounded border border-border text-xs font-medium hover:bg-muted transition-colors"
            title="Fit to screen"
          >Fit</button>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:block">Scroll to navigate · click nodes for details</span>
      </div>

      {/* Scrollable viewport */}
      <div
        ref={wrapRef}
        className="overflow-auto border border-border rounded-lg bg-muted/20"
        style={{ maxHeight: 520 }}
        onScroll={handleScroll}
      >
        <div style={{ width: scaledW, height: scaledH, minWidth: "100%", position: "relative" }}>
          <svg
            width={scaledW}
            height={scaledH}
            style={{ display: "block" }}
          >
            <g transform={`scale(${zoom})`}>
              {edges.map((e, i) => (
                <path
                  key={i}
                  d={edgePath(e)}
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ))}
              {nodes.map(pos => (
                <NodeEl
                  key={pos.node.userId}
                  pos={pos}
                  selected={selected?.node.userId === pos.node.userId}
                  onSelect={setSelected}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>

      {/* Popup rendered OUTSIDE the overflow container — never clipped */}
      {popupPos && (
        <MemberPopup
          pos={popupPos}
          onClose={() => setSelected(null)}
          svgW={scaledW}
        />
      )}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export function GenealogyPage() {
  const { data: tree, isLoading: treeLoading } = useGetGenealogyTree({ depth: 9 });
  const { data: stats } = useGetGenealogyStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Genealogy Tree</h1>
        <p className="text-muted-foreground">Your complete downline organization — Uni-Level view</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Total Team
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalTeamSize ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Members</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats?.activeMembers ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-orange-500" /> Pro Members
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-500">{stats?.proMembers ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Personally Enrolled</CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.personallyEnrolled ?? 0}</div></CardContent>
        </Card>
      </div>

      {/* Generation breakdown */}
      {stats?.generationBreakdown && stats.generationBreakdown.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="font-serif text-lg">Generation Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
              {stats.generationBreakdown.map((g: any) => (
                <div key={g.generation} className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Gen {g.generation}</div>
                  <div className="font-bold text-lg">{g.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tree diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Team Tree</CardTitle>
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
    </div>
  );
}
