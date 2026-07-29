import { MessageStatus } from "@/types";
import { cn } from "@/lib/utils";

interface MessageStatusProps {
  status: MessageStatus;
  className?: string;
}

const configs: Record<MessageStatus, { label: string; className: string }> = {
  sent: { label: "Sent", className: "text-muted-foreground" },
  delivered: { label: "Delivered", className: "text-blue-400" },
  read: { label: "Read", className: "text-primary" },
  failed: { label: "Failed", className: "text-destructive" },
};

export function MessageStatusBadge({ status, className }: MessageStatusProps) {
  const config = configs[status];
  return (
    <span className={cn("text-xs font-medium", config.className, className)}>
      {status === "sent" && "✓"}
      {status === "delivered" && "✓✓"}
      {status === "read" && "✓✓"}
      {status === "failed" && "✗"}
    </span>
  );
}

export function MessageStatusDot({ status }: { status: MessageStatus }) {
  const colors: Record<MessageStatus, string> = {
    sent: "bg-muted-foreground",
    delivered: "bg-blue-400",
    read: "bg-primary",
    failed: "bg-destructive",
  };

  return (
    <span className={cn("inline-block w-2 h-2 rounded-full", colors[status])} title={status} />
  );
}
