const STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  Processing: "bg-violet-50 text-violet-700 ring-violet-200",
  Dispatched: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Delivered: "bg-farm-green-50 text-farm-green-700 ring-farm-green-200",
  Cancelled: "bg-red-50 text-red-600 ring-red-200",
  Active: "bg-farm-green-50 text-farm-green-700 ring-farm-green-200",
  Draft: "bg-gray-100 text-gray-600 ring-gray-200",
  "In Stock": "bg-farm-green-50 text-farm-green-700 ring-farm-green-200",
  "Low Stock": "bg-amber-50 text-amber-700 ring-amber-200",
  "Out of Stock": "bg-red-50 text-red-600 ring-red-200",
  Inactive: "bg-gray-100 text-gray-600 ring-gray-200",
  Scheduled: "bg-blue-50 text-blue-700 ring-blue-200",
  Expired: "bg-gray-100 text-gray-500 ring-gray-200",
  Paid: "bg-farm-green-50 text-farm-green-700 ring-farm-green-200",
  Unpaid: "bg-amber-50 text-amber-700 ring-amber-200",
  Refunded: "bg-gray-100 text-gray-600 ring-gray-200",
  // Contact Messages / Customer Enquiries statuses.
  New: "bg-blue-50 text-blue-700 ring-blue-200",
  Read: "bg-amber-50 text-amber-700 ring-amber-200",
  Replied: "bg-farm-green-50 text-farm-green-700 ring-farm-green-200",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        STYLES[status] ?? "bg-gray-100 text-gray-600 ring-gray-200"
      }`}
    >
      {status}
    </span>
  );
}
