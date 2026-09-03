export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Dispatched"
  | "Delivered"
  | "Cancelled";

export type PaymentMode = "UPI" | "Cash on Delivery" | "Card" | "Bank Transfer" | "Pay at Company";

export type PaymentStatus = "Paid" | "Unpaid" | "Refunded";

// How the customer chose to complete the order — NOT a payment gateway.
// "delivery" is the existing Cash on Delivery flow; "visit_company" means
// the customer visits the company in person to complete the purchase.
export type OrderMethod = "Cash on Delivery" | "Visit Company";

export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  threshold: number;
  image: string;
  images?: string[];
  description: string;
  // Must match the PostgreSQL `product_status` enum exactly (lowercase).
  status: "active" | "draft" | "out of stock";
  createdAt: string;
  lastStockDate?: string;
  // Optional technical specifications (agricultural machinery)
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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
  status: "Active" | "Inactive";
}

export interface Order {
  id: string;
  purchaseCode: string;
  customer: string;
  customerId: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  product: string;
  sku: string;
  quantity: number;
  orderMethod: OrderMethod;
  payment: PaymentMode;
  paymentStatus: PaymentStatus;
  price: number;
  amount: number;
  date: string;
  status: OrderStatus;
}

// Must match the PostgreSQL `contact_message_status` enum exactly.
export type ContactMessageStatus = "New" | "Read" | "Replied";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export type DiscountType = "Percentage" | "Flat";

export interface Offer {
  id: string;
  title: string;
  description: string;
  code: string;
  product: string;
  discountType: DiscountType;
  discountValue: number;
  discount: string;
  appliesTo: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Scheduled" | "Expired" | "Inactive";
  redemptions: number;
}
