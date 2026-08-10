import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "border-border bg-muted text-foreground",
        success: "border-[var(--a-homebd)] bg-[var(--a-homebg)] text-[var(--a-home)]",
        warning: "border-[var(--a-hcp4bd)] bg-[var(--a-hcp4bg)] text-[var(--a-hcp4)]",
        destructive: "border-[var(--a-emsbd)] bg-[var(--a-emsbg)] text-[var(--a-ems)]"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
