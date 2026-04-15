import { useGetGenealogyTree, useGetGenealogyStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Star, Loader2 } from "lucide-react";
import { roleLabel } from "@/lib/labels";

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

function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const indent = depth * 24;

  return (
    <div>
      <div
        className={`flex items-center gap-3 p-3 rounded-lg mb-1 border transition-colors hover:border-primary/30 ${node.isProMember ? "bg-primary/5 border-primary/20" : "bg-card border-border/50"}`}
        style={{ marginLeft: indent }}
      >
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${node.isProMember ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          {node.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{node.name}</span>
            {node.isProMember && <Badge variant="default" className="text-xs h-4">Pro</Badge>}
            <Badge variant={node.status === "active" ? "secondary" : "destructive"} className="text-xs h-4">{node.status}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>Gen {node.generation}</span>
            <span>{node.teamSize} in team</span>
            <span className="text-blue-600 font-medium">PV: {node.personalVolume ?? 0} CV</span>
            <span className="text-green-600 font-medium">GV: {node.groupVolume ?? 0} CV</span>
          </div>
        </div>
        <div className="text-right text-sm flex-shrink-0">
          <div className="font-semibold text-green-600">${node.totalEarnings.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{roleLabel(node.role)}</div>
          <div className="text-xs text-muted-foreground">Joined {new Date(node.joinedAt).toLocaleDateString()}</div>
        </div>
      </div>
      {node.children?.map(child => (
        <TreeNodeComponent key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export function GenealogyPage() {
  const { data: tree, isLoading: treeLoading } = useGetGenealogyTree({ depth: 9 });
  const { data: stats, isLoading: statsLoading } = useGetGenealogyStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Genealogy Tree</h1>
        <p className="text-muted-foreground">Your complete downline organization across all generations</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Total Team</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalTeamSize ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Active Members</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats?.activeMembers ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> Pro Members</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">{stats?.proMembers ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Personally Enrolled</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.personallyEnrolled ?? 0}</div></CardContent>
        </Card>
      </div>

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

      <Card>
        <CardHeader><CardTitle className="font-serif">Team Tree</CardTitle></CardHeader>
        <CardContent>
          {treeLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : tree ? (
            <div className="overflow-x-auto">
              <TreeNodeComponent node={tree as TreeNode} />
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">No genealogy data found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
