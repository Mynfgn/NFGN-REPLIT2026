import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Share2, Check, Zap, Star, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage?: string | null;
  price: number;
  quantity: number;
  total: number;
  cvTotal?: number;
  isDownloadable?: boolean;
  downloadUrl?: string | null;
  downloadFileName?: string | null;
}

interface Order {
  id: number;
  orderNumber: string;
  userName: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  refundAmount?: number;
  refundNote?: string | null;
  shippingAddress?: string | null;
  promoCode?: string | null;
  notes?: string | null;
  createdAt: string;
  isPickup?: boolean;
  handlingFee?: number;
  items: OrderItem[];
  digitalSignature?: string | null;
  digitalSignedAt?: string | null;
}

interface ReceiptModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  isProMember?: boolean;
  currentMonthPv?: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-red-100 text-red-800",
};

const BPP_MIN_PV = 150;

function fmt(n: number) { return n.toFixed(2); }

export function ReceiptModal({ order, open, onClose, isProMember, currentMonthPv }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!order) return null;
  const o = order as Order;

  const totalPv = o.items.reduce((s, i) => s + (i.cvTotal ?? 0), 0);
  const pvAfterOrder = (currentMonthPv ?? 0) + totalPv;
  const pvNeeded = Math.max(0, BPP_MIN_PV - pvAfterOrder);
  const bppMet = isProMember && pvAfterOrder >= BPP_MIN_PV;

  const date = new Date(o.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const formattedTime = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  function handlePrint() {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
      <title>Receipt – ${o.orderNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #0a0a0a; background: #fff; }
        .receipt-wrap { max-width: 700px; margin: 0 auto; padding: 32px 24px; }
        .header { text-align: center; margin-bottom: 24px; }
        .brand { font-size: 26px; font-weight: 900; letter-spacing: 3px; color: #C9A84C; }
        .brand-sub { font-size: 10px; letter-spacing: 2px; color: #666; text-transform: uppercase; margin-top: 2px; }
        .doc-title { font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #0a0a0a; margin-top: 8px; }
        .meta-bar { display: flex; justify-content: space-between; border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; }
        .slip-block { border: 1.5px dashed #C9A84C; border-radius: 6px; padding: 14px 16px; margin-bottom: 16px; }
        .slip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px; }
        .slip-col h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
        .slip-col p { font-size: 12px; line-height: 1.6; }
        .items-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        .items-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; padding: 6px 8px; text-align: left; border-bottom: 1px solid #eee; }
        .items-table th:not(:first-child) { text-align: right; }
        .items-table td { padding: 8px 8px; font-size: 12px; }
        .items-table td:not(:first-child) { text-align: right; }
        .items-table tr:not(:last-child) td { border-bottom: 1px solid #f5f5f5; }
        .cv-badge { display: inline-block; background: #f0f9ff; color: #0369a1; font-size: 10px; padding: 1px 5px; border-radius: 4px; font-weight: 600; }
        .totals { margin-left: auto; width: 260px; margin-top: 12px; }
        .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #555; }
        .totals-row.grand-total { font-size: 15px; font-weight: 900; border-top: 2px solid #0a0a0a; padding-top: 8px; margin-top: 4px; }
        .pv-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #0369a1; font-weight: 600; border-top: 1px solid #dbeafe; margin-top: 6px; padding-top: 6px; }
        .bpp-box { border: 1px solid #C9A84C; border-radius: 6px; padding: 10px 14px; margin-top: 16px; font-size: 11px; }
        .bpp-box.met { border-color: #2D6A4F; background: #f0fdf4; color: #166534; }
        .bpp-box.need { border-color: #C9A84C; background: #fffbeb; color: #92400e; }
        .tear-line { border: none; border-top: 2px dashed #ccc; margin: 20px 0; }
        .footer { text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #888; line-height: 1.8; }
        .footer strong { color: #C9A84C; }
        @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
      </style></head>
      <body><div class="receipt-wrap">${content.innerHTML}</div>
      <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>`);
    printWindow.document.close();
  }

  async function handleShare() {
    const text = buildShareText(o, totalPv);
    if (navigator.share) {
      try { await navigator.share({ title: `Receipt – ${o.orderNumber}`, text }); return; } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Receipt copied to clipboard!" });
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-base font-semibold flex items-center justify-between gap-2">
            <span>Order Receipt</span>
            <div className="flex gap-2 mr-6">
              <Button size="sm" variant="outline" onClick={handleShare} className="h-8 text-xs gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Share"}
              </Button>
              <Button size="sm" onClick={handlePrint} className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                <Printer className="h-3.5 w-3.5" />
                Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={receiptRef} className="px-6 pb-6 pt-4 space-y-0">

          {/* Header */}
          <div className="text-center mb-5">
            <div className="text-2xl font-black tracking-[4px] text-primary">NFGN</div>
            <div className="text-[10px] tracking-[2px] text-muted-foreground uppercase mt-0.5">New Face Global Network</div>
            <div className="text-xs font-bold tracking-widest uppercase mt-1.5 text-foreground">Official Receipt &amp; Shipping Slip</div>
          </div>

          {/* Order Meta */}
          <div className="flex justify-between items-start bg-muted/40 border rounded-lg px-4 py-3 text-xs mb-5">
            <div className="space-y-0.5">
              <p className="text-muted-foreground">Order Number</p>
              <p className="font-mono font-bold text-sm text-foreground">{o.orderNumber}</p>
            </div>
            <div className="space-y-0.5 text-center">
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">{formattedDate}</p>
              <p className="text-muted-foreground">{formattedTime}</p>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-muted-foreground">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusColors[o.status] ?? "bg-gray-100 text-gray-700"}`}>
                {o.status}
              </span>
            </div>
          </div>

          {/* Refund notice if applicable */}
          {(o.refundAmount ?? 0) > 0 && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-xs mb-4">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-700">Refund Issued: −${fmt(o.refundAmount!)}</p>
                {o.refundNote && <p className="text-red-600 mt-0.5">{o.refundNote}</p>}
              </div>
            </div>
          )}

          {/* ——— SHIPPING SLIP ——— */}
          <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 mb-2">
            <div className="text-[9px] font-bold tracking-[2px] uppercase text-primary mb-3">✂ Shipping Slip — Tear Here</div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 border-b pb-1">Ship To</p>
                <p className="font-bold text-sm">{o.userName}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line mt-0.5">{o.shippingAddress ?? "No address on file"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 border-b pb-1">Ship From</p>
                <p className="font-bold text-sm">NFGN Fulfillment</p>
                <p className="text-xs text-muted-foreground mt-0.5">New Face Global Network<br />Phone: (678) 909-9974<br />newfaceglobalnetwork@gmail.com</p>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Items to Ship</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-medium pb-1">Product</th>
                    <th className="text-right font-medium pb-1">Qty</th>
                    <th className="text-right font-medium pb-1">CV</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-0.5 font-medium">{item.productName}</td>
                      <td className="text-right py-0.5">× {item.quantity}</td>
                      <td className="text-right py-0.5 text-blue-700 font-semibold">{item.cvTotal ?? 0} CV</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {o.notes && (
              <div className="mt-3 pt-2 border-t">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Notes</p>
                <p className="text-xs mt-0.5 italic">{o.notes}</p>
              </div>
            )}
          </div>

          {/* Tear line */}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
            <span className="text-[9px] tracking-[2px] text-muted-foreground/50 uppercase">Receipt Below</span>
            <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
          </div>

          {/* ——— FULL RECEIPT ——— */}
          <div>
            <div className="text-[9px] font-bold tracking-[2px] uppercase text-primary mb-3">Itemized Receipt</div>

            {/* Bill To */}
            <div className="flex justify-between text-xs mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Bill To / Sold To</p>
                <p className="font-bold">{o.userName}</p>
                <p className="text-muted-foreground capitalize">{o.paymentMethod?.replace("_", " ")} — <span className={o.paymentStatus === "demo_paid" ? "text-green-600 font-semibold" : ""}>{o.paymentStatus?.replace(/_/g, " ")}</span></p>
              </div>
              {o.promoCode && (
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Promo Applied</p>
                  <p className="font-mono font-bold text-primary">{o.promoCode}</p>
                  <p className="text-muted-foreground">−${fmt(o.discount)}</p>
                </div>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full text-sm mb-1">
              <thead>
                <tr className="border-b border-t">
                  <th className="text-left py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="text-right py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qty</th>
                  <th className="text-right py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                  <th className="text-right py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CV</th>
                  <th className="text-right py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {o.items.map(item => (
                  <tr key={item.id} className="border-b border-muted/50">
                    <td className="py-2.5 pr-2">
                      <p className="font-semibold">{item.productName}</p>
                      {item.isDownloadable && (
                        <span className="inline-flex items-center gap-1 text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#C9A84C20", color: "#C9A84C" }}>
                          <Download className="h-2.5 w-2.5" /> Digital Download
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="py-2.5 text-right text-muted-foreground">${fmt(item.price)}</td>
                    <td className="py-2.5 text-right">
                      <span className="inline-block bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-bold">{item.cvTotal ?? 0}</span>
                    </td>
                    <td className="py-2.5 text-right font-semibold">${fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="ml-auto max-w-[260px] mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${fmt(o.subtotal)}</span>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount {o.promoCode ? `(${o.promoCode})` : ""}</span>
                  <span>−${fmt(o.discount)}</span>
                </div>
              )}
              {o.isPickup ? (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1">🏪 Pick-up Order</span>
                    <span className="text-xs text-muted-foreground">Shipping waived</span>
                  </div>
                  {(o.handlingFee ?? 0) > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Handling Fee</span>
                      <span>${fmt(o.handlingFee!)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{o.shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${fmt(o.shipping)}`}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>${fmt(o.tax)}</span>
              </div>
              {(o.refundAmount ?? 0) > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Refunded</span>
                  <span>−${fmt(o.refundAmount!)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-black text-base">
                <span>Total</span>
                <span className="text-primary">${fmt(o.total)}</span>
              </div>
              {/* PV Earned Row */}
              <div className="flex justify-between text-blue-700 font-bold text-sm border-t border-blue-100 pt-2 mt-1">
                <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5" />PV Earned</span>
                <span>{totalPv} PV</span>
              </div>
            </div>

            {/* BPP Notification for Pro Members */}
            {isProMember && (
              <div className={`mt-4 rounded-lg border px-4 py-3 text-xs flex items-start gap-2.5 ${bppMet ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                <Star className={`h-4 w-4 mt-0.5 flex-shrink-0 ${bppMet ? "text-green-600" : "text-amber-600"}`} />
                <div>
                  <p className={`font-bold ${bppMet ? "text-green-800" : "text-amber-800"}`}>
                    {bppMet ? "BPP Qualification: On Track!" : "Bill Payer Program (BPP) Progress"}
                  </p>
                  {bppMet ? (
                    <p className={`mt-0.5 ${bppMet ? "text-green-700" : "text-amber-700"}`}>
                      This order contributed {totalPv} PV. You've accumulated {pvAfterOrder} PV this month — you meet the 150 PV minimum for BPP qualification!
                    </p>
                  ) : (
                    <p className="mt-0.5 text-amber-700">
                      This order contributed {totalPv} PV. You need <strong>{pvNeeded} more PV</strong> this month to qualify for BPP (150 PV required). Check your BPP dashboard for details.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Digital Downloads — shown when order contains downloadable items and is paid */}
          {o.items.some(i => i.isDownloadable && i.downloadUrl) && ["paid", "demo_paid", "completed"].includes(o.paymentStatus) && (
            <div className="mt-5 rounded-lg overflow-hidden border-2" style={{ borderColor: "#C9A84C" }}>
              <div className="px-4 py-2.5" style={{ background: "linear-gradient(135deg, #faf8f3, #f5f0e8)", borderBottom: "1px solid #e8dfc8" }}>
                <p className="text-[10px] font-bold uppercase tracking-[1.5px] flex items-center gap-1.5" style={{ color: "#C9A84C" }}>
                  <Download className="h-3.5 w-3.5" /> Your Digital Downloads
                </p>
                <p className="text-[10px] mt-0.5 text-muted-foreground">Click a button below to download your purchased file(s). Links are tied to your account.</p>
              </div>
              <div className="px-4 py-3 space-y-2 bg-white">
                {o.items
                  .filter(i => i.isDownloadable && i.downloadUrl)
                  .map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border" style={{ borderColor: "#e8dfc8", background: "#faf8f3" }}>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{item.productName}</p>
                        {item.downloadFileName && (
                          <p className="text-[10px] text-muted-foreground truncate">{item.downloadFileName}</p>
                        )}
                      </div>
                      <a
                        href={`/api/orders/${o.id}/download/${item.productId}`}
                        download={item.downloadFileName || item.productName}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold no-underline transition-all"
                        style={{ background: "#C9A84C", color: "#000" }}
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Digital Signature — always shown; image only when signature was captured */}
          <div className="mt-5 rounded-lg overflow-hidden" style={{ border: "1.5px solid #C9A84C" }}>
            <div className="px-4 py-2.5" style={{ background: "linear-gradient(135deg, #faf8f3, #f5f0e8)", borderBottom: "1px solid #e8dfc8" }}>
              <p className="text-[10px] font-bold uppercase tracking-[1.5px]" style={{ color: "#C9A84C" }}>Electronic Purchase Agreement</p>
              {o.digitalSignedAt && (
                <p className="text-[10px] mt-0.5" style={{ color: "#888" }}>
                  Signed: {new Date(o.digitalSignedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
            {o.digitalSignature && (
              <div className="px-4 py-3 bg-white">
                <img src={o.digitalSignature} alt="Customer signature" className="w-full rounded border" style={{ maxHeight: 80, objectFit: "contain", borderColor: "#e8dfc8" }} />
              </div>
            )}
            <div className="px-4 py-3">
              <p className="text-[10px] rounded px-2 py-1.5 leading-relaxed" style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.2)", color: "#666" }}>
                <span className="font-bold" style={{ color: "#C9A84C" }}>Agreement: </span>
                I confirm that I personally authorised this purchase and am the account holder. I understand this digital signature is timestamped and serves as my official proof of purchase. I acknowledge that all sales are final — this product is non-refundable and cannot be returned.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t text-[10px] text-muted-foreground space-y-0.5">
            <p className="font-bold tracking-widest uppercase text-primary">New Face Global Network</p>
            <p>Thank you for your order! For questions, contact us at</p>
            <p>
              <a href="mailto:newfaceglobalnetwork@gmail.com" className="underline">newfaceglobalnetwork@gmail.com</a>{" "}
              or <a href="tel:6789099974" className="underline">(678) 909-9974</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function buildShareText(order: Order, totalPv: number): string {
  const date = new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const lines: string[] = [
    "═══════════════════════════════",
    "  NEW FACE GLOBAL NETWORK",
    "  Official Receipt",
    "═══════════════════════════════",
    `Order: ${order.orderNumber}`,
    `Date: ${date}`,
    `Customer: ${order.userName}`,
    `Status: ${order.status.toUpperCase()}`,
    "─────────────────────────────",
    "ITEMS:",
    ...order.items.map((i: OrderItem) => `  ${i.productName} × ${i.quantity}  $${i.total.toFixed(2)}  (${i.cvTotal ?? 0} CV)`),
    "─────────────────────────────",
    `Subtotal: $${order.subtotal.toFixed(2)}`,
    ...(order.discount > 0 ? [`Discount: -$${order.discount.toFixed(2)}`] : []),
    `Shipping: ${order.shipping === 0 ? "Free" : "$" + order.shipping.toFixed(2)}`,
    `Tax: $${order.tax.toFixed(2)}`,
    `TOTAL: $${order.total.toFixed(2)}`,
    `PV EARNED: ${totalPv} PV`,
    "─────────────────────────────",
    `Ship To: ${order.userName}`,
    order.shippingAddress ?? "No address on file",
    "═══════════════════════════════",
    "newfaceglobalnetwork@gmail.com",
    "(678) 909-9974",
  ];
  return lines.join("\n");
}
