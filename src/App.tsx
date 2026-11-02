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
import AlignmentGuides from "./AlignmentGuides";
import { alignNodeChanges, sameGuides, type DragAxisLock, type FlowBox, type GuideLine } from "./alignSnap";
import SaveToolbar from "./SaveToolbar";
import Toolbar from "./Toolbar";
import {
  ensureReadWritePermission,
  isMissingFileError,
  isNoodleProjectFile,
  pickNoodleProjectFile,
  projectNameFromFileName,
  readNoodleProjectFile,
  saveNoodleProject,
  visibleOpenError,
  writeBoundNoodleFile,
  type NoodleViewport,
} from "./noodleFile";
import { listRecents, markRecentUnavailable, rememberRecent, type RecentProject } from "./recents";
import StickyNode, { type StickyColor } from "./StickyNode";
import ShapeNode from "./ShapeNode";
import {
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  SHAPE_DEFAULT_HEIGHT,
  SHAPE_DEFAULT_WIDTH,
  type ShapeKind,
} from "./shapeData";
import TextNode from "./TextNode";
import { emptyBody } from "./textBody";
import ImageNode from "./ImageNode";
import EndpointNode from "./EndpointNode";
import NoodleEdge from "./NoodleEdge";
import ConnectMode from "./ConnectMode";
import PortMagnet, { nearestPort, portAtClient } from "./PortMagnet";
import { isSide, reflowAttachments, sameAttachmentPoint, sameFraction } from "./attachment";
import { NOODLE_EDGE_EVENT, applyNoodleData, defaultNoodleData, noodleStrokeStyle, readNoodle } from "./noodleData";
import { clearConnectionOrigin, getConnectionOrigin, getHotPort, setConnectionOrigin, setHotPort } from "./portHot";
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
import {
  NODE_CLIPBOARD_MARKER,
  appendMissing,
  duplicateGraph,
  nextDuplicateStep,
  pasteClipboard,
  repeatFromDrag,
  takeClipboard,
  type NodeClipboard,
  type RepeatMemory,
} from "./duplicate";

const STORAGE_KEY = "noodle-board";
const MAX_HISTORY = 50;
const AUTOSAVE_MS = 700;

const nodeTypes = {
  sticky: StickyNode,
  image: ImageNode,
  text: TextNode,
  shape: ShapeNode,
  endpoint: EndpointNode,
};
const edgeTypes = { smoothstep: NoodleEdge };

/** Above React Flow's selected-node z-index (1000), so noodles paint over images. */
const NOODLE_Z_INDEX = 1001;

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  zIndex: NOODLE_Z_INDEX,
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: "#334155" },
  style: { strokeWidth: 2 },
};

type Snapshot = {
  nodes: Node[];
  edges: Edge[];
  viewport?: NoodleViewport;
  documentName?: string;
  fileHandle?: FileSystemFileHandle | null;
  recentId?: string | null;
};

function cloneSnapshot(nodes: Node[], edges: Edge[]): Snapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}

function fractionFor(end: "source" | "target", connection: Connection | Edge) {
  const nodeId = end === "source" ? connection.source : connection.target;
  const handleId = end === "source" ? connection.sourceHandle : connection.targetHandle;
  if (!isSide(handleId)) return 0.5;
  if (end === "source") {
    const from = getConnectionOrigin();
    if (from && from.nodeId === nodeId && from.handleId === handleId) return from.fraction;
  }
  const hot = getHotPort();
  if (hot && hot.nodeId === nodeId && (hot.handleId ?? null) === (handleId ?? null) && hot.fraction != null) {
    return hot.fraction;
  }
  return 0.5;
}

/** True when a reconnect would put both ends on the same point. The stationary end keeps its stored fraction. */
function reconnectsToSamePoint(
  edge: Edge,
  connection: Connection,
  dragged: "source" | "target",
  dropFraction: number | undefined,
) {
  const data = readNoodle(edge.data);
  return sameAttachmentPoint(
    connection.source,
    connection.sourceHandle,
    dragged === "source" ? dropFraction : data.sourceFraction,
    connection.target,
    connection.targetHandle,
    dragged === "target" ? dropFraction : data.targetFraction,
  );
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

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (isTypingTarget(target)) return true;
  return target instanceof Element && Boolean(target.closest("[data-noodle-toolbar]"));
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
      const longSide = Math.max(img.naturalWidth, img.naturalHeight);
      const scale = longSide > 0 ? Math.min(1, 320 / longSide) : 1;
      // A sub-pixel side would round to 0 and leave the node with no box.
      resolve({
        width: Math.max(1, Math.round(img.naturalWidth * scale)),
        height: Math.max(1, Math.round(img.naturalHeight * scale)),
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
  const { screenToFlowPosition, getViewport, setViewport } = useReactFlow();
  const store = useStoreApi();
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const applyingHistory = useRef(false);
  const dragSnapshotTaken = useRef(false);
  const dragNodeIdRef = useRef<string | null>(null);
  const repeatRef = useRef<RepeatMemory | null>(null);
  const altDragRef = useRef<{
    nodeId: string;
    origin: { x: number; y: number };
    ids: Set<string>;
    settled: boolean;
    previous: RepeatMemory | null;
  } | null>(null);
  const parkedCopiesRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const clipboardRef = useRef<NodeClipboard | null>(null);
  const shiftHeldRef = useRef(false);
  const rawDragRef = useRef<Map<string, { x: number; y: number }> | null>(null);
  const resizeOriginRef = useRef(new Map<string, FlowBox>());
  const snappedSizeRef = useRef(new Map<string, { width: number; height: number }>());
  const guidesRef = useRef<GuideLine[]>([]);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const reconnectRef = useRef<{ edge: Edge; dragged: HandleType } | null>(null);
  const rfConnectionRef = useRef<Connection | null>(null);
  const documentNameRef = useRef("Untitled");
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const savingRef = useRef(false);
  const openingRef = useRef(false);
  const recentsRef = useRef<RecentProject[]>([]);
  const autosaveTimerRef = useRef<number | null>(null);
  const suppressAutosaveRef = useRef(false);
  const blockMoveAutosaveRef = useRef(false);
  const boundRecentIdRef = useRef<string | null>(null);
  const autosaveErrorRef = useRef<string | null>(null);
  const fileErrorRef = useRef<string | null>(null);
  const flushAutosaveRef = useRef<() => void>(() => {});
  const [connectMode, setConnectMode] = useState(false);
  const connectModeRef = useRef(false);
  const suppressConnectRef = useRef(false);
  const [documentName, setDocumentName] = useState("Untitled");
  const [fileError, setFileError] = useState<string | null>(null);
  const [boundHandle, setBoundHandle] = useState<FileSystemFileHandle | null>(null);
  const [recents, setRecents] = useState<RecentProject[]>([]);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  useEffect(() => {
    connectModeRef.current = connectMode;
  }, [connectMode]);

  useEffect(() => {
    fileErrorRef.current = fileError;
  }, [fileError]);

  useEffect(() => {
    recentsRef.current = recents;
  }, [recents]);

  const rememberBoard = useCallback(
    (view?: {
      viewport: NoodleViewport;
      documentName: string;
      fileHandle: FileSystemFileHandle | null;
      recentId: string | null;
    }) => {
      if (applyingHistory.current) return;
      const snapshot = cloneSnapshot(nodesRef.current, edgesRef.current);
      if (view) {
        snapshot.viewport = view.viewport;
        snapshot.documentName = view.documentName;
        snapshot.fileHandle = view.fileHandle;
        snapshot.recentId = view.recentId;
      }
      pastRef.current.push(snapshot);
      if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift();
      futureRef.current = [];
    },
    [],
  );

  const takeSnapshot = useCallback(() => {
    rememberBoard();
  }, [rememberBoard]);

  const placeViewport = useCallback(
    (viewport: NoodleViewport) => {
      store.setState({ fitViewQueued: false });
      void setViewport(viewport);
      requestAnimationFrame(() => {
        store.setState({ fitViewQueued: false });
        void setViewport(viewport);
      });
    },
    [setViewport, store],
  );

  useEffect(() => {
    window.addEventListener("noodle-snapshot", takeSnapshot);
    return () => window.removeEventListener("noodle-snapshot", takeSnapshot);
  }, [takeSnapshot]);

  useEffect(() => {
    // Untitled draft. A bound file is debounce-written instead, so this copy stays put.
    if (boundHandle) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nodes, edges }),
    );
  }, [nodes, edges, boundHandle]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const { id, data, height, width } = (
        event as CustomEvent<{ id: string; data?: Node["data"]; height?: number; width?: number }>
      ).detail;
      setNodes((current) => {
        let changed = false;
        const next = current.map((node) => {
          if (node.id !== id) return node;
          let updated = data === undefined ? node : { ...node, data };
          if (data !== undefined) changed = true;
          if (typeof height === "number") {
            const currentHeight = typeof updated.height === "number" ? updated.height : Number(updated.style?.height ?? 0);
            const styleHeight = Number(updated.style?.height ?? 0);
            if (Math.abs(currentHeight - height) > 1 || Math.abs(styleHeight - height) > 1) {
              changed = true;
              updated = { ...updated, height, style: { ...updated.style, height } };
            }
          }
          if (typeof width === "number") {
            const currentWidth = typeof updated.width === "number" ? updated.width : Number(updated.style?.width ?? 0);
            const styleWidth = Number(updated.style?.width ?? 0);
            if (Math.abs(currentWidth - width) > 1 || Math.abs(styleWidth - width) > 1) {
              changed = true;
              updated = { ...updated, width, style: { ...updated.style, width } };
            }
          }
          return updated;
        });
        return changed ? next : current;
      });
    };
    window.addEventListener("noodle-update-node", onUpdate);
    return () => window.removeEventListener("noodle-update-node", onUpdate);
  }, []);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string; data?: unknown }>).detail;
      if (!detail?.id) return;
      const data = detail.data;
      if (!data || typeof data !== "object") return;
      let changed = false;
      const next = edgesRef.current.map((edge) => {
        if (edge.id !== detail.id) return edge;
        changed = true;
        return applyNoodleData(edge, readNoodle(data));
      });
      if (!changed) return;
      edgesRef.current = next;
      setEdges(next);
    };
    window.addEventListener(NOODLE_EDGE_EVENT, onUpdate);
    return () => window.removeEventListener(NOODLE_EDGE_EVENT, onUpdate);
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (changes.some((change) => change.type === "remove")) takeSnapshot();
      const dragEnded = changes.some((change) => change.type === "position" && change.dragging === false);
      const parkedNodes = parkedCopiesRef.current?.nodes;
      const alt = dragEnded ? altDragRef.current : null;
      const dragId = dragNodeIdRef.current;
      const axisLock: DragAxisLock | null =
        altDragRef.current && shiftHeldRef.current
          ? { origin: altDragRef.current.origin, primaryId: altDragRef.current.nodeId }
          : null;
      if (altDragRef.current) {
        const raw = new Map<string, { x: number; y: number }>();
        for (const change of changes) {
          if (change.type === "position" && change.position) {
            raw.set(change.id, { x: change.position.x, y: change.position.y });
          }
        }
        if (raw.size > 0) rawDragRef.current = raw;
      }
      setNodes((current) => {
        const base = appendMissing(current, parkedNodes);
        const aligned = alignNodeChanges(
          base,
          changes,
          dragEnded ? dragId : dragNodeIdRef.current,
          resizeOriginRef.current,
          snappedSizeRef.current,
          axisLock,
        );
        if (aligned.guides && !sameGuides(guidesRef.current, aligned.guides)) {
          guidesRef.current = aligned.guides;
        }
        const next = applyNodeChanges(aligned.changes, base);
        nodesRef.current = next;
        if (alt && (altDragRef.current === null || altDragRef.current === alt)) {
          alt.settled = true;
          const memory = repeatFromDrag(next, alt.nodeId, alt.origin, alt.ids);
          repeatRef.current = memory ?? alt.previous;
        }
        return next;
      });
    },
    [takeSnapshot],
  );

  useEffect(() => {
    const applyShift = (held: boolean) => {
      if (shiftHeldRef.current === held) return;
      shiftHeldRef.current = held;
      const alt = altDragRef.current;
      const raw = rawDragRef.current;
      if (!alt || !raw || raw.size === 0) return;
      onNodesChange(
        [...raw.entries()].map(([id, position]) => ({
          id,
          type: "position",
          position: { x: position.x, y: position.y },
          dragging: true,
        })),
      );
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Shift") applyShift(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift") applyShift(false);
    };
    const onBlur = () => applyShift(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [onNodesChange]);

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const removed = changes.some((change) => change.type === "remove");
      if (removed) takeSnapshot();
      const parkedEdges = parkedCopiesRef.current?.edges;
      const base = appendMissing(edgesRef.current, parkedEdges);
      const changed = applyEdgeChanges(changes, base);
      const next = removed ? reflowAttachments(changed) : changed;
      edgesRef.current = next;
      setEdges(next);
      if (removed) setNodes((current) => pruneEndpoints(current, next));
    },
    [takeSnapshot],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (suppressConnectRef.current) return;
      if (!connection.source || !connection.target) return;
      const sourceFraction = fractionFor("source", connection);
      const targetFraction = fractionFor("target", connection);
      if (
        sameAttachmentPoint(
          connection.source,
          connection.sourceHandle,
          sourceFraction,
          connection.target,
          connection.targetHandle,
          targetFraction,
        )
      ) {
        return;
      }
      const data = defaultNoodleData();
      if (isSide(connection.sourceHandle)) data.sourceFraction = sourceFraction;
      if (isSide(connection.targetHandle)) data.targetFraction = targetFraction;
      const created = {
        ...defaultEdgeOptions,
        ...connection,
        type: "smoothstep" as const,
        zIndex: NOODLE_Z_INDEX,
        data,
        style: noodleStrokeStyle(data),
        label: undefined,
        markerStart: undefined,
        markerEnd: undefined,
      };
      const added = addEdge(created, edgesRef.current);
      // addEdge drops a second noodle that reuses the same side ids. Each noodle is its own edge.
      const withNew =
        added === edgesRef.current
          ? edgesRef.current.concat({ ...created, id: `noodle-${crypto.randomUUID()}` })
          : added;
      const next = reflowAttachments(withNew);
      takeSnapshot();
      edgesRef.current = next;
      setEdges(next);
    },
    [takeSnapshot],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      if (suppressConnectRef.current || reconnectRef.current) return;
      if (connectionState.isValid && connectionState.toHandle) {
        clearConnectionOrigin();
        return;
      }
      const from = connectionState.fromHandle;
      if (!from?.nodeId) {
        clearConnectionOrigin();
        return;
      }
      const point = pointFromEvent(event);
      const state = store.getState();
      const port =
        (connectModeRef.current ? portAtClient(state, point.x, point.y) : null) ??
        nearestPort(state, connectionState.pointer);
      if (!port?.handleId) {
        clearConnectionOrigin();
        return;
      }
      setHotPort(port);
      const origin = getConnectionOrigin();
      const sourceFraction =
        origin && origin.nodeId === from.nodeId && origin.handleId === (from.id ?? null)
          ? origin.fraction
          : 0.5;
      if (sameAttachmentPoint(from.nodeId, from.id, sourceFraction, port.nodeId, port.handleId, port.fraction)) {
        clearConnectionOrigin();
        return;
      }
      onConnect({
        source: from.nodeId,
        sourceHandle: from.id ?? null,
        target: port.nodeId,
        targetHandle: port.handleId,
      });
      clearConnectionOrigin();
    },
    [onConnect, store],
  );

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    if (!connection.source || !connection.target) return false;
    const active = reconnectRef.current;
    if (connection.source === connection.target && (connection.sourceHandle ?? null) === (connection.targetHandle ?? null)) {
      const data = active ? readNoodle(active.edge.data) : null;
      const sourceFraction =
        active?.dragged === "target" ? data?.sourceFraction : fractionFor("source", connection);
      const targetFraction =
        active?.dragged === "source" ? data?.targetFraction : fractionFor("target", connection);
      if (
        !isSide(connection.sourceHandle) ||
        sameAttachmentPoint(
          connection.source,
          connection.sourceHandle,
          sourceFraction,
          connection.target,
          connection.targetHandle,
          targetFraction,
        )
      ) {
        return false;
      }
    }
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
    (edge: Edge, connection: Connection, dragged: HandleType, fraction: number | undefined) => {
      if (reconnectsToSamePoint(edge, connection, dragged, fraction)) return;
      const current = readNoodle(edge.data);
      const nextFraction =
        (dragged === "source" ? isSide(connection.sourceHandle) : isSide(connection.targetHandle)) ? fraction : undefined;
      const previous = dragged === "source" ? current.sourceFraction : current.targetFraction;
      if (sameEnds(edge, connection) && sameFraction(previous, nextFraction)) return;
      takeSnapshot();
      const rewired = reconnectEdge(edge, connection, edgesRef.current, {
        shouldReplaceId: false,
      });
      const patched = rewired.map((item) => {
        if (item.id !== edge.id) return item;
        const noodle = readNoodle(item.data);
        if (dragged === "source") {
          if (nextFraction === undefined) delete noodle.sourceFraction;
          else noodle.sourceFraction = nextFraction;
        } else if (nextFraction === undefined) delete noodle.targetFraction;
        else noodle.targetFraction = nextFraction;
        return applyNoodleData(item, noodle);
      });
      const nextEdges = reflowAttachments(patched);
      edgesRef.current = nextEdges;
      setEdges(nextEdges);
      setNodes((currentNodes) => pruneEndpoints(currentNodes, nextEdges));
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
      if (existing) {
        const samePlace =
          Math.abs(existing.position.x - position.x) < 0.5 &&
          Math.abs(existing.position.y - position.y) < 0.5;
        if (samePlace) return;
        takeSnapshot();
        setNodes((current) =>
          current.map((node) => (node.id === existing.id ? { ...node, position } : node)),
        );
        return;
      }
      takeSnapshot();
      const id = `end-${crypto.randomUUID()}`;
      const connection = connectionForPark(edge, dragged, id);
      const nextEdges = reflowAttachments(
        reconnectEdge(edge, connection, edgesRef.current, {
          shouldReplaceId: false,
        }),
      );
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

      const hot = nearestPort(store.getState(), connectionState.pointer);
      const hotConnection = hot ? connectionForDrop(edge, dragged, hot) : null;
      const held = (connection: Connection, fraction: number | undefined) => {
        if (!sameEnds(edge, connection)) return false;
        const data = readNoodle(edge.data);
        const previous = dragged === "source" ? data.sourceFraction : data.targetFraction;
        const next =
          (dragged === "source" ? isSide(connection.sourceHandle) : isSide(connection.targetHandle)) ? fraction : undefined;
        return sameFraction(previous, next);
      };
      if (hotConnection && allowsPort(nodesRef.current, dragged, hotConnection)) {
        if (reconnectsToSamePoint(edge, hotConnection, dragged, hot?.fraction)) {
          clearConnectionOrigin();
          return;
        }
        if (!held(hotConnection, hot?.fraction)) applyReconnect(edge, hotConnection, dragged, hot?.fraction);
        clearConnectionOrigin();
        return;
      }
      if (rf && allowsPort(nodesRef.current, dragged, rf)) {
        const nodeId = dragged === "source" ? rf.source : rf.target;
        const handleId = dragged === "source" ? rf.sourceHandle : rf.targetHandle;
        const previousId = dragged === "source" ? edge.source : edge.target;
        const previousHandle = dragged === "source" ? (edge.sourceHandle ?? null) : (edge.targetHandle ?? null);
        const previous = dragged === "source" ? readNoodle(edge.data).sourceFraction : readNoodle(edge.data).targetFraction;
        const matched = hot && hot.nodeId === nodeId && (hot.handleId ?? null) === (handleId ?? null);
        const fraction = matched
          ? hot.fraction
          : nodeId === previousId && (handleId ?? null) === previousHandle
            ? previous
            : 0.5;
        if (reconnectsToSamePoint(edge, rf, dragged, fraction)) {
          clearConnectionOrigin();
          return;
        }
        if (!held(rf, fraction)) applyReconnect(edge, rf, dragged, fraction);
        clearConnectionOrigin();
        return;
      }
      const stationaryId = dragged === "source" ? edge.target : edge.source;
      const stationaryHandle =
        dragged === "source" ? (edge.targetHandle ?? null) : (edge.sourceHandle ?? null);
      const currentId = dragged === "source" ? edge.source : edge.target;
      const currentHandle =
        dragged === "source" ? (edge.sourceHandle ?? null) : (edge.targetHandle ?? null);
      const point = pointFromEvent(event);
      const onHandle = (nodeId: string, handleId: string | null) => {
        const handle = document.querySelector(
          `.react-flow__handle[data-nodeid="${CSS.escape(nodeId)}"][data-handleid="${CSS.escape(handleId ?? "")}"]`,
        );
        if (!(handle instanceof HTMLElement)) return false;
        const box = handle.getBoundingClientRect();
        return (
          point.x >= box.left &&
          point.x <= box.right &&
          point.y >= box.top &&
          point.y <= box.bottom
        );
      };
      if (onHandle(stationaryId, stationaryHandle) || onHandle(currentId, currentHandle)) {
        clearConnectionOrigin();
        return;
      }

      parkEnd(edge, dragged, point);
      clearConnectionOrigin();
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
    setConnectMode(false);
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

  const addText = useCallback(() => {
    setConnectMode(false);
    takeSnapshot();
    setNodes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        type: "text",
        position: canvasCenter(),
        style: { width: 220 },
        data: { paragraphs: emptyBody() },
      },
    ]);
  }, [canvasCenter, takeSnapshot]);

  const addShape = useCallback(
    (kind: ShapeKind) => {
      setConnectMode(false);
      takeSnapshot();
      const { x, y, zoom } = getViewport();
      const width = SHAPE_DEFAULT_WIDTH;
      const height = SHAPE_DEFAULT_HEIGHT;
      setNodes((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type: "shape",
          position: {
            x: (-x + window.innerWidth / 2) / zoom - width / 2,
            y: (-y + window.innerHeight / 2) / zoom - height / 2,
          },
          style: { width, height },
          data: {
            kind,
            fill: DEFAULT_SHAPE_FILL,
            stroke: DEFAULT_SHAPE_STROKE,
            paragraphs: emptyBody(),
          },
        },
      ]);
    },
    [getViewport, takeSnapshot],
  );

  const addImageAt = useCallback(
    async (file: File, position?: { x: number; y: number }) => {
      if (!file.type.startsWith("image/")) return;
      setConnectMode(false);
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
    const nextEdges = reflowAttachments(
      edgesRef.current.filter(
        (edge) => !edge.selected && !removed.has(edge.source) && !removed.has(edge.target),
      ),
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

  const applyHistory = useCallback(
    (snapshot: Snapshot) => {
      repeatRef.current = null;
      altDragRef.current = null;
      parkedCopiesRef.current = null;
      rawDragRef.current = null;
      clearConnectionOrigin();
      setHotPort(null);
      applyingHistory.current = true;
      nodesRef.current = snapshot.nodes;
      edgesRef.current = snapshot.edges;
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      if (snapshot.viewport) placeViewport(snapshot.viewport);
      if (snapshot.documentName !== undefined) {
        documentNameRef.current = snapshot.documentName;
        setDocumentName(snapshot.documentName);
      }
      if (snapshot.fileHandle !== undefined) {
        fileHandleRef.current = snapshot.fileHandle;
        setBoundHandle(snapshot.fileHandle);
      }
      if (snapshot.recentId !== undefined) boundRecentIdRef.current = snapshot.recentId;
      queueMicrotask(() => {
        applyingHistory.current = false;
      });
    },
    [placeViewport],
  );

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return;
    const current = cloneSnapshot(nodesRef.current, edgesRef.current);
    if (previous.viewport) {
      current.viewport = getViewport();
      current.documentName = documentNameRef.current;
      current.fileHandle = fileHandleRef.current;
      current.recentId = boundRecentIdRef.current;
    }
    futureRef.current.push(current);
    applyHistory(previous);
  }, [applyHistory, getViewport]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    const current = cloneSnapshot(nodesRef.current, edgesRef.current);
    if (next.viewport) {
      current.viewport = getViewport();
      current.documentName = documentNameRef.current;
      current.fileHandle = fileHandleRef.current;
      current.recentId = boundRecentIdRef.current;
    }
    pastRef.current.push(current);
    applyHistory(next);
  }, [applyHistory, getViewport]);

  const clearAutosaveTimer = useCallback(() => {
    if (autosaveTimerRef.current != null) {
      window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }, []);

  const scheduleAutosave = useCallback(() => {
    clearAutosaveTimer();
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      flushAutosaveRef.current();
    }, AUTOSAVE_MS);
  }, [clearAutosaveTimer]);

  const recordRecent = useCallback(async (name: string, handle: FileSystemFileHandle | null, id?: string) => {
    try {
      boundRecentIdRef.current = await rememberRecent({ name, fileHandle: handle, id });
      autosaveErrorRef.current = null;
      setRecents(await listRecents());
    } catch {
      // The board still opens and saves when recents storage is unavailable.
    }
  }, []);

  const releaseMissingFile = useCallback(async (handle: FileSystemFileHandle, message: string) => {
    if (fileHandleRef.current === handle) {
      fileHandleRef.current = null;
      setBoundHandle(null);
    }
    const id = boundRecentIdRef.current;
    if (id) {
      try {
        await markRecentUnavailable(id);
        setRecents(await listRecents());
      } catch {
        // The banner still reports the missing file.
      }
    }
    autosaveErrorRef.current = message;
    setFileError(message);
  }, []);

  const flushAutosave = useCallback(async () => {
    const handle = fileHandleRef.current;
    if (!handle) return;
    if (savingRef.current || openingRef.current) {
      scheduleAutosave();
      return;
    }
    const result = await writeBoundNoodleFile({
      handle,
      name: documentNameRef.current,
      viewport: getViewport(),
      nodes: nodesRef.current,
      edges: edgesRef.current,
    });
    if (fileHandleRef.current !== handle) return;
    if (result.ok) {
      if (fileErrorRef.current && fileErrorRef.current === autosaveErrorRef.current) setFileError(null);
      autosaveErrorRef.current = null;
      return;
    }
    if (result.missing) {
      await releaseMissingFile(handle, result.message);
      return;
    }
    if (autosaveErrorRef.current !== result.message) {
      autosaveErrorRef.current = result.message;
      setFileError(result.message);
    }
  }, [getViewport, releaseMissingFile, scheduleAutosave]);

  useEffect(() => {
    flushAutosaveRef.current = () => {
      void flushAutosave();
    };
  }, [flushAutosave]);

  useEffect(() => {
    void listRecents()
      .then(setRecents)
      .catch(() => setRecents([]));
  }, []);

  useEffect(() => {
    if (suppressAutosaveRef.current) {
      suppressAutosaveRef.current = false;
      return;
    }
    if (!boundHandle) return;
    scheduleAutosave();
    return () => clearAutosaveTimer();
  }, [nodes, edges, boundHandle, scheduleAutosave, clearAutosaveTimer]);

  const openProjectFile = useCallback(
    async (file: File, handle: FileSystemFileHandle | null, recentId?: string) => {
      try {
        const snapshot = await readNoodleProjectFile(file);
        if (savingRef.current) {
          setFileError("Could not open this file while the board is saving. Try again in a moment.");
          return;
        }
        const dirtyUntitled =
          documentNameRef.current === "Untitled" &&
          (nodesRef.current.length > 0 || edgesRef.current.length > 0);
        if (
          dirtyUntitled &&
          !window.confirm("Replace the current Untitled board? Undo will bring this board back.")
        ) {
          return;
        }
        if (savingRef.current) {
          setFileError("Could not open this file while the board is saving. Try again in a moment.");
          return;
        }
        rememberBoard({
          viewport: getViewport(),
          documentName: documentNameRef.current,
          fileHandle: fileHandleRef.current,
          recentId: boundRecentIdRef.current,
        });
        const nextNodes = pruneEndpoints(snapshot.nodes, snapshot.edges);
        const nextEdges = snapshot.edges.map((edge) =>
          edge.zIndex == null ? { ...edge, zIndex: NOODLE_Z_INDEX } : edge,
        );
        const name = projectNameFromFileName(file.name);
        suppressAutosaveRef.current = true;
        blockMoveAutosaveRef.current = true;
        window.setTimeout(() => {
          blockMoveAutosaveRef.current = false;
        }, 400);
        repeatRef.current = null;
        altDragRef.current = null;
        parkedCopiesRef.current = null;
        rawDragRef.current = null;
        clearConnectionOrigin();
        setHotPort(null);
        nodesRef.current = nextNodes;
        edgesRef.current = nextEdges;
        documentNameRef.current = name;
        fileHandleRef.current = handle;
        setNodes(nextNodes);
        setEdges(nextEdges);
        setDocumentName(name);
        setBoundHandle(handle);
        setFileError(null);
        placeViewport(snapshot.viewport);
        await recordRecent(name, handle, recentId);
      } catch (error) {
        setFileError(visibleOpenError(error));
      }
    },
    [getViewport, placeViewport, recordRecent, rememberBoard],
  );

  const openProject = useCallback(async () => {
    if (savingRef.current || openingRef.current) return;
    openingRef.current = true;
    setFileError(null);
    try {
      const picked = await pickNoodleProjectFile();
      if (!picked.ok) {
        if (!picked.aborted) setFileError(picked.message);
        return;
      }
      await openProjectFile(picked.file, picked.handle);
    } finally {
      openingRef.current = false;
    }
  }, [openProjectFile]);

  const saveProject = useCallback(
    async (mode: "save" | "save-as") => {
      if (savingRef.current || openingRef.current) return;
      savingRef.current = true;
      setFileError(null);
      try {
        const result = await saveNoodleProject({
          mode,
          name: documentNameRef.current,
          handle: fileHandleRef.current,
          viewport: getViewport(),
          nodes: nodesRef.current,
          edges: edgesRef.current,
        });
        if (result.ok) {
          documentNameRef.current = result.name;
          fileHandleRef.current = result.handle;
          setDocumentName(result.name);
          setBoundHandle(result.handle);
          await recordRecent(result.name, result.handle);
          return;
        }
        if (result.aborted) return;
        if (result.missing && fileHandleRef.current) {
          await releaseMissingFile(fileHandleRef.current, result.message);
          return;
        }
        setFileError(result.message);
      } finally {
        savingRef.current = false;
      }
    },
    [getViewport, recordRecent, releaseMissingFile],
  );

  const reopenRecent = useCallback(
    async (id: string) => {
      if (savingRef.current || openingRef.current) return;
      const recent = recentsRef.current.find((item) => item.id === id);
      if (!recent) return;
      openingRef.current = true;
      setFileError(null);
      try {
        if (recent.fileHandle) {
          try {
            const allowed = await ensureReadWritePermission(recent.fileHandle);
            if (!allowed) {
              setFileError("Could not open this file. File permission was not granted.");
              return;
            }
            const file = await recent.fileHandle.getFile();
            await openProjectFile(file, recent.fileHandle, recent.id);
          } catch (error) {
            if (isMissingFileError(error)) {
              try {
                await markRecentUnavailable(recent.id);
                setRecents(await listRecents());
              } catch {
                // The banner still reports the missing file.
              }
              setFileError("Could not open this file. It was moved or deleted.");
              return;
            }
            setFileError(visibleOpenError(error));
          }
          return;
        }
        const picked = await pickNoodleProjectFile();
        if (!picked.ok) {
          if (!picked.aborted) setFileError(picked.message);
          return;
        }
        await openProjectFile(picked.file, picked.handle, recent.id);
      } finally {
        openingRef.current = false;
      }
    },
    [openProjectFile],
  );

  const duplicateSelection = useCallback(() => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const selectedIds = new Set(
      currentNodes.filter((node) => node.selected && node.type !== ENDPOINT_TYPE).map((node) => node.id),
    );
    if (selectedIds.size === 0) return;
    const step = nextDuplicateStep(currentNodes, selectedIds, repeatRef.current);
    const result = duplicateGraph(currentNodes, currentEdges, selectedIds, step, true);
    if (!result) return;
    takeSnapshot();
    const nextNodes = [
      ...currentNodes.map((node) => (node.selected ? { ...node, selected: false } : node)),
      ...result.nodes,
    ];
    const nextEdges = reflowAttachments([...currentEdges, ...result.edges]);
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
    repeatRef.current = { ids: new Set(result.cloneIds), birth: result.birth, step };
  }, [takeSnapshot]);

  const pasteSelection = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip) return false;
    const pasted = pasteClipboard(clip);
    if (!pasted) return false;
    takeSnapshot();
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const nextNodes = [
      ...currentNodes.map((node) => (node.selected ? { ...node, selected: false } : node)),
      ...pasted.result.nodes,
    ];
    const nextEdges = reflowAttachments([
      ...currentEdges.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)),
      ...pasted.result.edges,
    ]);
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
    clipboardRef.current = pasted.clipboard;
    return true;
  }, [takeSnapshot]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "s") {
        event.preventDefault();
        void saveProject(event.shiftKey ? "save-as" : "save");
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "o" && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        void openProject();
        return;
      }
      const inNoodleField = event.target instanceof Element && Boolean(event.target.closest("[data-noodle-toolbar]"));
      if (isTypingTarget(event.target) && !inNoodleField) return;
      if (inNoodleField && event.key !== "Escape" && !((event.ctrlKey || event.metaKey) && key === "z")) return;
      if (event.key === "Escape") {
        if (document.querySelector("[data-noodle-menu]")) return;
        if (!connectModeRef.current) return;
        event.preventDefault();
        suppressConnectRef.current = true;
        store.getState().cancelConnection();
        store.setState({ connectionClickStartHandle: null });
        clearConnectionOrigin();
        document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, view: window }));
        suppressConnectRef.current = false;
        setConnectMode(false);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "d" && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        duplicateSelection();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [duplicateSelection, openProject, redo, saveProject, store, undo]);

  useEffect(() => {
    const onCopy = (event: ClipboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      const currentNodes = nodesRef.current;
      const selectedIds = new Set(
        currentNodes.filter((node) => node.selected && node.type !== ENDPOINT_TYPE).map((node) => node.id),
      );
      const taken = takeClipboard(currentNodes, edgesRef.current, selectedIds);
      if (!taken) return;
      clipboardRef.current = taken;
      event.preventDefault();
      event.clipboardData?.setData("text/plain", NODE_CLIPBOARD_MARKER);
    };
    const onPaste = (event: ClipboardEvent) => {
      const data = event.clipboardData;
      if (!data) return;
      const editable = isEditableTarget(event.target);
      if (!editable) {
        for (const item of data.items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) void addImageAt(file);
            event.preventDefault();
            return;
          }
        }
      }
      if (data.getData("text/plain") !== NODE_CLIPBOARD_MARKER) return;
      // Capture phase, so an editor never inserts the marker as text.
      event.preventDefault();
      event.stopPropagation();
      if (!editable) pasteSelection();
    };
    window.addEventListener("copy", onCopy);
    window.addEventListener("paste", onPaste, true);
    return () => {
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("paste", onPaste, true);
    };
  }, [addImageAt, pasteSelection]);

  const canDelete =
    nodes.some((node) => node.selected) || edges.some((edge) => edge.selected);

  if (!sameGuides(guides, guidesRef.current)) {
    setGuides(guidesRef.current);
  }

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
          if (!file || openingRef.current) return;
          if (isNoodleProjectFile(file)) {
            if (savingRef.current) return;
            openingRef.current = true;
            void openProjectFile(file, null).finally(() => {
              openingRef.current = false;
            });
            return;
          }
          if (!file.type.startsWith("image/")) return;
          const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          void addImageAt(file, position);
        }}
      >
        <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex flex-col gap-2 min-[800px]:grid min-[800px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[800px]:items-center min-[800px]:gap-3">
          <div className="min-w-0 self-start min-[800px]:justify-self-start">
            <SaveToolbar
              documentName={documentName}
              recents={recents}
              onOpen={() => void openProject()}
              onOpenRecent={(id) => void reopenRecent(id)}
              onSave={() => void saveProject("save")}
              onSaveAs={() => void saveProject("save-as")}
            />
          </div>
          <div className="flex min-w-0 justify-center">
            <Toolbar
              connectMode={connectMode}
              onToggleConnect={() =>
                setConnectMode((current) => {
                  clearConnectionOrigin();
                  setHotPort(null);
                  return !current;
                })
              }
              onAddSticky={addSticky}
              onAddText={addText}
              onAddShape={addShape}
              onAddImage={(file) => void addImageAt(file)}
              onDelete={deleteSelected}
              canDelete={canDelete}
            />
          </div>
          <div className="absolute right-0 top-0 rounded-xl bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow min-[800px]:static min-[800px]:justify-self-end">
            Noodle Board
          </div>
        </div>
        {fileError ? (
          <div
            role="alert"
            className="absolute bottom-4 left-4 z-30 flex max-w-[min(28rem,calc(100%-2rem))] items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 shadow"
          >
            <span>{fileError}</span>
            <button
              type="button"
              onClick={() => setFileError(null)}
              className="shrink-0 font-medium text-rose-800 hover:text-rose-950"
            >
              Dismiss
            </button>
          </div>
        ) : null}
        <PortMagnet connectMode={connectMode} />
        <ReactFlow
          className={connectMode ? "noodle-connect" : undefined}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={(_event, params) => {
            if (!params.nodeId || !params.handleId || !isSide(params.handleId)) return;
            const hot = getHotPort();
            const hotFraction =
              hot && hot.nodeId === params.nodeId && hot.handleId === params.handleId && hot.fraction != null
                ? hot.fraction
                : undefined;
            const existing = getConnectionOrigin();
            if (existing?.nodeId === params.nodeId && existing.handleId === params.handleId) {
              if (hotFraction != null && hotFraction !== existing.fraction) {
                setConnectionOrigin({ nodeId: params.nodeId, handleId: params.handleId, fraction: hotFraction });
              }
              return;
            }
            setConnectionOrigin({
              nodeId: params.nodeId,
              handleId: params.handleId,
              fraction: hotFraction ?? 0.5,
            });
          }}
          onConnectEnd={onConnectEnd}
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
          connectOnClick={connectMode}
          nodesDraggable={!connectMode}
          panOnDrag={connectMode ? [1, 2] : true}
          fitView={stored.nodes.length > 0}
          minZoom={0.15}
          maxZoom={3}
          panOnScroll
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Shift"
          deleteKeyCode={["Delete", "Backspace"]}
          onNodeDragStart={(event, node, dragged) => {
            dragNodeIdRef.current = node.id;
            if ("shiftKey" in event) shiftHeldRef.current = event.shiftKey;
            if (dragSnapshotTaken.current) return;
            dragSnapshotTaken.current = true;
            takeSnapshot();
            altDragRef.current = null;
            parkedCopiesRef.current = null;
            if (!("altKey" in event) || !event.altKey) return;
            const rootIds = new Set(
              (dragged ?? [node])
                .filter((item) => item.type !== ENDPOINT_TYPE)
                .map((item) => item.id),
            );
            const present = nodesRef.current.filter((item) => rootIds.has(item.id));
            if (!present.some((item) => item.id === node.id) && node.type !== ENDPOINT_TYPE) {
              const self = nodesRef.current.find((item) => item.id === node.id);
              if (self) present.push(self);
            }
            if (present.length === 0) return;
            const ids = new Set(present.map((item) => item.id));
            const result = duplicateGraph(nodesRef.current, edgesRef.current, ids, { x: 0, y: 0 }, false);
            if (!result) return;
            const source = present.find((item) => item.id === node.id) ?? present[0];
            altDragRef.current = {
              nodeId: source.id,
              origin: { x: source.position.x, y: source.position.y },
              ids,
              settled: false,
              previous: repeatRef.current,
            };
            parkedCopiesRef.current = { nodes: result.nodes, edges: result.edges };
            const nextNodes = [...nodesRef.current, ...result.nodes];
            const nextEdges = reflowAttachments([...edgesRef.current, ...result.edges]);
            nodesRef.current = nextNodes;
            edgesRef.current = nextEdges;
            setNodes(nextNodes);
            setEdges(nextEdges);
          }}
          onNodeDragStop={() => {
            const alt = altDragRef.current;
            altDragRef.current = null;
            parkedCopiesRef.current = null;
            rawDragRef.current = null;
            dragSnapshotTaken.current = false;
            dragNodeIdRef.current = null;
            if (alt && !alt.settled) {
              const memory = repeatFromDrag(nodesRef.current, alt.nodeId, alt.origin, alt.ids);
              if (memory) repeatRef.current = memory;
              window.setTimeout(() => {
                if (alt.settled) return;
                if (altDragRef.current && altDragRef.current !== alt) return;
                const settled = repeatFromDrag(nodesRef.current, alt.nodeId, alt.origin, alt.ids);
                repeatRef.current = settled ?? alt.previous;
                alt.settled = true;
              }, 0);
            }
            if (guidesRef.current.length > 0) {
              guidesRef.current = [];
              setGuides([]);
            }
          }}
          onMoveEnd={() => {
            if (blockMoveAutosaveRef.current || !fileHandleRef.current) return;
            scheduleAutosave();
          }}
          proOptions={{ hideAttribution: true }}
        >
          <AlignmentGuides lines={guides} />
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
          <ConnectMode active={connectMode} onConnect={onConnect} isValidConnection={isValidConnection} />
        </ReactFlow>
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
