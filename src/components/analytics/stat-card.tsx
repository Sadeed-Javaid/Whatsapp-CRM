import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "info" | "danger";
  className?: string;
}

const variants = {
  default: "bg-muted/50 text-muted-foreground",
  success: "bg-primary/10 text-primary",
  info: "bg-blue-500/10 text-blue-500",
  danger: "bg-destructive/10 text-destructive",
};

export function StatCard({ label, value, icon: Icon, variant = "default", className }: StatCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl p-5 flex flex-col gap-4", className)}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", variants[variant])}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}
