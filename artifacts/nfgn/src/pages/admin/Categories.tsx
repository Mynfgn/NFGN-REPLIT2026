import { useState, useEffect, useRef } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, RefreshCw, FolderOpen, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  shopHeadline: string | null;
  shopTags: string | null;
  productCount: number;
}

interface LinkedProduct {
  id: number;
  name: string;
}

const EMPTY_FORM = { name: "", slug: "", description: "", image: "", shopHeadline: "", shopTags: "" };

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);
  const [checkingProducts, setCheckingProducts] = useState(false);
  const [productCheckFailed, setProductCheckFailed] = useState(false);
  const productCheckAbortRef = useRef<AbortController | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await customFetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : (data.categories ?? []));
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // When delete target changes, check for assigned products
  useEffect(() => {
    if (!deleteTarget) {
      setLinkedProducts([]);
      setCheckingProducts(false);
      setProductCheckFailed(false);
      return;
    }

    productCheckAbortRef.current?.abort();
    const ctrl = new AbortController();
    productCheckAbortRef.current = ctrl;

    setCheckingProducts(true);
    setLinkedProducts([]);
    setProductCheckFailed(false);

    // Always fetch from the API — don't rely on cached productCount which may be stale
    customFetch(`/api/categories/${deleteTarget.id}/products`, { signal: ctrl.signal })
      .then(async res => {
        if (ctrl.signal.aborted) return;
        if (res.ok) {
          const data = await res.json();
          setLinkedProducts(Array.isArray(data) ? data : []);
        } else {
          setProductCheckFailed(true);
        }
      })
      .catch(err => {
        if (err?.name === "AbortError") return;
        setProductCheckFailed(true);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setCheckingProducts(false);
      });
  }, [deleteTarget]);

  const openCreate = () => {
    setEditCat(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      image: cat.image ?? "",
      shopHeadline: cat.shopHeadline ?? "",
      shopTags: cat.shopTags ?? "",
    });
    setDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setForm(f => ({
      ...f,
      name: val,
      slug: editCat ? f.slug : slugify(val),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Category name and slug are required.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        image: form.image.trim() || null,
        shopHeadline: form.shopHeadline.trim() || null,
        shopTags: form.shopTags.trim() || null,
      };
      const res = editCat
        ? await customFetch(`/api/categories/${editCat.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await customFetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        toast.success(editCat ? "Category updated!" : "Category created!");
        setDialogOpen(false);
        fetchCategories();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save category");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await customFetch(`/api/categories/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        const count = linkedProducts.length;
        if (count > 0) {
          toast.success(`"${deleteTarget.name}" deleted. ${count} ${count === 1 ? "product was" : "products were"} uncategorized.`);
        } else {
          toast.success(`"${deleteTarget.name}" deleted.`);
        }
        setDeleteTarget(null);
        fetchCategories();
      } else {
        toast.error("Failed to delete category");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Categories</h1>
          <p className="text-muted-foreground">Organize your products into categories for the shop and admin panel.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCategories} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-primary">
              <FolderOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-primary">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Products Assigned</p>
              <p className="text-2xl font-bold">{categories.reduce((s, c) => s + c.productCount, 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search categories..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Categories ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No categories found. Click "Add Category" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(cat => (
                    <TableRow key={cat.id} className={deleteTarget?.id === cat.id ? "bg-destructive/5" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.name} className="h-8 w-8 rounded object-cover border" />
                          ) : (
                            <div className="h-8 w-8 rounded border bg-muted flex items-center justify-center">
                              <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium text-sm">{cat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{cat.slug}</code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                          {cat.description ?? <span className="italic text-xs">No description</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cat.productCount > 0 ? "default" : "outline"} className="text-xs">
                          {cat.productCount} {cat.productCount === 1 ? "product" : "products"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(cat)}
                            title="Delete category"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCat ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Category Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Handmade Soaps"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Slug <span className="text-destructive">*</span></Label>
              <Input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="e.g. handmade-soaps"
              />
              <p className="text-xs text-muted-foreground">
                Used in URLs. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of this category..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category Image URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              {form.image && (
                <img
                  src={form.image}
                  alt="preview"
                  className="h-16 w-16 rounded object-cover border mt-2"
                  onError={e => (e.currentTarget.style.display = "none")}
                />
              )}
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pro Store Section (optional)</p>
              <p className="text-xs text-muted-foreground -mt-2">If this category appears as a Pro Store section on the Shop page, you can override its headline and filter tags here.</p>

              <div className="space-y-1.5">
                <Label>Section Headline <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={form.shopHeadline}
                  onChange={e => setForm(f => ({ ...f, shopHeadline: e.target.value }))}
                  placeholder='e.g. "Travel the World. Together."'
                />
                <p className="text-xs text-muted-foreground">Overrides the large heading shown at the top of that section on the Shop page.</p>
              </div>

              <div className="space-y-1.5">
                <Label>Filter Tags <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  value={form.shopTags}
                  onChange={e => setForm(f => ({ ...f, shopTags: e.target.value }))}
                  placeholder="e.g. Destination Retreats, Group Trips, VIP Experiences"
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of tags shown as badges below the heading.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editCat ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) { productCheckAbortRef.current?.abort(); setDeleteTarget(null); setLinkedProducts([]); setProductCheckFailed(false); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  This will permanently delete <strong>"{deleteTarget?.name}"</strong>. This action cannot be undone.
                </p>

                {checkingProducts && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking for assigned products…
                  </div>
                )}

                {!checkingProducts && productCheckFailed && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3">
                    <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                      <span>⚠️</span> Could not verify assigned products
                    </p>
                    <p className="text-sm text-destructive/80 mt-1">
                      The product check failed. Please verify manually before proceeding.
                    </p>
                  </div>
                )}

                {!checkingProducts && !productCheckFailed && linkedProducts.length > 0 && (
                  <div className="rounded-md border border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 space-y-1.5">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <span>⚠️</span> This category has {linkedProducts.length} assigned {linkedProducts.length === 1 ? "product" : "products"}:
                    </p>
                    <ul className="list-disc list-inside text-sm text-amber-700 dark:text-amber-400 space-y-0.5">
                      {linkedProducts.map(p => (
                        <li key={p.id}>{p.name}</li>
                      ))}
                    </ul>
                    <p className="text-sm text-amber-600 dark:text-amber-500">
                      {linkedProducts.length === 1 ? "That product" : "Those products"} will remain in the store but will no longer have a category assigned.
                    </p>
                  </div>
                )}

                {!checkingProducts && !productCheckFailed && linkedProducts.length === 0 && deleteTarget?.productCount === 0 && (
                  <p className="text-sm text-muted-foreground">No products are assigned to this category.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || checkingProducts}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : linkedProducts.length > 0 ? "Yes, Delete & Uncategorize" : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
