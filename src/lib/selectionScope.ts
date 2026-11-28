import { useStore, type Edge, type Node } from "@xyflow/react";
import { ENDPOINT_TYPE } from "./noodleEnds";

/** Selected elements and noodles. Endpoint nodes are part of a noodle, not their own object. */
export function selectedObjectCount(nodes: readonly Node[], edges: readonly Edge[]) {
  let count = 0;
  for (const node of nodes) {
    if (node.selected && node.type !== ENDPOINT_TYPE) count += 1;
  }
  for (const edge of edges) {
    if (edge.selected) count += 1;
  }
  return count;
}

export function useSelectedObjectCount() {
  return useStore((state) => selectedObjectCount(state.nodes, state.edges));
}
