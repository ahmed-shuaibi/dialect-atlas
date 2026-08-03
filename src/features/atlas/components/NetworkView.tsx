import { useEffect, useMemo, useRef } from "react";
import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import fcose from "cytoscape-fcose";
import { Maximize2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NetworkLegend } from "@/features/atlas/components/NetworkLegend";
import { pairKey } from "@/features/atlas/lib/atlas-transform";

cytoscape.use(fcose);

const ME = "#4ea3df";
const CO = "#e9a13b";
const NODE = "#6c7783";
const NODE_DRIVER = "#8ab2c0";
const LABEL = "#e4e4e7";
const HALO = "#050505";

/**
 * fcose tuned for a calm, rounded focus+context cluster (not a stringy diagonal). `randomize:true`
 * lets the force pass run from a spread start — for hub-and-spoke driver topologies this settles
 * into a roughly circular cluster instead of the line fcose produces from a cold (un-randomized)
 * start; `animate:false` keeps it a single non-animated solve. High node repulsion + separation
 * spreads overlapping labels; strong gravity with a tight gravityRange compacts the hub; tiled
 * packing keeps any stray disconnected pair beside the main mass instead of flung to a corner.
 */
const layoutOpts = {
  name: "fcose",
  quality: "proof",
  randomize: true,
  animate: false,
  nodeRepulsion: 9000,
  idealEdgeLength: 90,
  edgeElasticity: 0.25,
  nodeSeparation: 120,
  gravity: 0.9,
  gravityRange: 1.2,
  gravityCompound: 1.4,
  numIter: 3000,
  packComponents: true,
  componentSpacing: 60,
  tile: true,
  padding: 32,
};

export interface NetSelection {
  /** suffixed gene-effect id of endpoint a (e.g. TP53_M) — matches the table's ga and the node id. */
  a: string;
  /** suffixed gene-effect id of endpoint b (e.g. PIK3CA_N) — matches the table's gb and the node id. */
  b: string;
  type: "ME" | "CO";
}

/** Node id → display label override (rarely needed; the transform sets `label` per node). */
export type NodeLabelMap = Record<string, string>;

export function NetworkView({
  elements,
  minW,
  maxW,
  selected,
  onSelect,
  nodeLabel,
}: {
  elements: ElementDefinition[];
  minW: number;
  maxW: number;
  selected: NetSelection | null;
  onSelect: (s: NetSelection | null) => void;
  /**
   * Optional node-id → display-label override. Normally unused: the transform builds nodes at
   * gene-effect granularity (id = suffixed symbol) and sets `label` per node, so labels already
   * match the table's suffixed identity (TP53_M). Provided only for callers that relabel nodes.
   */
  nodeLabel?: NodeLabelMap;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // The focal hub of the ego view: the top-ranked node by marginal driver prob (= the node
  // sized largest, the seed of the top ME pair after dedup). Stable for a given element set.
  const focusId = useMemo(() => {
    let best: string | null = null;
    let bestW = -Infinity;
    for (const el of elements) {
      const d = el.data as { id?: string; w?: number; source?: string };
      if (d.source !== undefined) continue; // edges have source/target; nodes don't
      if (typeof d.w === "number" && d.w > bestW) {
        bestW = d.w;
        best = d.id ?? null;
      }
    }
    return best;
  }, [elements]);

  useEffect(() => {
    if (!containerRef.current) return;
    const lo = minW;
    const hi = maxW > minW ? maxW : minW + 0.001;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      minZoom: 0.25,
      maxZoom: 3,
      style: [
        {
          selector: "node",
          style: {
            "background-color": NODE,
            "background-opacity": 0.92,
            "border-width": 1.5,
            "border-color": "#2b3640",
            // node size encodes the gene's marginal driver probability (see legend)
            width: `mapData(w, ${lo}, ${hi}, 28, 66)`,
            height: `mapData(w, ${lo}, ${hi}, 28, 66)`,
            label: "data(label)",
            "font-family": "IBM Plex Mono, monospace",
            "font-size": 13,
            "font-weight": 500,
            color: LABEL,
            "text-valign": "center",
            "text-halign": "center",
            // stronger dark halo so labels read against any edge/node behind them
            "text-outline-width": 3,
            "text-outline-color": HALO,
            "text-margin-y": 0,
            "min-zoomed-font-size": 10,
          },
        },
        { selector: "node[?driver]", style: { "background-color": NODE_DRIVER } },
        {
          selector: 'edge[type="ME"]',
          style: {
            "line-color": ME,
            "line-style": "solid",
            // edge width encodes |ρ| (see legend)
            width: `mapData(effect, 0, 0.45, 1.4, 6)`,
            opacity: 0.62,
            "curve-style": "bezier",
          },
        },
        {
          selector: 'edge[type="CO"]',
          style: {
            "line-color": CO,
            "line-style": "dashed",
            "line-dash-pattern": [6, 4],
            width: `mapData(effect, 0, 0.45, 1.4, 6)`,
            opacity: 0.62,
            "curve-style": "bezier",
          },
        },
        // ego view: everything outside the focal hub's neighborhood rests dimmed + label-less,
        // so only the hub + first-degree neighbors carry labels (no collisions).
        { selector: ".dim", style: { opacity: 0.14, "text-opacity": 0 } },
        { selector: ".faded", style: { opacity: 0.08, "text-opacity": 0.08 } },
        { selector: "node.hl", style: { "border-width": 3, "border-color": LABEL } },
        { selector: "edge.hl", style: { opacity: 1, width: 4 } },
        { selector: "edge.sel", style: { opacity: 1, width: 5, "line-color": LABEL } },
        { selector: "node.sel", style: { "border-width": 3, "border-color": LABEL } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any,
      layout: layoutOpts as never,
    });
    cyRef.current = cy;

    // Resolve display labels so the graph agrees with the table (PIK3CA → PIK3CA_M). Prefer
    // the explicit map, then any transform-supplied `label`, then the bare id.
    cy.nodes().forEach((n) => {
      const id = n.id();
      const label = nodeLabel?.[id] ?? (n.data("label") as string | undefined) ?? id;
      n.data("label", label);
    });

    // Ego / focus+context: seed the resting view on the focal hub's closed neighborhood so a
    // newcomer lands on one readable pair-cluster instead of the whole hairball.
    const applyEgo = () => {
      cy.elements().removeClass("dim");
      if (!focusId) return;
      const hub = cy.getElementById(focusId);
      if (!hub.length) return;
      const nb = hub.closedNeighborhood();
      cy.elements().difference(nb).addClass("dim");
    };

    // Auto-shrink the surface to the graph's bounding box on sparse cohorts so a two-star
    // layout doesn't float in a tall void. Caps at the clamp max; floors at 300px.
    const shrinkToGraph = () => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const w = surface.clientWidth || 1;
      const bb = cy.elements().renderedBoundingBox();
      // graph aspect at fit-to-width, plus padding; clamp to [300, 560].
      const graphAspect = bb.h > 0 && bb.w > 0 ? bb.h / bb.w : 0.5;
      const target = Math.max(300, Math.min(560, Math.round(w * graphAspect) + 96));
      surface.style.height = `${target}px`;
      cy.resize();
      cy.fit(undefined, 28);
    };

    requestAnimationFrame(() => cy.resize());
    cy.one("layoutstop", () => {
      applyEgo();
      shrinkToGraph();
    });

    cy.on("mouseover", "node", (e) => {
      cy.elements().removeClass("dim");
      const nb = e.target.closedNeighborhood();
      cy.elements().difference(nb).addClass("faded");
      nb.addClass("hl");
    });
    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("faded hl");
      applyEgo();
    });
    cy.on("tap", "edge", (e) => {
      const d = e.target.data();
      onSelect({ a: d.source, b: d.target, type: d.type });
    });
    // Tapping a node opens the detail for its STRONGEST incident pair (max |ρ|), so the whole
    // node is a hit target for the popover — not just the thin edge.
    cy.on("tap", "node", (e) => {
      const edges = e.target.connectedEdges();
      if (!edges.length) return;
      let best = edges[0];
      let bestEff = -Infinity;
      edges.forEach((ed) => {
        const eff = (ed.data("effect") as number | undefined) ?? 0;
        if (eff > bestEff) {
          bestEff = eff;
          best = ed;
        }
      });
      const d = best.data();
      onSelect({ a: d.source, b: d.target, type: d.type });
    });
    cy.on("tap", (e) => {
      if (e.target === cy) onSelect(null);
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, minW, maxW, onSelect, nodeLabel, focusId]);

  // reflect external (table-driven) selection; an explicit selection expands the ego view to
  // foreground the selected pair's neighborhood.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass("sel");
    if (selected) {
      const edge = cy.getElementById(pairKey(selected.a, selected.b));
      if (edge.length) {
        cy.elements().removeClass("dim");
        const nb = edge.connectedNodes().closedNeighborhood();
        cy.elements().difference(nb).addClass("dim");
        edge.addClass("sel");
        edge.connectedNodes().addClass("sel");
      }
    }
  }, [selected, elements]);

  // Accessible text alternative: the table is the source of truth, but summarize the graph for
  // screen readers so the canvas isn't a void.
  const nodeCount = useMemo(
    () => elements.filter((el) => (el.data as { source?: string }).source === undefined).length,
    [elements],
  );
  const edgeCount = elements.length - nodeCount;
  const ariaLabel = `Topology graph of ${nodeCount} genes and ${edgeCount} dependency edges (blue solid = mutually exclusive, amber dashed = co-occurring). The ranked table above lists every pair; use it to inspect or select.`;

  return (
    <div className="space-y-label">
      <div
        ref={surfaceRef}
        className="canvas-surface relative h-network w-full overflow-hidden"
      >
        <div
          ref={containerRef}
          role="img"
          aria-label={ariaLabel}
          className="h-full w-full"
        />
        {/* Floating overlay on >=640px; the full static legend renders below on mobile. */}
        <div className="hidden sm:block">
          <NetworkLegend floating />
        </div>
        <div className="absolute right-3 top-3 flex gap-label">
        <Button
          variant="outline"
          size="icon"
          aria-label="Re-run network layout"
          className="bg-card/80 text-muted-foreground-strong backdrop-blur-sm hover:text-foreground"
          onClick={() => cyRef.current?.layout(layoutOpts as never).run()}
        >
          <RefreshCw className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Fit network to view"
          className="bg-card/80 text-muted-foreground-strong backdrop-blur-sm hover:text-foreground"
          onClick={() => cyRef.current?.fit(undefined, 28)}
        >
          <Maximize2 className="size-3.5" />
        </Button>
        </div>
      </div>
      {/* Static legend beneath the canvas on mobile — never occludes the short graph. */}
      <div className="sm:hidden">
        <NetworkLegend />
      </div>
    </div>
  );
}
