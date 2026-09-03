import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Mail, MessageSquareText, Phone } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import Toast, { type ToastState } from "../components/ui/Toast";
import { fetchContactMessage, updateContactMessageStatus } from "../data/contactApi";
import { ApiError } from "../lib/apiClient";
import type { ContactMessage, ContactMessageStatus } from "../types";

const STATUS_OPTIONS: ContactMessageStatus[] = ["New", "Read", "Replied"];

export default function ContactMessageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contactMessage, setContactMessage] = useState<ContactMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchContactMessage(id)
      .then((data) => {
        if (!cancelled) setContactMessage(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load this enquiry.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleStatusChange = async (status: ContactMessageStatus) => {
    if (!contactMessage || status === contactMessage.status) return;
    setIsUpdating(true);
    try {
      const updated = await updateContactMessageStatus(contactMessage.id, status);
      setContactMessage(updated);
      setToast({ message: `Status updated to ${status}`, variant: "success" });
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : "Could not update the status.",
        variant: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl2 bg-farm-mist" />;
  }

  if (error || !contactMessage) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-farm-charcoal/60">{error ?? "Enquiry not found."}</p>
        <Link to="/admin/contact-messages" className="mt-3 inline-block text-sm font-medium text-farm-green-700">
          Back to Contact Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        onClick={() => navigate("/admin/contact-messages")}
        className="flex items-center gap-1.5 text-sm font-medium text-farm-charcoal/60 hover:text-farm-charcoal-deep"
      >
        <ArrowLeft size={15} /> Back to Contact Messages
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-farm-green-700 text-xl font-semibold text-white">
              {contactMessage.name.charAt(0)}
            </div>
            <h2 className="mt-3 font-display text-lg font-bold text-farm-charcoal-deep">{contactMessage.name}</h2>
            <div className="mt-1">
              <StatusBadge status={contactMessage.status} />
            </div>
          </div>

          <div className="mt-5 space-y-3 border-t border-black/5 pt-5 text-sm">
            <a
              href={`mailto:${contactMessage.email}`}
              className="flex items-center gap-2.5 text-farm-charcoal/70 hover:text-farm-green-700"
            >
              <Mail size={15} className="shrink-0 text-farm-charcoal/40" /> {contactMessage.email}
            </a>
            <a
              href={`tel:${contactMessage.phone}`}
              className="flex items-center gap-2.5 text-farm-charcoal/70 hover:text-farm-green-700"
            >
              <Phone size={15} className="shrink-0 text-farm-charcoal/40" /> {contactMessage.phone}
            </a>
            <div className="flex items-center gap-2.5 text-farm-charcoal/70">
              <Calendar size={15} className="shrink-0 text-farm-charcoal/40" />
              {new Date(contactMessage.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          <div className="mt-5 border-t border-black/5 pt-5">
            <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Status</label>
            <select
              value={contactMessage.status}
              disabled={isUpdating}
              onChange={(e) => handleStatusChange(e.target.value as ContactMessageStatus)}
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100 disabled:opacity-60"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Enquiry Message"
              subtitle={`Submitted ${new Date(contactMessage.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}`}
            />
            <div className="flex gap-3 p-5">
              <MessageSquareText size={18} className="mt-0.5 shrink-0 text-farm-charcoal/40" />
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-farm-charcoal-deep">
                {contactMessage.message}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
