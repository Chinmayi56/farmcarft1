import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingBag, UserCheck, UserPlus, Users } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import { fetchCustomers } from "../data/customerApi";
import { ApiError } from "../lib/apiClient";
import type { Customer } from "../types";

export default function Customers() {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchCustomers()
      .then((data) => {
        if (!cancelled) setCustomers(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load customers.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.email.toLowerCase().includes(query.toLowerCase()) ||
          c.location.toLowerCase().includes(query.toLowerCase())
      ),
    [customers, query]
  );

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "Active").length;
  const purchasingCustomers = customers.filter((c) => c.totalOrders > 0).length;
  const newCustomers = customers.filter((c) => {
    const joined = new Date(c.joinedAt).getTime();
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    return joined >= ninetyDaysAgo;
  }).length;

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl2 bg-farm-mist" />;
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-display text-lg font-bold text-farm-charcoal-deep">Customers</h2>
        <p className="text-sm text-farm-charcoal/55">{customers.length} registered customers</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Customers" value={totalCustomers} icon={Users} accent="green" />
        <StatCard label="New Customers" value={newCustomers} icon={UserPlus} accent="charcoal" />
        <StatCard label="Active Customers" value={activeCustomers} icon={UserCheck} accent="amber" />
        <StatCard label="Purchasing Customers" value={purchasingCustomers} icon={ShoppingBag} accent="green" />
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-farm-charcoal/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or location..."
          className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
        />
      </div>

      <Card>
        <CardHeader title="All Customers" subtitle={`${filtered.length} of ${customers.length}`} />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Mobile</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Total Purchase</th>
                <th className="px-5 py-3 font-medium">Last Purchase</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                  <td className="px-5 py-3">
                    <Link to={`/admin/customers/${c.id}`} className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-farm-green-700 text-xs font-semibold text-white">
                        {c.name.charAt(0)}
                      </div>
                      <span className="font-medium text-farm-charcoal-deep hover:text-farm-green-700">
                        {c.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-farm-charcoal/70">{c.email}</td>
                  <td className="px-5 py-3 text-farm-charcoal/70">{c.phone}</td>
                  <td className="px-5 py-3 text-farm-charcoal/70">{c.totalOrders}</td>
                  <td className="px-5 py-3 font-medium text-farm-charcoal-deep">
                    ₹{c.totalSpent.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3 text-farm-charcoal/60">
                    {new Date(c.joinedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/admin/customers/${c.id}`}
                      className="text-xs font-semibold text-farm-green-700 hover:text-farm-green-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Users size={28} className="mx-auto mb-2 text-farm-charcoal/25" />
                    <p className="text-sm font-medium text-farm-charcoal/60">No customers found</p>
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
