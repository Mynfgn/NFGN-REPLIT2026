import { useState } from "react";
import { useGetGenealogyTree, useGetGenealogyStats, useGetDownline } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Star, TrendingUp, ChevronDown, ChevronRight,
  Loader2, Search, Network, List
} from "lucide-react";

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
  joinedAt: string;
  children: TreeNode[];
  avatar?: string;
};

const ROLE_COLORS: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800 border-purple-200",
  admin: "bg-red-100 text-red-800 border-red-200",
  store_admin: "bg-orange-100 text-orange-800 border-orange-200",
  pro_member: "bg-amber-100 text-amber-800 border-amber-200",
  affiliate: "bg-blue-100 text-blue-800 border-blue-200",
  customer: "bg-gray-100 text-gray-700 border-gray-200",
};

function CollapsibleTreeNode({
  node,
  depth = 0,
  search,
}: {
  node: TreeNode;
  depth?: number;
  search: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const matchesSearch =
    !search ||
    node.name.toLowerCase().includes(search.toLowerCase()) ||
    node.email.toLowerCase().includes(search.toLowerCase());

  const roleLabel = node.role.replace(/_/g, " ");
  const roleClass = ROLE_COLORS[node.role] ?? "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-3 rounded-lg mb-1 border transition-all ${
          matchesSearch ? "" : "opacity-30"
        } ${
          node.isProMember
            ? "bg-primary/5 border-primary/20 hover:border-primary/40"
            : "bg-card border-border/50 hover:border-border"
        }`}
        style={{ marginLeft: depth * 28 }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-muted-foreground ${
            hasChildren ? "hover:bg-muted cursor-pointer" : "cursor-default"
          }`}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </button>

        {/* Avatar */}
        <div
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
            node.isProMember
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {node.name.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{node.name}</span>
            {node.isProMember && (
              <Star className="h-3 w-3 text-primary flex-shrink-0" />
            )}
            <span
              className={`text-xs px-1.5 py-0.5 rounded border capitalize font-medium ${roleClass}`}
            >
              {roleLabel}
            </span>
            <Badge
              variant={node.status === "active" ? "secondary" : "destructive"}
              className="text-xs h-4"
            >
              {node.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="truncate">{node.email}</span>
            <span className="flex-shrink-0">Gen {node.generation}</span>
            {hasChildren && (
              <span className="flex-shrink-0">
                {node.children.length} direct
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right text-sm flex-shrink-0 hidden sm:block">
          <div className="font-semibold text-green-600">
            ${node.totalEarnings.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">
            {node.teamSize} in team
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <CollapsibleTreeNode
              key={child.userId}
              node={child}
              depth={depth + 1}
              search={search}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminGenealogyPage() {
  const [search, setSearch] = useState("");

  // Load from root (user 1 = super admin)
  const { data: tree, isLoading: treeLoading } = useGetGenealogyTree({
    userId: 1,
    depth: 9,
  });
  const { data: stats, isLoading: statsLoading } = useGetGenealogyStats({
    userId: 1,
  });
  const { data: downline, isLoading: downlineLoading } = useGetDownline({
    userId: 1,
  });

  const flatList: any[] = Array.isArray(downline) ? downline : [];
  const filteredFlat = flatList.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Global Genealogy</h1>
        <p className="text-muted-foreground">
          Complete network organization across all 9 generations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Total Network
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                stats?.totalTeamSize ?? 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.activeMembers ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" /> Pro Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats?.proMembers ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Generations Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.generationBreakdown?.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Breakdown */}
      {stats?.generationBreakdown && stats.generationBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">
              Generation Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
              {stats.generationBreakdown
                .sort((a: any, b: any) => a.generation - b.generation)
                .map((g: any) => (
                  <div
                    key={g.generation}
                    className="text-center p-3 bg-muted rounded-lg"
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      Gen {g.generation}
                    </div>
                    <div className="font-bold text-lg">{g.count}</div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + Tree/List toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="tree">
        <TabsList>
          <TabsTrigger value="tree" className="gap-2">
            <Network className="h-4 w-4" /> Tree View
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" /> List View
          </TabsTrigger>
        </TabsList>

        {/* Tree view */}
        <TabsContent value="tree">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">
                Network Tree
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  Click arrows to expand/collapse
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {treeLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : tree ? (
                <div className="overflow-x-auto">
                  <CollapsibleTreeNode
                    node={tree as TreeNode}
                    depth={0}
                    search={search}
                  />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No genealogy data found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flat list view */}
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
              {downlineLoading ? (
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
                        <th className="pb-3 font-medium text-muted-foreground text-center">Gen</th>
                        <th className="pb-3 font-medium text-muted-foreground">Sponsor</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Earnings</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredFlat.map((m: any) => {
                        const roleClass = ROLE_COLORS[m.role] ?? "bg-gray-100 text-gray-700 border-gray-200";
                        return (
                          <tr key={m.userId} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.isProMember ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                  {m.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-1">
                                    {m.name}
                                    {m.isProMember && <Star className="h-3 w-3 text-primary" />}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{m.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`text-xs px-1.5 py-0.5 rounded border capitalize font-medium ${roleClass}`}>
                                {m.role.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-bold">
                                {m.generation}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-muted-foreground text-xs">
                              {m.sponsorName}
                            </td>
                            <td className="py-3 text-right font-semibold text-green-600">
                              ${m.totalEarnings.toFixed(2)}
                            </td>
                            <td className="py-3 text-right text-xs text-muted-foreground">
                              {new Date(m.joinedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
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
