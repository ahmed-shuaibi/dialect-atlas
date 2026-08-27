import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { baseGene, codePointCompare, resultQ } from "@/features/atlas/lib/atlas-transform";
import { DEFAULT_Q_THRESHOLD, type AtlasMode, type Direction, type InteractionResult } from "@/features/atlas/types";

export interface NetworkLayoutNode {
  id: string;
  gene: string;
  effect: "M" | "N" | null;
  x: number;
  y: number;
  shownDegree: number;
}

export interface NetworkLayoutEdge {
  id: string;
  source: string;
  target: string;
  direction: Direction;
  q: number;
  width: number;
}

export interface NetworkLayout {
  nodes: NetworkLayoutNode[];
  edges: NetworkLayoutEdge[];
}

type ForceNode = SimulationNodeDatum & { id: string };
type ForceLink = SimulationLinkDatum<ForceNode> & {
  id: string;
  source: string | ForceNode;
  target: string | ForceNode;
};

function effect(geneEffect: string): "M" | "N" | null {
  const match = geneEffect.match(/_([MN])$/);
  return match?.[1] === "M" || match?.[1] === "N" ? match[1] : null;
}

function hashIds(ids: string[]): number {
  let hash = 2166136261;
  for (const value of ids.join("|")) {
    hash ^= value.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function edgeWidthForQ(q: number, qThreshold = DEFAULT_Q_THRESHOLD): number {
  const strength = Math.max(0, Math.log10(qThreshold / Math.max(q, 1e-12)));
  return Math.min(5, 1.5 + strength * 0.85);
}

/** Build a deterministic initial force layout for the provided display result set. */
export function buildNetworkLayout(
  results: InteractionResult[],
  mode: AtlasMode,
  qThreshold = DEFAULT_Q_THRESHOLD,
): NetworkLayout {
  const orderedResults = [...results].sort((a, b) => codePointCompare(a.id, b.id));
  const degrees = new Map<string, number>();
  for (const { ga, gb } of orderedResults) {
    degrees.set(ga, (degrees.get(ga) ?? 0) + 1);
    degrees.set(gb, (degrees.get(gb) ?? 0) + 1);
  }
  const ids = [...degrees.keys()].sort(codePointCompare);
  if (ids.length === 0) return { nodes: [], edges: [] };

  const radius = Math.max(150, ids.length * 6);
  const forceNodes: ForceNode[] = ids.map((id, index) => {
    const angle = (index / ids.length) * Math.PI * 2;
    return { id, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
  const forceLinks: ForceLink[] = orderedResults.map((result) => ({
    id: result.id,
    source: result.ga,
    target: result.gb,
  }));

  const simulation = forceSimulation(forceNodes)
    .randomSource(seededRandom(hashIds(ids)))
    .force(
      "link",
      forceLink<ForceNode, ForceLink>(forceLinks)
        .id((node) => node.id)
        .distance(106)
        .strength(0.78),
    )
    .force("charge", forceManyBody().strength(-125).distanceMax(340))
    .force("collision", forceCollide<ForceNode>().radius(59).strength(0.95).iterations(3))
    .force("x", forceX(0).strength(0.09))
    .force("y", forceY(0).strength(0.12))
    .force("center", forceCenter(0, 0))
    .stop();

  const iterations = Math.min(260, 110 + ids.length);
  for (let index = 0; index < iterations; index += 1) simulation.tick();
  simulation.stop();

  const positions = new Map(
    forceNodes.map((node) => [
      node.id,
      {
        x: Math.round((node.x ?? 0) * 1600) / 1000,
        y: Math.round((node.y ?? 0) * 700) / 1000,
      },
    ]),
  );
  return {
    nodes: ids.map((id) => ({
      id,
      gene: baseGene(id),
      effect: effect(id),
      x: positions.get(id)?.x ?? 0,
      y: positions.get(id)?.y ?? 0,
      shownDegree: degrees.get(id) ?? 0,
    })),
    edges: orderedResults.map((result) => {
      const q = resultQ(result, mode);
      return {
        id: result.id,
        source: result.ga,
        target: result.gb,
        direction: result.direction,
        q,
        width: edgeWidthForQ(q, qThreshold),
      };
    }),
  };
}
