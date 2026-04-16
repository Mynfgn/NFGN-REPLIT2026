import { useState, useEffect } from "react";
import { customFetch } from "@/lib/custom-fetch";
import { useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, RefreshCw, Package, DollarSign, BarChart2, Layers } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  image: string | null;
  categoryId: number | null;
  categoryName: string | null;
  stock: number;
  featured: boolean;
  isProPackage: boolean;
  status: string;
  commissionRate: number;
  cv: number;
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  description: "",
  price: "",
  comparePrice: "",
  image: "",
  categoryId: "",
  stock: "0",
  featured: false,
  isProPackage: false,
  commissionRate: "10",
  cv: "0",
  ingredients: "",
  benefits: "",
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: categoriesData } = useListCategories();
  const categories = categoriesData?.categories ?? [];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await customFetch("/api/products/admin-all");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreate = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: String(p.price),
      comparePrice: p.comparePrice != null ? String(p.comparePrice) : "",
      image: p.image ?? "",
      categoryId: p.categoryId ? String(p.categoryId) : "",
      stock: String(p.stock),
      featured: p.featured,
      isProPackage: p.isProPackage,
      commissionRate: String(p.commissionRate),
      cv: String(p.cv ?? 0),
      ingredients: "",
      benefits: "",
    });
    setDialogOpen(true);
  };

  const handleNameChange = (val: string) => {
    setForm(f => ({
      ...f,
      name: val,
      slug: editProduct ? f.slug : slugify(val),
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.description || !form.price) {
      toast.error("Name, slug, description, and price are required.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
        image: form.image || null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        stock: parseInt(form.stock) || 0,
        featured: form.featured,
        isProPackage: form.isProPackage,
        commissionRate: parseFloat(form.commissionRate) || 10,
        cv: parseInt(form.cv) || 0,
        ingredients: form.ingredients || null,
        benefits: form.benefits || null,
      };

      const res = editProduct
        ? await customFetch(`/api/products/${editProduct.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await customFetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      if (res.ok) {
        toast.success(editProduct ? "Product updated!" : "Product created!");
        setDialogOpen(false);
        fetchProducts();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save product");
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
      const res = await customFetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        toast.success(`"${deleteTarget.name}" has been deactivated.`);
        setDeleteTarget(null);
        fetchProducts();
      } else {
        toast.error("Failed to deactivate product");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = products.filter(p => p.status === "active").length;
  const totalCv = products.filter(p => p.status === "active").reduce((s, p) => s + (p.cv ?? 0), 0);
  const avgCommission = products.filter(p => p.status === "active").length
    ? (products.filter(p => p.status === "active").reduce((s, p) => s + p.commissionRate, 0) / activeCount).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Product Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage all NFGN products, pricing, CV, and commissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products.length, icon: Package, color: "text-primary" },
          { label: "Active", value: activeCount, icon: BarChart2, color: "text-green-600" },
          { label: "Total CV Pool", value: totalCv, icon: Layers, color: "text-blue-600" },
          { label: "Avg Commission", value: `${avgCommission}%`, icon: DollarSign, color: "text-yellow-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Products ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>CV</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      No products found. Click "Add Product" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(p => (
                    <TableRow key={p.id} className={p.status !== "active" ? "opacity-50" : ""}>
                      <TableCell>
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-10 w-10 rounded object-cover border" />
                        ) : (
                          <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">${p.price.toFixed(2)}</span>
                          {p.comparePrice && (
                            <p className="text-xs text-muted-foreground line-through">${p.comparePrice.toFixed(2)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{p.cv ?? 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{p.commissionRate}%</Badge>
                      </TableCell>
                      <TableCell>{p.stock}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{p.categoryName ?? "—"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {p.featured && <Badge className="text-xs px-1.5 py-0">Featured</Badge>}
                          {p.isProPackage && <Badge variant="secondary" className="text-xs px-1.5 py-0">Pro Pkg</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "active" ? "default" : "destructive"} className="text-xs">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {p.status === "active" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(p)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Product Name <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. NFGN Herbal Detox Cleanse"
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL Slug <span className="text-destructive">*</span></Label>
                <Input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="e.g. herbal-detox-cleanse"
                />
                <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.categoryId || "none"} onValueChange={v => setForm(f => ({ ...f, categoryId: v === "none" ? "" : v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— No Category —</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description <span className="text-destructive">*</span></Label>
                <Textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the product..."
                  rows={3}
                />
              </div>
            </div>

            {/* Product Image */}
            <div className="space-y-1.5">
              <Label>Product Image URL</Label>
              <Input
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
              {form.image && (
                <img src={form.image} alt="preview" className="h-20 w-20 rounded object-cover border mt-2" onError={e => (e.currentTarget.style.display = "none")} />
              )}
              <p className="text-xs text-muted-foreground">
                Paste a direct image URL. Recommended size: 600×600px or larger, square format.
              </p>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Selling Price ($) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="49.99"
                />
                <p className="text-xs text-muted-foreground">The price customers pay at checkout.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Compare-At Price ($) <span className="text-muted-foreground text-xs">(optional MSRP)</span></Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.comparePrice}
                  onChange={e => setForm(f => ({ ...f, comparePrice: e.target.value }))}
                  placeholder="79.99"
                />
                <p className="text-xs text-muted-foreground">Original/retail price shown as strikethrough.</p>
              </div>
            </div>

            {/* CV & Commission */}
            <div className="grid grid-cols-2 gap-4 bg-muted/40 rounded-lg p-4 border">
              <div className="col-span-2 mb-1">
                <p className="text-sm font-semibold">Commission & Volume Settings</p>
                <p className="text-xs text-muted-foreground">These values drive the NFGN compensation plan calculations.</p>
              </div>
              <div className="space-y-1.5">
                <Label>CV (Commissionable Volume)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.cv}
                  onChange={e => setForm(f => ({ ...f, cv: e.target.value }))}
                  placeholder="50"
                />
                <p className="text-xs text-muted-foreground">Integer value used to calculate group volume (GV) in the downline.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Referral Commission Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.commissionRate}
                  onChange={e => setForm(f => ({ ...f, commissionRate: e.target.value }))}
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">Percentage paid to the referring member on sale of this product.</p>
              </div>
            </div>

            {/* Stock */}
            <div className="space-y-1.5">
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                min="0"
                value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                placeholder="100"
              />
            </div>

            {/* Ingredients & Benefits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ingredients</Label>
                <Textarea
                  value={form.ingredients}
                  onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
                  placeholder="List key ingredients..."
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Benefits</Label>
                <Textarea
                  value={form.benefits}
                  onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))}
                  placeholder="Key product benefits..."
                  rows={3}
                />
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-col sm:flex-row gap-6 bg-muted/40 rounded-lg p-4 border">
              <div className="flex items-center gap-3 flex-1">
                <Switch
                  checked={form.featured}
                  onCheckedChange={v => setForm(f => ({ ...f, featured: v }))}
                  id="featured"
                />
                <div>
                  <Label htmlFor="featured" className="cursor-pointer">Featured Product</Label>
                  <p className="text-xs text-muted-foreground">Displayed on the homepage and top of shop.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-1">
                <Switch
                  checked={form.isProPackage}
                  onCheckedChange={v => setForm(f => ({ ...f, isProPackage: v }))}
                  id="isProPackage"
                />
                <div>
                  <Label htmlFor="isProPackage" className="cursor-pointer">Pro Package</Label>
                  <p className="text-xs text-muted-foreground">Purchasing this upgrades the buyer to Pro Member and triggers Level Commissions.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editProduct ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>"{deleteTarget?.name}"</strong> and hide it from the shop and all listings. 
              The product record is preserved and can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? "Deactivating..." : "Yes, Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
