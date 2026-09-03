import { useState, type FormEvent } from "react";
import { ImagePlus, Save, X } from "lucide-react";
import { Card, CardHeader } from "../ui/Card";
import type { Product } from "../../types";
import { filesToDataUrls } from "../../utils/fileToDataUrl";

const CATEGORY_OPTIONS = [
  "Grain Transfer",
  "Grain Handling",
  "Grain Collection",
  "Accessories",
  "Spares",
];

const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%25' height='100%25' fill='%23eef1ed'/></svg>";

export interface ProductFormValues {
  name: string;
  category: string;
  sku: string;
  description: string;
  price: string;
  discountPrice: string;
  stock: string;
  motor: string;
  capacity: string;
  length: string;
  height: string;
  pipeMaterial: string;
  screwMaterial: string;
  usage: string;
  features: string;
  applications: string;
  images: string[];
}

function toFormValues(product?: Product): ProductFormValues {
  return {
    name: product?.name ?? "",
    category: product?.category ?? CATEGORY_OPTIONS[0],
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    price: product?.price !== undefined ? String(product.price) : "",
    discountPrice: product?.discountPrice !== undefined ? String(product.discountPrice) : "",
    stock: product?.stock !== undefined ? String(product.stock) : "",
    motor: product?.motor ?? "",
    capacity: product?.capacity ?? "",
    length: product?.length ?? "",
    height: product?.height ?? "",
    pipeMaterial: product?.pipeMaterial ?? "",
    screwMaterial: product?.screwMaterial ?? "",
    usage: product?.usage ?? "",
    features: product?.features?.join(", ") ?? "",
    applications: product?.applications?.join(", ") ?? "",
    images: product?.images ?? (product?.image ? [product.image] : []),
  };
}

interface ProductFormProps {
  mode: "add" | "edit";
  initialProduct?: Product;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function ProductForm({ mode, initialProduct, onSubmit, onCancel, submitting }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(() => toFormValues(initialProduct));
  const [imageError, setImageError] = useState("");

  const update = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    try {
      const urls = await filesToDataUrls(fileList);
      setValues((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
      setImageError("");
    } catch {
      setImageError("Could not read one or more images. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    setValues((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <Card>
      <CardHeader
        title={mode === "add" ? "Add New Product" : "Edit Product"}
        subtitle={
          mode === "add"
            ? "Create a new listing for the Farm Craft catalog"
            : "Update details for this product"
        }
      />
      <form onSubmit={handleSubmit} className="space-y-6 p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Product Name</label>
            <input
              required
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Farm Craft Grain Transferring Pipe"
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Category</label>
            <select
              value={values.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">SKU</label>
            <input
              required
              value={values.sku}
              onChange={(e) => update("sku", e.target.value)}
              placeholder="FC-XXX-0000"
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Price (₹)</label>
            <input
              required
              type="number"
              min={0}
              value={values.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">
              Discount Price (₹) <span className="text-farm-charcoal/40">— optional</span>
            </label>
            <input
              type="number"
              min={0}
              value={values.discountPrice}
              onChange={(e) => update("discountPrice", e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Stock Quantity</label>
            <input
              required
              type="number"
              min={0}
              value={values.stock}
              onChange={(e) => update("stock", e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Description</label>
            <textarea
              rows={3}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Describe the product's build, use case and key specifications..."
              className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
            />
          </div>
        </div>

        <div className="border-t border-black/5 pt-5">
          <h4 className="mb-3 font-display text-sm font-semibold text-farm-charcoal-deep">Specifications</h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Motor</label>
              <input
                value={values.motor}
                onChange={(e) => update("motor", e.target.value)}
                placeholder="e.g. 5 HP to 16 HP"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Capacity</label>
              <input
                value={values.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                placeholder="e.g. 18 tons per hour"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Length</label>
              <input
                value={values.length}
                onChange={(e) => update("length", e.target.value)}
                placeholder="e.g. 30 feet to 500 feet"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Height</label>
              <input
                value={values.height}
                onChange={(e) => update("height", e.target.value)}
                placeholder="e.g. 20 feet"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Pipe Material</label>
              <input
                value={values.pipeMaterial}
                onChange={(e) => update("pipeMaterial", e.target.value)}
                placeholder="e.g. HDPE"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Screw Material</label>
              <input
                value={values.screwMaterial}
                onChange={(e) => update("screwMaterial", e.target.value)}
                placeholder="e.g. SS"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Usage</label>
              <input
                value={values.usage}
                onChange={(e) => update("usage", e.target.value)}
                placeholder="e.g. Transferring all types of grains and powders"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 pt-5">
          <h4 className="mb-3 font-display text-sm font-semibold text-farm-charcoal-deep">
            Features &amp; Applications
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">
                Features <span className="text-farm-charcoal/40">— comma separated</span>
              </label>
              <textarea
                rows={3}
                value={values.features}
                onChange={(e) => update("features", e.target.value)}
                placeholder="Heavy-duty grain transfer, Long-distance transfer, Multiple length options"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">
                Applications <span className="text-farm-charcoal/40">— comma separated</span>
              </label>
              <textarea
                rows={3}
                value={values.applications}
                onChange={(e) => update("applications", e.target.value)}
                placeholder="Rice, Corn, Wheat, Soybean"
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-farm-green-600 focus:outline-none focus:ring-2 focus:ring-farm-green-100"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 pt-5">
          <label className="mb-1.5 block text-sm font-medium text-farm-charcoal-deep">Product Images</label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 bg-farm-mist/40 py-8 text-center hover:bg-farm-mist/70">
            <ImagePlus size={22} className="text-farm-charcoal/40" />
            <span className="text-sm text-farm-charcoal/55">Click to upload, or drag and drop</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />
          </label>
          {imageError && <p className="mt-2 text-xs text-red-600">{imageError}</p>}

          {values.images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {values.images.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-farm-mist">
                  <img
                    src={src || PLACEHOLDER_IMAGE}
                    alt={`Product ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-black/5 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-farm-charcoal-deep hover:bg-farm-mist"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-farm-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-farm-green-800 disabled:opacity-60"
          >
            <Save size={16} /> {submitting ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </Card>
  );
}
