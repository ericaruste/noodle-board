import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  reconnectEdge,
  useReactFlow,
  useStoreApi,
  type Connection,
  type DefaultEdgeOptions,
  type Edge,
  type FinalConnectionState,
  type HandleType,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Toolbar from "./Toolbar";
import StickyNode, { type StickyColor, type StickyData } from "./StickyNode";
import ImageNode from "./ImageNode";
import EndpointNode from "./EndpointNode";
import NoodleEdge from "./NoodleEdge";
import PortMagnet from "./PortMagnet";
import { getHotPort } from "./portHot";
import {
  END_RADIUS,
  ENDPOINT_SIZE,
  ENDPOINT_TYPE,
  PORT_SCREEN_RADIUS,
  allowsPort,
  connectionForDrop,
  connectionForPark,
  draggedEnd,
  makeEndpoint,
  pointFromEvent,
  pruneEndpoints,
  sameEnds,
} from "./noodleEnds";

const STORAGE_KEY = "noodle-board";
const MAX_HISTORY = 50;

const nodeTypes = { sticky: StickyNode, image: ImageNode, endpoint: EndpointNode };
const edgeTypes = { smoothstep: NoodleEdge };

/** Above React Flow's selected-node z-index (1000), so noodles paint over images. */
const NOODLE_Z_INDEX = 1001;

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  zIndex: NOODLE_Z_INDEX,
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: "#334155" },
  style: { strokeWidth: 2 },
};

type Snapshot = { nodes: Node[]; edges: Edge[] };

function cloneSnapshot(nodes: Node[], edges: Edge[]): Snapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

function loadCanvas(): Snapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { nodes: [], edges: [] };
    const parsed = JSON.parse(raw) as Snapshot;
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const edges = Array.isArray(parsed.edges) ? parsed.edges : [];
    return { nodes: pruneEndpoints(nodes, edges), edges };
  } catch {
    return { nodes: [], edges: [] };
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const max = 320;
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      resolve({
        width: Math.max(80, Math.round(img.naturalWidth * scale)),
        height: Math.max(80, Math.round(img.naturalHeight * scale)),
      });
    };
    img.onerror = reject;
    img.src = src;
  });
}

function Board() {
  const stored = useMemo(() => loadCanvas(), []);
  const [nodes, setNodes] = useState<Node[]>(stored.nodes);
  const [edges, setEdges] = useState<Edge[]>(stored.edges);
  const { screenToFlowPosition, getViewport } = useReactFlow();
  const store = useStoreApi();
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const applyingHistory = useRef(false);
  const dragSnapshotTaken = useRef(false);
  const reconnectRef = useRef<{ edge: Edge; dragged: HandleType } | null>(null);
  const rfConnectionRef = useRef<Connection | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  const takeSnapshot = useCallback(() => {
    if (applyingHistory.current) return;
    pastRef.current.push(cloneSnapshot(nodesRef.current, edgesRef.current));
    if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift();
    futureRef.current = [];
  }, []);

  useEffect(() => {
    window.addEventListener("noodle-snapshot", takeSnapshot);
    return () => window.removeEventListener("noodle-snapshot", takeSnapshot);
  }, [takeSnapshot]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nodes, edges }),
    );
  }, [nodes, edges]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const { id, data } = (event as CustomEvent<{ id: string; data: StickyData }>).detail;
      setNodes((current) =>
        current.map((node) => (node.id === id ? { ...node, data } : node)),
      );
    };
    window.addEventListener("noodle-update-node", onUpdate);
    return () => window.removeEventListener("noodle-update-node", onUpdate);
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (changes.some((change) => change.type === "remove")) takeSnapshot();
      setNodes((current) => applyNodeChanges(changes, current));
    },
    [takeSnapshot],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const removed = changes.some((change) => change.type === "remove");
      if (removed) takeSnapshot();
      const next = applyEdgeChanges(changes, edgesRef.current);
      edgesRef.current = next;
      setEdges(next);
      if (removed) setNodes((current) => pruneEndpoints(current, next));
    },
    [takeSnapshot],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      takeSnapshot();
      setEdges((current) => addEdge(connection, current));
    },
    [takeSnapshot],
  );

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    if (!connection.source || !connection.target) return false;
    if (
      connection.source === connection.target &&
      (connection.sourceHandle ?? null) === (connection.targetHandle ?? null)
    ) {
      return false;
    }
    const active = reconnectRef.current;
    if (!active) {
      return !nodesRef.current.some(
        (node) =>
          (node.id === connection.source || node.id === connection.target) &&
          node.type === ENDPOINT_TYPE,
      );
    }
    return allowsPort(nodesRef.current, active.dragged, connection);
  }, []);

  const applyReconnect = useCallback(
    (edge: Edge, connection: Connection) => {
      if (sameEnds(edge, connection)) return;
      takeSnapshot();
      const nextEdges = reconnectEdge(edge, connection, edgesRef.current, {
        shouldReplaceId: false,
      });
      edgesRef.current = nextEdges;
      setEdges(nextEdges);
      setNodes((current) => pruneEndpoints(current, nextEdges));
    },
    [takeSnapshot],
  );

  const parkEnd = useCallback(
    (edge: Edge, dragged: HandleType, point: { x: number; y: number }) => {
      const flow = screenToFlowPosition(point);
      const position = {
        x: flow.x - ENDPOINT_SIZE / 2,
        y: flow.y - ENDPOINT_SIZE / 2,
      };
      const currentId = dragged === "source" ? edge.source : edge.target;
      const existing = nodesRef.current.find(
        (node) => node.id === currentId && node.type === ENDPOINT_TYPE,
      );
      takeSnapshot();
      if (existing) {
        setNodes((current) =>
          current.map((node) => (node.id === existing.id ? { ...node, position } : node)),
        );
        return;
      }
      const id = `end-${crypto.randomUUID()}`;
      const connection = connectionForPark(edge, dragged, id);
      const nextEdges = reconnectEdge(edge, connection, edgesRef.current, {
        shouldReplaceId: false,
      });
      edgesRef.current = nextEdges;
      setNodes((current) => [...current, makeEndpoint(id, position)]);
      setEdges(nextEdges);
    },
    [screenToFlowPosition, takeSnapshot],
  );

  const onReconnectStart = useCallback(
    (event: ReactMouseEvent, edge: Edge, handleType: HandleType) => {
      void event;
      reconnectRef.current = { edge, dragged: draggedEnd(handleType) };
      rfConnectionRef.current = null;
    },
    [],
  );

  const onReconnect = useCallback((edge: Edge, connection: Connection) => {
    void edge;
    rfConnectionRef.current = connection;
  }, []);

  const onReconnectEnd = useCallback(
    (
      event: MouseEvent | TouchEvent,
      edge: Edge,
      handleType: HandleType,
      connectionState: FinalConnectionState,
    ) => {
      const dragged = reconnectRef.current?.dragged ?? draggedEnd(handleType);
      const rf = rfConnectionRef.current;
      reconnectRef.current = null;
      rfConnectionRef.current = null;

      const hot = getHotPort();
      const hotConnection = hot ? connectionForDrop(edge, dragged, hot) : null;
      if (hotConnection && allowsPort(nodesRef.current, dragged, hotConnection)) {
        applyReconnect(edge, hotConnection);
        return;
      }
      if (hotConnection) return;

      if (rf && allowsPort(nodesRef.current, dragged, rf)) {
        applyReconnect(edge, rf);
        return;
      }

      if (connectionState.isValid === false) {
        const toId = connectionState.toHandle?.nodeId;
        const blockedByEndpoint = nodesRef.current.some(
          (node) => node.id === toId && node.type === ENDPOINT_TYPE,
        );
        if (!blockedByEndpoint) return;
      }

      if (connectionState.from && connectionState.pointer) {
        const [tx, ty, zoom] = store.getState().transform;
        const px = (connectionState.pointer.x - tx) / zoom;
        const py = (connectionState.pointer.y - ty) / zoom;
        const distance = Math.hypot(px - connectionState.from.x, py - connectionState.from.y);
        if (zoom > 0 && distance <= PORT_SCREEN_RADIUS / zoom) return;
      }

      parkEnd(edge, dragged, pointFromEvent(event));
    },
    [applyReconnect, parkEnd, store],
  );

  const canvasCenter = useCallback(() => {
    const { x, y, zoom } = getViewport();
    return {
      x: (-x + window.innerWidth / 2) / zoom - 90,
      y: (-y + window.innerHeight / 2) / zoom - 90,
    };
  }, [getViewport]);

  const addSticky = useCallback(() => {
    takeSnapshot();
    const colors: StickyColor[] = ["yellow", "pink", "blue", "green"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    setNodes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: "sticky",
        position: canvasCenter(),
        style: { width: 180, height: 180 },
        data: { text: "", color },
      },
    ]);
  }, [canvasCenter, takeSnapshot]);

  const addImageAt = useCallback(
    async (file: File, position?: { x: number; y: number }) => {
      if (!file.type.startsWith("image/")) return;
      const src = await fileToDataUrl(file);
      const size = await imageSize(src);
      takeSnapshot();
      setNodes((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type: "image",
          position: position ?? canvasCenter(),
          style: { width: size.width, height: size.height },
          data: { src },
        },
      ]);
    },
    [canvasCenter, takeSnapshot],
  );

  const deleteSelected = useCallback(() => {
    const selectedNodes = nodesRef.current.filter((node) => node.selected);
    const selectedEdges = edgesRef.current.filter((edge) => edge.selected);
    if (!selectedNodes.length && !selectedEdges.length) return;
    takeSnapshot();
    const removed = new Set(selectedNodes.map((node) => node.id));
    const nextEdges = edgesRef.current.filter(
      (edge) => !edge.selected && !removed.has(edge.source) && !removed.has(edge.target),
    );
    const nextNodes = pruneEndpoints(
      nodesRef.current.filter((node) => !node.selected),
      nextEdges,
    );
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [takeSnapshot]);

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.push(cloneSnapshot(nodesRef.current, edgesRef.current));
    applyingHistory.current = true;
    nodesRef.current = previous.nodes;
    edgesRef.current = previous.edges;
    setNodes(previous.nodes);
    setEdges(previous.edges);
    queueMicrotask(() => {
      applyingHistory.current = false;
    });
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(cloneSnapshot(nodesRef.current, edgesRef.current));
    applyingHistory.current = true;
    nodesRef.current = next.nodes;
    edgesRef.current = next.edges;
    setNodes(next.nodes);
    setEdges(next.edges);
    queueMicrotask(() => {
      applyingHistory.current = false;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) void addImageAt(file);
          event.preventDefault();
          break;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [addImageAt]);

  const canDelete =
    nodes.some((node) => node.selected) || edges.some((edge) => edge.selected);

  return (
    <div
        className="h-full w-full bg-stone-100"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files[0];
          if (!file) return;
          const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          void addImageAt(file, position);
        }}
      >
        <Toolbar
          onAddSticky={addSticky}
          onAddImage={(file) => void addImageAt(file)}
          onDelete={deleteSelected}
          canDelete={canDelete}
        />
        <PortMagnet />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onReconnectStart={onReconnectStart}
          onReconnectEnd={onReconnectEnd}
          isValidConnection={isValidConnection}
          defaultEdgeOptions={defaultEdgeOptions}
          elevateEdgesOnSelect
          reconnectRadius={END_RADIUS}
          connectionRadius={PORT_SCREEN_RADIUS}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineContainerStyle={{ zIndex: NOODLE_Z_INDEX }}
          connectionMode={ConnectionMode.Loose}
          fitView={stored.nodes.length > 0}
          minZoom={0.15}
          maxZoom={3}
          panOnScroll
          panOnDrag
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Shift"
          deleteKeyCode={["Delete", "Backspace"]}
          onNodeDragStart={() => {
            if (dragSnapshotTaken.current) return;
            dragSnapshotTaken.current = true;
            takeSnapshot();
          }}
          onNodeDragStop={() => {
            dragSnapshotTaken.current = false;
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            id="dots"
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1.6}
            color="#c4b5a5"
          />
          <MiniMap
            pannable
            zoomable
            nodeStrokeWidth={2}
            maskColor="rgba(28, 25, 23, 0.12)"
            className="!bg-white"
          />
        </ReactFlow>
        <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow">
          Noodle Board
        </div>
      </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Board />
    </ReactFlowProvider>
  );
}
