/**
 * Paint order for the whole board. Each token sits above the one before it:
 * canvas, selection, toolbar, dropdown, modal.
 *
 * `canvas` is for noodles and the connection line. It stays above React Flow's
 * selected-node bump (1000). `selection` is for handles, end knobs, the port
 * highlight, alignment guides, and the top chrome. It stays above an elevated
 * noodle: a selected edge adds another 1000, and a selected node can add its
 * own z on top. Toolbar and dropdown live in the shared floating layer, outside
 * the React Flow viewport, so a selected or dragged element cannot cover them.
 * `modal` is reserved for the first dialog. Nothing paints a dialog yet.
 *
 * Drag-feedback overlays (port fill, edge outline, edge marker) read `selection`
 * and do not introduce z-index numbers of their own.
 */
export const layers = {
  canvas: 1001,
  selection: 10000,
  toolbar: 11000,
  dropdown: 12000,
  modal: 13000,
} as const;

export type LayerName = keyof typeof layers;
