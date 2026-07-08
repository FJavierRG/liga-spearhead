import { cn } from "@/lib/utils";

export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "font-display text-sm font-semibold uppercase tracking-[0.12em] text-[var(--accent)]",
        className
      )}
    >
      {children}
    </h2>
  );
}
