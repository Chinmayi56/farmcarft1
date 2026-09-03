import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; direction: "up" | "down" };
  accent?: "green" | "charcoal" | "amber" | "red";
}

const ACCENTS: Record<string, string> = {
  green: "bg-farm-green-50 text-farm-green-700",
  charcoal: "bg-farm-mist text-farm-charcoal-deep",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
};

export default function StatCard({ label, value, icon: Icon, trend, accent = "green" }: StatCardProps) {
  return (
    <div className="rounded-xl2 border border-black/5 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover sm:p-5">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${ACCENTS[accent]}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
              trend.direction === "up"
                ? "bg-farm-green-50 text-farm-green-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {trend.direction === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl font-bold text-farm-charcoal-deep sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-sm text-farm-charcoal/60">{label}</p>
    </div>
  );
}
