import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import { fetchCustomer } from "../data/customerApi";
import { loadOrders } from "../data/orderStorage";
import { ApiError } from "../lib/apiClient";
import type { Customer, Order } from "../types";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    Promise.all([fetchCustomer(id), loadOrders().catch(() => [])])
      .then(([customerData, orderData]) => {
        if (cancelled) return;
        setCustomer(customerData);
        setOrders(orderData);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load this customer.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const customerOrders = orders.filter((o) => o.customerId === id);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl2 bg-farm-mist" />;
  }

  if (error || !customer) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-farm-charcoal/60">{error ?? "Customer not found."}</p>
        <Link to="/admin/customers" className="mt-3 inline-block text-sm font-medium text-farm-green-700">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={() => navigate("/admin/customers")}
        className="flex items-center gap-1.5 text-sm font-medium text-farm-charcoal/60 hover:text-farm-charcoal-deep"
      >
        <ArrowLeft size={15} /> Back to Customers
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-farm-green-700 text-xl font-semibold text-white">
              {customer.name.charAt(0)}
            </div>
            <h2 className="mt-3 font-display text-lg font-bold text-farm-charcoal-deep">{customer.name}</h2>
            <div className="mt-1">
              <StatusBadge status={customer.status} />
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-black/5 pt-5 text-sm">
            <div className="flex items-center gap-2.5 text-farm-charcoal/70">
              <Mail size={15} className="shrink-0 text-farm-charcoal/40" /> {customer.email}
            </div>
            <div className="flex items-center gap-2.5 text-farm-charcoal/70">
              <Phone size={15} className="shrink-0 text-farm-charcoal/40" /> {customer.phone}
            </div>
            <div className="flex items-center gap-2.5 text-farm-charcoal/70">
              <MapPin size={15} className="shrink-0 text-farm-charcoal/40" /> {customer.location}
            </div>
          </div>

          <p className="mt-5 border-t border-black/5 pt-4 text-xs text-farm-charcoal/50">
            Customer since{" "}
            {new Date(customer.joinedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <p className="text-xs text-farm-charcoal/50">Total Orders</p>
              <p className="mt-1 font-display text-2xl font-bold text-farm-charcoal-deep">
                {customer.totalOrders}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-farm-charcoal/50">Total Spent</p>
              <p className="mt-1 font-display text-2xl font-bold text-farm-charcoal-deep">
                ₹{customer.totalSpent.toLocaleString("en-IN")}
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Order History" subtitle={`${customerOrders.length} order(s)`} />
            {customerOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-farm-charcoal/50">No orders found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                      <th className="px-5 py-3 font-medium">Order ID</th>
                      <th className="px-5 py-3 font-medium">Product</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map((o) => (
                      <tr key={o.id} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                        <td className="px-5 py-3 font-medium text-farm-charcoal-deep">
                          <Link to={`/admin/purchased-products/${o.id}`} className="hover:text-farm-green-700">
                            {o.id}
                          </Link>
                        </td>
                        <td className="max-w-[220px] truncate px-5 py-3 text-farm-charcoal/70">{o.product}</td>
                        <td className="px-5 py-3 text-farm-charcoal-deep">₹{o.amount.toLocaleString("en-IN")}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
