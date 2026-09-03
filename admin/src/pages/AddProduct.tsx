import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ProductForm, { type ProductFormValues } from "../components/products/ProductForm";
import { createProduct, deriveStatus } from "../data/productApi";
import { ApiError } from "../lib/apiClient";

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default function AddProduct() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    setError("");
    const stock = Number(values.stock) || 0;

    try {
      await createProduct({
        name: values.name.trim(),
        category: values.category,
        sku: values.sku.trim(),
        price: Number(values.price) || 0,
        discountPrice: values.discountPrice ? Number(values.discountPrice) : undefined,
        stock,
        image: values.images[0] || undefined,
        images: values.images.length > 0 ? values.images : undefined,
        description: values.description.trim(),
        status: deriveStatus(stock),
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
      navigate("/admin/products", { state: { toast: "Product added successfully" } });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not create product.";
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 animate-fade-in">
      <button
        onClick={() => navigate("/admin/products")}
        className="flex items-center gap-1.5 text-sm font-medium text-farm-charcoal/60 hover:text-farm-charcoal-deep"
      >
        <ArrowLeft size={15} /> Back to Products
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
      )}

      <ProductForm
        mode="add"
        onSubmit={(values) => void handleSubmit(values)}
        onCancel={() => navigate("/admin/products")}
        submitting={submitting}
      />
    </div>
  );
}
