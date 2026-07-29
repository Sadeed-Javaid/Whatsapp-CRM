import { cn } from "@/lib/utils";
import { CampaignStatus } from "@/types";

const configs = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  running: { label: "Running", className: "bg-blue-500/10 text-blue-500" },
  completed: { label: "Completed", className: "bg-primary/10 text-primary" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const config = configs[status];
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}
