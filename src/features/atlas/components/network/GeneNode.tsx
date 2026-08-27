import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GeneNode, GeneNodeData } from "@/features/atlas/components/network/types";
import { cn } from "@/lib/utils";

const CENTERED_HANDLE_STYLE = {
  width: 1,
  height: 1,
  left: "50%",
  top: "50%",
  border: 0,
  background: "transparent",
  pointerEvents: "none" as const,
  transform: "translate(-50%, -50%)",
};

export function effectLabel(effect: GeneNodeData["effect"]): string {
  if (effect === "M") return "Missense effect";
  if (effect === "N") return "Nonsense effect";
  return "Gene effect";
}

function GeneNodeView({ data, selected }: NodeProps<GeneNode>) {
  return (
    <div
      className={cn(
        "network-gene-node min-w-[96px] rounded-full border border-line bg-[var(--network-node)] px-4 py-2.5 text-center font-mono text-[15px] font-medium text-ink shadow-sm transition-[border-color,box-shadow,opacity,transform]",
        data.likelyPassenger && "border-passenger shadow-[0_0_0_4px_var(--passenger-soft)]",
        (data.active || selected) && "border-brand shadow-[0_0_0_4px_var(--brand-soft)]",
        data.dimmed && "opacity-35",
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={CENTERED_HANDLE_STYLE}
        isConnectable={false}
      />
      <span>{data.label}</span>
      {data.effect && <span className="ml-1 text-[10px] text-muted">{data.effect}</span>}
      <Handle
        type="source"
        position={Position.Right}
        style={CENTERED_HANDLE_STYLE}
        isConnectable={false}
      />
    </div>
  );
}

export const NETWORK_NODE_TYPES = { gene: GeneNodeView };
