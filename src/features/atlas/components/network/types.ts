import type { Edge, Node } from "@xyflow/react";

export type GeneNodeData = {
  label: string;
  gene: string;
  effect: "M" | "N" | null;
  shownDegree: number;
  meCount: number;
  coCount: number;
  likelyPassenger: boolean;
  active: boolean;
  dimmed: boolean;
};

export type GeneNode = Node<GeneNodeData, "gene">;
export type ResultEdge = Edge<{ q: number; resultId: string }, "straight">;
export type Inspection = { kind: "node" | "edge"; id: string } | null;
