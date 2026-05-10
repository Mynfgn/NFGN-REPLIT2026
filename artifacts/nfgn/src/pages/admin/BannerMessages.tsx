import { useState, useEffect, useRef } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { TickerBar } from "@/components/ticker-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Megaphone, Plus, Trash2, Save, Loader2, GripVertical,
  ToggleLeft, ToggleRight, RefreshCw, Eye, EyeOff, MonitorPlay, Gauge, ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";

interface BannerMessage {
  id: number;
  message: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

type TickerSpeed = "slow" | "medium" | "fast";
type TickerFontSize = "small" | "medium" | "large";

const SPEED_LABELS: Record<TickerSpeed, string> = { slow: "Slow", medium: "Medium", fast: "Fast" };
const FONT_SIZE_LABELS: Record<TickerFontSize, string> = { small: "Small", medium: "Medium", large: "Large" };
const FONT_SIZE_PX: Record<TickerFontSize, number> = { small: 13, medium: 16, large: 22 };

export function AdminBannerMessagesPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<BannerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [editText, setEditText] = useState<Record<number, string>>({});
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [tickerSpeed, setTickerSpeed] = useState<TickerSpeed>("medium");
  const [tickerFontSize, setTickerFontSize] = useState<TickerFontSize>("medium");
  const [savingSpeed, setSavingSpeed] = useState(false);
  const [savingFontSize, setSavingFontSize] = useState(false);
  const rowRefs = useRef<Record<number, HTMLLIElement | null>>({});

  const { data: settingsData } = useGetSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();

  useEffect(() => {
    if (settingsData?.tickerSpeed) {
      setTickerSpeed(settingsData.tickerSpeed as TickerSpeed);
    }
    if (settingsData?.tickerFontSize) {
      setTickerFontSize(settingsData.tickerFontSize as TickerFontSize);
    }
  }, [settingsData]);

  async function load() {
    setLoading(true);
    try {
      const res = await customFetch("/api/admin/banners");
      const data = await res.json();
      setBanners(data);
    } catch {
      toast({ title: "Error", description: "Failed to load banner messages.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleFontSizeChange(size: TickerFontSize) {
    if (!settingsData) return;
    const previous = tickerFontSize;
    setTickerFontSize(size);
    setSavingFontSize(true);
    try {
      await updateSettings({ data: { ...settingsData, tickerFontSize: size } });
      toast({ title: "Saved", description: `Ticker size set to ${FONT_SIZE_LABELS[size].toLowerCase()}.` });
    } catch {
      setTickerFontSize(previous);
      toast({ title: "Error", description: "Failed to save font size.", variant: "destructive" });
    } finally {
      setSavingFontSize(false);
    }
  }

  async function handleSpeedChange(speed: TickerSpeed) {
    if (!settingsData) return;
    const previous = tickerSpeed;
    setTickerSpeed(speed);
    setSavingSpeed(true);
    try {
      await updateSettings({ data: { ...settingsData, tickerSpeed: speed } });
      toast({ title: "Saved", description: `Ticker speed set to ${SPEED_LABELS[speed].toLowerCase()}.` });
    } catch {
      setTickerSpeed(previous);
      toast({ title: "Error", description: "Failed to save speed.", variant: "destructive" });
    } finally {
      setSavingSpeed(false);
    }
  }

  async function handleAdd() {
    if (!newMessage.trim()) return;
    setAdding(true);
    try {
      const res = await customFetch("/api/admin/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: newMessage.trim(),
          isActive: true,
          sortOrder: banners.length,
        }),
      });
      if (!res.ok) throw new Error();
      setNewMessage("");
      await load();
      toast({ title: "Added", description: "Banner message added." });
    } catch {
      toast({ title: "Error", description: "Failed to add message.", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(banner: BannerMessage) {
    setSaving(banner.id);
    try {
      const res = await customFetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      if (!res.ok) throw new Error();
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveText(banner: BannerMessage) {
    const text = editText[banner.id];
    if (text === undefined || text === banner.message) {
      setEditText(prev => { const n = { ...prev }; delete n[banner.id]; return n; });
      setHighlightedId(null);
      return;
    }
    if (!text.trim()) return;
    setSaving(banner.id);
    try {
      const res = await customFetch(`/api/admin/banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, message: text.trim() } : b));
      setEditText(prev => { const n = { ...prev }; delete n[banner.id]; return n; });
      setHighlightedId(null);
      toast({ title: "Saved", description: "Message updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(id: number) {
    setDeleting(id);
    try {
      const res = await customFetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBanners(prev => prev.filter(b => b.id !== id));
      toast({ title: "Deleted", description: "Banner message removed." });
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  }

  function handleDragStart(id: number) {
    setDragging(id);
  }

  function handleDragOver(e: React.DragEvent, id: number) {
    e.preventDefault();
    setDragOver(id);
  }

  async function handleDrop(targetId: number) {
    if (dragging === null || dragging === targetId) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const fromIndex = banners.findIndex(b => b.id === dragging);
    const toIndex = banners.findIndex(b => b.id === targetId);
    const reordered = [...banners];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const withOrder = reordered.map((b, i) => ({ ...b, sortOrder: i }));
    setBanners(withOrder);
    setDragging(null);
    setDragOver(null);

    try {
      await customFetch("/api/admin/banners/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: withOrder.map(b => ({ id: b.id, sortOrder: b.sortOrder })) }),
      });
    } catch {
      toast({ title: "Error", description: "Failed to save order.", variant: "destructive" });
      await load();
    }
  }

  const activeBanners = banners.filter(b => b.isActive);
  const activeCount = activeBanners.length;
  const activeMessages = activeBanners.map(b => b.message);

  function handlePreviewClick(index: number) {
    const banner = activeBanners[index];
    if (!banner) return;
    const el = rowRefs.current[banner.id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setEditText(prev => ({ ...prev, [banner.id]: banner.message }));
    setHighlightedId(banner.id);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Banner Messages
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage the scrolling ticker messages on the Shop page.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-3 items-center text-sm text-muted-foreground">
        <Badge variant="outline">{banners.length} total</Badge>
        <Badge className="bg-green-600 hover:bg-green-700">{activeCount} active</Badge>
        <span className="text-xs">Drag rows to reorder. Only active messages show on the shop.</span>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Add New Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Enter banner message…"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={adding || !newMessage.trim()}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Messages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : banners.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No banner messages yet. Add one above.
            </div>
          ) : (
            <ul className="divide-y">
              {banners.map((banner) => {
                const isEditing = editText[banner.id] !== undefined;
                const isDragTarget = dragOver === banner.id;
                return (
                  <li
                    key={banner.id}
                    ref={el => { rowRefs.current[banner.id] = el; }}
                    draggable
                    onDragStart={() => handleDragStart(banner.id)}
                    onDragOver={e => handleDragOver(e, banner.id)}
                    onDrop={() => handleDrop(banner.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${highlightedId === banner.id ? "bg-primary/10 ring-1 ring-inset ring-primary/40" : isDragTarget ? "bg-primary/5 border-primary/30" : "hover:bg-muted/40"} ${dragging === banner.id ? "opacity-40" : ""}`}
                  >
                    <button className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
                      <GripVertical className="h-4 w-4" />
                    </button>

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <Input
                          autoFocus
                          value={editText[banner.id]}
                          onChange={e => setEditText(prev => ({ ...prev, [banner.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleSaveText(banner);
                            if (e.key === "Escape") { setEditText(prev => { const n = { ...prev }; delete n[banner.id]; return n; }); setHighlightedId(null); }
                          }}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <p
                          className={`text-sm cursor-text select-none truncate ${!banner.isActive ? "text-muted-foreground" : ""}`}
                          style={{ textDecoration: !banner.isActive ? "line-through" : "none" }}
                          onClick={() => { setEditText(prev => ({ ...prev, [banner.id]: banner.message })); setHighlightedId(banner.id); }}
                          title="Click to edit"
                        >
                          {banner.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          disabled={saving === banner.id}
                          onClick={() => handleSaveText(banner)}
                        >
                          {saving === banner.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                      )}

                      <button
                        onClick={() => handleToggle(banner)}
                        disabled={saving === banner.id}
                        title={banner.isActive ? "Disable" : "Enable"}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {banner.isActive
                          ? <Eye className="h-4 w-4 text-green-600" />
                          : <EyeOff className="h-4 w-4" />
                        }
                      </button>

                      <button
                        onClick={() => handleDelete(banner.id)}
                        disabled={deleting === banner.id}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        {deleting === banner.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-primary" />
              Live Preview
              {activeMessages.length > 0 ? (
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border border-primary/30 text-xs font-semibold">
                  {activeMessages.length} active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">No active messages</Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {savingFontSize && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                <span className="text-xs text-muted-foreground font-medium">Size:</span>
                <div className="flex rounded-md border overflow-hidden text-xs">
                  {(["small", "medium", "large"] as TickerFontSize[]).map(size => (
                    <button
                      key={size}
                      onClick={() => handleFontSizeChange(size)}
                      disabled={savingFontSize || !settingsData}
                      className={`px-3 py-1 font-medium transition-colors capitalize ${
                        tickerFontSize === size
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {FONT_SIZE_LABELS[size]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {savingSpeed && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Speed:</span>
                <div className="flex rounded-md border overflow-hidden text-xs">
                  {(["slow", "medium", "fast"] as TickerSpeed[]).map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      disabled={savingSpeed || !settingsData}
                      className={`px-3 py-1 font-medium transition-colors capitalize ${
                        tickerSpeed === speed
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {SPEED_LABELS[speed]}
                    </button>
                  ))}
                </div>
              </div>
              <a
                href="/shop"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                title="Open the Shop page to see the live ticker"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview on Shop
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-lg overflow-hidden">
            <TickerBar
              messages={
                activeMessages.length > 0
                  ? activeMessages
                  : [settingsData?.tickerPlaceholder?.trim() || "Check back soon for our latest news and promotions!"]
              }
              fontSize={FONT_SIZE_PX[tickerFontSize]}
              padding="14px 0"
              speed={activeMessages.length > 0 ? tickerSpeed : "slow"}
              onMessageClick={activeMessages.length > 0 ? handlePreviewClick : undefined}
            />
          </div>
          {activeMessages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2 px-4">
              Showing placeholder — enable at least one message above to show real content.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Click a message text to edit inline, or click it in the Live Preview to jump to its row. Changes appear on the shop immediately.
      </p>
    </div>
  );
}
