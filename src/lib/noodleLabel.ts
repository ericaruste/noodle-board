import { useSyncExternalStore } from "react";

let editingId: string | null = null;
let blockClose = false;
let endRetain: (() => void) | null = null;
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

/** The Text button's press blurs the field before its click can toggle it. The block ends with that gesture. */
export function retainNoodleLabel() {
  blockClose = true;
  if (endRetain) {
    window.removeEventListener("pointerup", endRetain, true);
    window.removeEventListener("pointercancel", endRetain, true);
  }
  endRetain = () => {
    const finish = endRetain;
    endRetain = null;
    if (finish) {
      window.removeEventListener("pointerup", finish, true);
      window.removeEventListener("pointercancel", finish, true);
    }
    blockClose = false;
  };
  window.addEventListener("pointerup", endRetain, true);
  window.addEventListener("pointercancel", endRetain, true);
}

export function releaseNoodleLabel() {
  blockClose = false;
  if (!endRetain) return;
  window.removeEventListener("pointerup", endRetain, true);
  window.removeEventListener("pointercancel", endRetain, true);
  endRetain = null;
}

export function openNoodleLabel(id: string) {
  if (editingId === id) return;
  editingId = id;
  emit();
}

/** Pass the edge id from a blur so closing one field cannot clear a field that just opened on another noodle. */
export function closeNoodleLabel(id?: string) {
  if (blockClose) return;
  if (editingId == null) return;
  if (id != null && editingId !== id) return;
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
