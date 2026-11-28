# Noodle ports

How the small dots on a selected node are drawn, when they show, and what a press or drag does. There is no arrow button and no duplicate button on a port. An arrow is only the noodle preview. Duplicate is Ctrl+D or Alt-drag of the node body.

Code names: `sticky`, `image`, `text`, and `shape` with kinds `rect` (Rectangle; a square only when width equals height), `round-rect`, `ellipse` (Ellipse; a circle only when width equals height), `triangle`, and `diamond`. Endpoint nodes are not these ports.

## Where they are drawn

Every sticky, image, text, and shape node renders the same `ObjectPorts` (`src/canvas/ObjectPorts.tsx`). Each side is a React Flow `Handle`, a `div.react-flow__handle`, not SVG and not a custom dot.

```tsx
<Handle
  id={handleId}
  type="source"
  position={Position[side]}
  className={className}
  style={landing || !placement ? undefined : offsetStyle(handleId, placement.fraction)}
/>
```

React Flow places the handle `position: absolute` at the midpoint of that side (`left: 50%` or `top: 50%`, `border-radius: 100%` from `@xyflow/react/dist/style.css`). This app then pushes it outside the box. The only percentage is how far along the side the dot sits, and that stays `50%` until a drag slides it.

From `src/index.css`:

```css
.noodle-node .react-flow__handle {
  z-index: 3;
  width: var(--noodle-port-size, 10px);
  height: var(--noodle-port-size, 10px);
  min-width: 0;
  min-height: 0;
}

.noodle-node .react-flow__handle-top {
  transform: translate(-50%, calc(-50% - var(--noodle-handle-outset, 14px)));
}
```

Bottom, left, and right use the same outset on the other axis.

`--noodle-port-size` and `--noodle-handle-outset` come from the node’s resize style in `src/canvas/NoodleResizer.tsx`, not from the node’s width or height. At zoom 1 the dot is 8px and the outset is 14px. Zoom-out multiplies those by `max(1/zoom, 1) ** 0.65`, so the dots shrink only partway.

```ts
const HIT_PX = 16;
const PORT_PX = 8;
const GAP_PX = 2;
// ...
"--noodle-port-size": `${port}px`,
"--noodle-handle-outset": `${thickness / 2 + port / 2 + gap}px`,
```

`thickness` is `HIT_PX * compensate`, `port` is `PORT_PX * compensate`, and `gap` is `GAP_PX * compensate`. The CSS fallbacks are 10px and 14px if those variables are missing.

Idle color is `#64748b` with the border removed (`src/index.css`, the `.react-flow__handle` rule). The Handle also gets React Flow’s `nodrag` and `nopan` classes, so a port press does not drag the node or pan.

All four handles are `type="source"`. `connectionMode={ConnectionMode.Loose}` lets any of them be the end of a noodle.

## Where they sit in the tree

`ObjectPorts` is a direct child of `.noodle-node`, next to the resizer and the shape. It is not inside the painted geometry.

The diamond and triangle are SVG paths in a sibling `<svg class="overflow-visible">`. The diamond is not a rotated square. `clip-path` is only on `.noodle-shape-hit`, the invisible hit shape, and that element does not wrap the ports. `.noodle-shape-text` is `overflow: hidden`, and the ports are not inside it. `.react-flow__node-shape` and `.react-flow__node-image` set `overflow: visible`. Sticky and text nodes do not set overflow, so it stays visible. Nothing in the port chain is rotated, clipped, or `overflow: hidden`.

The dots follow the rectangular node box:

- Rectangle, rounded rectangle, sticky, image, and text: midpoints of the four box edges, then outset.
- Ellipse: those midpoints are the four cardinal points of the ellipse, then outset past the curve.
- Diamond: the four box midpoints are the four vertices, then outset past them.
- Triangle: top is the apex and bottom is the middle of the base. Left and right sit at half the box height, outside the slanted edges, in the empty corners of the box.

Image ports follow the node rectangle. `object-contain` does not move them onto the bitmap.

## When they show, and what hover does

Idle visibility is CSS, not a `:hover` rule. There is no `transition` on a port.

From `src/index.css`:

```css
.react-flow .react-flow__handle,
.react-flow .react-flow__handle.connectionindicator {
  opacity: 0;
  pointer-events: none;
}

.noodle-solo .react-flow__node.selected .react-flow__handle,
.noodle-solo .react-flow__node.selected .react-flow__handle.connectionindicator {
  opacity: 1;
  pointer-events: all;
}
```

`.noodle-solo` is on the board only when exactly one object is selected. A selected noodle counts. Hand tool and Space add `.noodle-hand`, which forces the dots back to `opacity: 0` and `pointer-events: none`.

Hovering a visible dot does not change its size or color. The cursor is React Flow’s `crosshair` (`.connectionindicator`). The node body stays `grab`.

During a noodle drag, React state (`HoverTarget` in `src/lib/portHot.ts`) swaps classes:

| Class | When | Look |
| --- | --- | --- |
| `noodle-port-outline` | Pointer is over that node, but not snapped to this side | White fill, 2px `#334155` border, normal size |
| `noodle-port-fill` | Snapped to this side’s midpoint | `#0f172a`, 1.7× size, 3px slate ring |
| `noodle-port-hot` | This handle is the moving attachment | Handle forced to `opacity: 0` |
| `clickconnecting` | Arrow tool has armed a click on this handle | 1.45×, `#0f172a`, 4px ring |

The hot dot is redrawn as a separate `div.noodle-port-marker` in a `ViewportPortal`: 14px, `#0f172a`, 4px ring, `pointer-events: none`, `z-index: layers.selection`. That 14px is not the zoom-compensated port size. `DragLanding` in `src/canvas/PortMagnet.tsx` draws a `#334155` rectangle around the node box (2px stroke). On a free-edge landing it also draws an 8px screen-size marker (`8 / zoom` flow px).

The start hit is the visible circle only. `selectedPortPress` keeps the press when the pointer is inside that element’s radius. There is no larger invisible pad for starting a noodle.

A noodle that is already moving uses a larger zone, in screen pixels, converted by zoom:

| Name | Pixels | Role |
| --- | --- | --- |
| `PORT_SCREEN_RADIUS` | 48 | Snap to the nearest midpoint, and React Flow’s `connectionRadius` |
| `PORT_SNAP_EXIT_PX` | 58 | Leave that snap (`PORT_SCREEN_RADIUS + 10`) |
| `EDGE_BAND_PX` | 14 | Still “over” the element just outside the outline |
| `LANDING_BAND_SCREEN_PX` | 28 | In a gap, the nearest side can still catch the end |
| `DRAG_START` | 5 | Arrow-tool movement before a click becomes a drag (`src/canvas/ConnectMode.tsx`) |

`PORT_SCREEN_RADIUS` does not start a noodle. It only applies once a noodle is already moving.

## Click, press, and drag

Nothing on a port copies a node or shows a spawned-node ghost. `PlacementGhost` is the toolbar placement preview. Duplicate is Ctrl+D (`DUPLICATE_GAP` = 32 flow px in `src/lib/duplicate.ts`) or Alt-drag of the node. The handle’s `nodrag` class keeps a port drag off that path.

**Select tool.** `PortMagnet` listens on pointerdown. If the sole selected node’s visible port is under the pointer, it stops the event, pins the source at fraction `0.5`, and `forwardEndDrag` sends a synthetic mousedown to that handle. React Flow then runs a connection. The preview is `NoodleConnectionLine` (`src/canvas/connectionLine.tsx`): an elbow path, 2px, default noodle color, with an SVG arrow marker. It is not a node ghost.

Release goes through `onConnect` / `onConnectEnd` in `src/App.tsx`. A new edge is `type: "smoothstep"` so `NoodleEdge` draws it, with `data.shape: "elbow"`, `markerEnd: "arrow"` in edge data, and `markerEnd` on the edge object cleared. Source fraction is always `0.5`. Target fraction is the drop point along that side, or `0.5` when the landing mode is a port. `connectionMode` is `ConnectionMode.Loose`. A click that never leaves the same point is rejected by `sameAttachmentPoint`. Dropping in empty space does not create a node or a noodle.

**Arrow tool** (`tool === "arrow"`, `connectOnClick`). `ConnectMode` takes the pointer. A press that moves less than 5px arms `connectionClickStartHandle` and shows `ConnectPreview` (same elbow plus arrow) until a second click lands on another element or the gesture is cancelled. A press that moves 5px or more becomes the same drag as the select tool. `nodesConnectable` is false for the hand tool, Space, and placement, so those presses do not start a noodle.

## Canvas behavior

`selectionOnDrag` is left at React Flow’s default `false`. Marquee is the custom `Marquee`, and only on the select tool. Its ignore list includes `.react-flow__handle`, so a press on a dot does not start a marquee.

`panOnDrag` is the middle button in the select tool, and the left and middle buttons for the hand tool or Space. Handles are `nopan`. A separate listener pans when a left or middle press starts on `.nopan` during hand or Space, so a port does not pan the board in the select tool.

A pane click deselects and the dots disappear with `.selected`. A port press calls `holdSelection` and swallows the following click so that press does not select the noodle that paints over the dot. `clearEdgeSelection` drops a selected noodle when a port connect starts.

Selected solo nodes are lifted to `z-index: var(--noodle-layer-selection)` (`layers.selection`, 10000). Noodles sit on `layers.canvas` (1001), so the dots stay clickable through a stroke. Inside the node, resize strips are `z-index: 1`, resize corners `2`, ports `3`. Shape nodes set `pointer-events: none` on `.react-flow__node-shape`. A visible port sets `pointer-events: all` on itself, so the dot still receives the hit.

## Hardcoded pixels vs node size

| Value | What it is |
| --- | --- |
| Dot size | `PORT_PX` (8) times zoom compensation. CSS fallback 10px. Not a percentage of the node. |
| Outset from the edge | `thickness / 2 + port / 2 + gap`, 14px at zoom 1. CSS fallback 14px. Not a percentage of the node. |
| Along-side position | `50%`, or `fraction * 100%` while a drag slides the handle. |
| Start hit area | The visible circle’s radius. Same as the painted dot. |
| Landing snap | 48 screen px (`PORT_SCREEN_RADIUS`), plus the 14 / 28 / 58 bands above. |
| Hot marker | 14px, fixed, not the compensated port size. |
| Fill / armed size | 1.7× and 1.45× the port size. |
| Noodle gap | `ROUTE_GAP` = 8 flow px between the node edge and the drawn noodle end. Not a spawn distance. |
| Duplicate step | `DUPLICATE_GAP` = 32 flow px. Ctrl+D and Alt-drag only. Not a port. |

## By node type

| node type | port sides | drawing and positioning | hover/hit area | click behavior | drag behavior | inconsistencies |
| --- | --- | --- | --- | --- | --- | --- |
| Sticky note | top, right, bottom, left | `Handle` div on the box midpoints, outset by `--noodle-handle-outset`. Not inside a clip or rotation. | Idle: the painted circle only (8px at zoom 1). No `:hover`. While connecting, 48px screen snap fills that side. | Starts a noodle only. No copy, no ghost node. | Select tool: connection drag, elbow preview with an arrow. Drop writes a `smoothstep` edge (`shape: "elbow"`). | Same component as every other node. |
| Rectangle (`rect`) | same four | Same handles on the rectangular box. Painted shape is a sibling SVG. | Same. Start hit equals the dot. | Same. | Same. | A square only when width equals height. Ports ignore the 8px painted corner radius. |
| Rounded rectangle | same four | Same box midpoints plus outset. | Same. | Same. | Same. | Attachment outline uses the corner radius. The idle dots stay on the straight midpoints, outside the curve. |
| Ellipse | same four | Cardinal points of the bounding box, then outset past the curve. | Same. | Same. | Same. | A circle only when width equals height. Dots sit outside the ellipse by the outset, not on the stroke. |
| Diamond | same four | Box midpoints are the four vertices, then outset. SVG path is a sibling. No rotation, no clip on the ports. | Same. The dot is outside the vertex and still hittable. | Same. | Same. | `clip-path` is only on `.noodle-shape-hit`. Empty box corners do not select the diamond, but the dots do. |
| Triangle | same four | Top = apex, bottom = base midpoint, both outset. Left and right are at half the box height. | Same. Left and right dots are in the empty corners, outside the triangle, and still receive hits. | Same. | Same. | Left and right ports do not lie on the slanted edges. The landing outline is still the rectangle (`outlineRadius` is 0 except for rounded rectangles). |
| Image | same four | Same handles on the node box. `overflow: visible`. | Same. | Same. | Same. | `object-contain` can leave empty box around the bitmap. Ports stay on the box, not the image. |
| Text | same four | Same handles on the hug box. | Same. | Same. | Same. | The text frame is `overflow: hidden`, but the ports are not inside it, so they are not clipped. |
