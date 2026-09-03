// Admin Customers data layer.
//
// Talks to the real FastAPI Admin Customer endpoints instead of mock data:
//   GET /api/admin/customers
//   GET /api/admin/customers/{id}
//
// The backend already returns objects shaped exactly like the `Customer`
// type (see ../types), so no field mapping is needed here.
import { apiRequest } from "../lib/apiClient";
import type { Customer } from "../types";

export async function fetchCustomers(): Promise<Customer[]> {
  return apiRequest<Customer[]>("/admin/customers");
}

export async function fetchCustomer(id: string): Promise<Customer> {
  return apiRequest<Customer>(`/admin/customers/${encodeURIComponent(id)}`);
}
