import { useState, type DragEvent } from 'react';

/**
 * Drag-to-reorder for a list with native HTML drag and drop. Only the grip
 * handle starts a drag (so text in the card can still be selected); up and
 * down buttons cover touch screens and keyboards.
 */
export function useReorder(onMove: (from: number, to: number) => void) {
  const [armed, setArmed] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  const handle = (i: number) => ({
    onPointerDown: () => setArmed(i),
    onPointerUp: () => setArmed(null),
  });

  const item = (i: number) => ({
    draggable: armed === i,
    onDragStart: (e: DragEvent) => {
      setDragging(i);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(i));
    },
    onDragOver: (e: DragEvent) => {
      if (dragging === null) return;
      e.preventDefault();
      if (over !== i) setOver(i);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragging !== null && dragging !== i) onMove(dragging, i);
      setDragging(null);
      setOver(null);
      setArmed(null);
    },
    onDragEnd: () => {
      setDragging(null);
      setOver(null);
      setArmed(null);
    },
  });

  return { handle, item, dragging, over };
}
