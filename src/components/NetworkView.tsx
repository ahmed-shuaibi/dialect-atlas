import { useEffect, useRef, type ReactNode } from "react";
import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import fcose from "cytoscape-fcose";
import { Maximize2, RefreshCw } from "lucide-react";
import { NetworkLegend } from "@/components/NetworkLegend";

cytoscape.use(fcose);

const ME = "#4ea3df";
const CO = "#e9a13b";
const NODE = "#6c7783";
const NODE_DRIVER = "#8ab2c0";
const LABEL = "#e4e4e7";
const HALO = "#050505";

const layoutOpts = {
  name: "fcose",
  quality: "default",
  randomize: true,
  animate: true,
  animationDuration: 600,
  nodeRepulsion: 8500,
  idealEdgeLength: 95,
  nodeSeparation: 90,
  gravity: 0.2,
  numIter: 2500,
  padding: 36,
};

export interface NetSelection {
  a: string;
  b: string;
  type: "ME" | "CO";
}

export function NetworkView({
  elements,
  minW,
  maxW,
  selected,
  onSelect,
}: {
  elements: ElementDefinition[];
  minW: number;
  maxW: number;
  selected: NetSelection | null;
  onSelect: (s: NetSelection | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const lo = minW;
    const hi = maxW > minW ? maxW : minW + 0.001;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      minZoom: 0.2,
      maxZoom: 3,
      style: [
        {
          selector: "node",
          style: {
            "background-color": NODE,
            "background-opacity": 0.92,
            "border-width": 1.5,
            "border-color": "#2b3640",
            width: `mapData(w, ${lo}, ${hi}, 22, 60)`,
            height: `mapData(w, ${lo}, ${hi}, 22, 60)`,
            label: "data(id)",
            "font-family": "IBM Plex Mono, monospace",
            "font-size": 11,
            "font-weight": 500,
            color: LABEL,
            "text-valign": "center",
            "text-halign": "center",
            "text-outline-width": 2.5,
            "text-outline-color": HALO,
            "min-zoomed-font-size": 7,
          },
        },
        { selector: "node[?driver]", style: { "background-color": NODE_DRIVER } },
        {
          selector: 'edge[type="ME"]',
          style: {
            "line-color": ME,
            "line-style": "solid",
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

    // ensure the canvas picks up the container size + frames the graph once laid out
    requestAnimationFrame(() => cy.resize());
    cy.one("layoutstop", () => cy.fit(undefined, 36));

    cy.on("mouseover", "node", (e) => {
      const nb = e.target.closedNeighborhood();
      cy.elements().difference(nb).addClass("faded");
      nb.addClass("hl");
    });
    cy.on("mouseout", "node", () => cy.elements().removeClass("faded hl"));
    cy.on("tap", "edge", (e) => {
      const d = e.target.data();
      onSelect({ a: d.source, b: d.target, type: d.type });
    });
    cy.on("tap", (e) => {
      if (e.target === cy) onSelect(null);
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, minW, maxW, onSelect]);

  // reflect external (table-driven) selection
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass("sel");
    if (selected) {
      const edge = cy.getElementById([selected.a, selected.b].sort().join("|"));
      if (edge.length) {
        edge.addClass("sel");
        edge.connectedNodes().addClass("sel");
      }
    }
  }, [selected, elements]);

  return (
    <div className="canvas-surface relative h-[600px] w-full overflow-hidden">
      <div ref={containerRef} className="h-full w-full" />
      <NetworkLegend />
      <div className="absolute right-3 top-3 flex gap-1.5">
        <IconBtn title="Re-run layout" onClick={() => cyRef.current?.layout(layoutOpts as never).run()}>
          <RefreshCw className="size-3.5" />
        </IconBtn>
        <IconBtn title="Fit to view" onClick={() => cyRef.current?.fit(undefined, 36)}>
          <Maximize2 className="size-3.5" />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick }: { children: ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="focus-ring flex size-8 items-center justify-center rounded-md border border-border bg-card/80 text-muted-foreground-strong backdrop-blur-sm transition-colors hover:text-foreground"
    >
      {children}
    </button>
  );
}
