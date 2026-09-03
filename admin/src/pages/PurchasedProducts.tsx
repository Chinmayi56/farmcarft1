import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, FileText, RefreshCcw, Search, ShoppingCart } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import Toast, { type ToastState } from "../components/ui/Toast";
import { loadOrders, updateOrderStatus } from "../data/orderStorage";
import type { Order, OrderStatus } from "../types";

const STATUS_FILTERS: (OrderStatus | "All")[] = [
  "All",
  "Pending",
  "Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

const STATUS_OPTIONS: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

export default function PurchasedProducts() {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<OrderStatus | "All">("All");
  const [statusEditingId, setStatusEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    loadOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      setToast({ message: state.toast, variant: "success" });
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.purchaseCode.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q);
      const matchesStatus = status === "All" || o.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, status]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orders, orderId, newStatus).then((next) => { setOrders(next); setStatusEditingId(null); setToast({ message: "Order status updated", variant: "success" }); }).catch(() => setToast({ message: "Could not update order", variant: "error" })); return;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-lg font-bold text-farm-charcoal-deep">Purchased Products</h2>
        <p className="text-sm text-farm-charcoal/55">All orders placed by Farm Craft customers</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-farm-charcoal/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order ID, purchase code, customer or product..."
            className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                status === s
                  ? "bg-farm-green-700 text-white"
                  : "border border-black/10 text-farm-charcoal/60 hover:bg-farm-mist"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title="Orders" subtitle={`${filtered.length} of ${orders.length} orders`} />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                <th className="px-5 py-3 font-medium">Order ID</th>
                <th className="px-5 py-3 font-medium">Purchase Code</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Mobile</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Order Method</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Address</th>
                <th className="px-5 py-3 font-medium">Order Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                  <td className="px-5 py-3 font-medium text-farm-charcoal-deep">{order.id}</td>
                  <td className="px-5 py-3 font-mono text-xs text-farm-charcoal/70">{order.purchaseCode}</td>
                  <td className="px-5 py-3 text-farm-charcoal/75">{order.customer}</td>
                  <td className="px-5 py-3 text-farm-charcoal/60">{order.email}</td>
                  <td className="px-5 py-3 text-farm-charcoal/60">{order.mobile}</td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-farm-charcoal/75">{order.product}</td>
                  <td className="px-5 py-3 text-farm-charcoal/75">{order.quantity}</td>
                  <td className="px-5 py-3 text-farm-charcoal/75">₹{order.price.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3 text-farm-charcoal/75">{order.orderMethod}</td>
                  <td className="px-5 py-3 text-farm-charcoal/75">{order.payment}</td>
                  <td className="max-w-[180px] truncate px-5 py-3 text-farm-charcoal/60">
                    {order.address}, {order.city}
                  </td>
                  <td className="px-5 py-3 text-farm-charcoal/60">
                    {new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="px-5 py-3">
                    {statusEditingId === order.id ? (
                      <select
                        autoFocus
                        defaultValue={order.status}
                        onBlur={() => setStatusEditingId(null)}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs focus:border-farm-green-600 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={order.status} />
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/admin/purchased-products/${order.id}`}
                        className="rounded-lg p-1.5 text-farm-charcoal/50 hover:bg-farm-mist hover:text-farm-charcoal-deep"
                        aria-label="View order"
                        title="View"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => setStatusEditingId(order.id)}
                        className="rounded-lg p-1.5 text-farm-charcoal/50 hover:bg-farm-mist hover:text-farm-charcoal-deep"
                        aria-label="Update status"
                        title="Update Status"
                      >
                        <RefreshCcw size={16} />
                      </button>
                      <Link
                        to={`/admin/purchased-products/${order.id}/invoice`}
                        className="rounded-lg p-1.5 text-farm-charcoal/50 hover:bg-farm-mist hover:text-farm-charcoal-deep"
                        aria-label="View invoice"
                        title="Invoice"
                      >
                        <FileText size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-5 py-14 text-center">
                    <ShoppingCart size={28} className="mx-auto mb-2 text-farm-charcoal/25" />
                    <p className="text-sm font-medium text-farm-charcoal/60">No orders found</p>
                    <p className="mt-1 text-xs text-farm-charcoal/40">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
