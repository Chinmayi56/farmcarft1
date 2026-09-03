import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl2 border border-black/5 bg-white shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-farm-charcoal-deep sm:text-base">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-xs text-farm-charcoal/50">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
