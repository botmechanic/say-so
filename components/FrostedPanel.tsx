import type { ReactNode } from "react";

type FrostedPanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

/** Shared frosted-glass shell for build stream and proof panels. */
export function FrostedPanel({
  title,
  subtitle,
  children,
  className = "",
}: FrostedPanelProps) {
  return (
    <div
      className={`flex h-full min-h-[420px] flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 shadow-[0_8px_40px_rgba(0,0,0,0.28)] backdrop-blur-md ${className}`}
    >
      <header className="mb-4 flex shrink-0 items-baseline gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate/90">
          {title}
        </span>
        {subtitle && (
          <span className="text-[11px] font-medium text-slate/60">{subtitle}</span>
        )}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
