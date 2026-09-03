import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export interface ToastState {
  message: string;
  variant?: "success" | "error";
}

interface ToastProps extends ToastState {
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, variant = "success", onClose, duration = 2600 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = variant === "success";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 sm:justify-end sm:px-6">
      <div
        className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-card-hover animate-fade-in ${
          isSuccess
            ? "border-farm-green-200 bg-white text-farm-charcoal-deep"
            : "border-red-200 bg-white text-farm-charcoal-deep"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 size={17} className="text-farm-green-600" />
        ) : (
          <XCircle size={17} className="text-red-600" />
        )}
        {message}
      </div>
    </div>
  );
}
