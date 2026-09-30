import { PackageSearch } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No data yet",
  description = "Records will appear here once data is available.",
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: 64, height: 64, background: "var(--bg-elevated)", color: "var(--text-muted)" }}
      >
        {icon ?? <PackageSearch size={28} />}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{description}</p>
      </div>
      {action}
    </div>
  );
}
