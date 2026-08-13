import { create } from "zustand";
import type { Node, Script } from "@/lib/db/schema";

type StoryState = {
  script: Script | null;
  nodes: Node[];
  currentNodeId: string | null;
  hydrate: (script: Script, nodes: Node[]) => void;
  setCurrent: (nodeId: string) => void;
  addNode: (node: Node) => void;
  patchNode: (nodeId: string, patch: Partial<Node>) => void;
};

export const useStoryStore = create<StoryState>((set, get) => ({
  script: null,
  nodes: [],
  currentNodeId: null,

  hydrate: (script, nodes) => {
    const current = pickInitialCurrent(nodes);
    set({ script, nodes, currentNodeId: current });
  },

  setCurrent: (nodeId) => set({ currentNodeId: nodeId }),

  addNode: (node) =>
    set({
      nodes: [...get().nodes, node],
      currentNodeId: node.id,
    }),

  patchNode: (nodeId, patch) =>
    set({
      nodes: get().nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
    }),
}));

function pickInitialCurrent(nodes: Node[]): string | null {
  if (!nodes.length) return null;
  const ready = [...nodes]
    .filter((n) => n.status === "ready")
    .sort((a, b) => +b.createdAt - +a.createdAt);
  if (ready[0]) return ready[0].id;
  return nodes[nodes.length - 1].id;
}
