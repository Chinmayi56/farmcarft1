// Admin Products data layer — Backend Step 5B.
//
// Talks to the real FastAPI Product endpoints instead of mock data /
// localStorage:
//   POST   /api/products
//   GET    /api/products
//   GET    /api/products/{id}
//   PUT    /api/products/{id}
//   DELETE /api/products/{id}
//
// Note on `threshold` / `lastStockDate`: the Product entity on the backend
// (Backend Step 5A) intentionally does not store a low-stock `threshold` —
// that belongs to a later Stock Management step and is out of scope here.
// To keep the existing Products / Out of Stock / Reports UI working without
// redesigning it, every product is given the same sensible default
// threshold on the client. `lastStockDate` is derived from the server's
// `updated_at` timestamp, which does change on every stock edit.
import { apiRequest } from "../lib/apiClient";
import type { Product } from "../types";

const DEFAULT_THRESHOLD = 5;

// Lightweight inline placeholder used only for display when a product has
// no image — never sent to the API, never stored as product data.
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%25' height='100%25' fill='%23eef1ed'/></svg>";

// --- Backend <-> Frontend shape mapping -----------------------------------

interface ApiProduct {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number | string;
  discount_price: number | string | null;
  stock: number;
  description: string | null;
  status: Product["status"];
  image: string | null;
  images: string[] | null;
  motor: string | null;
  capacity: string | null;
  length: string | null;
  height: string | null;
  pipe_material: string | null;
  screw_material: string | null;
  usage: string | null;
  features: string[] | null;
  applications: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ApiProductList {
  total: number;
  items: ApiProduct[];
}

export interface ProductInput {
  name: string;
  category: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  description: string;
  status: Product["status"];
  image?: string;
  images?: string[];
  motor?: string;
  capacity?: string;
  length?: string;
  height?: string;
  pipeMaterial?: string;
  screwMaterial?: string;
  usage?: string;
  features?: string[];
  applications?: string[];
}

function toProduct(api: ApiProduct): Product {
  return {
    id: api.id,
    name: api.name,
    category: api.category,
    sku: api.sku,
    price: Number(api.price),
    discountPrice: api.discount_price !== null ? Number(api.discount_price) : undefined,
    stock: api.stock,
    threshold: DEFAULT_THRESHOLD,
    image: api.image || PLACEHOLDER_IMAGE,
    images: api.images && api.images.length > 0 ? api.images : undefined,
    description: api.description ?? "",
    status: api.status,
    createdAt: api.created_at.slice(0, 10),
    lastStockDate: api.updated_at.slice(0, 10),
    motor: api.motor ?? undefined,
    capacity: api.capacity ?? undefined,
    length: api.length ?? undefined,
    height: api.height ?? undefined,
    pipeMaterial: api.pipe_material ?? undefined,
    screwMaterial: api.screw_material ?? undefined,
    usage: api.usage ?? undefined,
    features: api.features ?? undefined,
    applications: api.applications ?? undefined,
  };
}

function toApiPayload(input: Partial<ProductInput>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.category !== undefined) payload.category = input.category;
  if (input.sku !== undefined) payload.sku = input.sku;
  if (input.price !== undefined) payload.price = input.price;
  if (input.discountPrice !== undefined) payload.discount_price = input.discountPrice;
  if (input.stock !== undefined) payload.stock = input.stock;
  if (input.description !== undefined) payload.description = input.description;
  if (input.status !== undefined) payload.status = input.status;
  if (input.image !== undefined) payload.image = input.image;
  if (input.images !== undefined) payload.images = input.images;
  if (input.motor !== undefined) payload.motor = input.motor;
  if (input.capacity !== undefined) payload.capacity = input.capacity;
  if (input.length !== undefined) payload.length = input.length;
  if (input.height !== undefined) payload.height = input.height;
  if (input.pipeMaterial !== undefined) payload.pipe_material = input.pipeMaterial;
  if (input.screwMaterial !== undefined) payload.screw_material = input.screwMaterial;
  if (input.usage !== undefined) payload.usage = input.usage;
  if (input.features !== undefined) payload.features = input.features;
  if (input.applications !== undefined) payload.applications = input.applications;
  return payload;
}

// --- API calls --------------------------------------------------------------

/** GET /api/products — fetches the full catalog (single page, admin-sized). */
export async function fetchProducts(params?: { search?: string; category?: string }): Promise<Product[]> {
  const data = await apiRequest<ApiProductList>("/products", {
    query: { limit: 200, search: params?.search, category: params?.category },
  });
  return data.items.map(toProduct);
}

/** GET /api/products/{id} */
export async function fetchProduct(id: string): Promise<Product> {
  const data = await apiRequest<ApiProduct>(`/products/${id}`);
  return toProduct(data);
}

/** POST /api/products (ADMIN only) */
export async function createProduct(input: ProductInput): Promise<Product> {
  const data = await apiRequest<ApiProduct>("/products", {
    method: "POST",
    body: toApiPayload(input),
  });
  return toProduct(data);
}

/** PUT /api/products/{id} (ADMIN only, partial update) */
export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const data = await apiRequest<ApiProduct>(`/products/${id}`, {
    method: "PUT",
    body: toApiPayload(input),
  });
  return toProduct(data);
}

/** DELETE /api/products/{id} (ADMIN only) */
export async function deleteProduct(id: string): Promise<void> {
  await apiRequest<void>(`/products/${id}`, { method: "DELETE" });
}

// --- Pure helpers (no persistence) ------------------------------------------

export function deriveStatus(stock: number, keepDraft?: boolean): Product["status"] {
  if (keepDraft) return "draft";
  return stock <= 0 ? "out of stock" : "active";
}

// Human-readable label for a product's raw (lowercase, DB-matching)
// status value — for display only, e.g. in <StatusBadge />. Never send
// this label back to the API; always send the raw Product["status"] value.
const STATUS_LABELS: Record<Product["status"], string> = {
  active: "Active",
  draft: "Draft",
  "out of stock": "Out of Stock",
};

export function productStatusLabel(status: Product["status"]): string {
  return STATUS_LABELS[status] ?? status;
}

export function stockLevel(product: Product): "In Stock" | "Low Stock" | "Out of Stock" {
  if (product.stock <= 0) return "Out of Stock";
  if (product.stock <= product.threshold) return "Low Stock";
  return "In Stock";
}
