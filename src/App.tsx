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
import GroupSelection, { applyGroupStyle, GROUP_STYLE_EVENT, type GroupStyleDetail } from "./GroupSelection";
import Marquee from "./Marquee";
import {
  alignNodeChanges,
  sameOverlay,
  type DragAxisLock,
  type FlowBox,
  type GuideOverlay,
} from "./alignSnap";
import { bindBoardZoom } from "./editorZoom";
import { FloatingLayer } from "./FloatingPanel";
import { layers } from "./layers";
import PlacementGhost from "./PlacementGhost";
import {
  isCanvasPlacementTarget,
  placementSize,
  snapFlowPoint,
  TEXT_PLACE_HEIGHT,
  TEXT_PLACE_WIDTH,
  type Placement,
} from "./placement";
import { armTextEdit } from "./textEdit";
import SaveToolbar from "./SaveToolbar";
import Toolbar, { type BoardTool } from "./Toolbar";
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
  type ShapeKind,
} from "./shapeData";
import TextNode from "./TextNode";
import { emptyBody } from "./textBody";
import ImageNode from "./ImageNode";
import EndpointNode from "./EndpointNode";
import NoodleEdge from "./NoodleEdge";
import ConnectMode from "./ConnectMode";
import NoodleConnectionLine from "./connectionLine";
import PortMagnet, { dragKind, hoverForRelease, nearestHandleOnNode, nearestPort, pointerToFlow, portAtClient, portFromHover } from "./PortMagnet";
import { isSide, reflowAttachments, sameAttachmentPoint, sameFraction } from "./attachment";
import { NOODLE_EDGE_EVENT, applyNoodleData, defaultNoodleData, noodleStrokeStyle, readNoodle } from "./noodleData";
import { closeNoodleLabel, noodleLabelEditingId, openNoodleLabel, releaseNoodleLabel } from "./noodleLabel";
import { armClickSwallow, clearConnectionOrigin, clearReleaseLanding, getHotPort, holdSelection, selectionHeld, setConnectionOrigin, setHotPort, type HoverTarget } from "./portHot";
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
  paintEndpoints,
  pointFromEvent,
  pruneEndpoints,
  sameEnds,
} from "./noodleEnds";
import { carryDraggedNoodles } from "./selectionMove";
import { selectedObjectCount } from "./selectionScope";
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

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  zIndex: layers.canvas,
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

/**
 * React Flow can snap the target to a different side than the pointer near a corner.
 * The magnet's side and fraction are the drop.
 */
function releaseHitsNode(event: MouseEvent | TouchEvent) {
  const target = event.target;
  return target instanceof Element && Boolean(target.closest(".react-flow__node"));
}

function connectionWithDrop<T extends Connection | Edge>(connection: T): T {
  const hot = getHotPort();
  if (!hot || !isSide(hot.handleId)) return connection;
  if (hot.nodeId === connection.target && (connection.targetHandle ?? null) === hot.handleId) return connection;
  return { ...connection, target: hot.nodeId, targetHandle: hot.handleId };
}

/** Origin ends are side midpoints. The target keeps the point under the pointer. */
function fractionFor(end: "source" | "target", connection: Connection | Edge) {
  const handleId = end === "source" ? connection.sourceHandle : connection.targetHandle;
  if (!isSide(handleId)) return undefined;
  if (end === "source") return 0.5;
  const hot = getHotPort();
  if (
    hot &&
    hot.nodeId === connection.target &&
    (hot.handleId ?? null) === (handleId ?? null) &&
    hot.fraction != null
  ) {
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
    const kept = pruneEndpoints(nodes, edges);
    return {
      nodes: paintEndpoints(kept),
      edges: reflowAttachments(edges.map((edge) => (edge.zIndex == null ? { ...edge, zIndex: layers.canvas } : edge))),
    };
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

function selectedEdgeIds(edges: readonly Edge[]) {
  const ids = new Set<string>();
  for (const edge of edges) {
    if (edge.selected) ids.add(edge.id);
  }
  return ids;
}

function selectionIds(nodes: readonly Node[], edges: readonly Edge[]) {
  return {
    nodes: nodes.filter((node) => node.selected).map((node) => node.id),
    edges: edges.filter((edge) => edge.selected).map((edge) => edge.id),
  };
}

function sameSelection(
  a: { nodes: string[]; edges: string[] },
  b: { nodes: string[]; edges: string[] },
) {
  if (a.nodes.length !== b.nodes.length || a.edges.length !== b.edges.length) return false;
  const nodes = new Set(a.nodes);
  const edges = new Set(a.edges);
  return b.nodes.every((id) => nodes.has(id)) && b.edges.every((id) => edges.has(id));
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
  const guidesRef = useRef<GuideOverlay>({ lines: [], brackets: [] });
  const [guides, setGuides] = useState<GuideOverlay>({ lines: [], brackets: [] });
  const reconnectRef = useRef<{ edge: Edge; dragged: HandleType } | null>(null);
  const reconnectSettledRef = useRef(false);
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
  const [tool, setTool] = useState<BoardTool>("select");
  const toolRef = useRef<BoardTool>("select");
  const [placement, setPlacement] = useState<Placement | null>(null);
  const placementRef = useRef<Placement | null>(null);
  const placementEpoch = useRef(0);
  const swallowPlaceRef = useRef(0);
  const suppressContextRef = useRef(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const spaceHeldRef = useRef(false);
  const spaceSelectionRef = useRef<{ nodes: string[]; edges: string[] } | null>(null);
  const connectMode = tool === "arrow";
  const connectModeRef = useRef(false);
  const suppressConnectRef = useRef(false);
  const gestureEdgeRef = useRef<string | null>(null);
  const [documentName, setDocumentName] = useState("Untitled");
  const [fileError, setFileError] = useState<string | null>(null);
  const [boundHandle, setBoundHandle] = useState<FileSystemFileHandle | null>(null);
  const [recents, setRecents] = useState<RecentProject[]>([]);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

  useEffect(() => {
    let detach = () => {};
    let seen: HTMLElement | null = null;
    const attach = () => {
      const root = store.getState().domNode;
      if (root === seen) return;
      detach();
      seen = root;
      detach = () => {};
      if (!root) return;
      detach = bindBoardZoom(root, () => store.getState());
    };
    attach();
    const unsubscribe = store.subscribe(attach);
    return () => {
      unsubscribe();
      detach();
    };
  }, [store]);

  useEffect(() => {
    const id = noodleLabelEditingId();
    if (!id || edges.some((edge) => edge.id === id)) return;
    releaseNoodleLabel();
    closeNoodleLabel();
  }, [edges]);

  useEffect(() => {
    toolRef.current = tool;
    connectModeRef.current = connectMode;
  }, [tool, connectMode]);

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

  const removalSnapRef = useRef(false);
  const snapshotRemoval = useCallback(() => {
    if (removalSnapRef.current) return;
    removalSnapRef.current = true;
    takeSnapshot();
    queueMicrotask(() => {
      removalSnapRef.current = false;
    });
  }, [takeSnapshot]);

  const clearSelection = useCallback(() => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    if (!currentNodes.some((node) => node.selected) && !currentEdges.some((edge) => edge.selected)) return;
    const nextNodes = currentNodes.map((node) => (node.selected ? { ...node, selected: false } : node));
    const nextEdges = currentEdges.map((edge) => (edge.selected ? { ...edge, selected: false } : edge));
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
  }, []);

  const selectIds = useCallback((nodeIds: ReadonlySet<string>, edgeIds: ReadonlySet<string>) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    let nodesChanged = false;
    let edgesChanged = false;
    const nextNodes = currentNodes.map((node) => {
      const selected = node.type !== ENDPOINT_TYPE && nodeIds.has(node.id);
      if (Boolean(node.selected) === selected) return node;
      nodesChanged = true;
      return { ...node, selected };
    });
    const nextEdges = currentEdges.map((edge) => {
      const selected = edgeIds.has(edge.id);
      if (Boolean(edge.selected) === selected) return edge;
      edgesChanged = true;
      return { ...edge, selected };
    });
    if (!nodesChanged && !edgesChanged) return;
    if (nodesChanged) {
      nodesRef.current = nextNodes;
      setNodes(nextNodes);
    }
    if (edgesChanged) {
      edgesRef.current = nextEdges;
      setEdges(nextEdges);
    }
  }, []);

  const clearPlacement = useCallback(() => {
    placementEpoch.current += 1;
    if (!placementRef.current) return;
    placementRef.current = null;
    setPlacement(null);
  }, []);

  const chooseTool = useCallback(
    (next: BoardTool) => {
      clearPlacement();
      if (next === "hand") clearSelection();
      clearConnectionOrigin();
      setHotPort(null);
      toolRef.current = next;
      setTool(next);
    },
    [clearPlacement, clearSelection],
  );

  const cancelPlacement = useCallback(() => {
    const had = placementRef.current != null;
    clearPlacement();
    if (!had) return;
    if (toolRef.current === "select") return;
    clearConnectionOrigin();
    setHotPort(null);
    toolRef.current = "select";
    setTool("select");
  }, [clearPlacement]);

  const armPlacement = useCallback((next: Placement) => {
    placementEpoch.current += 1;
    placementRef.current = next;
    setPlacement(next);
    if (toolRef.current === "select") return;
    clearConnectionOrigin();
    setHotPort(null);
    toolRef.current = "select";
    setTool("select");
  }, []);

  const restoreSpaceSelection = useCallback(() => {
    const saved = spaceSelectionRef.current;
    spaceSelectionRef.current = null;
    if (!saved) return;
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    if (sameSelection(saved, selectionIds(currentNodes, currentEdges))) return;
    const nodeIds = new Set(saved.nodes);
    const edgeIds = new Set(saved.edges);
    const nextNodes = currentNodes.map((node) => {
      const selected = nodeIds.has(node.id);
      return node.selected === selected ? node : { ...node, selected };
    });
    const nextEdges = currentEdges.map((edge) => {
      const selected = edgeIds.has(edge.id);
      return edge.selected === selected ? edge : { ...edge, selected };
    });
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
  }, []);

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
      const applied = selectionHeld() ? changes.filter((change) => change.type !== "select") : changes;
      if (applied.length === 0) return;
      if (applied.some((change) => change.type === "remove")) snapshotRemoval();
      const dragEnded = applied.some((change) => change.type === "position" && change.dragging === false);
      const parkedNodes = parkedCopiesRef.current?.nodes;
      const alt = dragEnded ? altDragRef.current : null;
      const dragId = dragNodeIdRef.current;
      const axisLock: DragAxisLock | null =
        altDragRef.current && shiftHeldRef.current
          ? { origin: altDragRef.current.origin, primaryId: altDragRef.current.nodeId }
          : null;
      if (altDragRef.current) {
        const raw = new Map<string, { x: number; y: number }>();
        for (const change of applied) {
          if (change.type === "position" && change.position) {
            raw.set(change.id, { x: change.position.x, y: change.position.y });
          }
        }
        if (raw.size > 0) rawDragRef.current = raw;
      }
      const edgesAtDrag = edgesRef.current;
      let carriedEdges: Edge[] | null = null;
      setNodes((current) => {
        const base = appendMissing(current, parkedNodes);
        const aligned = alignNodeChanges(
          base,
          applied,
          dragEnded ? dragId : dragNodeIdRef.current,
          resizeOriginRef.current,
          snappedSizeRef.current,
          axisLock,
        );
        if (aligned.guides) {
          const next = { lines: aligned.guides, brackets: aligned.brackets ?? [] };
          if (!sameOverlay(guidesRef.current, next)) guidesRef.current = next;
        }
        const next = applyNodeChanges(aligned.changes, base);
        const carried = dragNodeIdRef.current ? carryDraggedNoodles(base, next, edgesAtDrag) : null;
        const nodesOut = carried?.nodes ?? next;
        if (carried && carried.edges !== edgesAtDrag) carriedEdges = carried.edges;
        nodesRef.current = nodesOut;
        if (alt && (altDragRef.current === null || altDragRef.current === alt)) {
          alt.settled = true;
          const memory = repeatFromDrag(nodesOut, alt.nodeId, alt.origin, alt.ids);
          repeatRef.current = memory ?? alt.previous;
        }
        return nodesOut;
      });
      if (carriedEdges) {
        edgesRef.current = carriedEdges;
        setEdges(carriedEdges);
      }
    },
    [snapshotRemoval],
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
      if (removed) snapshotRemoval();
      const parkedEdges = parkedCopiesRef.current?.edges;
      const base = appendMissing(edgesRef.current, parkedEdges);
      const changed = applyEdgeChanges(changes, base);
      const next = removed ? reflowAttachments(changed) : changed;
      edgesRef.current = next;
      setEdges(next);
      if (removed) setNodes((current) => pruneEndpoints(current, next));
    },
    [snapshotRemoval],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (suppressConnectRef.current) return;
      if (!connection.source || !connection.target) return;
      // The handle hit and the body drop can both report one gesture.
      if (gestureEdgeRef.current) return;
      const landed = connectionWithDrop(connection);
      const sourceFraction = fractionFor("source", landed);
      const targetFraction = fractionFor("target", landed);
      if (
        sameAttachmentPoint(
          landed.source,
          landed.sourceHandle,
          sourceFraction,
          landed.target,
          landed.targetHandle,
          targetFraction,
        )
      ) {
        return;
      }
      const data = defaultNoodleData();
      if (sourceFraction !== undefined) data.sourceFraction = sourceFraction;
      if (targetFraction !== undefined) data.targetFraction = targetFraction;
      const created = {
        ...defaultEdgeOptions,
        ...landed,
        type: "smoothstep" as const,
        zIndex: layers.canvas,
        data,
        style: noodleStrokeStyle(data),
        label: undefined,
        markerStart: undefined,
        markerEnd: undefined,
      };
      const added = addEdge(created, edgesRef.current);
      // addEdge drops a second noodle that reuses the same side ids. Each noodle is its own edge.
      const freshId = `noodle-${crypto.randomUUID()}`;
      const withNew =
        added === edgesRef.current
          ? edgesRef.current.concat({ ...created, id: freshId })
          : added;
      const createdId =
        withNew.find((edge) => !edgesRef.current.some((item) => item.id === edge.id))?.id ?? null;
      gestureEdgeRef.current = createdId;
      const next = reflowAttachments(withNew);
      takeSnapshot();
      edgesRef.current = next;
      setEdges(next);
      const live = store.getState().connection.inProgress;
      // A drag still has connection.inProgress, and onConnectEnd reads this guard.
      // A click never reaches onConnectEnd, so the guard must not outlive this call.
      if (!live) gestureEdgeRef.current = null;
    },
    [store, takeSnapshot],
  );

  const alignGestureEdge = useCallback(
    (hovered: HoverTarget | null) => {
      const id = gestureEdgeRef.current;
      if (!id || !hovered) return;
      const port = portFromHover(hovered, dragKind(store.getState()));
      if (!port.handleId) return;
      const edge = edgesRef.current.find((item) => item.id === id);
      if (!edge) return;
      const data = readNoodle(edge.data);
      const fraction = port.fraction ?? 0.5;
      if (
        edge.target === port.nodeId &&
        edge.targetHandle === port.handleId &&
        sameFraction(data.targetFraction ?? 0.5, fraction)
      ) {
        return;
      }
      const sourceFraction = isSide(edge.sourceHandle) ? 0.5 : data.sourceFraction;
      if (
        sameAttachmentPoint(edge.source, edge.sourceHandle, sourceFraction, port.nodeId, port.handleId, fraction)
      ) {
        const next = edgesRef.current.filter((item) => item.id !== id);
        edgesRef.current = next;
        setEdges(next);
        return;
      }
      const next = reflowAttachments(
        edgesRef.current.map((item) =>
          item.id === id
            ? applyNoodleData(
                { ...item, target: port.nodeId, targetHandle: port.handleId },
                { ...data, targetFraction: fraction },
              )
            : item,
        ),
      );
      edgesRef.current = next;
      setEdges(next);
    },
    [store],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
      const finish = () => {
        gestureEdgeRef.current = null;
        clearConnectionOrigin();
        setHotPort(null);
        clearReleaseLanding();
      };
      // Reconnect still needs the landing. onReconnectEnd reads and clears it.
      if (reconnectRef.current || reconnectSettledRef.current) return;
      if (suppressConnectRef.current) {
        finish();
        return;
      }
      const point = pointFromEvent(event);
      const state = store.getState();
      const kind = dragKind(state);
      const hovered = hoverForRelease(state, point.x, point.y, kind);
      if (hovered || releaseHitsNode(event)) {
        holdSelection();
        armClickSwallow();
      }
      // A handle hit only counts when this gesture actually added the noodle.
      if (connectionState.isValid && connectionState.toHandle && gestureEdgeRef.current) {
        alignGestureEdge(hovered);
        finish();
        return;
      }
      const from = connectionState.fromHandle;
      if (!from?.nodeId) {
        finish();
        return;
      }
      if (gestureEdgeRef.current) {
        alignGestureEdge(hovered);
        finish();
        return;
      }
      const mode = kind === "origin" ? "midpoint" : "edge";
      const port =
        (hovered ? portFromHover(hovered, kind) : null) ??
        portAtClient(state, point.x, point.y, mode) ??
        nearestPort(state, connectionState.pointer, mode);
      if (!port?.handleId) {
        finish();
        return;
      }
      setHotPort(port);
      const sourceFraction = isSide(from.id) ? 0.5 : undefined;
      if (sameAttachmentPoint(from.nodeId, from.id, sourceFraction, port.nodeId, port.handleId, port.fraction)) {
        finish();
        return;
      }
      onConnect({
        source: from.nodeId,
        sourceHandle: from.id ?? null,
        target: port.nodeId,
        targetHandle: port.handleId,
      });
      finish();
    },
    [alignGestureEdge, onConnect, store],
  );

  const isValidConnection = useCallback((connection: Connection | Edge) => {
    if (!connection.source || !connection.target) return false;
    const active = reconnectRef.current;
    const landed = active?.dragged === "source" ? connection : connectionWithDrop(connection);
    if (landed.source === landed.target && (landed.sourceHandle ?? null) === (landed.targetHandle ?? null)) {
      const data = active ? readNoodle(active.edge.data) : null;
      const sourceFraction =
        active?.dragged === "target" ? (data?.sourceFraction ?? 0.5) : fractionFor("source", landed);
      const targetFraction =
        active?.dragged === "source" ? data?.targetFraction : fractionFor("target", landed);
      if (
        !isSide(landed.sourceHandle) ||
        sameAttachmentPoint(
          landed.source,
          landed.sourceHandle,
          sourceFraction,
          landed.target,
          landed.targetHandle,
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
      const onSide = dragged === "source" ? isSide(connection.sourceHandle) : isSide(connection.targetHandle);
      const nextFraction = !onSide ? undefined : dragged === "source" ? 0.5 : fraction;
      const previous =
        dragged === "source"
          ? isSide(edge.sourceHandle)
            ? (current.sourceFraction ?? 0.5)
            : current.sourceFraction
          : current.targetFraction;
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
      reconnectSettledRef.current = true;
      queueMicrotask(() => {
        reconnectSettledRef.current = false;
      });
      if (suppressConnectRef.current) {
        reconnectRef.current = null;
        rfConnectionRef.current = null;
        clearConnectionOrigin();
        setHotPort(null);
        clearReleaseLanding();
        return;
      }
      const dragged = reconnectRef.current?.dragged ?? draggedEnd(handleType);
      const rf = rfConnectionRef.current;
      reconnectRef.current = null;
      rfConnectionRef.current = null;
      const point = pointFromEvent(event);
      const kind = dragged === "source" ? "origin" : "target";
      const state = store.getState();
      const hovered = hoverForRelease(state, point.x, point.y, kind);
      clearReleaseLanding();
      if (hovered || releaseHitsNode(event)) {
        holdSelection();
        armClickSwallow();
      }
      const mode = dragged === "source" ? "midpoint" : "edge";
      const hot =
        (hovered ? portFromHover(hovered, kind) : null) ??
        portAtClient(state, point.x, point.y, mode) ??
        nearestPort(state, connectionState.pointer, mode);
      setHotPort(null);
      const dropFraction = dragged === "source" ? (hot ? 0.5 : undefined) : hot?.fraction;
      const hotConnection = hot ? connectionForDrop(edge, dragged, hot) : null;
      const held = (connection: Connection, fraction: number | undefined) => {
        if (!sameEnds(edge, connection)) return false;
        const data = readNoodle(edge.data);
        const previous =
          dragged === "source"
            ? isSide(edge.sourceHandle)
              ? (data.sourceFraction ?? 0.5)
              : data.sourceFraction
            : data.targetFraction;
        const next = dragged === "source"
          ? isSide(connection.sourceHandle)
            ? 0.5
            : undefined
          : isSide(connection.targetHandle)
            ? fraction
            : undefined;
        return sameFraction(previous, next);
      };
      if (hotConnection && allowsPort(nodesRef.current, dragged, hotConnection)) {
        if (reconnectsToSamePoint(edge, hotConnection, dragged, dropFraction)) {
          clearConnectionOrigin();
          return;
        }
        if (!held(hotConnection, dropFraction)) applyReconnect(edge, hotConnection, dragged, dropFraction);
        clearConnectionOrigin();
        return;
      }
      if (rf && allowsPort(nodesRef.current, dragged, rf)) {
        const nodeId = dragged === "source" ? rf.source : rf.target;
        const handleId = dragged === "source" ? rf.sourceHandle : rf.targetHandle;
        const previousId = dragged === "source" ? edge.source : edge.target;
        const previousHandle = dragged === "source" ? (edge.sourceHandle ?? null) : (edge.targetHandle ?? null);
        const data = readNoodle(edge.data);
        const previous =
          dragged === "source"
            ? isSide(edge.sourceHandle)
              ? (data.sourceFraction ?? 0.5)
              : data.sourceFraction
            : data.targetFraction;
        const matched = hot && hot.nodeId === nodeId && (hot.handleId ?? null) === (handleId ?? null);
        const flow = dragged === "target" ? pointerToFlow(store.getState(), connectionState.pointer) : null;
        const projected =
          flow && nodeId ? nearestHandleOnNode(store.getState(), nodeId, flow, "edge") : null;
        const drop =
          dragged === "target" && projected && isSide(projected.handleId)
            ? { ...rf, target: projected.nodeId, targetHandle: projected.handleId }
            : rf;
        const fraction =
          dragged === "source"
            ? isSide(handleId)
              ? 0.5
              : undefined
            : projected && isSide(projected.handleId) && projected.fraction != null
              ? projected.fraction
              : matched && hot?.fraction != null
                ? hot.fraction
                : nodeId === previousId && (handleId ?? null) === previousHandle
                  ? previous
                  : undefined;
        // A target drop with no measured point stays put. Do not invent a midpoint.
        if (dragged === "target" && fraction == null && isSide(drop.targetHandle)) {
          clearConnectionOrigin();
          return;
        }
        if (reconnectsToSamePoint(edge, drop, dragged, fraction)) {
          clearConnectionOrigin();
          return;
        }
        if (!held(drop, fraction)) applyReconnect(edge, drop, dragged, fraction);
        clearConnectionOrigin();
        return;
      }
      const stationaryId = dragged === "source" ? edge.target : edge.source;
      const stationaryHandle =
        dragged === "source" ? (edge.targetHandle ?? null) : (edge.sourceHandle ?? null);
      const currentId = dragged === "source" ? edge.source : edge.target;
      const currentHandle =
        dragged === "source" ? (edge.sourceHandle ?? null) : (edge.targetHandle ?? null);
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

  const beginSticky = useCallback(() => {
    if (placementRef.current?.kind === "sticky") {
      cancelPlacement();
      return;
    }
    const colors: StickyColor[] = ["yellow", "pink", "blue", "green"];
    const color = colors[Math.floor(Math.random() * colors.length)] ?? "yellow";
    armPlacement({ kind: "sticky", color });
  }, [armPlacement, cancelPlacement]);

  const beginText = useCallback(() => {
    if (placementRef.current?.kind === "text") {
      cancelPlacement();
      return;
    }
    armPlacement({ kind: "text" });
  }, [armPlacement, cancelPlacement]);

  const beginShape = useCallback(
    (kind: ShapeKind) => {
      const current = placementRef.current;
      if (current?.kind === "shape" && current.shape === kind) {
        cancelPlacement();
        return;
      }
      armPlacement({ kind: "shape", shape: kind });
    },
    [armPlacement, cancelPlacement],
  );

  const placeAt = useCallback(
    (clientX: number, clientY: number) => {
      const current = placementRef.current;
      if (!current) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.isContentEditable) active.blur();
      const raw = screenToFlowPosition({ x: clientX, y: clientY }, { snapToGrid: false });
      const flow = store.getState();
      const center = snapFlowPoint(raw, flow.snapToGrid, flow.snapGrid);
      const zoom = flow.transform[2];
      let size = placementSize(current);
      if (current.kind === "text") {
        const ghost = document.querySelector("[data-placement-ghost]");
        const measured =
          ghost instanceof HTMLElement && zoom > 0 ? ghost.getBoundingClientRect().height / zoom : 0;
        size = { width: TEXT_PLACE_WIDTH, height: measured > 1 ? measured : TEXT_PLACE_HEIGHT };
      }
      const position = { x: center.x - size.width / 2, y: center.y - size.height / 2 };
      takeSnapshot();
      const id = crypto.randomUUID();
      if (current.kind === "text") armTextEdit(id);
      const node: Node = {
        id,
        position,
        selected: true,
        style:
          current.kind === "text"
            ? { width: size.width }
            : { width: size.width, height: size.height },
        ...(current.kind === "sticky"
          ? { type: "sticky", data: { text: "", color: current.color } }
          : current.kind === "text"
            ? { type: "text", data: { paragraphs: emptyBody() } }
            : current.kind === "shape"
              ? {
                  type: "shape",
                  data: {
                    kind: current.shape,
                    fill: DEFAULT_SHAPE_FILL,
                    stroke: DEFAULT_SHAPE_STROKE,
                    paragraphs: emptyBody(),
                  },
                }
              : { type: "image", data: { src: current.src } }),
      };
      const nextNodes = [
        ...nodesRef.current.map((item) => (item.selected ? { ...item, selected: false } : item)),
        node,
      ];
      const nextEdges = edgesRef.current.some((edge) => edge.selected)
        ? edgesRef.current.map((edge) => (edge.selected ? { ...edge, selected: false } : edge))
        : edgesRef.current;
      nodesRef.current = nextNodes;
      edgesRef.current = nextEdges;
      setNodes(nextNodes);
      setEdges(nextEdges);
      placementEpoch.current += 1;
      placementRef.current = null;
      setPlacement(null);
      if (toolRef.current !== "select") {
        toolRef.current = "select";
        setTool("select");
      }
      swallowPlaceRef.current = performance.now() + 450;
    },
    [screenToFlowPosition, store, takeSnapshot],
  );

  const beginImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const epoch = ++placementEpoch.current;
      try {
        const src = await fileToDataUrl(file);
        const size = await imageSize(src);
        if (placementEpoch.current !== epoch) return;
        armPlacement({ kind: "image", src, width: size.width, height: size.height });
      } catch {
        if (placementEpoch.current === epoch) placementEpoch.current += 1;
      }
    },
    [armPlacement],
  );

  const addImageAt = useCallback(
    async (file: File, position?: { x: number; y: number }) => {
      if (!file.type.startsWith("image/")) return;
      chooseTool("select");
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
    [canvasCenter, chooseTool, takeSnapshot],
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
        const nextNodes = paintEndpoints(pruneEndpoints(snapshot.nodes, snapshot.edges));
        const nextEdges = reflowAttachments(
          snapshot.edges.map((edge) => (edge.zIndex == null ? { ...edge, zIndex: layers.canvas } : edge)),
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
    const edgeIds = selectedEdgeIds(currentEdges);
    if (selectedIds.size === 0 && edgeIds.size === 0) return;
    const step = nextDuplicateStep(currentNodes, selectedIds, repeatRef.current);
    const result = duplicateGraph(currentNodes, currentEdges, selectedIds, step, true, edgeIds);
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
      const inNoodleLabel = event.target instanceof Element && Boolean(event.target.closest("[data-noodle-label]"));
      const undoKey = (event.ctrlKey || event.metaKey) && key === "z";
      if (isTypingTarget(event.target) && !inNoodleField && !(inNoodleLabel && undoKey)) return;
      if (inNoodleField && event.key !== "Escape" && !undoKey) return;
      if ((event.key === " " || event.code === "Space") && !event.repeat) {
        if (spaceHeldRef.current) return;
        event.preventDefault();
        spaceSelectionRef.current = selectionIds(nodesRef.current, edgesRef.current);
        spaceHeldRef.current = true;
        setSpaceHeld(true);
        return;
      }
      if (key === "v" && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        chooseTool("select");
        return;
      }
      if (key === "h" && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        chooseTool("hand");
        return;
      }
      if (event.key === "Escape") {
        if (placementRef.current) {
          event.preventDefault();
          cancelPlacement();
          return;
        }
        if (document.querySelector("[data-noodle-menu]")) return;
        const dragging = store.getState().connection.inProgress || reconnectRef.current;
        if (dragging) {
          event.preventDefault();
          suppressConnectRef.current = true;
          reconnectRef.current = null;
          rfConnectionRef.current = null;
          store.getState().cancelConnection();
          store.setState({ connectionClickStartHandle: null });
          clearConnectionOrigin();
          setHotPort(null);
          clearReleaseLanding();
          holdSelection();
          document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
          suppressConnectRef.current = false;
          armClickSwallow();
          const swallowRelease = () => {
            armClickSwallow();
            window.removeEventListener("pointerup", swallowRelease, true);
            window.removeEventListener("pointercancel", swallowRelease, true);
          };
          window.addEventListener("pointerup", swallowRelease, true);
          window.addEventListener("pointercancel", swallowRelease, true);
          return;
        }
        if (!connectModeRef.current) return;
        event.preventDefault();
        suppressConnectRef.current = true;
        store.getState().cancelConnection();
        store.setState({ connectionClickStartHandle: null });
        clearConnectionOrigin();
        setHotPort(null);
        document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
        suppressConnectRef.current = false;
        chooseTool("select");
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
  }, [cancelPlacement, chooseTool, duplicateSelection, openProject, redo, saveProject, store, undo]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!placementRef.current) return;
      if (event.button === 2) {
        if (!isCanvasPlacementTarget(event.target)) return;
        event.preventDefault();
        event.stopPropagation();
        suppressContextRef.current = true;
        cancelPlacement();
        return;
      }
      if (event.button !== 0 || spaceHeldRef.current) return;
      if (!isCanvasPlacementTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      placeAt(event.clientX, event.clientY);
    };
    const onContextMenu = (event: MouseEvent) => {
      const armed = suppressContextRef.current || placementRef.current != null;
      suppressContextRef.current = false;
      if (!armed || !isCanvasPlacementTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      if (placementRef.current) cancelPlacement();
    };
    const swallowPlacedClick = (event: MouseEvent) => {
      if (performance.now() > swallowPlaceRef.current) return;
      if (!isCanvasPlacementTarget(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("contextmenu", onContextMenu, true);
    window.addEventListener("click", swallowPlacedClick, true);
    window.addEventListener("dblclick", swallowPlacedClick, true);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
      window.removeEventListener("click", swallowPlacedClick, true);
      window.removeEventListener("dblclick", swallowPlacedClick, true);
    };
  }, [cancelPlacement, placeAt]);

  const openNoodleFromDoubleClick = useCallback(
    (event: { preventDefault: () => void; stopPropagation: () => void; shiftKey?: boolean }, edgeId: string, selected: boolean | undefined) => {
      if (toolRef.current === "hand" || spaceHeldRef.current) return;
      // d3 zoom hears the double-click on the pane before React's edge handler.
      event.preventDefault();
      event.stopPropagation();
      if (event.shiftKey) return;
      const flow = store.getState();
      if (flow.connection.inProgress || flow.connectionClickStartHandle != null) return;
      if (!selected) flow.addSelectedEdges([edgeId]);
      openNoodleLabel(edgeId);
    },
    [store],
  );

  useEffect(() => {
    const onDoubleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".react-flow")) return;
      const rest = target.closest("[data-noodle-rest]");
      const edgeEl = target.closest(".react-flow__edge");
      const edgeId = rest?.getAttribute("data-noodle-rest") || edgeEl?.getAttribute("data-id");
      if (!edgeId) return;
      const selected = store.getState().edges.some((edge) => edge.id === edgeId && edge.selected);
      openNoodleFromDoubleClick(event, edgeId, selected);
    };
    document.addEventListener("dblclick", onDoubleClick, true);
    return () => document.removeEventListener("dblclick", onDoubleClick, true);
  }, [openNoodleFromDoubleClick, store]);

  useEffect(() => {
    const onCopy = (event: ClipboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      const currentNodes = nodesRef.current;
      const selectedIds = new Set(
        currentNodes.filter((node) => node.selected && node.type !== ENDPOINT_TYPE).map((node) => node.id),
      );
      const edgeIds = selectedEdgeIds(edgesRef.current);
      if (selectedIds.size === 0 && edgeIds.size === 0) return;
      const taken = takeClipboard(currentNodes, edgesRef.current, selectedIds, edgeIds);
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

  useEffect(() => {
    const release = () => {
      if (!spaceHeldRef.current) return;
      spaceHeldRef.current = false;
      setSpaceHeld(false);
      if (toolRef.current !== "hand") restoreSpaceSelection();
      else spaceSelectionRef.current = null;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key !== " " && event.code !== "Space") return;
      release();
    };
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", release);
    };
  }, [restoreSpaceSelection]);

  useEffect(() => {
    let pan: { pointerId: number; x: number; y: number } | null = null;
    const blockedTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null;
      if (!target.closest(".react-flow")) return null;
      if (target.closest(".react-flow__minimap, .react-flow__controls, [data-floating-panel], [data-canvas-chrome], [data-noodle-label]")) return null;
      return target.closest(".nopan");
    };
    const onDown = (event: PointerEvent) => {
      if (pan || (event.button !== 0 && event.button !== 1)) return;
      const blocked = blockedTarget(event.target);
      if (!blocked) return;
      const left = event.button === 0;
      if (left && toolRef.current !== "hand" && !spaceHeldRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      pan = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    };
    const onMove = (event: PointerEvent) => {
      if (!pan || event.pointerId !== pan.pointerId) return;
      const dx = event.clientX - pan.x;
      const dy = event.clientY - pan.y;
      pan = { pointerId: pan.pointerId, x: event.clientX, y: event.clientY };
      if (dx === 0 && dy === 0) return;
      void store.getState().panBy({ x: dx, y: dy });
    };
    const onUp = (event: PointerEvent) => {
      if (!pan || event.pointerId !== pan.pointerId) return;
      pan = null;
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", onUp, true);
    window.addEventListener("pointercancel", onUp, true);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onUp, true);
    };
  }, [store]);

  useEffect(() => {
    const onStyle = (event: Event) => {
      const detail = (event as CustomEvent<GroupStyleDetail>).detail;
      if (!detail) return;
      const next = applyGroupStyle(nodesRef.current, edgesRef.current, detail);
      if (!next) return;
      if (detail.history !== false) takeSnapshot();
      if (next.nodes !== nodesRef.current) {
        nodesRef.current = next.nodes;
        setNodes(next.nodes);
      }
      if (next.edges !== edgesRef.current) {
        edgesRef.current = next.edges;
        setEdges(next.edges);
      }
    };
    window.addEventListener(GROUP_STYLE_EVENT, onStyle);
    return () => window.removeEventListener(GROUP_STYLE_EVENT, onStyle);
  }, [takeSnapshot]);

  const canDelete =
    nodes.some((node) => node.selected) || edges.some((edge) => edge.selected);

  if (!sameOverlay(guides, guidesRef.current)) {
    setGuides(guidesRef.current);
  }

  return (
      <div
        className="relative h-full w-full bg-stone-100"
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
        <div
          data-canvas-chrome
          className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-3"
          style={{ zIndex: layers.selection }}
        >
          <div className="min-w-0">
            <SaveToolbar
              documentName={documentName}
              recents={recents}
              onOpen={() => void openProject()}
              onOpenRecent={(id) => void reopenRecent(id)}
              onSave={() => void saveProject("save")}
              onSaveAs={() => void saveProject("save-as")}
            />
          </div>
          <div className="pointer-events-auto absolute right-0 top-0 rounded-xl border border-white/50 bg-white/40 px-3 py-2 text-sm font-semibold text-slate-700 shadow backdrop-blur-xl min-[800px]:static">
            Noodle Board
          </div>
        </div>
        {fileError ? (
          <div
            role="alert"
            className="absolute left-4 top-20 flex max-w-[min(28rem,calc(100%-2rem))] items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 shadow"
            style={{ zIndex: layers.selection }}
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
          className={[connectMode ? "noodle-connect" : "", tool === "hand" || spaceHeld ? "noodle-hand" : "", selectedObjectCount(nodes, edges) === 1 ? "noodle-solo" : ""].filter(Boolean).join(" ") || undefined}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeDoubleClick={(event, edge) => {
            openNoodleFromDoubleClick(event, edge.id, edge.selected);
          }}
          onConnect={onConnect}
          onConnectStart={(_event, params) => {
            gestureEdgeRef.current = null;
            clearReleaseLanding();
            if (!params.nodeId || !params.handleId || !isSide(params.handleId)) return;
            // Dragging the origin reports the stationary target. Pin the source midpoint instead.
            if (params.handleType === "target") {
              const edge = reconnectRef.current?.edge;
              if (edge && isSide(edge.sourceHandle)) {
                setConnectionOrigin({ nodeId: edge.source, handleId: edge.sourceHandle, fraction: 0.5 });
              }
              return;
            }
            setConnectionOrigin({
              nodeId: params.nodeId,
              handleId: params.handleId,
              fraction: 0.5,
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
          connectionLineComponent={NoodleConnectionLine}
          connectionLineContainerStyle={{ zIndex: layers.canvas }}
          connectionMode={ConnectionMode.Loose}
          connectOnClick={connectMode}
          nodesDraggable={tool === "select" && !spaceHeld && !placement}
          nodesConnectable={!placement}
          elementsSelectable={tool !== "hand" && !spaceHeld && !placement}
          panOnDrag={tool === "hand" || spaceHeld ? [0, 1] : [1]}
          panActivationKeyCode={null}
          fitView={stored.nodes.length > 0}
          minZoom={0.15}
          maxZoom={3}
          panOnScroll
          selectionKeyCode={null}
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
            const result = duplicateGraph(
              nodesRef.current,
              edgesRef.current,
              ids,
              { x: 0, y: 0 },
              false,
              selectedEdgeIds(edgesRef.current),
            );
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
            if (guidesRef.current.lines.length > 0 || guidesRef.current.brackets.length > 0) {
              guidesRef.current = { lines: [], brackets: [] };
              setGuides(guidesRef.current);
            }
          }}
          onMoveEnd={() => {
            if (blockMoveAutosaveRef.current || !fileHandleRef.current) return;
            scheduleAutosave();
          }}
          proOptions={{ hideAttribution: true }}
        >
          <AlignmentGuides lines={guides.lines} brackets={guides.brackets} />
          {placement ? <PlacementGhost placement={placement} /> : null}
          <GroupSelection />
          <Marquee active={tool === "select" && !spaceHeld && !placement} onSelect={selectIds} />
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
            bgColor="transparent"
            maskColor="rgba(28, 25, 23, 0.12)"
          />
          <ConnectMode active={connectMode} onConnect={onConnect} isValidConnection={isValidConnection} />
        </ReactFlow>
        <Toolbar
          tool={tool}
          placement={placement?.kind ?? null}
          placingShape={placement?.kind === "shape" ? placement.shape : null}
          onTool={chooseTool}
          onAddSticky={beginSticky}
          onAddText={beginText}
          onAddShape={beginShape}
          onAddImage={(file) => void beginImage(file)}
          onCancelPlacement={cancelPlacement}
          onDelete={deleteSelected}
          canDelete={canDelete}
        />
        <FloatingLayer />
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
