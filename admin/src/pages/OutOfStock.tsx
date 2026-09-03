import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Eye, PackageCheck, RefreshCcw } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import Toast, { type ToastState } from "../components/ui/Toast";
import { fetchProducts, updateProduct, stockLevel, deriveStatus } from "../data/productApi";
import { addNotification } from "../data/notificationStorage";
import { ApiError } from "../lib/apiClient";
import type { Product } from "../types";

export default function OutOfStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof ApiError ? err.message : "Could not load products.";
          setToast({ message, variant: "error" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const lowOrOutOfStock = products.filter((p) => p.stock <= p.threshold);
  const outOfStock = lowOrOutOfStock.filter((p) => p.stock === 0).length;
  const lowStock = lowOrOutOfStock.filter((p) => p.stock > 0).length;

  const openEdit = (product: Product) => {
    setEditing(product);
    setNewStock(String(product.stock));
  };

  const handleSaveStock = async () => {
    if (!editing) return;
    const value = Math.max(0, parseInt(newStock, 10) || 0);
    setSaving(true);
    try {
      const updated = await updateProduct(editing.id, {
        stock: value,
        status: editing.status === "draft" ? "draft" : deriveStatus(value),
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

      // Notify only on a genuine transition into a state the admin needs
      // to act on — not on every stock edit — matching prior behaviour.
      const wasCritical = editing.stock <= editing.threshold;
      const nowOut = value <= 0;
      const nowLow = value > 0 && value <= editing.threshold;
      if ((nowOut || nowLow) && !wasCritical) {
        addNotification({
          type: "stock",
          title: nowOut ? "Out of stock" : "Low stock alert",
          message: `${editing.name} (${editing.sku}) is now at ${value} unit${value === 1 ? "" : "s"}.`,
        });
      }

      setEditing(null);
      setToast({ message: "Stock updated", variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not update stock.";
      setToast({ message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-farm-charcoal-deep">Out of Stock</h2>
          <p className="text-sm text-farm-charcoal/55">
            {outOfStock} out of stock · {lowStock} running low
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Stock Watchlist" subtitle="Products at or below their restock threshold" />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Current Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Stock Date</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {lowOrOutOfStock.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      <span className="max-w-[220px] truncate font-medium text-farm-charcoal-deep">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-farm-charcoal/70">{p.sku}</td>
                  <td className="px-5 py-3 text-farm-charcoal/70">{p.category}</td>
                  <td className="px-5 py-3 text-farm-charcoal/70">{p.stock}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={stockLevel(p)} />
                  </td>
                  <td className="px-5 py-3 text-farm-charcoal/60">
                    {p.lastStockDate
                      ? new Date(p.lastStockDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={`/admin/products/${p.id}`}
                        className="rounded-lg p-1.5 text-farm-charcoal/50 hover:bg-farm-mist hover:text-farm-charcoal-deep"
                        aria-label="View product"
                        title="View Product"
                      >
                        <Eye size={16} />
                      </Link>
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-1.5 text-farm-charcoal/50 hover:bg-farm-mist hover:text-farm-charcoal-deep"
                        aria-label="Update stock"
                        title="Update Stock"
                      >
                        <RefreshCcw size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {lowOrOutOfStock.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <PackageCheck size={28} className="mx-auto mb-2 text-farm-charcoal/25" />
                    <p className="text-sm font-medium text-farm-charcoal/60">No out-of-stock products</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl2 bg-white p-5 shadow-card-hover"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-sm font-semibold text-farm-charcoal-deep">Update Stock</h3>
            <p className="mt-1 text-sm text-farm-charcoal/60">{editing.name}</p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">New Stock Quantity</label>
              <input
                type="number"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-farm-charcoal-deep hover:bg-farm-mist"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveStock()}
                className="rounded-xl bg-farm-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-farm-green-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
