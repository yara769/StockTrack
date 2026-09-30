"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

// O-01 fix: cap stagger at 300 ms so 100-row tables don't take 3 s to animate
const MAX_STAGGER_DELAY = 0.3;

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = "id" as keyof T,
  onRowClick,
  emptyMessage = "No records found",
}: TableProps<T>) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr
              style={{
                background: "var(--bg-elevated)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide",
                    col.className,
                  )}
                  style={{ color: "var(--text-muted)" }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm"
                  style={{
                    color: "var(--text-muted)",
                    background: "var(--bg-surface)",
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <motion.tr
                  key={String(row[keyField] ?? idx)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    // O-01: cap total stagger so large tables stay snappy
                    delay: Math.min(idx * 0.03, MAX_STAGGER_DELAY),
                    duration: 0.2,
                  }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(onRowClick && "cursor-pointer")}
                  style={{
                    background: "var(--bg-surface)",
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--bg-elevated)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "var(--bg-surface)")
                  }
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn("px-4 py-3", col.className)}
                      style={{ color: "var(--text-primary)" }}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key as keyof T] ?? "—")}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
