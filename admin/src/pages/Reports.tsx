import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";

import { loadOrders } from "../data/orderStorage";
import { fetchProducts, stockLevel } from "../data/productApi";
import { downloadCsv } from "../utils/exportCsv";
import type { Order, Product } from "../types";
import { apiRequest } from "../lib/apiClient";

const REPORT_TABS = ["Sales", "Purchases", "Customers", "Product Performance", "Stock"] as const;
type ReportTab = (typeof REPORT_TABS)[number];

export default function Reports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<ReportTab>("Sales");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [productFilter, setProductFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [exported, setExported] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadOrders().then(setOrders).catch(() => setOrders([]));
    apiRequest<any[]>("/admin/customers").then(setCustomers).catch(() => setCustomers([]));
    fetchProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  const productNames = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.name)))], [products]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesFrom = !dateFrom || o.date >= dateFrom;
      const matchesTo = !dateTo || o.date <= dateTo;
      const matchesProduct = productFilter === "All" || o.product === productFilter;
      return matchesFrom && matchesTo && matchesProduct;
    });
  }, [orders, dateFrom, dateTo, productFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => categoryFilter === "All" || p.category === categoryFilter);
  }, [products, categoryFilter]);

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
  const avgOrderValue = filteredOrders.length ? Math.round(totalRevenue / filteredOrders.length) : 0;

  const revenueByMonth = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach((o) => {
      const month = new Date(o.date).toLocaleDateString("en-IN", { month: "short" });
      map.set(month, (map.get(month) ?? 0) + o.amount);
    });
    return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
  }, [filteredOrders]);

  const customerTrendData = useMemo(() => {
    const byMonth = new Map<string,{month:string,newCustomers:number,returning:number}>();
    customers.forEach((c) => { const d=new Date(c.joinedAt); const month=d.toLocaleDateString("en-IN",{month:"short"}); const row=byMonth.get(month)||{month,newCustomers:0,returning:0}; row.newCustomers++; byMonth.set(month,row); });
    return Array.from(byMonth.values()).slice(-6);
  }, [customers]);

  const productPerformance = useMemo(() => {
    const map = new Map<string, { units: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      const entry = map.get(o.product) ?? { units: 0, revenue: 0 };
      entry.units += o.quantity;
      entry.revenue += o.amount;
      map.set(o.product, entry);
    });
    return Array.from(map.entries())
      .map(([product, v]) => ({ product, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  const handleExport = (format: "csv" | "excel") => {
    const suffix = format === "excel" ? "xls-compatible.csv" : "csv";
    if (tab === "Sales" || tab === "Purchases") {
      downloadCsv(
        `farmcraft-${tab.toLowerCase()}-report.${suffix}`,
        ["Order ID", "Purchase Code", "Customer", "Product", "Qty", "Amount", "Payment", "Date", "Status"],
        filteredOrders.map((o) => [o.id, o.purchaseCode, o.customer, o.product, o.quantity, o.amount, o.payment, o.date, o.status])
      );
    } else if (tab === "Customers") {
      downloadCsv(
        `farmcraft-customers-report.${suffix}`,
        ["Customer ID", "Name", "Email", "Mobile", "Orders", "Total Spent", "Status"],
        customers.map((c) => [c.id, c.name, c.email, c.phone, c.totalOrders, c.totalSpent, c.status])
      );
    } else if (tab === "Product Performance") {
      downloadCsv(
        `farmcraft-product-performance.${suffix}`,
        ["Product", "Units Sold", "Revenue"],
        productPerformance.map((p) => [p.product, p.units, p.revenue])
      );
    } else if (tab === "Stock") {
      downloadCsv(
        `farmcraft-stock-report.${suffix}`,
        ["Product", "SKU", "Category", "Stock", "Status"],
        filteredProducts.map((p) => [p.name, p.sku, p.category, p.stock, stockLevel(p)])
      );
    }
    setExported(true);
    setTimeout(() => setExported(false), 2200);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-farm-charcoal-deep">Reports</h2>
          <p className="text-sm text-farm-charcoal/55">Sales, purchases and customer performance summary</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-farm-charcoal-deep hover:bg-farm-mist"
          >
            <Download size={16} /> {exported ? "Exported!" : "Export CSV"}
          </button>
          <button
            onClick={() => handleExport("excel")}
            className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-farm-charcoal-deep hover:bg-farm-mist"
          >
            <FileSpreadsheet size={16} /> Export Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              tab === t ? "bg-farm-green-700 text-white" : "border border-black/10 text-farm-charcoal/60 hover:bg-farm-mist"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-farm-charcoal/50">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:border-farm-green-600 focus:outline-none"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-farm-charcoal/50">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:border-farm-green-600 focus:outline-none"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-farm-charcoal/50">Product</label>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="appearance-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:border-farm-green-600 focus:outline-none"
          >
            {productNames.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-farm-charcoal/50">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm focus:border-farm-green-600 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {(tab === "Sales" || tab === "Purchases") && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs text-farm-charcoal/50">Total Revenue</p>
              <p className="mt-1 font-display text-2xl font-bold text-farm-charcoal-deep">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-farm-charcoal/50">Average Order Value</p>
              <p className="mt-1 font-display text-2xl font-bold text-farm-charcoal-deep">
                ₹{avgOrderValue.toLocaleString("en-IN")}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-farm-charcoal/50">Orders</p>
              <p className="mt-1 font-display text-2xl font-bold text-farm-charcoal-deep">{filteredOrders.length}</p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Revenue by Month" subtitle="Based on current filters" />
            <div className="h-80 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMonth} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebe6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7ebe6", fontSize: 12 }} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#1c6b3d" maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader title={tab === "Sales" ? "Sales" : "Purchases"} subtitle={`${filteredOrders.length} orders`} />
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                    <th className="px-5 py-3 font-medium">Order ID</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                      <td className="px-5 py-3 font-medium text-farm-charcoal-deep">{o.id}</td>
                      <td className="px-5 py-3 text-farm-charcoal/70">{o.customer}</td>
                      <td className="max-w-[220px] truncate px-5 py-3 text-farm-charcoal/70">{o.product}</td>
                      <td className="px-5 py-3 text-farm-charcoal-deep">₹{o.amount.toLocaleString("en-IN")}</td>
                      <td className="px-5 py-3 text-farm-charcoal/60">
                        {new Date(o.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-sm text-farm-charcoal/50">
                        No orders match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "Customers" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs text-farm-charcoal/50">Registered Customers</p>
              <p className="mt-1 font-display text-2xl font-bold text-farm-charcoal-deep">{customers.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-farm-charcoal/50">Active Customers</p>
              <p className="mt-1 font-display text-2xl font-bold text-farm-charcoal-deep">
                {customers.filter((c) => c.status === "Active").length}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-farm-charcoal/50">Avg. Spend / Customer</p>
              <p className="mt-1 font-display text-2xl font-bold text-farm-charcoal-deep">
                ₹{Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length).toLocaleString("en-IN")}
              </p>
            </Card>
          </div>
          <Card>
            <CardHeader title="New vs Returning Customers" subtitle="Last 6 months" />
            <div className="h-72 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerTrendData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ebe6" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7ebe6", fontSize: 12 }} />
                  <Legend />
                  <Line type="monotone" dataKey="newCustomers" name="New" stroke="#1c6b3d" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="returning" name="Returning" stroke="#4bad74" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {tab === "Product Performance" && (
        <Card>
          <CardHeader title="Product Performance" subtitle="Units sold and revenue, based on current filters" />
          {productPerformance.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-farm-charcoal/50">No sales data for this selection.</p>
          ) : (
            <>
              <div className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={productPerformance.slice(0, 8)} margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7ebe6" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="product" type="category" width={160} tick={{ fontSize: 11, fill: "#5b6660" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e7ebe6", fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 8, 8, 0]} fill="#4bad74" maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                      <th className="px-5 py-3 font-medium">Product</th>
                      <th className="px-5 py-3 font-medium">Units Sold</th>
                      <th className="px-5 py-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformance.map((p) => (
                      <tr key={p.product} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                        <td className="max-w-[280px] truncate px-5 py-3 font-medium text-farm-charcoal-deep">{p.product}</td>
                        <td className="px-5 py-3 text-farm-charcoal/70">{p.units}</td>
                        <td className="px-5 py-3 text-farm-charcoal-deep">₹{p.revenue.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      {tab === "Stock" && (
        <Card>
          <CardHeader title="Stock Report" subtitle={`${filteredProducts.length} products`} />
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                    <td className="max-w-[240px] truncate px-5 py-3 font-medium text-farm-charcoal-deep">{p.name}</td>
                    <td className="px-5 py-3 text-farm-charcoal/70">{p.sku}</td>
                    <td className="px-5 py-3 text-farm-charcoal/70">{p.category}</td>
                    <td className="px-5 py-3 text-farm-charcoal/70">{p.stock}</td>
                    <td className="px-5 py-3 text-farm-charcoal/70">{stockLevel(p)}</td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-farm-charcoal/50">
                      No products match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
