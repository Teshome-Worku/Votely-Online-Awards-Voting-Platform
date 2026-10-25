import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-violet-500/30 bg-violet-500/10 text-violet-300 backdrop-blur-sm",
        secondary:
          "border-slate-700 bg-slate-800/60 text-slate-300",
        outline:
          "border-slate-700 text-slate-300",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-300",
        live:
          "border-emerald-500/40 bg-emerald-950/40 text-emerald-300 shadow-sm shadow-emerald-900/30",
        glow:
          "border-violet-400/40 bg-violet-950/50 text-violet-200 shadow-sm shadow-violet-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
