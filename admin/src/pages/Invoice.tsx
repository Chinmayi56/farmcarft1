import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { loadOrders } from "../data/orderStorage";
import type { Order } from "../types";
import logo from "../assets/farmcraft-logo-full.png";

const GSTIN = "37AQXPV3001H1ZG";

export default function Invoice() {
  const { id } = useParams();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  const order = orders.find((o) => o.id === id);

  if (orders.length === 0) return null;

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-farm-charcoal/60">Order not found.</p>
        <Link to="/admin/purchased-products" className="mt-3 inline-block text-sm font-medium text-farm-green-700">
          Back to Purchased Products
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const html = document.getElementById("invoice-printable")?.outerHTML ?? "";
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Invoice ${order.id}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#1f2a24;padding:24px;}
        table{width:100%;border-collapse:collapse;}
        th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #e7ebe6;font-size:13px;}
        h1,h2,h3{margin:0;}
        .brand{color:#1c6b3d;}
        .muted{color:#6b756f;font-size:12px;}
      </style>
      </head><body>${html}</body></html>`;
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice-${order.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <Link
          to={`/admin/purchased-products/${order.id}`}
          className="flex items-center gap-1.5 text-sm font-medium text-farm-charcoal/60 hover:text-farm-charcoal-deep"
        >
          <ArrowLeft size={15} /> Back to Order
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-farm-charcoal-deep hover:bg-farm-mist"
          >
            <Download size={16} /> Download Invoice
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 rounded-xl bg-farm-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-farm-green-800"
          >
            <Printer size={16} /> Print Invoice
          </button>
        </div>
      </div>

      <div
        id="invoice-printable"
        className="mx-auto max-w-3xl rounded-xl2 border border-black/5 bg-white p-8 shadow-card print:rounded-none print:border-0 print:shadow-none"
      >
        <div className="flex items-start justify-between border-b-2 border-farm-green-700 pb-5">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Farm Craft" className="h-14 w-24 shrink-0 rounded-lg bg-white object-contain p-1" />
            <div>
              <h1 className="font-display text-2xl font-extrabold text-farm-green-700">FARM CRAFT</h1>
              <p className="text-xs text-farm-charcoal/55">GSTIN: {GSTIN}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-display text-lg font-bold text-farm-charcoal-deep">TAX INVOICE</h2>
            <p className="mt-1 text-xs text-farm-charcoal/55">Order ID: {order.id}</p>
            <p className="text-xs text-farm-charcoal/55">Purchase Code: {order.purchaseCode}</p>
            <p className="text-xs text-farm-charcoal/55">
              Order Date:{" "}
              {new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-farm-charcoal/45">Billed To</p>
            <p className="mt-2 text-sm font-semibold text-farm-charcoal-deep">{order.customer}</p>
            <p className="text-xs text-farm-charcoal/60">{order.email}</p>
            <p className="text-xs text-farm-charcoal/60">{order.mobile}</p>
            <p className="mt-1 text-xs text-farm-charcoal/60">
              {order.address}, {order.city}, {order.state} - {order.pincode}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-farm-charcoal/45">Payment</p>
            <p className="mt-2 text-sm text-farm-charcoal-deep">Method: {order.payment}</p>
            <p className="text-sm text-farm-charcoal-deep">Payment Status: {order.paymentStatus}</p>
            <p className="text-sm text-farm-charcoal-deep">Order Status: {order.status}</p>
          </div>
        </div>

        <table className="mt-7 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-farm-charcoal/45">
              <th className="py-2.5">Product</th>
              <th className="py-2.5">SKU</th>
              <th className="py-2.5 text-right">Qty</th>
              <th className="py-2.5 text-right">Unit Price</th>
              <th className="py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/5">
              <td className="py-3 font-medium text-farm-charcoal-deep">{order.product}</td>
              <td className="py-3 text-farm-charcoal/70">{order.sku}</td>
              <td className="py-3 text-right text-farm-charcoal/70">{order.quantity}</td>
              <td className="py-3 text-right text-farm-charcoal/70">₹{order.price.toLocaleString("en-IN")}</td>
              <td className="py-3 text-right font-medium text-farm-charcoal-deep">
                ₹{order.amount.toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-farm-charcoal/70">
              <span>Subtotal</span>
              <span>₹{order.amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-1.5 font-display text-base font-bold text-farm-charcoal-deep">
              <span>Total</span>
              <span>₹{order.amount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-black/10 pt-4 text-center text-xs text-farm-charcoal/45">
          This is a system-generated invoice from Farm Craft. Thank you for your business.
        </div>
      </div>
    </div>
  );
}
