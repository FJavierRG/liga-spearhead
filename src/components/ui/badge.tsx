import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)]",
        success:
          "border-[#3d6b45] bg-[#1a2e1c] text-[#8ecf98]",
        warning:
          "border-[#8b6428] bg-[#2a2010] text-[#e8b85a]",
        danger:
          "border-[#7a3530] bg-[#2a1412] text-[#e88880]",
        info:
          "border-[var(--border-light)] bg-[var(--accent-dim)] text-[var(--accent-hover)]",
        outline: "border-[var(--border)] text-[var(--muted)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
