import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...rest }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-sm outline-none transition-all",
              icon && "pl-9",
              className,
            )}
            style={{
              background: "var(--bg-elevated)",
              border: error ? "1px solid var(--danger)" : "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--border-accent)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-muted)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
            {...rest}
          />
        </div>
        {error && (
          <span className="text-xs" style={{ color: "var(--danger)" }}>
            {error}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...rest }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={3}
        className={cn("w-full rounded-lg px-3 py-2 text-sm outline-none resize-none transition-all", className)}
        style={{
          background: "var(--bg-elevated)",
          border: error ? "1px solid var(--danger)" : "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
        {...rest}
      />
      {error && <span className="text-xs" style={{ color: "var(--danger)" }}>{error}</span>}
    </div>
  ),
);
Textarea.displayName = "Textarea";
