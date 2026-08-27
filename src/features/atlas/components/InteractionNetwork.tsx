import "@xyflow/react/dist/style.css";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Panel,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
  type AriaLabelConfig,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from "@xyflow/react";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme";
import { NETWORK_NODE_TYPES, effectLabel } from "@/features/atlas/components/network/GeneNode";
import { NetworkInspector } from "@/features/atlas/components/network/NetworkInspector";
import { NetworkLegend } from "@/features/atlas/components/network/NetworkLegend";
import type {
  GeneNode,
  Inspection,
  ResultEdge,
} from "@/features/atlas/components/network/types";
import { buildNetworkLayout } from "@/features/atlas/components/network-layout";
import {
  fmtQ,
  resultIsSignificant,
} from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, InteractionResult } from "@/features/atlas/types";

const FIT_OPTIONS = { padding: 0.14, minZoom: 0.2, maxZoom: 1.2 };
const NETWORK_ARIA_LABEL_CONFIG = {
  "node.a11yDescription.default": "Press Enter or Space to select a gene. Press Escape to clear the selection.",
  "node.a11yDescription.keyboardDisabled":
    "Press Enter or Space to select a gene. Use the arrow keys to move it. Press Escape to clear the selection.",
  "edge.a11yDescription.default":
    "Press Enter or Space to select an interaction and open its pair details. Press Escape to clear the selection.",
} satisfies Partial<AriaLabelConfig>;

function FitNetwork({ trigger }: { trigger: string }) {
  const initialized = useNodesInitialized();
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!initialized) return;
    const frame = window.requestAnimationFrame(() => void fitView(FIT_OPTIONS));
    return () => window.cancelAnimationFrame(frame);
  }, [fitView, initialized, trigger]);
  return null;
}

function countDirections(results: InteractionResult[]) {
  const counts = new Map<string, { ME: number; CO: number }>();
  for (const result of results) {
    for (const id of [result.ga, result.gb]) {
      const count = counts.get(id) ?? { ME: 0, CO: 0 };
      count[result.direction] += 1;
      counts.set(id, count);
    }
  }
  return counts;
}

export function InteractionNetwork({
  results,
  totalResults,
  mode,
  qThreshold,
  likelyPassengers,
  highlightLikelyPassengers,
  onSelect,
}: {
  results: InteractionResult[];
  totalResults: number;
  mode: AtlasMode;
  qThreshold: number;
  likelyPassengers: ReadonlySet<string>;
  highlightLikelyPassengers: boolean;
  onSelect: (result: InteractionResult) => void;
}) {
  const { theme } = useTheme();
  const [instance, setInstance] = useState<ReactFlowInstance<GeneNode, ResultEdge> | null>(null);
  const [nodes, setNodes] = useState<GeneNode[]>([]);
  const [edges, setEdges] = useState<ResultEdge[]>([]);
  const [hovered, setHovered] = useState<Inspection>(null);
  const [selected, setSelected] = useState<Inspection>(null);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [fitRevision, setFitRevision] = useState(0);
  const inspection = hovered ?? selected;
  const layout = useMemo(
    () => buildNetworkLayout(results, mode, qThreshold),
    [mode, qThreshold, results],
  );
  const resultById = useMemo(
    () => new Map(results.map((result) => [result.id, result])),
    [results],
  );
  const directionCounts = useMemo(() => countDirections(results), [results]);
  const initialNodes = useMemo<GeneNode[]>(
    () =>
      layout.nodes.map((node) => {
        const counts = directionCounts.get(node.id) ?? { ME: 0, CO: 0 };
        return {
          id: node.id,
          type: "gene",
          position: { x: node.x, y: node.y },
          origin: [0.5, 0.5],
          data: {
            label: node.gene,
            gene: node.gene,
            effect: node.effect,
            shownDegree: node.shownDegree,
            meCount: counts.ME,
            coCount: counts.CO,
            likelyPassenger: highlightLikelyPassengers && likelyPassengers.has(node.id),
            active: false,
            dimmed: false,
          },
          draggable: true,
          selectable: true,
          focusable: true,
          deletable: false,
          ariaLabel: `${node.gene}; ${effectLabel(node.effect)}; ${node.shownDegree} ${node.shownDegree === 1 ? "connection" : "connections"} shown${highlightLikelyPassengers && likelyPassengers.has(node.id) ? "; likely passenger gene effect" : ""}`,
        };
      }),
    [directionCounts, highlightLikelyPassengers, layout.nodes, likelyPassengers],
  );
  const initialEdges = useMemo<ResultEdge[]>(
    () =>
      layout.edges.map((edge) => {
        const result = resultById.get(edge.id);
        const significant = result ? resultIsSignificant(result, mode, qThreshold) : false;
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "straight",
          data: { q: edge.q, resultId: edge.id },
          focusable: true,
          selectable: true,
          deletable: false,
          interactionWidth: 22,
          ariaLabel: result
            ? `${result.ga} and ${result.gb}; ${result.direction === "ME" ? "mutually exclusive" : "co-occurring"}; ${significant ? "significant" : "not significant"} at ${mode === "consensus" ? "maximum " : ""}q ${fmtQ(edge.q)}`
            : edge.id,
          style: {
            stroke: edge.direction === "ME" ? "var(--me)" : "var(--co)",
            strokeWidth: edge.width,
            strokeDasharray: edge.direction === "CO" ? "8 6" : undefined,
            cursor: "pointer",
          },
        };
      }),
    [layout.edges, mode, qThreshold, resultById],
  );

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHovered(null);
    setSelected(null);
    setLayoutDirty(false);
  }, [initialEdges, initialNodes]);

  const onNodesChange = useCallback((changes: NodeChange<GeneNode>[]) => {
    if (
      changes.some(
        (change) =>
          change.type === "position" &&
          (change.position != null || change.positionAbsolute != null),
      )
    ) {
      setLayoutDirty(true);
    }
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange<ResultEdge>[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams<GeneNode, ResultEdge>) => {
      const selectedEdge = selectedEdges[selectedEdges.length - 1];
      if (selectedEdge) {
        setSelected({ kind: "edge", id: selectedEdge.id });
        return;
      }
      const selectedNode = selectedNodes[selectedNodes.length - 1];
      setSelected(selectedNode ? { kind: "node", id: selectedNode.id } : null);
    },
    [],
  );

  const inspectedNode = inspection?.kind === "node" ? inspection.id : null;
  const inspectedEdge = inspection?.kind === "edge" ? inspection.id : null;
  const inspectedResult = inspectedEdge ? resultById.get(inspectedEdge) ?? null : null;
  const connectedNodeIds = useMemo(() => {
    if (!inspectedNode) return new Set<string>();
    const ids = new Set([inspectedNode]);
    for (const edge of edges) {
      if (edge.source === inspectedNode) ids.add(edge.target);
      if (edge.target === inspectedNode) ids.add(edge.source);
    }
    return ids;
  }, [edges, inspectedNode]);

  const displayedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const edgeMatch = inspectedResult
          ? node.id === inspectedResult.ga || node.id === inspectedResult.gb
          : true;
        const neighborhoodMatch = inspectedNode ? connectedNodeIds.has(node.id) : true;
        return {
          ...node,
          data: {
            ...node.data,
            active:
              node.id === inspectedNode ||
              (inspectedResult != null && (node.id === inspectedResult.ga || node.id === inspectedResult.gb)),
            dimmed: !edgeMatch || !neighborhoodMatch,
          },
        };
      }),
    [connectedNodeIds, inspectedNode, inspectedResult, nodes],
  );
  const displayedEdges = useMemo(
    () =>
      edges.map((edge) => {
        const inspectionMatch = inspectedNode
          ? edge.source === inspectedNode || edge.target === inspectedNode
          : inspectedEdge
            ? edge.id === inspectedEdge
            : true;
        const active = edge.id === inspectedEdge;
        return {
          ...edge,
          style: {
            ...edge.style,
            opacity: inspectionMatch ? (active ? 1 : 0.78) : 0.12,
            strokeWidth: Number(edge.style?.strokeWidth ?? 1.5) + (active ? 1.5 : 0),
          },
        };
      }),
    [edges, inspectedEdge, inspectedNode],
  );

  const inspectedNodeData = inspectedNode
    ? displayedNodes.find((node) => node.id === inspectedNode)?.data ?? null
    : null;
  const inspectedLayoutEdge = inspectedEdge
    ? layout.edges.find((edge) => edge.id === inspectedEdge) ?? null
    : null;
  const meCount = results.filter(({ direction }) => direction === "ME").length;
  const coCount = results.filter(({ direction }) => direction === "CO").length;

  const onNetworkKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (!(event.target instanceof Element)) return;
      const edgeElement = event.target.closest<SVGGElement>(".react-flow__edge[data-id]");
      const edgeId = edgeElement?.getAttribute("data-id");
      if (edgeId) {
        const result = resultById.get(edgeId);
        if (!result) return;
        event.preventDefault();
        setSelected({ kind: "edge", id: edgeId });
        onSelect(result);
        return;
      }
      const nodeElement = event.target.closest<HTMLElement>(".react-flow__node[data-id]");
      const nodeId = nodeElement?.getAttribute("data-id");
      if (!nodeId) return;
      event.preventDefault();
      setSelected({ kind: "node", id: nodeId });
    },
    [onSelect, resultById],
  );

  const resetLayout = () => {
    setNodes(initialNodes);
    setLayoutDirty(false);
    setFitRevision((revision) => revision + 1);
  };

  return (
    <section aria-label="Interaction network" onKeyDownCapture={onNetworkKeyDown}>
      <NetworkLegend
        meCount={meCount}
        coCount={coCount}
        totalResults={totalResults}
        shownResults={results.length}
        showLikelyPassengers={highlightLikelyPassengers}
      />

      <div className="surface-card h-[min(68vh,720px)] min-h-[31rem] overflow-hidden bg-paper">
        <ReactFlow<GeneNode, ResultEdge>
          nodes={displayedNodes}
          edges={displayedEdges}
          nodeTypes={NETWORK_NODE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          onInit={setInstance}
          onNodeMouseEnter={(_, node) => setHovered({ kind: "node", id: node.id })}
          onNodeMouseLeave={() => setHovered(null)}
          onEdgeMouseEnter={(_, edge) => setHovered({ kind: "edge", id: edge.id })}
          onEdgeMouseLeave={() => setHovered(null)}
          onNodeClick={(_, node) => setSelected({ kind: "node", id: node.id })}
          onEdgeClick={(_, edge) => {
            setSelected({ kind: "edge", id: edge.id });
            const result = resultById.get(edge.id);
            if (result) onSelect(result);
          }}
          onPaneClick={() => setSelected(null)}
          fitView
          fitViewOptions={FIT_OPTIONS}
          minZoom={0.12}
          maxZoom={2.4}
          nodesDraggable
          nodesConnectable={false}
          edgesReconnectable={false}
          nodesFocusable
          edgesFocusable
          elementsSelectable
          deleteKeyCode={null}
          panOnScroll
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          colorMode={theme}
          ariaLabelConfig={NETWORK_ARIA_LABEL_CONFIG}
        >
          <FitNetwork trigger={`${mode}:${qThreshold}:${results.map(({ id }) => id).join("|")}:${fitRevision}`} />
          {inspection && (
            <NetworkInspector
              node={inspectedNodeData}
              result={inspectedResult}
              edge={inspectedLayoutEdge}
              mode={mode}
              qThreshold={qThreshold}
              onSelect={onSelect}
            />
          )}
          <Panel position="bottom-right" className="m-3 flex overflow-hidden rounded-full border border-line bg-paper p-1 shadow-sm">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => void instance?.zoomOut({ duration: 0 })} aria-label="Zoom out">
              <Minus className="size-4" aria-hidden />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => void instance?.zoomIn({ duration: 0 })} aria-label="Zoom in">
              <Plus className="size-4" aria-hidden />
            </Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => void instance?.fitView(FIT_OPTIONS)} aria-label="Fit network to view">
              <Maximize2 className="size-4" aria-hidden />
            </Button>
            {layoutDirty && (
              <Button type="button" variant="ghost" size="icon-sm" onClick={resetLayout} aria-label="Reset node layout">
                <RotateCcw className="size-4" aria-hidden />
              </Button>
            )}
          </Panel>
        </ReactFlow>
      </div>
    </section>
  );
}
