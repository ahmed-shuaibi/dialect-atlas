import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Edge, Node, ReactFlowProps } from "@xyflow/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InteractionNetwork } from "@/features/atlas/components/InteractionNetwork";
import type { DialectRow, InteractionResult } from "@/features/atlas/types";

const flowMocks = vi.hoisted(() => ({ fitView: vi.fn() }));

vi.mock("@xyflow/react", async () => {
  const actual = await vi.importActual<typeof import("@xyflow/react")>("@xyflow/react");

  function ReactFlowMock({
    nodes = [],
    edges = [],
    onNodesChange,
    onSelectionChange,
    children,
  }: ReactFlowProps<Node, Edge>) {
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            onNodesChange?.([
              {
                id: nodes[0]!.id,
                type: "position",
                position: { x: 600, y: 400 },
                dragging: false,
              },
            ])
          }
        >
          move node with keyboard
        </button>
        <button
          type="button"
          onClick={() => onSelectionChange?.({ nodes: [], edges: [edges[0]!] })}
        >
          select edge
        </button>
        {children}
      </div>
    );
  }

  return {
    ...actual,
    ReactFlow: ReactFlowMock,
    Panel: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    useNodesInitialized: () => true,
    useReactFlow: () => ({ fitView: flowMocks.fitView }),
  };
});

vi.mock("@/components/ui/theme", () => ({
  useTheme: () => ({ theme: "light", toggleTheme: vi.fn() }),
}));

const row = {
  ga: "KRAS_M",
  gb: "TP53_M",
  direction: "ME",
  q: 0.001,
  rank: 1,
  rho: -0.45,
  lrt: 0,
} as DialectRow;

const interaction: InteractionResult = {
  id: "ME::KRAS_M::TP53_M",
  ga: row.ga,
  gb: row.gb,
  direction: "ME",
  representative: row,
  matches: [{ bmr: "cbase", row, percentile: 0.01 }],
  pairEvidence: [{ bmr: "cbase", row }],
  mutsigFallbackFeatures: [],
  worstPercentile: 0.01,
  medianPercentile: 0.01,
};

describe("InteractionNetwork controlled behavior", () => {
  beforeEach(() => {
    flowMocks.fitView.mockReset();
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("syncs React Flow edge selection into the scientific inspector", async () => {
    render(
      <InteractionNetwork
        results={[interaction]}
        totalResults={1}
        mode="cbase"
        qThreshold={0.01}
        query=""
        onSelect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "select edge" }));

    expect(await screen.findByText("Mutually exclusive")).toBeInTheDocument();
    expect(screen.getByText("q 0.0010")).toBeInTheDocument();
  });

  it("marks keyboard position changes dirty and refits only after reset", async () => {
    render(
      <InteractionNetwork
        results={[interaction]}
        totalResults={1}
        mode="cbase"
        qThreshold={0.01}
        query=""
        onSelect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "move node with keyboard" }));
    const reset = await screen.findByRole("button", { name: "Reset node layout" });
    const fitCallsBeforeReset = flowMocks.fitView.mock.calls.length;

    fireEvent.click(reset);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Reset node layout" })).not.toBeInTheDocument();
      expect(flowMocks.fitView.mock.calls.length).toBeGreaterThan(fitCallsBeforeReset);
    });
  });
});
