"use client";

import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { Html, Stars } from "@react-three/drei";
import { Leva, useControls } from "leva";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { STORY_CATALOG } from "@/lib/agents/catalog";

type StoryDomain = "Movie" | "History" | "Novel";

type StoryNode = {
  id: number;
  title: string;
  domain: StoryDomain;
  year: number;
  summary: string;
  position: [number, number, number];
  signal: number;
};

type FeaturedStoryNode = {
  id: string;
  title: string;
  domain: StoryDomain;
  summary: string;
  position: [number, number, number];
};

const DOMAIN_COLORS: Record<StoryDomain, string> = {
  Movie: "#60a5fa",
  History: "#34d399",
  Novel: "#f472b6",
};

const DOMAIN_POOL: StoryDomain[] = ["Movie", "History", "Novel"];
const TITLE_TOKENS = [
  "Nebula",
  "Empire",
  "Cipher",
  "Odyssey",
  "Chronicle",
  "Echo",
  "Paradox",
  "Frontier",
  "Archive",
  "Myth",
];
const SYNOPSIS_TOKENS = [
  "political intrigue",
  "forbidden technology",
  "hidden identity",
  "collapse of empires",
  "rewritten prophecy",
  "parallel timeline",
];

function seededRandomFactory(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) {
    state += 2147483646;
  }
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function createNode(index: number, spread: number, random: () => number): StoryNode {
  const domain = DOMAIN_POOL[Math.floor(random() * DOMAIN_POOL.length)] ?? "Novel";
  const radius = spread * Math.cbrt(random());
  const theta = random() * Math.PI * 2;
  const phi = Math.acos(2 * random() - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  const year = 1800 + Math.floor(random() * 260);
  const leftToken = TITLE_TOKENS[Math.floor(random() * TITLE_TOKENS.length)] ?? "Story";
  const rightToken = TITLE_TOKENS[Math.floor(random() * TITLE_TOKENS.length)] ?? "Node";
  const summaryToken =
    SYNOPSIS_TOKENS[Math.floor(random() * SYNOPSIS_TOKENS.length)] ??
    "cross-world tension";

  return {
    id: index,
    title: `${leftToken} ${rightToken}`,
    domain,
    year,
    summary: `${domain} node exploring ${summaryToken}.`,
    position: [x, y, z],
    signal: random(),
  };
}

function createFeaturedStoryNodes(radius: number): FeaturedStoryNode[] {
  const total = STORY_CATALOG.length;
  if (total === 0) {
    return [];
  }

  return STORY_CATALOG.map((item, index) => {
    const theta = (index / total) * Math.PI * 2;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    const y = ((index % 3) - 1) * 4;
    return {
      id: item.id,
      title: item.title,
      domain: item.medium,
      summary: item.summary,
      position: [x, y, z],
    };
  });
}

function CameraRig({
  nodes,
  focusedNodeId,
}: {
  nodes: StoryNode[];
  focusedNodeId: number | null;
}) {
  const targetPosition = useRef(new THREE.Vector3(0, 0, 48));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(({ camera }) => {
    const focusedNode =
      focusedNodeId !== null && nodes[focusedNodeId] ? nodes[focusedNodeId] : null;

    if (focusedNode) {
      const [x, y, z] = focusedNode.position;
      targetLookAt.current.set(x, y, z);
      targetPosition.current.set(x * 1.45, y * 1.45, z * 1.45 + 8);
    } else {
      targetLookAt.current.set(0, 0, 0);
      targetPosition.current.set(0, 0, 48);
    }

    camera.position.lerp(targetPosition.current, 0.07);
    camera.lookAt(targetLookAt.current);
  });

  return null;
}

interface UniverseCanvasProps {
  onCatalogNodeSelect?: (nodeId: string) => void;
}

export default function UniverseCanvas({ onCatalogNodeSelect }: UniverseCanvasProps) {
  const controls = useControls("Universe", {
    nodeCount: { value: 16000, min: 4000, max: 30000, step: 1000 },
    spread: { value: 54, min: 25, max: 90, step: 1 },
  });

  const nodes = useMemo(() => {
    const random = seededRandomFactory(117);
    return Array.from({ length: controls.nodeCount }, (_, index) =>
      createNode(index, controls.spread, random),
    );
  }, [controls.nodeCount, controls.spread]);
  const featuredNodes = useMemo(() => createFeaturedStoryNodes(18), []);

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matrixHelper = useRef(new THREE.Object3D());
  const colorHelper = useRef(new THREE.Color());
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const [focusedNodeId, setFocusedNodeId] = useState<number | null>(null);
  const [hoveredFeaturedNodeId, setHoveredFeaturedNodeId] = useState<string | null>(null);
  const [focusedFeaturedNodeId, setFocusedFeaturedNodeId] = useState<string | null>(null);
  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const featuredHoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const helper = matrixHelper.current;
    const color = colorHelper.current;

    for (const node of nodes) {
      const focusMultiplier = focusedNodeId === node.id ? 2.2 : 1;
      helper.position.set(node.position[0], node.position[1], node.position[2]);
      helper.scale.setScalar((0.06 + node.signal * 0.16) * focusMultiplier);
      helper.updateMatrix();

      mesh.setMatrixAt(node.id, helper.matrix);
      color.set(DOMAIN_COLORS[node.domain]);
      mesh.setColorAt(node.id, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [nodes, focusedNodeId]);

  const hoveredNode =
    hoveredNodeId !== null && nodes[hoveredNodeId] ? nodes[hoveredNodeId] : null;
  const hoveredFeaturedNode = featuredNodes.find(
    (node) => node.id === hoveredFeaturedNodeId,
  );

  const clearHoveredNode = () => {
    if (hoverClearTimer.current) {
      clearTimeout(hoverClearTimer.current);
      hoverClearTimer.current = null;
    }

    hoverClearTimer.current = setTimeout(() => {
      setHoveredNodeId(null);
      hoverClearTimer.current = null;
    }, 45);
  };

  const clearHoveredFeaturedNode = () => {
    if (featuredHoverClearTimer.current) {
      clearTimeout(featuredHoverClearTimer.current);
      featuredHoverClearTimer.current = null;
    }

    featuredHoverClearTimer.current = setTimeout(() => {
      setHoveredFeaturedNodeId(null);
      featuredHoverClearTimer.current = null;
    }, 45);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (hoverClearTimer.current) {
      clearTimeout(hoverClearTimer.current);
      hoverClearTimer.current = null;
    }
    if (typeof event.instanceId === "number") {
      setHoveredNodeId(event.instanceId);
    }
  };

  const handleNodeClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (typeof event.instanceId === "number") {
      setFocusedNodeId(event.instanceId);
      setFocusedFeaturedNodeId(null);
    }
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.8]}
        camera={{ position: [0, 0, 48], fov: 58, near: 0.1, far: 320 }}
        onPointerMissed={() => {
          setFocusedNodeId(null);
          setFocusedFeaturedNodeId(null);
        }}
      >
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 30, 185]} />
        <ambientLight intensity={0.28} />
        <pointLight color="#22d3ee" intensity={40} position={[18, 12, 8]} />
        <pointLight color="#a855f7" intensity={32} position={[-16, -12, -6]} />
        <Stars radius={170} depth={70} count={4600} factor={3} fade speed={0.7} />
        <CameraRig nodes={nodes} focusedNodeId={focusedNodeId} />

        <instancedMesh
          ref={meshRef}
          args={[undefined, undefined, nodes.length]}
          onPointerMove={handlePointerMove}
          onPointerOut={clearHoveredNode}
          onClick={handleNodeClick}
        >
          <sphereGeometry args={[1, 4, 4]} />
          <meshStandardMaterial
            vertexColors
            emissive="#0f172a"
            emissiveIntensity={0.6}
            roughness={0.3}
            metalness={0.2}
          />
        </instancedMesh>

        {featuredNodes.map((node) => {
          const isFocused = focusedFeaturedNodeId === node.id;

          return (
            <mesh
              key={node.id}
              position={node.position}
              onPointerOver={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                if (featuredHoverClearTimer.current) {
                  clearTimeout(featuredHoverClearTimer.current);
                  featuredHoverClearTimer.current = null;
                }
                setHoveredFeaturedNodeId(node.id);
              }}
              onPointerOut={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                clearHoveredFeaturedNode();
              }}
              onClick={(event: ThreeEvent<MouseEvent>) => {
                event.stopPropagation();
                setFocusedFeaturedNodeId(node.id);
                onCatalogNodeSelect?.(node.id);
              }}
            >
              <sphereGeometry args={[isFocused ? 0.94 : 0.72, 20, 20]} />
              <meshStandardMaterial
                color={DOMAIN_COLORS[node.domain]}
                emissive={DOMAIN_COLORS[node.domain]}
                emissiveIntensity={isFocused ? 0.6 : 0.3}
                roughness={0.25}
                metalness={0.35}
              />
            </mesh>
          );
        })}

        {hoveredFeaturedNode ? (
          <Html position={hoveredFeaturedNode.position} center distanceFactor={16}>
            <div className="pointer-events-none w-72 rounded-xl border border-neon-cyan/45 bg-cosmos-950/90 px-3 py-2 text-sm text-cosmos-100 shadow-nebula backdrop-blur">
              <p className="font-semibold text-neon-cyan">{hoveredFeaturedNode.title}</p>
              <p className="mt-1 text-cosmos-200/80">{hoveredFeaturedNode.domain}</p>
              <p className="mt-1 text-cosmos-100/80">{hoveredFeaturedNode.summary}</p>
            </div>
          </Html>
        ) : hoveredNode ? (
          <Html position={hoveredNode.position} center distanceFactor={26}>
            <div className="pointer-events-none w-64 rounded-xl border border-cosmos-200/30 bg-cosmos-950/90 px-3 py-2 text-sm text-cosmos-100 shadow-nebula backdrop-blur">
              <p className="font-semibold text-neon-cyan">{hoveredNode.title}</p>
              <p className="mt-1 text-cosmos-200/80">
                {hoveredNode.domain} | {hoveredNode.year}
              </p>
              <p className="mt-1 text-cosmos-100/80">{hoveredNode.summary}</p>
            </div>
          </Html>
        ) : null}
      </Canvas>
      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-cosmos-700/70 bg-cosmos-950/75 px-2 py-1 text-xs text-cosmos-200/80 backdrop-blur">
        Highlighted nodes are catalog anchors. Click to stage source/target in Command Deck.
      </div>
      <Leva hidden={process.env.NODE_ENV !== "development"} collapsed />
    </div>
  );
}
