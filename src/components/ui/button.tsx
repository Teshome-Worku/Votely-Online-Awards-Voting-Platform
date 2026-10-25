import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a14] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white shadow-md shadow-violet-950/50 hover:bg-violet-500 hover:shadow-violet-800/40 border border-violet-500/30",
        primaryGlow:
          "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/25 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-600/40 border border-violet-400/30",
        secondary:
          "bg-slate-800/80 text-slate-100 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600",
        outline:
          "border border-violet-500/30 bg-transparent text-violet-200 hover:bg-violet-950/30 hover:border-violet-400/50 hover:text-white",
        ghost:
          "text-slate-300 hover:text-white hover:bg-slate-800/60",
        link:
          "text-violet-400 underline-offset-4 hover:underline hover:text-violet-300 p-0 h-auto",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
