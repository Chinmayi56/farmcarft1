import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Mail, MailOpen, MessageSquareText, Search } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import { fetchContactMessages } from "../data/contactApi";
import { ApiError } from "../lib/apiClient";
import type { ContactMessage } from "../types";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ContactMessages() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchContactMessages()
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load contact enquiries.");
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
      messages.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.email.toLowerCase().includes(query.toLowerCase()) ||
          m.phone.toLowerCase().includes(query.toLowerCase())
      ),
    [messages, query]
  );

  const total = messages.length;
  const newCount = messages.filter((m) => m.status === "New").length;
  const readCount = messages.filter((m) => m.status === "Read").length;
  const repliedCount = messages.filter((m) => m.status === "Replied").length;

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
        <h2 className="font-display text-lg font-bold text-farm-charcoal-deep">Contact Messages</h2>
        <p className="text-sm text-farm-charcoal/55">{total} customer enquiries submitted via the website</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Enquiries" value={total} icon={Inbox} accent="charcoal" />
        <StatCard label="New" value={newCount} icon={Mail} accent="green" />
        <StatCard label="Read" value={readCount} icon={MailOpen} accent="amber" />
        <StatCard label="Replied" value={repliedCount} icon={MessageSquareText} accent="green" />
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-farm-charcoal/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
        />
      </div>

      <Card>
        <CardHeader title="All Enquiries" subtitle={`${filtered.length} of ${messages.length}`} />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Message</th>
                <th className="px-5 py-3 font-medium">Received</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                  <td className="px-5 py-3">
                    <Link to={`/admin/contact-messages/${m.id}`} className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-farm-green-700 text-xs font-semibold text-white">
                        {m.name.charAt(0)}
                      </div>
                      <span className="font-medium text-farm-charcoal-deep hover:text-farm-green-700">
                        {m.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-farm-charcoal/70">{m.email}</td>
                  <td className="px-5 py-3 text-farm-charcoal/70">{m.phone}</td>
                  <td className="max-w-[220px] truncate px-5 py-3 text-farm-charcoal/70">{m.message}</td>
                  <td className="px-5 py-3 text-farm-charcoal/60">{formatDateTime(m.createdAt)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/admin/contact-messages/${m.id}`}
                      className="text-xs font-semibold text-farm-green-700 hover:text-farm-green-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <Inbox size={28} className="mx-auto mb-2 text-farm-charcoal/25" />
                    <p className="text-sm font-medium text-farm-charcoal/60">No contact enquiries found</p>
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
