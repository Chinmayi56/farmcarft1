import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, Users, AlertTriangle, Tag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/ui/StatCard";
import { Card, CardHeader } from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import { loadOrders } from "../data/orderStorage";
import { loadOffers } from "../data/offerStorage";
import { fetchProducts, stockLevel } from "../data/productApi";
import type { Order, Product, Offer } from "../types";
import { apiRequest } from "../lib/apiClient";

export default function Dashboard() {
  const { admin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadOrders().then(setOrders).catch(() => setOrders([]));
    setOffers(loadOffers());
    apiRequest<any[]>("/admin/customers").then(setCustomers).catch(() => setCustomers([]));
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const outOfStockCount = useMemo(() => products.filter((p) => stockLevel(p) !== "In Stock").length, [products]);
  const activeOffersCount = useMemo(() => offers.filter((o) => o.status === "Active").length, [offers]);

  const stockStatusData = useMemo(() => {
    const inStock = products.filter((p) => stockLevel(p) === "In Stock").length;
    const low = products.filter((p) => stockLevel(p) === "Low Stock").length;
    const out = products.filter((p) => stockLevel(p) === "Out of Stock").length;
    return [
      { name: "In Stock", value: inStock, color: "#1c6b3d" },
      { name: "Low Stock", value: low, color: "#d18e2c" },
      { name: "Out of Stock", value: out, color: "#c9432f" },
    ];
  }, [products]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6),
    [orders]
  );

  const purchaseOverviewData = useMemo(() => { const m=new Map<string,number>(); orders.forEach(o=>{const k=new Date(o.date).toLocaleDateString("en-IN",{month:"short"});m.set(k,(m.get(k)||0)+o.amount);}); return Array.from(m.entries()).slice(-6).map(([month,revenue])=>({month,revenue})); },[orders]);
  const categoryPerformanceData = useMemo(() => { const m=new Map<string,number>(); products.forEach(p=>m.set(p.category,(m.get(p.category)||0)+1)); return Array.from(m.entries()).map(([category,value])=>({category,value})); },[products]);
  const customerTrendData = useMemo(() => { const m=new Map<string,number>(); customers.forEach(c=>{const k=new Date(c.joinedAt).toLocaleDateString("en-IN",{month:"short"});m.set(k,(m.get(k)||0)+1);}); return Array.from(m.entries()).slice(-6).map(([month,newCustomers])=>({month,newCustomers,returning:0})); },[customers]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl font-bold text-farm-charcoal-deep sm:text-2xl">
          Hello, {admin?.name ?? "Admin"}
        </h2>
        <p className="mt-1 text-sm text-farm-charcoal/55">
          Here's what's happening with Farm Craft today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total Products"
          value={products.length}
          icon={Package}
          trend={{ value: "4.2%", direction: "up" }}
          accent="green"
        />
        <StatCard
          label="Purchased Products"
          value={orders.length}
          icon={ShoppingCart}
          trend={{ value: "12%", direction: "up" }}
          accent="charcoal"
        />
        <StatCard
          label="Customers"
          value={customers.length}
          icon={Users}
          trend={{ value: "8.1%", direction: "up" }}
          accent="green"
        />
        <StatCard
          label="Out of Stock"
          value={outOfStockCount}
          icon={AlertTriangle}
          trend={{ value: String(outOfStockCount), direction: "down" }}
          accent="red"
        />
        <StatCard
          label="Active Offers"
          value={activeOffersCount}
          icon={Tag}
          trend={{ value: `${activeOffersCount} live`, direction: "up" }}
          accent="amber"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Purchase Overview" subtitle="Monthly purchases, last 6 months" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={purchaseOverviewData} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="purchaseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1c6b3d" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1c6b3d" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebe6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e7ebe6", fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="purchases"
                  stroke="#1c6b3d"
                  strokeWidth={2.5}
                  fill="url(#purchaseFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Stock Status" subtitle="Current inventory split" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {stockStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7ebe6", fontSize: 12 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-farm-charcoal/70">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Product Category Performance" subtitle="Share of total sales" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformanceData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebe6" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7ebe6", fontSize: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#2e9358" maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Customer Purchase Trends" subtitle="New vs returning customers" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerTrendData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebe6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7ebe6", fontSize: 12 }} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs text-farm-charcoal/70">{value}</span>}
                />
                <Line type="monotone" dataKey="newCustomers" name="New" stroke="#1c6b3d" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="returning" name="Returning" stroke="#c9432f" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent purchases table */}
      <Card>
        <CardHeader title="Recent Purchases" subtitle="Latest orders across all channels" />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                <th className="px-5 py-3 font-medium">Order ID</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Qty</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                  <td className="px-5 py-3 font-medium text-farm-charcoal-deep">
                    <Link to={`/admin/purchased-products/${order.id}`} className="hover:text-farm-green-700">
                      {order.id}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-farm-charcoal/75">{order.customer}</td>
                  <td className="max-w-[220px] truncate px-5 py-3 text-farm-charcoal/75">{order.product}</td>
                  <td className="px-5 py-3 text-farm-charcoal/75">{order.quantity}</td>
                  <td className="px-5 py-3 text-farm-charcoal/75">{order.payment}</td>
                  <td className="px-5 py-3 font-medium text-farm-charcoal-deep">
                    ₹{order.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3 text-farm-charcoal/60">
                    {new Date(order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-farm-charcoal/50">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
