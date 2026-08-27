import { Panel } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { resultEffectText } from "@/features/atlas/components/explore-display";
import { effectLabel } from "@/features/atlas/components/network/GeneNode";
import type { GeneNodeData } from "@/features/atlas/components/network/types";
import type { NetworkLayoutEdge } from "@/features/atlas/components/network-layout";
import {
  baseGene,
  backgroundSupport,
  consensusQLabel,
  fmtQ,
} from "@/features/atlas/lib/atlas-transform";
import type { AtlasMode, BmrCount, InteractionResult } from "@/features/atlas/types";
import { cn } from "@/lib/utils";

export function NetworkInspector({
  node,
  result,
  edge,
  mode,
  qThreshold,
  minSignificantBmrs,
  onSelect,
}: {
  node: GeneNodeData | null;
  result: InteractionResult | null;
  edge: NetworkLayoutEdge | null;
  mode: AtlasMode;
  qThreshold: number;
  minSignificantBmrs: BmrCount;
  onSelect: (result: InteractionResult) => void;
}) {
  if (!node && (!result || !edge)) return null;
  const support = result ? backgroundSupport(result, qThreshold) : null;
  const qLabel = mode === "consensus" ? consensusQLabel(minSignificantBmrs) : "q";
  return (
    <Panel position="top-left" className="m-4 max-w-[min(22rem,calc(100vw-5rem))]">
      <div
        className="rounded-[20px] border border-line bg-paper/95 p-4 text-ink shadow-soft backdrop-blur"
        role="status"
        aria-live="polite"
      >
        {node ? (
          <>
            <p className="font-mono text-base font-semibold">{node.gene}</p>
            <p className="mt-1 text-sm text-muted">{effectLabel(node.effect)}</p>
            {node.likelyPassenger && (
              <p className="mt-2 text-sm font-semibold text-passenger">
                Likely passenger gene effect
              </p>
            )}
            <p className="mt-3 text-sm font-medium">
              {node.shownDegree} connections shown · {node.meCount} ME · {node.coCount} CO
            </p>
          </>
        ) : result && edge ? (
          <>
            <p className="font-mono text-sm font-semibold">
              {baseGene(result.ga)} / {baseGene(result.gb)}
            </p>
            <p
              className={cn(
                "mt-1 text-sm font-semibold",
                result.direction === "ME" ? "text-me" : "text-co",
              )}
            >
              {result.direction === "ME" ? "Mutually exclusive" : "Co-occurring"}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted">
              <span>{qLabel} {fmtQ(edge.q)}</span>
              <span>{resultEffectText(result, mode)}</span>
              <span>{support?.identified}/{support?.independent} identified</span>
              <span>{support?.significant}/{support?.independent} significant</span>
            </div>
            <Button
              type="button"
              variant="soft"
              size="sm"
              className="mt-4"
              onClick={() => onSelect(result)}
            >
              Open pair details
            </Button>
          </>
        ) : null}
      </div>
    </Panel>
  );
}
