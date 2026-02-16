"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CommandDeck } from "@/components/universe/CommandDeck";

interface UniverseCanvasProps {
  onCatalogNodeSelect?: (nodeId: string) => void;
}

type CanvasSelectionSignal = {
  nodeId: string;
  token: number;
};

const UniverseCanvas = dynamic<UniverseCanvasProps>(
  () => import("@/components/universe/UniverseCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center bg-cosmos-950 text-cosmos-200">
        Booting holodeck...
      </div>
    ),
  },
);

export default function UniversePage() {
  const [canvasSelectionSignal, setCanvasSelectionSignal] =
    useState<CanvasSelectionSignal | null>(null);

  const handleCatalogNodeSelectFromCanvas = (nodeId: string) => {
    setCanvasSelectionSignal((previous) => ({
      nodeId,
      token: (previous?.token ?? 0) + 1,
    }));
  };

  return (
    <main className="relative h-dvh overflow-hidden bg-cosmos-950 text-cosmos-100">
      <UniverseCanvas onCatalogNodeSelect={handleCatalogNodeSelectFromCanvas} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_30%,rgba(2,6,23,0.75)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-cosmos-950 to-transparent" />
      <CommandDeck canvasSelectionSignal={canvasSelectionSignal} />
    </main>
  );
}
