import "@xyflow/react/dist/style.css";
import {
  Panel,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { buildNetworkLayout } from "@/features/atlas/components/network-layout";
import { fmtQ } from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, InteractionResult } from "@/features/atlas/types";

type GeneNode = Node<{ label: string }, "default">;
type ResultEdge = Edge<{ q: number }, "straight">;

const ME_COLOR = "var(--me)";
const CO_COLOR = "var(--co)";

export function InteractionNetwork({
  results,
  totalResults,
  mode,
  query,
  onSelect,
}: {
  results: InteractionResult[];
  totalResults: number;
  mode: AtlasMode;
  query: string;
  onSelect: (result: InteractionResult) => void;
}) {
  const [instance, setInstance] = useState<ReactFlowInstance<GeneNode, ResultEdge> | null>(null);
  const layout = useMemo(() => buildNetworkLayout(results, mode), [mode, results]);
  const resultById = useMemo(
    () => new Map(results.map((result) => [result.id, result])),
    [results],
  );
  const needle = query.trim().toLocaleUpperCase("en-US");
  const nodes = useMemo<GeneNode[]>(
    () =>
      layout.nodes.map((node) => {
        const matches = !needle || node.id.toLocaleUpperCase("en-US").includes(needle);
        return {
          id: node.id,
          type: "default",
          position: { x: node.x, y: node.y },
          data: { label: node.id },
          draggable: false,
          selectable: false,
          focusable: false,
          ariaLabel: `${node.gene}${node.effect ? ` ${node.effect} effect` : ""}; ${node.degree} significant ${node.degree === 1 ? "interaction" : "interactions"}`,
          style: {
            width: "auto",
            minWidth: 74,
            padding: "7px 10px",
            borderRadius: 4,
            border: `1px solid ${matches ? "#191915" : "#d9d0c2"}`,
            background: "#fffaf2",
            boxShadow: "none",
            color: matches ? "#191915" : "#665f56",
            fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
            fontSize: 11,
            fontWeight: 600,
            opacity: matches ? 1 : 0.58,
          },
        };
      }),
    [layout.nodes, needle],
  );
  const edges = useMemo<ResultEdge[]>(
    () =>
      layout.edges.map((edge) => {
        const result = resultById.get(edge.id);
        const searchMatch =
          !needle ||
          edge.source.toLocaleUpperCase("en-US").includes(needle) ||
          edge.target.toLocaleUpperCase("en-US").includes(needle);
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "straight",
          data: { q: edge.q },
          focusable: false,
          selectable: false,
          interactionWidth: 20,
          ariaLabel: result
            ? `${result.ga} and ${result.gb}; ${result.direction === "ME" ? "mutually exclusive" : "co-occurring"}; significant at q ${fmtQ(edge.q)}`
            : edge.id,
          style: {
            stroke: edge.direction === "ME" ? ME_COLOR : CO_COLOR,
            strokeWidth: edge.width,
            strokeDasharray: edge.direction === "CO" ? "8 6" : undefined,
            opacity: searchMatch ? 0.86 : 0.2,
            cursor: "pointer",
          },
        };
      }),
    [layout.edges, needle, resultById],
  );

  return (
    <section aria-label="Significant interaction network">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-muted">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Network encoding">
          <span className="inline-flex items-center gap-2">
            <span className="w-7 border-t-2 border-solid border-me" aria-hidden />
            Mutually exclusive
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-7 border-t-2 border-dashed border-co" aria-hidden />
            Co-occurring
          </span>
          <span>Line weight shows q-value strength.</span>
          <span>Use List to open pairs with a keyboard.</span>
        </div>
        <span className="text-right">
          <span className="font-mono">{results.length}</span>
          {totalResults > results.length ? (
            <> top-ranked of <span className="font-mono">{totalResults}</span></>
          ) : null}{" "}
          significant pairs
          {totalResults > results.length ? (
            <span className="block font-sans font-normal">Use List to explore every pair.</span>
          ) : null}
        </span>
      </div>

      <div className="h-[min(68vh,720px)] min-h-[31rem] overflow-hidden border border-line bg-paper">
        <ReactFlow<GeneNode, ResultEdge>
          nodes={nodes}
          edges={edges}
          onInit={setInstance}
          onEdgeClick={(_, edge) => {
            const result = resultById.get(edge.id);
            if (result) onSelect(result);
          }}
          fitView
          fitViewOptions={{ padding: 0.18, minZoom: 0.22, maxZoom: 1.15 }}
          minZoom={0.12}
          maxZoom={2.4}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnScroll
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          colorMode="light"
        >
          <Panel position="bottom-right" className="m-3 flex overflow-hidden border border-line bg-paper shadow-sm">
            <button
              type="button"
              onClick={() => void instance?.zoomOut({ duration: 0 })}
              className="focus-ring flex size-9 items-center justify-center border-r border-line text-muted hover:bg-sand hover:text-ink"
              aria-label="Zoom out"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => void instance?.zoomIn({ duration: 0 })}
              className="focus-ring flex size-9 items-center justify-center border-r border-line text-muted hover:bg-sand hover:text-ink"
              aria-label="Zoom in"
            >
              <Plus className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => void instance?.fitView({ padding: 0.18, duration: 0 })}
              className="focus-ring flex size-9 items-center justify-center text-muted hover:bg-sand hover:text-ink"
              aria-label="Fit network to view"
            >
              <Maximize2 className="size-4" aria-hidden />
            </button>
          </Panel>
        </ReactFlow>
      </div>

    </section>
  );
}
