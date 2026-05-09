import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { customFetch } from "@/lib/custom-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, RefreshCw, Package, Check, GripVertical, AlertTriangle, Loader2, Link2, Save, Undo2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProPackage {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  badge: string;
  badgeColor: string;
  perks: string[];
  sortOrder: number;
  cv: number;
  productId: number | null;
  productName: string | null;
  productSlug: string | null;
}

interface ShopProduct {
  id: number;
  name: string;
  price: number;
  isProPackage: boolean | null;
}

const EMPTY_FORM = {
  name: "",
  price: "",
  originalPrice: "",
  badge: "",
  badgeColor: "#C9A84C",
  perksRaw: "",
  sortOrder: "0",
  cv: "",
  productId: "",
};

interface SortableRowProps {
  pkg: ProPackage;
  position: number;
  savingOrder: boolean;
  isSavingEdit: boolean;
  onEdit: (pkg: ProPackage) => void;
  onDelete: (pkg: ProPackage) => void;
  onFixLink: (pkg: ProPackage) => void;
  onViewProduct: (pkg: ProPackage) => void;
}

function RowContent({ pkg, position, savingOrder, isDragging, onEdit, onDelete, onFixLink, onViewProduct, dragHandleProps }: {
  pkg: ProPackage;
  position: number;
  savingOrder: boolean;
  isDragging?: boolean;
  onEdit: (pkg: ProPackage) => void;
  onDelete: (pkg: ProPackage) => void;
  onFixLink: (pkg: ProPackage) => void;
  onViewProduct: (pkg: ProPackage) => void;
  dragHandleProps?: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
  };
}) {
  const savings = (pkg.originalPrice - pkg.price).toFixed(2);
  return (
    <>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip open={isDragging || savingOrder ? false : undefined}>
              <TooltipTrigger asChild>
                <button
                  {...(dragHandleProps?.attributes ?? {})}
                  {...(dragHandleProps?.listeners ?? {})}
                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted touch-none"
                  aria-label={savingOrder ? "Saving order…" : "Drag to reorder"}
                  disabled={savingOrder}
                >
                  {savingOrder ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                  ) : (
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                Drag to reorder
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span className="text-xs font-mono text-muted-foreground/60 select-none min-w-[1.25rem] text-right">
            {position}
          </span>
        </div>
      </TableCell>
      <TableCell className="font-medium">{pkg.name}</TableCell>
      <TableCell>
        {pkg.badge ? (
          <Badge
            style={{
              background: `${pkg.badgeColor}20`,
              color: pkg.badgeColor,
              border: `1px solid ${pkg.badgeColor}40`,
            }}
          >
            {pkg.badge}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-right font-semibold">
        ${pkg.price.toFixed(2)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground line-through">
        ${pkg.originalPrice.toFixed(2)}
      </TableCell>
      <TableCell className="text-right text-green-600 font-medium">
        ${savings}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          {pkg.perks.slice(0, 3).map((perk) => (
            <div key={perk} className="flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
              {perk}
            </div>
          ))}
          {pkg.perks.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{pkg.perks.length - 3} more
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {pkg.productName ? (
          <button
            type="button"
            onClick={() => onViewProduct(pkg)}
            className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded px-2 py-0.5 hover:bg-green-100 hover:border-green-300 transition-colors cursor-pointer"
            title={`Open product details: ${pkg.productName}`}
          >
            {pkg.productName}
          </button>
        ) : pkg.productId != null ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-300 rounded px-2 py-0.5">
              <AlertTriangle className="h-3 w-3 flex-shrink-0" />
              Stale link (ID {pkg.productId})
            </span>
            <button
              onClick={() => onFixLink(pkg)}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 hover:bg-blue-100 hover:border-blue-300 transition-colors"
              title="Fix stale product link"
            >
              <Link2 className="h-3 w-3 flex-shrink-0" />
              Fix
            </button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground italic">No product linked</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(pkg)}
            disabled={savingOrder}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(pkg)}
            disabled={savingOrder}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </>
  );
}

function SortableRow({ pkg, position, savingOrder, isSavingEdit, onEdit, onDelete, onFixLink, onViewProduct }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: pkg.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const rowClass = isDragging
    ? "opacity-0"
    : isSavingEdit
      ? "ring-2 ring-[#C9A84C] ring-inset bg-[#C9A84C]/5 transition-colors"
      : undefined;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={rowClass}
    >
      <RowContent
        pkg={pkg}
        position={position}
        savingOrder={savingOrder}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
        onFixLink={onFixLink}
        onViewProduct={onViewProduct}
        dragHandleProps={{ attributes, listeners }}
      />
    </TableRow>
  );
}

export function AdminProPackagesPage() {
  const [packages, setPackages] = useState<ProPackage[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<ProPackage | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [savingEditId, setSavingEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProPackage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [hasPendingReorder, setHasPendingReorder] = useState(false);
  const [orderSaveError, setOrderSaveError] = useState<string | null>(null);
  const [fixLinkTarget, setFixLinkTarget] = useState<ProPackage | null>(null);
  const [fixLinkProductId, setFixLinkProductId] = useState<string>("");
  const [fixLinkSaving, setFixLinkSaving] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const reorderAbortRef = useRef<AbortController | null>(null);
  const serverConfirmedOrderRef = useRef<ProPackage[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pro-packages");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: ProPackage[] = await res.json();
      setPackages(data);
      serverConfirmedOrderRef.current = data;
      setHasPendingReorder(false);
      setOrderSaveError(null);
    } catch {
      toast.error("Failed to load pro packages");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?limit=200");
      if (!res.ok) return;
      const data = await res.json();
      const list: ShopProduct[] = (data.products ?? []).map((p: ShopProduct) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        isProPackage: p.isProPackage,
      }));
      setProducts(list);
    } catch {
      // silently ignore; product list is optional for the edit dialog dropdown
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchProducts();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = packages.findIndex((p) => p.id === active.id);
    const newIndex = packages.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(packages, oldIndex, newIndex);
    setPackages(reordered);
    setHasPendingReorder(true);
    setOrderSaveError(null);
  };

  const handleSaveOrder = async () => {
    reorderAbortRef.current?.abort();
    reorderAbortRef.current = new AbortController();
    const { signal } = reorderAbortRef.current;

    setSavingOrder(true);
    setOrderSaveError(null);
    try {
      const order = packages.map((pkg, index) => ({ id: pkg.id, sortOrder: index + 1 }));
      const res = await customFetch("/api/pro-packages/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
        signal,
      });
      if (!res.ok) throw new Error("Failed to save order");
      const confirmed = packages.map((pkg, i) => ({ ...pkg, sortOrder: i + 1 }));
      setPackages(confirmed);
      serverConfirmedOrderRef.current = confirmed;
      setHasPendingReorder(false);
      toast.success("Order saved");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setOrderSaveError("Failed to save — please try again or undo.");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleUndoOrder = () => {
    setPackages(serverConfirmedOrderRef.current);
    setHasPendingReorder(false);
    setOrderSaveError(null);
  };

  const openCreate = () => {
    setEditPkg(null);
    setForm({ ...EMPTY_FORM, sortOrder: String(packages.length + 1) });
    setDialogOpen(true);
  };

  const openEdit = (pkg: ProPackage) => {
    setEditPkg(pkg);
    setForm({
      name: pkg.name,
      price: String(pkg.price),
      originalPrice: String(pkg.originalPrice),
      badge: pkg.badge,
      badgeColor: pkg.badgeColor,
      perksRaw: pkg.perks.join("\n"),
      sortOrder: String(pkg.sortOrder),
      cv: String(pkg.cv ?? 0),
      productId: pkg.productId != null ? String(pkg.productId) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.originalPrice) {
      toast.error("Name, price, and original price are required");
      return;
    }
    const price = parseFloat(form.price);
    const originalPrice = parseFloat(form.originalPrice);
    if (isNaN(price) || isNaN(originalPrice)) {
      toast.error("Price values must be valid numbers");
      return;
    }

    const perks = form.perksRaw
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);

    setSaving(true);
    if (editPkg) setSavingEditId(editPkg.id);
    try {
      const body = {
        name: form.name.trim(),
        price,
        originalPrice,
        badge: form.badge.trim(),
        badgeColor: form.badgeColor,
        perks,
        sortOrder: parseInt(form.sortOrder) || 0,
        cv: parseInt(form.cv) || 0,
        productId: form.productId !== "" ? parseInt(form.productId) : null,
      };

      let res: Response;
      if (editPkg) {
        res = await customFetch(`/api/pro-packages/${editPkg.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await customFetch("/api/pro-packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) throw new Error("Failed to save");
      toast.success(editPkg ? "Package updated" : "Package created");
      setDialogOpen(false);
      fetchPackages();
    } catch {
      toast.error("Failed to save package");
    } finally {
      setSaving(false);
      setSavingEditId(null);
    }
  };

  const [, setLocation] = useLocation();

  const openViewProduct = (pkg: ProPackage) => {
    if (pkg.productId == null) return;
    setLocation(`/admin/products?edit=${pkg.productId}`);
  };

  const openFixLink = (pkg: ProPackage) => {
    setFixLinkTarget(pkg);
    setFixLinkProductId("");
  };

  const handleFixLink = async () => {
    if (!fixLinkTarget) return;
    setFixLinkSaving(true);
    try {
      const productId = fixLinkProductId !== "" && fixLinkProductId !== "none"
        ? parseInt(fixLinkProductId)
        : null;
      const res = await customFetch(`/api/pro-packages/${fixLinkTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success(productId ? "Product link updated" : "Stale link cleared");
      setFixLinkTarget(null);
      fetchPackages();
    } catch {
      toast.error("Failed to update product link");
    } finally {
      setFixLinkSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await customFetch(`/api/pro-packages/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Package deleted");
      setDeleteTarget(null);
      fetchPackages();
    } catch {
      toast.error("Failed to delete package");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registration Packages</h1>
          <p className="text-muted-foreground mt-1">
            Manage the pro registration tiers shown on the Shop page. Drag rows to reorder.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {hasPendingReorder && (
            <div className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${orderSaveError ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C]"}`}>
              {orderSaveError ? (
                <XCircle className="h-4 w-4 flex-shrink-0" />
              ) : null}
              <span className="font-medium">
                {orderSaveError ?? "Order changed"}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs font-semibold text-[#C9A84C] hover:bg-[#C9A84C]/20 hover:text-[#C9A84C]"
                onClick={handleUndoOrder}
                disabled={savingOrder}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Undo
              </Button>
              <Button
                size="sm"
                className="h-6 px-2 text-xs font-semibold bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90"
                onClick={handleSaveOrder}
                disabled={savingOrder}
              >
                {savingOrder ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3 w-3 mr-1" />
                )}
                {savingOrder ? "Saving…" : "Save"}
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={fetchPackages} disabled={loading || savingOrder}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} disabled={savingOrder}>
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pro Registration Packages ({packages.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No packages yet. Click "Add Package" to create one.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={packages.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Original Price</TableHead>
                      <TableHead className="text-right">Savings</TableHead>
                      <TableHead>Perks</TableHead>
                      <TableHead>Linked Product</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg, index) => (
                      <SortableRow
                        key={pkg.id}
                        pkg={pkg}
                        position={index + 1}
                        savingOrder={savingOrder}
                        isSavingEdit={savingEditId === pkg.id}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                        onFixLink={openFixLink}
                        onViewProduct={openViewProduct}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
              <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
                {activeId != null ? (() => {
                  const activePkg = packages.find((p) => p.id === activeId);
                  const activePosition = packages.findIndex((p) => p.id === activeId) + 1;
                  if (!activePkg) return null;
                  return (
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>
                      <tbody>
                        <TableRow
                          className="ring-2 ring-[#C9A84C] ring-inset bg-[#C9A84C]/10 rounded shadow-[0_8px_24px_0_rgba(201,168,76,0.35),0_2px_8px_0_rgba(0,0,0,0.4)]"
                          style={{ display: "table-row" }}
                        >
                          <RowContent
                            pkg={activePkg}
                            position={activePosition}
                            savingOrder={savingOrder}
                            onEdit={openEdit}
                            onDelete={setDeleteTarget}
                            onFixLink={openFixLink}
                            onViewProduct={openViewProduct}
                          />
                        </TableRow>
                      </tbody>
                    </table>
                  );
                })() : null}
              </DragOverlay>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editPkg ? "Edit Package" : "Create Package"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Package Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. NFGN Starter Pack"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="197.94"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Original Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.originalPrice}
                  onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
                  placeholder="249.00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>CV (Commissionable Volume)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.cv}
                onChange={(e) => setForm((f) => ({ ...f, cv: e.target.value }))}
                placeholder="e.g. 150"
              />
              <p className="text-xs text-muted-foreground">
                The CV earned by the buyer when they purchase this package. Counts toward their Personal Commission Volume (PCV) and UPM qualification threshold.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Badge Label</Label>
                <Input
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  placeholder="Most Popular"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Badge Color</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.badgeColor}
                    onChange={(e) => setForm((f) => ({ ...f, badgeColor: e.target.value }))}
                    placeholder="#C9A84C"
                    className="flex-1"
                  />
                  <input
                    type="color"
                    value={form.badgeColor}
                    onChange={(e) => setForm((f) => ({ ...f, badgeColor: e.target.value }))}
                    className="h-10 w-10 rounded border cursor-pointer p-0.5"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Perks (one per line)</Label>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                value={form.perksRaw}
                onChange={(e) => setForm((f) => ({ ...f, perksRaw: e.target.value }))}
                placeholder={"Full Pro Membership\nCommission Eligible\nNetwork Access"}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Linked Shop Product</Label>
              <Select
                value={form.productId !== "" ? form.productId : "none"}
                onValueChange={(val) => setForm((f) => ({ ...f, productId: val === "none" ? "" : val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None — use fuzzy price match" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None — use fuzzy price match</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (${Number(p.price).toFixed(2)})
                      {p.isProPackage ? " ★" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Directly links this card's "Add to Cart" button to a specific shop product. Leave empty to fall back to automatic price matching.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editPkg ? "Save Changes" : "Create Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!fixLinkTarget} onOpenChange={(o) => !o && setFixLinkTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-blue-600" />
              Fix Stale Product Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              The product previously linked to <span className="font-semibold text-foreground">{fixLinkTarget?.name}</span> no longer exists. Select a replacement or clear the link.
            </p>
            <div className="space-y-1.5">
              <Label>Linked Shop Product</Label>
              <Select
                value={fixLinkProductId !== "" ? fixLinkProductId : "none"}
                onValueChange={(val) => setFixLinkProductId(val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Clear link (use price matching)</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} (${Number(p.price).toFixed(2)}){p.isProPackage ? " ★" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFixLinkTarget(null)} disabled={fixLinkSaving}>
              Cancel
            </Button>
            <Button onClick={handleFixLink} disabled={fixLinkSaving}>
              {fixLinkSaving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}" from the shop. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
