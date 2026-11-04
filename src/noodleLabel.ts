import { useSyncExternalStore } from "react";

let editingId: string | null = null;
let blockClose = false;
let blockTimer = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function noodleLabelEditingId() {
  return editingId;
}

/** The Text button's press blurs the field before its click can toggle it. */
export function retainNoodleLabel() {
  blockClose = true;
  window.clearTimeout(blockTimer);
  blockTimer = window.setTimeout(() => {
    blockClose = false;
  }, 500);
}

export function releaseNoodleLabel() {
  blockClose = false;
  window.clearTimeout(blockTimer);
}

export function openNoodleLabel(id: string) {
  if (editingId === id) return;
  editingId = id;
  emit();
}

export function closeNoodleLabel() {
  if (blockClose) return;
  if (editingId == null) return;
  editingId = null;
  emit();
}

export function toggleNoodleLabel(id: string) {
  releaseNoodleLabel();
  if (editingId === id) {
    editingId = null;
    emit();
    return;
  }
  openNoodleLabel(id);
}

export function useNoodleLabelEditing(edgeId: string) {
  return useSyncExternalStore(subscribe, () => editingId === edgeId, () => false);
}
