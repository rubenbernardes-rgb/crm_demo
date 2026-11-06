import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        blue: "border-transparent bg-brand-blue/10 text-brand-blueInk",
        purple: "border-transparent bg-brand-purple/10 text-brand-purpleInk",
        amber: "border-transparent bg-brand-amber/15 text-brand-amberInk",
        green: "border-transparent bg-brand-green/10 text-brand-greenInk",
        red: "border-transparent bg-brand-red/10 text-brand-redInk",
        slate: "border-transparent bg-foreground/10 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export { Badge, badgeVariants };
