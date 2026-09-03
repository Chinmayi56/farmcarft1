// Admin Contact Messages / Customer Enquiries data layer — Prompt 2.
//
// Talks to the real FastAPI contact endpoints (JWT + ADMIN role required
// on every route, enforced server-side via the existing `require_admin`
// dependency — see backend/app/routers/contact.py):
//   GET   /api/admin/contact-messages
//   GET   /api/admin/contact-messages/{id}
//   PATCH /api/admin/contact-messages/{id}
import { apiRequest } from "../lib/apiClient";
import type { ContactMessage, ContactMessageStatus } from "../types";

interface ApiContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: ContactMessageStatus;
  created_at: string;
  updated_at: string;
}

function toContactMessage(api: ApiContactMessage): ContactMessage {
  return {
    id: api.id,
    name: api.name,
    email: api.email,
    phone: api.phone,
    message: api.message,
    status: api.status,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

/** GET /api/admin/contact-messages (ADMIN only) */
export async function fetchContactMessages(): Promise<ContactMessage[]> {
  const data = await apiRequest<ApiContactMessage[]>("/admin/contact-messages");
  return data.map(toContactMessage);
}

/** GET /api/admin/contact-messages/{id} (ADMIN only) */
export async function fetchContactMessage(id: string): Promise<ContactMessage> {
  const data = await apiRequest<ApiContactMessage>(`/admin/contact-messages/${id}`);
  return toContactMessage(data);
}

/** PATCH /api/admin/contact-messages/{id} (ADMIN only) */
export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus
): Promise<ContactMessage> {
  const data = await apiRequest<ApiContactMessage>(`/admin/contact-messages/${id}`, {
    method: "PATCH",
    body: { status },
  });
  return toContactMessage(data);
}
