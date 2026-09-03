import type { Offer } from "../types";
import { offers as seedOffers } from "./mockData";

const STORAGE_KEY = "farmcraft_offers";

export function loadOffers(): Offer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Offer[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fall through to reseed on any parse error
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedOffers));
  return seedOffers;
}

export function persistOffers(list: Offer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function generateOfferId(list: Offer[]): string {
  let max = 0;
  list.forEach((o) => {
    const match = o.id.match(/(\d+)$/);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  });
  return `FC-OFF-${String(max + 1).padStart(2, "0")}`;
}

export function formatDiscount(type: Offer["discountType"], value: number): string {
  return type === "Percentage" ? `${value}% OFF` : `₹${value.toLocaleString("en-IN")} OFF`;
}

export function computeOfferStatus(startDate: string, endDate: string, manual?: "Inactive"): Offer["status"] {
  if (manual === "Inactive") return "Inactive";
  const today = new Date().toISOString().slice(0, 10);
  if (today < startDate) return "Scheduled";
  if (today > endDate) return "Expired";
  return "Active";
}
