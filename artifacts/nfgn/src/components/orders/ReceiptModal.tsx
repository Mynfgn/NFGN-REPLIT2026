import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: number;
  productName: string;
  productImage?: string | null;
  price: number;
  quantity: number;
  total: number;
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
  shippingAddress?: string | null;
  promoCode?: string | null;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface ReceiptModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-red-100 text-red-800",
};

function fmt(n: number) {
  return n.toFixed(2);
}

export function ReceiptModal({ order, open, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!order) return null;

  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  function handlePrint() {
    const content = receiptRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt – ${order.orderNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Arial', sans-serif; font-size: 13px; color: #0a0a0a; background: #fff; }
            .receipt-wrap { max-width: 680px; margin: 0 auto; padding: 32px 24px; }
            .header { text-align: center; margin-bottom: 24px; }
            .brand { font-size: 26px; font-weight: 900; letter-spacing: 3px; color: #C9A84C; }
            .brand-sub { font-size: 10px; letter-spacing: 2px; color: #666; text-transform: uppercase; margin-top: 2px; }
            .doc-title { font-size: 14px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #0a0a0a; margin-top: 8px; }
            .order-meta { display: flex; justify-content: space-between; margin-top: 16px; font-size: 12px; color: #555; border: 1px solid #ddd; border-radius: 6px; padding: 10px 14px; }
            .order-meta strong { color: #0a0a0a; }

            /* Shipping Slip */
            .section-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #C9A84C; margin-bottom: 6px; }
            .slip-block { border: 1.5px dashed #C9A84C; border-radius: 6px; padding: 14px 16px; margin: 20px 0; }
            .slip-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .slip-col h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #666; margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            .slip-col p { font-size: 12px; line-height: 1.6; }
            .slip-items { margin-top: 10px; }
            .slip-items table { width: 100%; border-collapse: collapse; font-size: 12px; }
            .slip-items td { padding: 3px 0; }
            .slip-items td:last-child { text-align: right; }
            .tear-line { border: none; border-top: 2px dashed #ccc; margin: 20px 0; position: relative; }
            .tear-label { text-align: center; font-size: 9px; letter-spacing: 2px; color: #aaa; text-transform: uppercase; margin: -8px 0 16px; }

            /* Receipt Items */
            .items-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            .items-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; padding: 6px 8px; text-align: left; border-bottom: 1px solid #eee; }
            .items-table th:not(:first-child) { text-align: right; }
            .items-table td { padding: 8px 8px; font-size: 12px; vertical-align: top; }
            .items-table td:not(:first-child) { text-align: right; }
            .items-table tr:not(:last-child) td { border-bottom: 1px solid #f5f5f5; }
            .product-name { font-weight: 600; }
            .unit-price { color: #666; font-size: 11px; margin-top: 1px; }

            /* Totals */
            .totals { margin-left: auto; width: 260px; margin-top: 12px; }
            .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
            .totals-row.subtotal { color: #555; }
            .totals-row.discount { color: #2D6A4F; }
            .totals-row.total { font-size: 15px; font-weight: 900; border-top: 2px solid #0a0a0a; padding-top: 8px; margin-top: 4px; }

            /* Footer */
            .receipt-footer { text-align: center; margin-top: 28px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #888; line-height: 1.8; }
            .receipt-footer strong { color: #C9A84C; }

            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .status-completed { background: #d1fae5; color: #065f46; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-processing { background: #dbeafe; color: #1e40af; }
            .status-cancelled { background: #fee2e2; color: #991b1b; }

            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-wrap">
            ${content.innerHTML}
          </div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  async function handleShare() {
    const text = buildShareText(order);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Receipt – ${order.orderNumber}`, text });
        return;
      } catch { /* fall through to copy */ }
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

        {/* Receipt Content */}
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
              <p className="font-mono font-bold text-sm text-foreground">{order.orderNumber}</p>
            </div>
            <div className="space-y-0.5 text-center">
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium text-foreground">{formattedDate}</p>
              <p className="text-muted-foreground">{formattedTime}</p>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-muted-foreground">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusColors[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* ——— SHIPPING SLIP ——— */}
          <div className="border-2 border-dashed border-primary/40 rounded-lg p-4 mb-2">
            <div className="text-[9px] font-bold tracking-[2px] uppercase text-primary mb-3">
              ✂ Shipping Slip — Tear Here
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 border-b pb-1">Ship To</p>
                <p className="font-bold text-sm">{order.userName}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line mt-0.5">{order.shippingAddress ?? "No address on file"}</p>
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
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-0.5 font-medium">{item.productName}</td>
                      <td className="text-right py-0.5">× {item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {order.notes && (
              <div className="mt-3 pt-2 border-t">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Notes</p>
                <p className="text-xs mt-0.5 italic">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Tear line visual for on-screen */}
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
                <p className="font-bold">{order.userName}</p>
                <p className="text-muted-foreground capitalize">{order.paymentMethod?.replace("_", " ")} — <span className={order.paymentStatus === "demo_paid" ? "text-green-600 font-semibold" : ""}>{order.paymentStatus?.replace(/_/g, " ")}</span></p>
              </div>
              {order.promoCode && (
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Promo Applied</p>
                  <p className="font-mono font-bold text-primary">{order.promoCode}</p>
                  <p className="text-muted-foreground">−${fmt(order.discount)}</p>
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
                  <th className="text-right py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-muted/50">
                    <td className="py-2.5 pr-2">
                      <p className="font-semibold">{item.productName}</p>
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="py-2.5 text-right text-muted-foreground">${fmt(item.price)}</td>
                    <td className="py-2.5 text-right font-semibold">${fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="ml-auto max-w-[240px] mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${fmt(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount {order.promoCode ? `(${order.promoCode})` : ""}</span>
                  <span>−${fmt(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${fmt(order.shipping)}`}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>${fmt(order.tax)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-black text-base">
                <span>Total</span>
                <span className="text-primary">${fmt(order.total)}</span>
              </div>
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

function buildShareText(order: Order): string {
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
    ...order.items.map(i => `  ${i.productName} × ${i.quantity}  $${i.total.toFixed(2)}`),
    "─────────────────────────────",
    `Subtotal: $${order.subtotal.toFixed(2)}`,
    ...(order.discount > 0 ? [`Discount: -$${order.discount.toFixed(2)}`] : []),
    `Shipping: ${order.shipping === 0 ? "Free" : "$" + order.shipping.toFixed(2)}`,
    `Tax: $${order.tax.toFixed(2)}`,
    `TOTAL: $${order.total.toFixed(2)}`,
    "─────────────────────────────",
    `Ship To: ${order.userName}`,
    order.shippingAddress ?? "No address on file",
    "═══════════════════════════════",
    "newfaceglobalnetwork@gmail.com",
    "(678) 909-9974",
  ];
  return lines.join("\n");
}
