import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Power, PowerOff, Tag, Trash2 } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Toast, { type ToastState } from "../components/ui/Toast";
import { fetchProducts } from "../data/productApi";
import { computeOfferStatus, formatDiscount, generateOfferId, loadOffers, persistOffers } from "../data/offerStorage";
import type { DiscountType, Offer } from "../types";

interface OfferFormState {
  title: string;
  description: string;
  product: string;
  discountType: DiscountType;
  discountValue: string;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: OfferFormState = {
  title: "",
  description: "",
  product: "All Machinery",
  discountType: "Percentage",
  discountValue: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
};

export default function Offers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OfferFormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<Offer | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    setOffers(loadOffers());
    fetchProducts()
      .then((data) => setProducts(["All Machinery", ...data.map((p) => p.name)]))
      .catch(() => setProducts(["All Machinery"]));
  }, []);

  const persist = (next: Offer[]) => {
    setOffers(next);
    persistOffers(next);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingId(offer.id);
    setForm({
      title: offer.title,
      description: offer.description,
      product: offer.product,
      discountType: offer.discountType,
      discountValue: String(offer.discountValue),
      startDate: offer.startDate,
      endDate: offer.endDate,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.discountValue) return;
    const discountValue = Number(form.discountValue) || 0;
    const discount = formatDiscount(form.discountType, discountValue);
    const status = computeOfferStatus(form.startDate, form.endDate);

    if (editingId) {
      const next = offers.map((o) =>
        o.id === editingId
          ? {
              ...o,
              title: form.title.trim(),
              description: form.description.trim(),
              product: form.product,
              appliesTo: form.product,
              discountType: form.discountType,
              discountValue,
              discount,
              startDate: form.startDate,
              endDate: form.endDate,
              status: o.status === "Inactive" ? "Inactive" : status,
            }
          : o
      );
      persist(next);
      setToast({ message: "Offer updated", variant: "success" });
    } else {
      const id = generateOfferId(offers);
      const newOffer: Offer = {
        id,
        title: form.title.trim(),
        description: form.description.trim(),
        code: `${form.title.trim().slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "") || "OFFR"}${offers.length + 1}`,
        product: form.product,
        appliesTo: form.product,
        discountType: form.discountType,
        discountValue,
        discount,
        startDate: form.startDate,
        endDate: form.endDate,
        status,
        redemptions: 0,
      };
      persist([newOffer, ...offers]);
      setToast({ message: "Offer created", variant: "success" });
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    persist(offers.filter((o) => o.id !== pendingDelete.id));
    setToast({ message: "Offer deleted", variant: "success" });
    setPendingDelete(null);
  };

  const toggleActive = (offer: Offer) => {
    const next = offers.map((o) => {
      if (o.id !== offer.id) return o;
      if (o.status === "Inactive") {
        return { ...o, status: computeOfferStatus(o.startDate, o.endDate) };
      }
      return { ...o, status: "Inactive" as const };
    });
    persist(next);
    setToast({
      message: offer.status === "Inactive" ? "Offer activated" : "Offer deactivated",
      variant: "success",
    });
  };

  const sortedOffers = useMemo(() => offers, [offers]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-farm-charcoal-deep">Offers</h2>
          <p className="text-sm text-farm-charcoal/55">{offers.length} offers created</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-xl bg-farm-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-farm-green-800"
        >
          <Plus size={16} /> Create Offer
        </button>
      </div>

      {sortedOffers.length === 0 ? (
        <Card className="p-14 text-center">
          <Tag size={28} className="mx-auto mb-2 text-farm-charcoal/25" />
          <p className="text-sm font-medium text-farm-charcoal/60">No offers found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedOffers.map((offer) => (
            <Card key={offer.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="rounded-xl bg-farm-green-50 p-2.5 text-farm-green-700">
                  <Tag size={18} />
                </div>
                <StatusBadge status={offer.status} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-farm-charcoal-deep">{offer.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-farm-charcoal/55">{offer.description}</p>
              <p className="mt-2 font-display text-lg font-bold text-farm-green-700">{offer.discount}</p>
              <p className="mt-1 text-xs text-farm-charcoal/50">{offer.appliesTo}</p>

              <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3 text-xs text-farm-charcoal/55">
                <span className="rounded-md bg-farm-mist px-2 py-1 font-mono font-medium text-farm-charcoal-deep">
                  {offer.code}
                </span>
                <span>{offer.redemptions} redemptions</span>
              </div>
              <p className="mt-2 text-xs text-farm-charcoal/45">
                {new Date(offer.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} –{" "}
                {new Date(offer.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>

              <div className="mt-4 flex items-center gap-1.5 border-t border-black/5 pt-3">
                <button
                  onClick={() => openEdit(offer)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-farm-charcoal/60 hover:bg-farm-mist hover:text-farm-charcoal-deep"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => toggleActive(offer)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-farm-charcoal/60 hover:bg-farm-mist hover:text-farm-charcoal-deep"
                >
                  {offer.status === "Inactive" ? <Power size={13} /> : <PowerOff size={13} />}
                  {offer.status === "Inactive" ? "Activate" : "Deactivate"}
                </button>
                <button
                  onClick={() => setPendingDelete(offer)}
                  className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 bg-white p-5 shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-sm font-semibold text-farm-charcoal-deep">
              {editingId ? "Edit Offer" : "Create Offer"}
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Offer Name</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                  placeholder="e.g. Monsoon Machinery Offer"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Product</label>
                <select
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  className="w-full appearance-none rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                >
                  {products.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
                    className="w-full appearance-none rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                  >
                    <option value="Percentage">Percentage</option>
                    <option value="Flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Discount Value</label>
                  <input
                    type="number"
                    min={0}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                    placeholder={form.discountType === "Percentage" ? "10" : "5000"}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-farm-charcoal-deep hover:bg-farm-mist"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-xl bg-farm-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-farm-green-800"
              >
                {editingId ? "Save Changes" : "Create Offer"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete offer"
        message={`Are you sure you want to delete "${pendingDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
