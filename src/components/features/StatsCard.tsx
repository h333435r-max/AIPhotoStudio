import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  color: "cyan" | "blue" | "green" | "purple";
  className?: string;
}

const colorMap = {
  cyan: {
    icon: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    glow: "shadow-cyan-500/10",
    value: "text-cyan-400",
  },
  blue: {
    icon: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/10",
    value: "text-blue-400",
  },
  green: {
    icon: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
    value: "text-emerald-400",
  },
  purple: {
    icon: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
    value: "text-violet-400",
  },
};

export default function StatsCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  className,
}: StatsCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={cn(
        "relative rounded-2xl border p-5 bg-white/5 backdrop-blur-sm shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl",
        c.border,
        c.glow,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
          <p className={cn("text-3xl font-bold", c.value)}>{value}</p>
          {subValue && (
            <p className="text-slate-500 text-xs mt-1">{subValue}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", c.bg)}>
          <Icon className={cn("w-6 h-6", c.icon)} />
        </div>
      </div>
    </div>
  );
}
