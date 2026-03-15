"use client";

import { useEffect, useMemo, useState } from "react";
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

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function Footer() {
  const now = new Date();
  const [health, setHealth] = useState<ServiceHealth | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const data = (await res.json()) as ServiceHealth;
        if (cancelled) return;
        setHealth(data);
      } catch {
        if (!cancelled) {
          setHealth({
            ok: false,
            service: 'storyverse-web',
            version: 'unknown',
            nodeEnv: 'unknown',
            timestamp: '',
          });
        }
      } finally {
        if (!cancelled) {
          setIsHealthLoading(false);
        }
      }
    };

    load();
    const interval = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const statusText = useMemo(() => {
    if (isHealthLoading && !health) {
      return 'checking';
    }

    if (health && health.ok) {
      return 'live';
    }

    return 'degraded';
  }, [health, isHealthLoading]);

  return (
    <footer className="border-t border-cosmos-200/10 bg-cosmos-950/60 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="inline-flex items-center gap-2 text-xs text-cosmos-200/60">
          <Orbit className="h-3.5 w-3.5 text-neon-cyan/60" />
          <span className="font-display tracking-wider uppercase">
            StoryVerse
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-cosmos-200/40">
            Agentic GraphRAG storytelling engine
          </p>
          <p className="text-[10px] uppercase tracking-wider text-cosmos-200/50">
            © {now.getFullYear()} · API status: {statusText}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-cosmos-200/50">
            {health ? `${health.service}@${health.version} · ${health.nodeEnv} · ${formatStatusTime(health.timestamp)}` : 'Waiting for health snapshot'}
          </p>
        </div>
      </div>
    </footer>
  );
}
