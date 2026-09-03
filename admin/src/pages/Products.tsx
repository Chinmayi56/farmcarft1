import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, Package, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Toast, { type ToastState } from "../components/ui/Toast";
import type { Product } from "../types";
import { fetchProducts, deleteProduct, productStatusLabel } from "../data/productApi";
import { ApiError } from "../lib/apiClient";

type StockFilter = "All" | "In Stock" | "Low Stock" | "Out of Stock";

const STOCK_FILTERS: StockFilter[] = ["All", "In Stock", "Low Stock", "Out of Stock"];

function matchesStockFilter(product: Product, filter: StockFilter): boolean {
  if (filter === "All") return true;
  if (filter === "Out of Stock") return product.stock <= 0;
  if (filter === "Low Stock") return product.stock > 0 && product.stock <= product.threshold;
  return product.stock > product.threshold;
}

export default function Products() {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState<StockFilter>("All");
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof ApiError ? err.message : "Could not load products.";
          setToast({ message, variant: "error" });
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Show a toast carried over via navigation state (e.g. after add/edit) then clear it.
  useEffect(() => {
    const state = location.state as { toast?: string } | null;
    if (state?.toast) {
      setToast({ message: state.toast, variant: "success" });
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchesCategory = category === "All" || p.category === category;
      return matchesQuery && matchesCategory && matchesStockFilter(p, stockFilter);
    });
  }, [products, query, category, stockFilter]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteProduct(target.id);
      setProducts((prev) => prev.filter((p) => p.id !== target.id));
      setToast({ message: `"${target.name}" was deleted`, variant: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not delete product.";
      setToast({ message, variant: "error" });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-farm-charcoal-deep">Products</h2>
          <p className="text-sm text-farm-charcoal/55">
            {isLoading ? "Loading products..." : `${filtered.length} of ${products.length} products`}
          </p>
        </div>
        <Link
          to="/admin/products/add"
          className="flex items-center justify-center gap-2 rounded-xl bg-farm-green-700 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-farm-green-800"
        >
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-farm-charcoal/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
          />
        </div>
        <div className="relative">
          <SlidersHorizontal size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-farm-charcoal/40" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full appearance-none rounded-xl border border-black/10 bg-white py-2.5 pl-9 pr-8 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100 sm:w-48"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <Package size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-farm-charcoal/40" />
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            className="w-full appearance-none rounded-xl border border-black/10 bg-white py-2.5 pl-9 pr-8 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100 sm:w-44"
          >
            {STOCK_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase tracking-wide text-farm-charcoal/45">
                <th className="px-5 py-3 font-medium">Image</th>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">SKU</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-3" colSpan={8}>
                      <div className="h-10 w-full animate-pulse rounded-lg bg-farm-mist" />
                    </td>
                  </tr>
                ))}

              {!isLoading &&
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-farm-mist/40">
                    <td className="px-5 py-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-farm-mist">
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                      </div>
                    </td>
                    <td className="max-w-[260px] px-5 py-3">
                      <Link
                        to={`/admin/products/${p.id}`}
                        className="line-clamp-2 font-medium text-farm-charcoal-deep hover:text-farm-green-700"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-farm-charcoal/70">{p.category}</td>
                    <td className="px-5 py-3 text-farm-charcoal/70">{p.sku}</td>
                    <td className="px-5 py-3 font-medium text-farm-charcoal-deep">
                      ₹{p.price.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-farm-charcoal/70">{p.stock}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={productStatusLabel(p.status)} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/admin/products/${p.id}`}
                          className="rounded-lg p-1.5 text-farm-charcoal/50 hover:bg-farm-mist hover:text-farm-charcoal-deep"
                          aria-label="View product"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="rounded-lg p-1.5 text-farm-charcoal/50 hover:bg-farm-mist hover:text-farm-charcoal-deep"
                          aria-label="Edit product"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          onClick={() => setPendingDelete(p)}
                          className="rounded-lg p-1.5 text-farm-charcoal/50 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Package size={28} className="mx-auto mb-2 text-farm-charcoal/25" />
                    <p className="text-sm font-medium text-farm-charcoal/60">No products found</p>
                    <p className="mt-1 text-xs text-farm-charcoal/40">
                      Try adjusting your search or filters.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete product"
        message={`Are you sure you want to delete "${pendingDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
