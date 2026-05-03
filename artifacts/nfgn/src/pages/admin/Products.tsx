import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { customFetch } from "@/lib/custom-fetch";
import { useListCategories } from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
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
import { Plus, Pencil, Trash2, RefreshCw, Package, DollarSign, BarChart2, Layers, Upload, X, Loader2, QrCode, ExternalLink, Copy, Check, Download, FileText, Music, ImageIcon } from "lucide-react";
import { toast } from "sonner";

function getImageSrc(image: string | null | undefined): string | null {
  if (!image) return null;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/objects/")) return `/api/storage${image}`;
  return image;
}

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
  shippingFee: number;
  handlingFee: number;
  isSports: boolean;
  sportsCategory: string | null;
  teamOrganizationName: string | null;
  isDownloadable: boolean;
  downloadUrl: string | null;
  downloadFileName: string | null;
  downloadFileSize: string | null;
  dollarCreditEligible: boolean;
  refundPolicy: string;
  proMemberDiscountEligible: boolean;
  proMemberDiscountPercent: number;
  createdAt: string;
}

const SPORTS_CATEGORIES = [
  "Team Tournament Fees & Registration",
  "Player Fees & Registration",
  "Tournament Admission Ticket",
  "Referee Fee",
  "Jersey / Apparel",
  "Concessions / Food / Beverage",
  "Special Seating",
  "Fundraiser",
  "Sponsorships & Donations",
] as const;

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
  shippingFee: "9.99",
  handlingFee: "5.00",
  isSports: false,
  sportsCategory: "",
  teamOrganizationName: "",
  isDownloadable: false,
  downloadUrl: "",
  downloadFileName: "",
  downloadFileSize: "",
  ingredients: "",
  benefits: "",
  dollarCreditEligible: false,
  refundPolicy: "",        // empty = not yet selected (required)
  proMemberDiscountEligible: false,
  proMemberDiscountPercent: "0",
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AdminProductsPage() {
  const [location] = useLocation();
  const isDigitalView = location === "/admin/products/digital";
  const isSportsView = location === "/admin/products/sports";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [qrCopied, setQrCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response: any) => {
      setForm(f => ({ ...f, image: response.objectPath }));
      toast.success("Image uploaded successfully!");
    },
    onError: (err: any) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const downloadFileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile: uploadDownloadFile, isUploading: isUploadingDownload } = useUpload({
    onSuccess: (response: any) => {
      setForm(f => ({ ...f, downloadUrl: response.objectPath }));
      toast.success("Download file uploaded!");
    },
    onError: (err: any) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const { data: categoriesData } = useListCategories();
  const categories = categoriesData ?? [];

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
      shippingFee: String(p.shippingFee ?? "9.99"),
      handlingFee: String(p.handlingFee ?? "5.00"),
      isSports: p.isSports ?? false,
      sportsCategory: (p as any).sportsCategory ?? "",
      teamOrganizationName: (p as any).teamOrganizationName ?? "",
      isDownloadable: p.isDownloadable ?? false,
      downloadUrl: p.downloadUrl ?? "",
      downloadFileName: p.downloadFileName ?? "",
      downloadFileSize: p.downloadFileSize ?? "",
      ingredients: "",
      benefits: "",
      dollarCreditEligible: p.dollarCreditEligible ?? false,
      refundPolicy: p.refundPolicy ?? "no_refund",
      proMemberDiscountEligible: p.proMemberDiscountEligible ?? false,
      proMemberDiscountPercent: String(p.proMemberDiscountPercent ?? "0"),
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
    if (!form.refundPolicy) {
      toast.error("Please select a Refund Policy for this product. This is required.");
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
        shippingFee: parseFloat(form.shippingFee) || 9.99,
        handlingFee: parseFloat(form.handlingFee) || 5.00,
        isSports: form.isSports,
        sportsCategory: form.isSports ? (form.sportsCategory || null) : null,
        teamOrganizationName: form.teamOrganizationName || null,
        isDownloadable: form.isDownloadable,
        downloadUrl: form.downloadUrl || null,
        downloadFileName: form.downloadFileName || null,
        downloadFileSize: form.downloadFileSize || null,
        ingredients: form.ingredients || null,
        benefits: form.benefits || null,
        dollarCreditEligible: form.dollarCreditEligible,
        refundPolicy: form.refundPolicy,
        proMemberDiscountEligible: form.isProPackage ? false : form.proMemberDiscountEligible,
        proMemberDiscountPercent: form.isProPackage ? 0 : parseFloat(form.proMemberDiscountPercent) || 0,
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

  const filtered = products.filter(p => {
    if (isDigitalView && !p.isDownloadable) return false;
    if (isSportsView && !p.isSports) return false;
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeCount = products.filter(p => p.status === "active").length;
  const totalCv = products.filter(p => p.status === "active").reduce((s, p) => s + (p.cv ?? 0), 0);
  const avgCommission = products.filter(p => p.status === "active").length
    ? (products.filter(p => p.status === "active").reduce((s, p) => s + p.commissionRate, 0) / activeCount).toFixed(1)
    : "0";

  const openCreateDigital = () => {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM, isDownloadable: true });
    setDialogOpen(true);
  };

  const openCreateSports = () => {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM, isSports: true });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {isDigitalView ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <Download className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-serif font-bold text-primary">Digital Products</h1>
              </div>
              <p className="text-muted-foreground">Manage downloadable digital products — e-books, music, PDFs, courses, and more.</p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}>
                <Download className="h-3 w-3" /> Showing downloadable products only · No shipping or handling fees
              </div>
            </>
          ) : isSportsView ? (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🏆</span>
                <h1 className="text-3xl font-serif font-bold text-primary">NFGN Sports</h1>
              </div>
              <p className="text-muted-foreground">Manage NFGN Sports products — tournament tickets, entry fees, sponsorships, concessions, skills camps, and more.</p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "rgba(201,168,76,0.12)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.3)" }}>
                🏆 Showing NFGN Sports products only · These appear under the Sports section in the Shop
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-serif font-bold text-primary">Product Management</h1>
              <p className="text-muted-foreground">Add, edit, and manage all NFGN products, pricing, CV, and commissions.</p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={isSportsView ? openCreateSports : isDigitalView ? openCreateDigital : openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            {isSportsView ? "Add Sports Product" : isDigitalView ? "Add Digital Product" : "Add Product"}
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
          <CardTitle className="text-base flex items-center gap-2">
            {isDigitalView && <Download className="h-4 w-4 text-primary" />}
            {isSportsView && <span>🏆</span>}
            {isDigitalView ? `Digital Products (${filtered.length})` : isSportsView ? `NFGN Sports Products (${filtered.length})` : `All Products (${filtered.length})`}
          </CardTitle>
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
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      {isDigitalView
                        ? "No digital products yet. Click \"Add Digital Product\" to upload your first e-book, PDF, music file, or course."
                        : isSportsView
                        ? "No NFGN Sports products yet. Click \"Add Sports Product\" to add tournament tickets, entry fees, concessions, and more."
                        : "No products found. Click \"Add Product\" to get started."
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(p => (
                    <TableRow key={p.id} className={p.status !== "active" ? "opacity-50" : ""}>
                      <TableCell>
                        {getImageSrc(p.image) ? (
                          <img src={getImageSrc(p.image)!} alt={p.name} className="h-10 w-10 rounded object-cover border" onError={e => { e.currentTarget.style.display = "none"; (e.currentTarget.nextSibling as HTMLElement)?.style.setProperty("display", "flex"); }} />
                        ) : null}
                        <div className="h-10 w-10 rounded border bg-muted items-center justify-center" style={{ display: getImageSrc(p.image) ? "none" : "flex" }}>
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
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
                        <div className="flex flex-wrap gap-1">
                          {p.featured && <Badge className="text-xs px-1.5 py-0">Featured</Badge>}
                          {p.isProPackage && <Badge variant="secondary" className="text-xs px-1.5 py-0">Pro Pkg</Badge>}
                          {p.isSports && <Badge className="text-xs px-1.5 py-0 gap-0.5" style={{ background: "#C9A84C", color: "#000" }}>🏆 Sports</Badge>}
                          {p.isDownloadable && <Badge variant="outline" className="text-xs px-1.5 py-0 gap-0.5 text-blue-700 border-blue-200"><Download className="h-2.5 w-2.5" />Digital</Badge>}
                          {p.dollarCreditEligible && (
                            <Badge className="text-xs px-1.5 py-0" style={{ background: "#C9A84C", color: "#000" }}>$-Credit</Badge>
                          )}
                          {p.refundPolicy === "7_day_return" ? (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 text-green-700 border-green-300">7-Day</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 text-red-600 border-red-200">No Refund</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === "active" ? "default" : "destructive"} className="text-xs">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="View QR Code" onClick={() => { setQrProduct(p); setQrCopied(false); }}>
                            <QrCode className="h-3.5 w-3.5" />
                          </Button>
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
            <div className="space-y-2">
              <Label>Product Image</Label>
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <Input
                    value={form.image}
                    onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="https://example.com/image.jpg or upload →"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a URL or click "Upload" to select a file from your computer.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await uploadFile(file);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || saving}
                    className="gap-2 whitespace-nowrap"
                  >
                    {isUploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
                    ) : (
                      <><Upload className="h-4 w-4" />Upload Image</>
                    )}
                  </Button>
                  {form.image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm(f => ({ ...f, image: "" }))}
                      className="gap-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />Clear
                    </Button>
                  )}
                </div>
              </div>
              {form.image && (
                <div className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
                  <img
                    src={getImageSrc(form.image) ?? ""}
                    alt="preview"
                    className="h-20 w-20 rounded object-cover border flex-shrink-0"
                    onError={e => (e.currentTarget.style.display = "none")}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Image Preview</p>
                    <p className="text-xs text-muted-foreground break-all line-clamp-2">{form.image}</p>
                  </div>
                </div>
              )}
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

            {/* NFGN Sports Product */}
            <div className="rounded-lg p-4 border-2 space-y-3" style={{ borderColor: "#C9A84C60", background: "#C9A84C06" }}>
              <div className="flex items-start gap-3">
                <Switch
                  checked={form.isSports}
                  onCheckedChange={v => setForm(f => ({ ...f, isSports: v, sportsCategory: v ? f.sportsCategory : "" }))}
                  id="isSports"
                />
                <div>
                  <Label htmlFor="isSports" className="cursor-pointer font-semibold flex items-center gap-1.5">
                    <span>🏆</span> NFGN Sports Product
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tournament tickets, entry fees, sponsorships, concessions, food truck meals, skills camps, personal trainer sessions, and other sports-related offerings. This product will appear in the dedicated <strong>NFGN SPORTS</strong> section of the Shop.
                  </p>
                </div>
              </div>
              {form.isSports && (
                <div className="space-y-3 pt-1 border-t border-dashed" style={{ borderColor: "rgba(201,168,76,0.3)" }}>
                  <div className="space-y-1.5">
                    <Label>Sports Category <span className="text-destructive">*</span></Label>
                    <Select
                      value={form.sportsCategory || "none"}
                      onValueChange={v => setForm(f => ({ ...f, sportsCategory: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sports category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Select Category —</SelectItem>
                        {SPORTS_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Select the type of sports product or service.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Name of Team / Organization / Player</Label>
                    <Input
                      value={form.teamOrganizationName}
                      onChange={e => setForm(f => ({ ...f, teamOrganizationName: e.target.value }))}
                      placeholder="e.g. Eastside Lions U12, Coach Rivera, Atlanta United FC"
                    />
                    <p className="text-xs text-muted-foreground">The team, organization, or player this product is associated with (optional).</p>
                  </div>
                  <div className="text-xs rounded-lg px-3 py-2 font-medium" style={{ background: "rgba(201,168,76,0.10)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
                    🏆 This product will be showcased under the NFGN SPORTS banner on the public Shop page.
                  </div>
                </div>
              )}
            </div>

            {/* Downloadable Product */}
            <div className={`rounded-lg p-4 border-2 space-y-4 transition-all`} style={{ borderColor: "#C9A84C60", background: "#C9A84C06" }}>
              <div className="flex items-start gap-3">
                <Switch
                  checked={form.isDownloadable}
                  onCheckedChange={v => setForm(f => ({ ...f, isDownloadable: v }))}
                  id="isDownloadable"
                />
                <div>
                  <Label htmlFor="isDownloadable" className="cursor-pointer font-semibold flex items-center gap-1.5">
                    <Download className="h-4 w-4" style={{ color: "#C9A84C" }} />
                    Downloadable Product
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    E-books, music, images, PDFs, and any digital file. No shipping or handling fee is charged. Stock is not decremented — customers receive a download link after payment.
                  </p>
                </div>
              </div>

              {form.isDownloadable && (
                <div className="space-y-4 pt-1 border-t border-dashed">
                  {/* File type hint icons */}
                  <div className="flex gap-3 text-xs text-muted-foreground items-center">
                    <FileText className="h-4 w-4" /> PDF / E-book
                    <Music className="h-4 w-4" /> Music / Audio
                    <ImageIcon className="h-4 w-4" /> Image / Artwork
                    <span className="text-muted-foreground">— any file type supported</span>
                  </div>

                  {/* Upload */}
                  <div className="space-y-1.5">
                    <Label>Download File *</Label>
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 space-y-1">
                        <Input
                          value={form.downloadUrl}
                          onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))}
                          placeholder="Upload a file → or paste a URL"
                          disabled={isUploadingDownload}
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload the file customers will receive after purchase (PDF, MP3, ZIP, etc.)
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <input
                          ref={downloadFileInputRef}
                          type="file"
                          accept=".pdf,.epub,.mp3,.mp4,.wav,.ogg,.zip,.rar,.png,.jpg,.jpeg,.gif,.webp,.svg,.docx,.txt,.pptx,.xlsx"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setForm(f => ({
                                ...f,
                                downloadFileName: file.name,
                                downloadFileSize: file.size > 1024 * 1024
                                  ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                                  : `${Math.round(file.size / 1024)} KB`,
                              }));
                              await uploadDownloadFile(file);
                            }
                            if (downloadFileInputRef.current) downloadFileInputRef.current.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFileInputRef.current?.click()}
                          disabled={isUploadingDownload || saving}
                          className="gap-2 whitespace-nowrap"
                        >
                          {isUploadingDownload
                            ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading…</>
                            : <><Upload className="h-4 w-4" />Upload File</>
                          }
                        </Button>
                        {form.downloadUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setForm(f => ({ ...f, downloadUrl: "", downloadFileName: "", downloadFileSize: "" }))}
                            className="gap-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    {form.downloadUrl && (
                      <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 text-xs">
                        <Download className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <span className="font-medium truncate">{form.downloadFileName || form.downloadUrl}</span>
                        {form.downloadFileSize && <span className="text-muted-foreground flex-shrink-0">({form.downloadFileSize})</span>}
                      </div>
                    )}
                  </div>

                  {/* File Name Override */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Display File Name</Label>
                      <Input
                        value={form.downloadFileName}
                        onChange={e => setForm(f => ({ ...f, downloadFileName: e.target.value }))}
                        placeholder="e.g., NFGN-Wellness-Guide.pdf"
                      />
                      <p className="text-xs text-muted-foreground">Shown to customer on receipt (auto-filled from upload).</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>File Size (display)</Label>
                      <Input
                        value={form.downloadFileSize}
                        onChange={e => setForm(f => ({ ...f, downloadFileSize: e.target.value }))}
                        placeholder="e.g., 3.2 MB"
                      />
                      <p className="text-xs text-muted-foreground">Shown alongside the download button (auto-filled from upload).</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Shipping & Handling */}
            <div className={`grid grid-cols-2 gap-4 transition-opacity ${form.isDownloadable ? "opacity-40 pointer-events-none" : ""}`}>
              <div className="col-span-2 mb-1">
                <p className="text-sm font-semibold">Shipping &amp; Pick-up Fees</p>
                <p className="text-xs text-muted-foreground">
                  {form.isDownloadable
                    ? "Not applicable — downloadable products have no shipping or handling fee."
                    : "Per-unit fees applied at checkout depending on delivery method chosen."}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Shipping Fee (per unit, delivery)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.shippingFee}
                  onChange={e => setForm(f => ({ ...f, shippingFee: e.target.value }))}
                  placeholder="9.99"
                />
                <p className="text-xs text-muted-foreground">Charged per unit when customer selects delivery. Free shipping threshold still applies.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Handling Fee (per unit, pick-up)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.handlingFee}
                  onChange={e => setForm(f => ({ ...f, handlingFee: e.target.value }))}
                  placeholder="5.00"
                />
                <p className="text-xs text-muted-foreground">Charged per unit when customer selects in-store pick-up. Shipping is waived.</p>
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
                  onCheckedChange={v => setForm(f => ({
                    ...f,
                    isProPackage: v,
                    proMemberDiscountEligible: v ? false : f.proMemberDiscountEligible,
                    proMemberDiscountPercent: v ? "0" : f.proMemberDiscountPercent,
                  }))}
                  id="isProPackage"
                />
                <div>
                  <Label htmlFor="isProPackage" className="cursor-pointer font-semibold">Pro Registration Product (PRP)</Label>
                  <p className="text-xs text-muted-foreground">Purchasing this upgrades the buyer to Pro Member and triggers Level Commissions. PRPs require 150 CV to qualify as a full Pro Member. <strong className="text-amber-600">PRPs cannot offer Pro Member discounts.</strong></p>
                </div>
              </div>
            </div>

            {/* Dollar Credit Program */}
            <div className="rounded-lg p-4 border-2 space-y-3" style={{ borderColor: "#C9A84C40", background: "#C9A84C08" }}>
              <div>
                <p className="text-sm font-bold" style={{ color: "#C9A84C" }}>Dollar Credit ($-Credit) Program</p>
                <p className="text-xs text-muted-foreground">Does this product qualify for the Dollar Credit referral reward program?</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.dollarCreditEligible}
                  onCheckedChange={v => setForm(f => ({ ...f, dollarCreditEligible: v }))}
                  id="dollarCreditEligible"
                />
                <div>
                  <Label htmlFor="dollarCreditEligible" className="cursor-pointer font-medium">
                    This product is eligible for the $-Credit program
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, Referring Retail Members will earn Dollar Credit when this product is purchased through their referral link.
                  </p>
                </div>
              </div>
            </div>

            {/* Pro Member Discount Program */}
            <div className={`rounded-lg p-4 border-2 space-y-3 transition-opacity ${form.isProPackage ? "opacity-40 pointer-events-none" : ""}`} style={{ borderColor: "#2D6A4F40", background: "#2D6A4F08" }}>
              <div>
                <p className="text-sm font-bold" style={{ color: "#2D6A4F" }}>Pro Member Discount Program</p>
                <p className="text-xs text-muted-foreground">
                  Allow active Pro Members to purchase this product at a discounted price.
                  {form.isProPackage && <span className="text-amber-600 font-medium"> Disabled — Pro Registration Products cannot have Pro Member discounts.</span>}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.proMemberDiscountEligible && !form.isProPackage}
                  onCheckedChange={v => setForm(f => ({ ...f, proMemberDiscountEligible: v }))}
                  id="proMemberDiscountEligible"
                  disabled={form.isProPackage}
                />
                <div>
                  <Label htmlFor="proMemberDiscountEligible" className="cursor-pointer font-medium">
                    Enable Pro Member discount on this product
                  </Label>
                  <p className="text-xs text-muted-foreground">When enabled, active Pro Members see and receive the discounted price at checkout.</p>
                </div>
              </div>
              {form.proMemberDiscountEligible && !form.isProPackage && (
                <div className="space-y-1.5 pt-1">
                  <Label>Discount Percentage (%)</Label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      step="1"
                      value={form.proMemberDiscountPercent}
                      onChange={e => setForm(f => ({ ...f, proMemberDiscountPercent: e.target.value }))}
                      placeholder="20"
                      className="w-28"
                    />
                    <span className="text-sm text-muted-foreground">% off the selling price</span>
                    {form.price && parseFloat(form.proMemberDiscountPercent) > 0 && (
                      <span className="text-sm font-semibold text-green-600 ml-2">
                        Pro price: ${(parseFloat(form.price) * (1 - parseFloat(form.proMemberDiscountPercent) / 100)).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Recommended: 15–30%. CV/PV is always calculated on the full price.</p>
                </div>
              )}
            </div>

            {/* Refund Policy — REQUIRED */}
            <div className="rounded-lg p-4 border-2 space-y-3 border-destructive/30 bg-destructive/5">
              <div>
                <p className="text-sm font-bold text-destructive">Refund Policy <span className="text-destructive">*</span> (Required)</p>
                <p className="text-xs text-muted-foreground">
                  Select the refund policy for this product. This is displayed to customers at checkout and on the product page. Both options are final — no exceptions.
                </p>
              </div>
              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    form.refundPolicy === "no_refund" ? "border-red-500 bg-red-50" : "border-border bg-background hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="refundPolicy"
                    value="no_refund"
                    checked={form.refundPolicy === "no_refund"}
                    onChange={() => setForm(f => ({ ...f, refundPolicy: "no_refund" }))}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-red-700">No Refund Policy</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      All sales are final. At checkout, customers will see and must agree to:<br />
                      <em className="text-foreground">"I understand and agree that this is a nonrefundable product. No exceptions."</em>
                    </p>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    form.refundPolicy === "7_day_return" ? "border-green-500 bg-green-50" : "border-border bg-background hover:bg-muted/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="refundPolicy"
                    value="7_day_return"
                    checked={form.refundPolicy === "7_day_return"}
                    onChange={() => setForm(f => ({ ...f, refundPolicy: "7_day_return" }))}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-green-700">7-Day Return Policy</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Returns accepted within 7 days, unopened/unused in original packaging. At checkout, customers will see and must agree to:<br />
                      <em className="text-foreground">"I understand and agree that I only have seven days to return this product unopened or unused. No exceptions."</em>
                    </p>
                  </div>
                </label>
              </div>
              {!form.refundPolicy && (
                <p className="text-xs text-destructive font-medium">⚠ You must select a refund policy before saving this product.</p>
              )}
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

      {/* QR Code Dialog */}
      <Dialog open={!!qrProduct} onOpenChange={open => !open && setQrProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Product QR Code
            </DialogTitle>
          </DialogHeader>
          {qrProduct && (() => {
            const shopUrl = `${window.location.origin}/shop?product=${qrProduct.slug}`;
            const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shopUrl)}&color=0a0a0a&bgcolor=ffffff`;
            const qrFull = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(shopUrl)}`;
            return (
              <div className="space-y-4 text-center">
                <div>
                  <p className="font-semibold">{qrProduct.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">${qrProduct.price.toFixed(2)} · {qrProduct.cv ?? 0} CV</p>
                </div>
                <div className="flex justify-center">
                  <div className="border rounded-xl p-4 bg-white inline-block shadow-sm">
                    <img src={qrSrc} alt={`QR for ${qrProduct.name}`} width={220} height={220} className="rounded" />
                  </div>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2 text-xs font-mono text-muted-foreground text-left break-all">{shopUrl}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Scanning this QR code opens the shop page for this product. Members can use their own referral link version from their Tools page.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(shopUrl);
                      setQrCopied(true);
                      setTimeout(() => setQrCopied(false), 2000);
                    }}
                  >
                    {qrCopied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {qrCopied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.open(qrFull, "_blank")}>
                    <ExternalLink className="h-3.5 w-3.5" /> Download Full Size
                  </Button>
                </div>
              </div>
            );
          })()}
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
