"use client";

import { AlertTriangle } from "lucide-react";

interface RiskBadgeProps {
  risk: string;
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  if (!risk) return null;

  return (
    <div className="animate-fade-in rounded-xl border border-neon-rose/20 bg-neon-rose/5 p-4 backdrop-blur-xl">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-neon-rose animate-pulse" />
        <div>
          <p className="text-xs font-medium tracking-wider text-neon-rose uppercase">
            Narrative Risk
          </p>
          <p className="mt-1 text-sm leading-relaxed text-cosmos-200/80">
            {risk}
          </p>
        </div>
      </div>
    </div>
  );
}
