import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide",
  {
    variants: {
      domain: {
        Movie:
          "bg-domain-movie/15 text-domain-movie border border-domain-movie/30",
        History:
          "bg-domain-history/15 text-domain-history border border-domain-history/30",
        Novel:
          "bg-domain-novel/15 text-domain-novel border border-domain-novel/30",
      },
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, domain, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ domain, className }))}
      {...props}
    />
  ),
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
