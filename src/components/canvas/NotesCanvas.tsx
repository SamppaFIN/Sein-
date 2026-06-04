import { useEffect, useRef, useCallback } from 'react';
import { useWallStore } from '@/store/useWallStore';
import { getFadeOpacity } from '@/lib/notes';
import type { Note } from '@/types';

interface NotesCanvasProps {
  scale: number;
  positionX: number;
  positionY: number;
  onNoteClick: (note: Note) => void;
  onNoteDblClick: (note: Note) => void;
  onCanvasClick: (canvasX: number, canvasY: number) => void;
  onPanStart: (e: { clientX: number; clientY: number }) => void;
  onPanMove: (e: { clientX: number; clientY: number }) => void;
  onPanEnd: () => void;
}

const CANVAS_W = 5000;
const CANVAS_H = 3500;

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function NotesCanvas({
  scale, positionX, positionY,
  onNoteClick, onNoteDblClick, onCanvasClick,
  onPanStart, onPanMove, onPanEnd,
}: NotesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notes = useWallStore((s) => s.notes);
  const editingNoteId = useWallStore((s) => s.editingNoteId);
  const focusedNoteId = useWallStore((s) => s.focusedNoteId);

  // Piirrä kaikki laput
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    const sorted = [...notes].sort((a, b) => a.z - b.z);

    for (const note of sorted) {
      const isActive = editingNoteId === note.id || focusedNoteId === note.id;
      const fade = isActive ? 1 : getFadeOpacity(note.created_at);

      ctx.save();
      ctx.globalAlpha = fade * 0.95;
      ctx.translate(note.x + note.width / 2, note.y + note.height / 2);
      ctx.rotate((note.rotation * Math.PI) / 180);

      const w = note.width;
      const h = note.height;

      // Varjo
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = isActive ? 14 : 6;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;

      // Tausta
      ctx.fillStyle = note.color;
      drawRoundedRect(ctx, -w / 2, -h / 2, w, h, 2);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Sisältö — puhdista markdown
      const cleanText = note.content
        .replace(/[#*_~`>\[\]!\-]/g, '')
        .trim() || '...';

      ctx.fillStyle = '#1a1a1a';
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.textBaseline = 'top';

      const lines = cleanText.split('\n').slice(0, 5);
      let lineY = -h / 2 + 10;
      for (const line of lines) {
        const wrapped = wrapText(ctx, line, w - 20);
        for (const wline of wrapped) {
          if (lineY > h / 2 - 34) break;
          ctx.fillText(wline, -w / 2 + 10, lineY);
          lineY += 15;
        }
        if (lineY > h / 2 - 34) break;
      }

      // Tagit
      if (note.tags.length > 0) {
        lineY = Math.max(lineY, h / 2 - 26);
        ctx.font = '10px "Segoe UI", sans-serif';
        let tagX = -w / 2 + 10;
        for (const tag of note.tags.slice(0, 3)) {
          const tagStr = '#' + tag;
          const tw = ctx.measureText(tagStr).width + 10;
          if (tagX + tw > w / 2 - 10) break;
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          ctx.fillRect(tagX, lineY - 1, tw, 16);
          ctx.fillStyle = '#8b7d3c';
          ctx.fillText(tagStr, tagX + 5, lineY + 2);
          tagX += tw + 4;
        }
      }

      // Aikaleima
      ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillStyle = '#999';
      ctx.textAlign = 'right';
      const timeStr = new Date(note.created_at).toLocaleDateString('fi-FI', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      });
      ctx.fillText(timeStr, w / 2 - 8, h / 2 - 14);

      // Aktiivisen korostus
      if (isActive) {
        ctx.strokeStyle = '#6af';
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, -w / 2 - 2, -h / 2 - 2, w + 4, h + 4, 4);
        ctx.stroke();
      }

      ctx.restore();
    }
  }, [notes, editingNoteId, focusedNoteId]);

  useEffect(() => { draw(); }, [draw]);

  // Hit-test
  const hitTest = useCallback((canvasX: number, canvasY: number): Note | null => {
    const sorted = [...notes].sort((a, b) => b.z - a.z);
    for (const note of sorted) {
      if (
        canvasX >= note.x && canvasX <= note.x + note.width &&
        canvasY >= note.y && canvasY <= note.y + note.height
      ) return note;
    }
    return null;
  }, [notes]);

  const lastClick = useRef(0);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    onPanStart({ clientX: e.clientX, clientY: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    isDragging.current = true;
    onPanMove({ clientX: e.clientX, clientY: e.clientY });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    onPanEnd();
    if (isDragging.current) { isDragging.current = false; return; }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const canvasX = (e.clientX - rect.left - positionX) / scale;
    const canvasY = (e.clientY - rect.top - positionY) / scale;

    const hit = hitTest(canvasX, canvasY);
    const now = Date.now();
    if (hit) {
      if (now - lastClick.current < 400) {
        onNoteDblClick(hit);
        lastClick.current = 0;
      } else {
        onNoteClick(hit);
        lastClick.current = now;
      }
    } else {
      onCanvasClick(canvasX, canvasY);
      lastClick.current = 0;
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'auto' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}
