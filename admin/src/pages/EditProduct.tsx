import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProductForm, { type ProductFormValues } from "../components/products/ProductForm";
import type { Product } from "../types";
import { fetchProduct, updateProduct, deriveStatus } from "../data/productApi";
import { ApiError } from "../lib/apiClient";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    fetchProduct(id)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-xl2 bg-farm-mist" />;
  }

  if (notFound || !product) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-farm-charcoal/60">Product not found.</p>
        <Link to="/admin/products" className="mt-3 inline-block text-sm font-medium text-farm-green-700">
          Back to Products
        </Link>
      </div>
    );
  }

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    setError("");
    const stock = Number(values.stock) || 0;

    try {
      await updateProduct(product.id, {
        name: values.name.trim(),
        category: values.category,
        sku: values.sku.trim(),
        price: Number(values.price) || 0,
        discountPrice: values.discountPrice ? Number(values.discountPrice) : undefined,
        stock,
        image: values.images[0] || undefined,
        images: values.images.length > 0 ? values.images : undefined,
        description: values.description.trim(),
        status: product.status === "draft" ? "draft" : deriveStatus(stock),
        motor: values.motor.trim() || undefined,
        capacity: values.capacity.trim() || undefined,
        length: values.length.trim() || undefined,
        height: values.height.trim() || undefined,
        pipeMaterial: values.pipeMaterial.trim() || undefined,
        screwMaterial: values.screwMaterial.trim() || undefined,
        usage: values.usage.trim() || undefined,
        features: splitList(values.features),
        applications: splitList(values.applications),
      });
      navigate(`/admin/products/${product.id}`, { state: { toast: "Product updated successfully" } });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not update product.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fade-in">
      <button
        onClick={() => navigate(`/admin/products/${product.id}`)}
        className="flex items-center gap-1.5 text-sm font-medium text-farm-charcoal/60 hover:text-farm-charcoal-deep"
      >
        <ArrowLeft size={15} /> Back to Product
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
      )}

      <ProductForm
        mode="edit"
        initialProduct={product}
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => navigate(`/admin/products/${product.id}`)}
        submitting={submitting}
      />
    </div>
  );
}
