import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InteractionNetwork } from "@/features/atlas/components/InteractionNetwork";
import type { DialectRow, Direction, InteractionResult } from "@/features/atlas/types";
import atlasStyles from "@/index.css?raw";

vi.mock("@/components/ui/theme", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

function result({
  id,
  ga,
  gb,
  direction,
  q,
}: {
  id: string;
  ga: string;
  gb: string;
  direction: Direction;
  q: number;
}): InteractionResult {
  const row = {
    ga,
    gb,
    direction,
    q,
    rank: 1,
    rho: direction === "ME" ? -0.45 : 0.35,
    lrt: direction === "CO" ? 12 : 0,
  } as DialectRow;
  return {
    id,
    ga,
    gb,
    direction,
    representative: row,
    matches: [{ bmr: "cbase", row, percentile: 0.01 }],
    pairEvidence: [{ bmr: "cbase", row }],
    mutsigFallbackFeatures: [],
    worstPercentile: 0.01,
    medianPercentile: 0.01,
  };
}

const me = result({
  id: "ME::KRAS_M::TP53_M",
  ga: "KRAS_M",
  gb: "TP53_M",
  direction: "ME",
  q: 0.001,
});
const co = result({
  id: "CO::EGFR_N::TP53_M",
  ga: "EGFR_N",
  gb: "TP53_M",
  direction: "CO",
  q: 0.005,
});
const resizeObserverMock = globalThis.ResizeObserver;
const domMatrixReadOnlyMock = window.DOMMatrixReadOnly;

describe("InteractionNetwork", () => {
  beforeEach(() => {
    class ImmediateResizeObserver implements ResizeObserver {
      constructor(private readonly callback: ResizeObserverCallback) {}

      observe(target: Element) {
        this.callback(
          [{ target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry],
          this,
        );
      }

      unobserve() {}
      disconnect() {}
    }

    globalThis.ResizeObserver = ImmediateResizeObserver;
    Object.defineProperty(window, "DOMMatrixReadOnly", {
      configurable: true,
      writable: true,
      value: class {
        readonly m22 = 1;
      },
    });
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(120);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(44);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 0,
      width: 120,
      height: 44,
      top: 0,
      right: 120,
      bottom: 44,
      left: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    globalThis.ResizeObserver = resizeObserverMock;
    Object.defineProperty(window, "DOMMatrixReadOnly", {
      configurable: true,
      writable: true,
      value: domMatrixReadOnlyMock,
    });
    vi.restoreAllMocks();
  });

  it("exposes draggable, focusable gene nodes and keeps a selected inspector pinned", async () => {
    render(
      <InteractionNetwork
        results={[me, co]}
        totalResults={2}
        mode="cbase"
        qThreshold={0.01}
        query=""
        onSelect={vi.fn()}
      />,
    );

    const tp53 = await screen.findByTestId("rf__node-TP53_M");
    expect(tp53).toHaveClass("draggable");
    expect(tp53).toHaveAttribute("tabindex", "0");
    expect(tp53).toHaveAttribute("aria-label", expect.stringMatching(/2 connections shown/i));
    await screen.findByTestId("rf__edge-ME::KRAS_M::TP53_M");

    fireEvent.mouseEnter(tp53);
    expect(await screen.findByText("2 connections shown · 1 ME · 1 CO")).toBeInTheDocument();

    fireEvent.click(tp53);
    fireEvent.mouseLeave(tp53);
    expect(screen.getByText("2 connections shown · 1 ME · 1 CO")).toBeInTheDocument();

    fireEvent.click(document.querySelector(".react-flow__pane")!);
    await waitFor(() => {
      expect(screen.queryByText("2 connections shown · 1 ME · 1 CO")).not.toBeInTheDocument();
    });

    fireEvent.keyDown(tp53, { key: "Enter" });
    expect(await screen.findByText("2 connections shown · 1 ME · 1 CO")).toBeInTheDocument();
  });

  it("exposes scientific edge evidence through a generous, focusable hit target", async () => {
    render(
      <InteractionNetwork
        results={[me, co]}
        totalResults={2}
        mode="cbase"
        qThreshold={0.01}
        query=""
        onSelect={vi.fn()}
      />,
    );

    const edge = await waitFor(() => {
      const element = document.querySelector<SVGGElement>(
        '.react-flow__edge[data-id="ME::KRAS_M::TP53_M"]',
      );
      expect(element).not.toBeNull();
      return element!;
    });
    expect(edge).toHaveAttribute("tabindex", "0");
    expect(edge).toHaveAccessibleName(/mutually exclusive; significant at q 0\.0010/i);
    expect(edge).toHaveClass("selectable");

    const visiblePath = edge.querySelector<SVGPathElement>(".react-flow__edge-path");
    const hitTarget = edge.querySelector<SVGPathElement>(".react-flow__edge-interaction");
    expect(visiblePath).not.toBeNull();
    expect(visiblePath).toHaveStyle({ cursor: "pointer", stroke: "var(--me)" });
    expect(hitTarget).not.toBeNull();
    expect(Number(hitTarget!.getAttribute("stroke-width"))).toBeGreaterThanOrEqual(20);

  });

  it("exposes the rounded zoom controls without a reset before movement", async () => {
    render(
      <InteractionNetwork
        results={[me]}
        totalResults={1}
        mode="cbase"
        qThreshold={0.01}
        query=""
        onSelect={vi.fn()}
      />,
    );

    expect(await screen.findByRole("button", { name: "Zoom out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fit network to view" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset node layout" })).not.toBeInTheDocument();

    expect(await screen.findByTestId("rf__node-KRAS_M")).toBeInTheDocument();
  });

  it("describes the supported keyboard actions without advertising deletion", async () => {
    render(
      <InteractionNetwork
        results={[me]}
        totalResults={1}
        mode="cbase"
        qThreshold={0.01}
        query=""
        onSelect={vi.fn()}
      />,
    );

    await screen.findByTestId("rf__node-KRAS_M");
    const nodeDescription = document.querySelector('[id^="react-flow__node-desc-"]');
    const edgeDescription = document.querySelector('[id^="react-flow__edge-desc-"]');
    expect(nodeDescription).toHaveTextContent(/use the arrow keys to move it/i);
    expect(edgeDescription).toHaveTextContent(/open its pair details/i);
    expect(nodeDescription).not.toHaveTextContent(/delete/i);
    expect(edgeDescription).not.toHaveTextContent(/delete/i);
  });

  it("keeps keyboard focus visible and the attribution legible", () => {
    expect(atlasStyles).toContain(
      ".react-flow__node-gene:focus-visible .network-gene-node",
    );
    expect(atlasStyles).toContain(
      ".react-flow__edge.selectable:focus-visible .react-flow__edge-path",
    );
    expect(atlasStyles).toMatch(
      /\.react-flow__attribution\s*\{[^}]*font-size:\s*10px;[^}]*opacity:\s*0\.92;/s,
    );
  });
});
