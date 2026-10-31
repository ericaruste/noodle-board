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
import TextNode from "./TextNode";
import { emptyBody } from "./textBody";
import ImageNode from "./ImageNode";
import EndpointNode from "./EndpointNode";
import NoodleEdge from "./NoodleEdge";
import PortMagnet, { nearestPort } from "./PortMagnet";
import {
  END_RADIUS,
  ENDPOINT_SIZE,
  ENDPOINT_TYPE,
  PORT_SCREEN_RADIUS,
  allowsPort,
  connectionForDrop,
  sameHandle,
  connectionForPark,
  draggedEnd,
  makeEndpoint,
  pointFromEvent,
  pruneEndpoints,
  sameEnds,
} from "./noodleEnds";

const STORAGE_KEY = "noodle-board";
const MAX_HISTORY = 50;
const AUTOSAVE_MS = 700;

const nodeTypes = { sticky: StickyNode, image: ImageNode, text: TextNode, endpoint: EndpointNode };
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
  const { screenToFlowPosition, getViewport, setViewport } = useReactFlow();
  const store = useStoreApi();
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const applyingHistory = useRef(false);
  const dragSnapshotTaken = useRef(false);
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
  const [documentName, setDocumentName] = useState("Untitled");
  const [fileError, setFileError] = useState<string | null>(null);
  const [boundHandle, setBoundHandle] = useState<FileSystemFileHandle | null>(null);
  const [recents, setRecents] = useState<RecentProject[]>([]);

  useEffect(() => {
    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [nodes, edges]);

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
      const { id, data } = (event as CustomEvent<{ id: string; data: Node["data"] }>).detail;
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
      const next = addEdge(connection, edgesRef.current);
      edgesRef.current = next;
      setEdges(next);
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

      const hot = nearestPort(store.getState(), connectionState.pointer);
      const hotConnection = hot ? connectionForDrop(edge, dragged, hot) : null;
      if (hotConnection && allowsPort(nodesRef.current, dragged, hotConnection)) {
        applyReconnect(edge, hotConnection);
        return;
      }
      if (rf && allowsPort(nodesRef.current, dragged, rf)) {
        applyReconnect(edge, rf);
        return;
      }
      if (hotConnection && sameHandle(hotConnection)) return;

      const stationaryId = dragged === "source" ? edge.target : edge.source;
      const stationaryHandle =
        dragged === "source" ? (edge.targetHandle ?? null) : (edge.sourceHandle ?? null);
      const droppedOnStationary =
        connectionState.toHandle?.nodeId === stationaryId &&
        (connectionState.toHandle.id ?? null) === stationaryHandle;
      if (connectionState.isValid === false && droppedOnStationary) return;

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

  const addText = useCallback(() => {
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

  const applyHistory = useCallback(
    (snapshot: Snapshot) => {
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
      if (isTypingTarget(event.target)) return;
      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openProject, redo, saveProject, undo]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (isTypingTarget(event.target)) return;
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
              onAddSticky={addSticky}
              onAddText={addText}
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
          onMoveEnd={() => {
            if (blockMoveAutosaveRef.current || !fileHandleRef.current) return;
            scheduleAutosave();
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
