import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Mail, MapPin, Phone } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import Toast, { type ToastState } from "../components/ui/Toast";
import { loadOrders, updateOrderStatus } from "../data/orderStorage";
import type { Order, OrderStatus } from "../types";

const STATUS_OPTIONS: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

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

  const handleStatusChange = (newStatus: OrderStatus) => {
    updateOrderStatus(orders, order.id, newStatus).then((next) => { setOrders(next); setToast({ message: "Order status updated", variant: "success" }); }).catch(() => setToast({ message: "Could not update order", variant: "error" }));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate("/admin/purchased-products")}
          className="flex items-center gap-1.5 text-sm font-medium text-farm-charcoal/60 hover:text-farm-charcoal-deep"
        >
          <ArrowLeft size={15} /> Back to Purchased Products
        </button>
        <Link
          to={`/admin/purchased-products/${order.id}/invoice`}
          className="flex items-center justify-center gap-2 rounded-xl bg-farm-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-farm-green-800"
        >
          <FileText size={16} /> View Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title={order.id}
              subtitle={`Purchase Code: ${order.purchaseCode}`}
              action={<StatusBadge status={order.status} />}
            />
            <div className="grid grid-cols-1 gap-4 p-5 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-farm-charcoal/50">Order Date</p>
                <p className="mt-1 font-medium text-farm-charcoal-deep">
                  {new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <div>
                <p className="text-xs text-farm-charcoal/50">Purchase Code</p>
                <p className="mt-1 font-mono font-medium text-farm-charcoal-deep">{order.purchaseCode}</p>
              </div>
              <div>
                <p className="text-xs text-farm-charcoal/50">Order Method</p>
                <p className="mt-1 font-medium text-farm-charcoal-deep">{order.orderMethod}</p>
              </div>
              <div>
                <p className="text-xs text-farm-charcoal/50">Status</p>
                <div className="mt-1.5">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                    className="rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-xs focus:border-farm-green-600 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Product" subtitle="Item purchased in this order" />
            <div className="grid grid-cols-1 gap-4 p-5 text-sm sm:grid-cols-4">
              <div className="sm:col-span-2">
                <p className="text-xs text-farm-charcoal/50">Name</p>
                <p className="mt-1 font-medium text-farm-charcoal-deep">{order.product}</p>
              </div>
              <div>
                <p className="text-xs text-farm-charcoal/50">SKU</p>
                <p className="mt-1 font-medium text-farm-charcoal-deep">{order.sku}</p>
              </div>
              <div>
                <p className="text-xs text-farm-charcoal/50">Quantity</p>
                <p className="mt-1 font-medium text-farm-charcoal-deep">{order.quantity}</p>
              </div>
              <div>
                <p className="text-xs text-farm-charcoal/50">Unit Price</p>
                <p className="mt-1 font-medium text-farm-charcoal-deep">₹{order.price.toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-xs text-farm-charcoal/50">Total</p>
                <p className="mt-1 font-medium text-farm-charcoal-deep">₹{order.amount.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Payment" subtitle="Payment method and status" />
            <div className="grid grid-cols-1 gap-4 p-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-farm-charcoal/50">Payment Method</p>
                <p className="mt-1 font-medium text-farm-charcoal-deep">{order.payment}</p>
              </div>
              <div>
                <p className="text-xs text-farm-charcoal/50">Payment Status</p>
                <div className="mt-1">
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="h-fit p-5 lg:col-span-1">
          <h3 className="font-display text-sm font-semibold text-farm-charcoal-deep">Customer</h3>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-farm-green-700 text-sm font-semibold text-white">
              {order.customer.charAt(0)}
            </div>
            <Link
              to={`/admin/customers/${order.customerId}`}
              className="font-medium text-farm-charcoal-deep hover:text-farm-green-700"
            >
              {order.customer}
            </Link>
          </div>
          <div className="mt-4 space-y-3 border-t border-black/5 pt-4 text-sm">
            <div className="flex items-center gap-2.5 text-farm-charcoal/70">
              <Mail size={15} className="shrink-0 text-farm-charcoal/40" /> {order.email}
            </div>
            <div className="flex items-center gap-2.5 text-farm-charcoal/70">
              <Phone size={15} className="shrink-0 text-farm-charcoal/40" /> {order.mobile}
            </div>
            <div className="flex items-start gap-2.5 text-farm-charcoal/70">
              <MapPin size={15} className="mt-0.5 shrink-0 text-farm-charcoal/40" />
              <span>
                {order.address}, {order.city}, {order.state} - {order.pincode}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
