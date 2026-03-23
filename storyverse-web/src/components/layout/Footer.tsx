"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Orbit } from "lucide-react";

type ServiceHealth = {
  ok: boolean;
  service: string;
  version: string;
  nodeEnv: string;
  timestamp: string;
};

function formatStatusTime(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function Footer() {
  const now = new Date();
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);
  const [manualRefreshLabel, setManualRefreshLabel] = useState<string>("Refresh");
  const [healthCheckedAt, setHealthCheckedAt] = useState<string>("");

  const load = useCallback(async () => {
    setIsHealthLoading(true);
    setManualRefreshLabel("Refreshing");

    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = (await res.json()) as ServiceHealth;
      setHealth(data);
      setHealthCheckedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch {
      setHealth({
        ok: false,
        service: "storyverse-web",
        version: "unknown",
        nodeEnv: "unknown",
        timestamp: "",
      });
      setHealthCheckedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } finally {
      setIsHealthLoading(false);
      setManualRefreshLabel("Refresh");
    }
  }, [setManualRefreshLabel]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (cancelled) {
        return;
      }
      await load();
    };

    void run();
    const interval = window.setInterval(run, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [load]);

  const statusText = useMemo(() => {
    if (isHealthLoading && !health) {
      return "checking";
    }

    if (health && health.ok) {
      return "live";
    }

    return "degraded";
  }, [health, isHealthLoading]);

  const hasHealthyTimestamp = Boolean(health?.timestamp);
  const statusAgeSeconds = useMemo(() => {
    if (!health?.timestamp) {
      return null;
    }

    const parsed = new Date(health.timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const diffMs = Date.now() - parsed.getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) {
      return null;
    }

    return Math.round(diffMs / 1000);
  }, [health]);

  const healthStatusLabel = useMemo(() => {
    if (statusAgeSeconds === null) {
      return statusText;
    }

    if (statusAgeSeconds <= 20) {
      return `${statusText} · fresh`;
    }

    return `${statusText} · stale ${statusAgeSeconds}s`;
  }, [statusAgeSeconds, statusText]);

  const statusAriaLabel =
    statusText === "live"
      ? `Service healthy, ${healthStatusLabel}`
      : statusText === "checking"
        ? "Service health check in progress"
        : `Service health degraded, ${healthStatusLabel}`;

  return (
    <footer className="border-t border-cosmos-200/10 bg-cosmos-950/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="inline-flex items-center gap-2 text-xs text-cosmos-200/60">
          <Orbit className="h-3.5 w-3.5 text-neon-cyan/60" />
          <span className="font-display tracking-wider uppercase">StoryVerse</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-cosmos-200/40">
            Agentic GraphRAG storytelling engine
          </p>
          <p
            className="text-[10px] uppercase tracking-wider text-cosmos-200/50"
            role="status"
            aria-live="polite"
            aria-label={statusAriaLabel}
          >
            © {now.getFullYear()} · API status: <span aria-hidden="true">{healthStatusLabel}</span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-cosmos-200/50">
            {health
              ? `${health.service}@${health.version} · ${health.nodeEnv} · ${formatStatusTime(health.timestamp)}`
              : "Waiting for health snapshot"}
            {hasHealthyTimestamp && statusAgeSeconds !== null
              ? ` · ${statusAgeSeconds <= 20 ? "within SLA" : "over SLA"}`
              : ""}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-cosmos-200/50">
            checked at <time dateTime={healthCheckedAt || undefined}>{healthCheckedAt || "—"}</time>
          </p>
          <button
            type="button"
            className="mt-1 inline-flex items-center rounded border border-cosmos-200/40 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-cosmos-200/60 transition-colors hover:border-neon-cyan/70 hover:text-neon-cyan disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              if (isHealthLoading) {
                return;
              }
              void load();
            }}
            disabled={isHealthLoading}
            aria-label="Refresh health check"
            aria-busy={isHealthLoading}
          >
            {manualRefreshLabel}
          </button>
        </div>
      </div>
    </footer>
  );
}
