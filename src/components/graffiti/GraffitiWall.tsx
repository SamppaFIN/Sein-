import { useEffect, useRef } from 'react';
import { useWallStore } from '@/store/useWallStore';
import { getFadeOpacity } from '@/lib/notes';
import type { Note } from '@/types';

const WALL_W = 5000;
const WALL_H = 3500;

// Graffiti-fonttityylejä
const GRAFFITI_FONTS = [
  'bold 48px "Impact", "Arial Black", "Segoe UI Black", sans-serif',
  'bold 40px "Arial Black", "Impact", sans-serif',
  '900 44px "Segoe UI Black", "Arial Black", sans-serif',
  'bold 36px "Trebuchet MS", "Arial Black", sans-serif',
  '800 50px "Georgia", "Times New Roman", serif',
];

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, Math.floor(parseInt(hex.slice(1, 3), 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(parseInt(hex.slice(3, 5), 16) * (1 - amount)));
  const b = Math.max(0, Math.floor(parseInt(hex.slice(5, 7), 16) * (1 - amount)));
  return `rgb(${r},${g},${b})`;
}

function drawBrickWall(ctx: CanvasRenderingContext2D) {
  const w = WALL_W;
  const h = WALL_H;

  // Perustausta — harmaa betoni
  ctx.fillStyle = '#4a4a4e';
  ctx.fillRect(0, 0, w, h);

  // Betonitekstuuri
  ctx.strokeStyle = 'rgba(255,255,255,0.015)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 200; i++) {
    ctx.beginPath();
    const x1 = Math.random() * w;
    const y1 = Math.random() * h;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (Math.random() - 0.5) * 200, y1 + (Math.random() - 0.5) * 40);
    ctx.stroke();
  }

  // Tiiliseinä — vaakasaumat
  const brickH = 65;
  ctx.strokeStyle = 'rgba(0,0,0,0.05)';
  ctx.lineWidth = 1;
  for (let row = 0; row < Math.ceil(h / brickH); row++) {
    const y = row * brickH + (row % 2 === 0 ? 32 : 0);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Pystysaumat
  ctx.strokeStyle = 'rgba(0,0,0,0.04)';
  const brickW = 320;
  for (let col = 0; col < Math.ceil(w / brickW); col++) {
    const x = col * brickW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.setLineDash([35, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Tummia laikkuja
  for (let i = 0; i < 20; i++) {
    const cx = Math.random() * w;
    const cy = Math.random() * h;
    const r = Math.random() * 80 + 30;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, 'rgba(0,0,0,0.08)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSprayText(
  ctx: CanvasRenderingContext2D,
  note: Note,
  noteIdx: number,
  totalNotes: number,
) {
  const fadeOpacity = getFadeOpacity(note.created_at);
  ctx.globalAlpha = fadeOpacity * 0.9;

  // Puhdista markdown-syntaksi
  const cleanText = note.content
    .replace(/[#*_~`>\[\]!\-]/g, '')
    .trim();

  if (!cleanText) {
    ctx.globalAlpha = 1;
    return;
  }

  // Jaa riveihin (max 3)
  const lines = cleanText.split('\n').filter((l) => l.trim()).slice(0, 3);

  // Fontin valinta perustuu ID:hen
  const fontIdx = note.id.charCodeAt(0) % GRAFFITI_FONTS.length;
  const fontFamily = GRAFFITI_FONTS[fontIdx];
  const baseFontSize = 34 + (note.z / Math.max(totalNotes, 1)) * 22;
  const lineHeight = baseFontSize * 1.25;

  // Sijoittelu — ID-pohjainen seed (toistettava)
  const seed = note.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const baseX = 180 + (seed % 41) * 105;
  const baseY = 160 + (seed % 27) * 115;
  const rotation = ((seed % 13) - 6) * (Math.PI / 180);

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.rotate(rotation);

  // Tekstin leveys (arvio)
  const maxLineWidth = Math.max(...lines.map((l) => l.length * baseFontSize * 0.5));

  lines.forEach((line, lineIdx) => {
    const y = lineIdx * lineHeight;

    // Spray-partikkelit tekstin ympärillä
    const particleCount = 40 + noteIdx * 3;
    for (let i = 0; i < particleCount; i++) {
      const spreadX = (Math.random() - 0.5) * maxLineWidth * 1.4;
      const spreadY = (Math.random() - 0.5) * lineHeight * 1.6 + y;
      const pr = Math.random() * 2.5 + 0.3;
      const po = Math.random() * 0.4 + 0.05;

      ctx.fillStyle = note.color;
      ctx.globalAlpha = po * fadeOpacity;
      ctx.beginPath();
      ctx.arc(spreadX, spreadY, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Varsinainen teksti
    ctx.globalAlpha = fadeOpacity * 0.9;
    ctx.font = fontFamily;
    ctx.textBaseline = 'top';

    // Outine (tummempi sävy, piirretään useaan suuntaan)
    const outlineWidth = baseFontSize * 0.1;
    const outlineColor = darkenColor(note.color, 0.7);
    ctx.fillStyle = outlineColor;
    const offsets = [
      [-outlineWidth, -outlineWidth], [outlineWidth, -outlineWidth],
      [-outlineWidth, outlineWidth], [outlineWidth, outlineWidth],
      [-outlineWidth, 0], [outlineWidth, 0],
      [0, -outlineWidth], [0, outlineWidth],
    ];
    for (const [ox, oy] of offsets) {
      ctx.fillText(line.slice(0, 55), ox, oy + y);
    }

    // Varjo
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillText(line.slice(0, 55), 3, y + 3);

    // Pääteksti (päällimmäisenä)
    ctx.fillStyle = note.color;
    ctx.fillText(line.slice(0, 55), 0, y);
  });

  // Maalivalumat (vain osaan graffiteista)
  if (noteIdx % 3 === 0) {
    const dripCount = 2 + (noteIdx % 3);
    for (let d = 0; d < dripCount; d++) {
      const dripX = 10 + Math.random() * maxLineWidth * 0.7;
      const dripStart = lines.length * lineHeight - 4;
      const dripLen = 15 + Math.random() * 50;

      ctx.strokeStyle = note.color;
      ctx.lineWidth = 1.5 + Math.random() * 3;
      ctx.globalAlpha = 0.5 * fadeOpacity;
      ctx.beginPath();
      ctx.moveTo(dripX, dripStart);
      ctx.bezierCurveTo(
        dripX + (Math.random() - 0.5) * 8, dripStart + dripLen * 0.3,
        dripX + (Math.random() - 0.5) * 8, dripStart + dripLen * 0.7,
        dripX, dripStart + dripLen,
      );
      ctx.stroke();

      // Pisara valuman päähän
      ctx.fillStyle = note.color;
      ctx.beginPath();
      ctx.arc(dripX, dripStart + dripLen, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

export function GraffitiWall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const notes = useWallStore((s) => s.notes);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = WALL_W;
    canvas.height = WALL_H;

    // Piirrä tausta
    drawBrickWall(ctx);

    // Järjestä z-indeksin mukaan (vanhimmat alle, uusimmat päälle)
    const sorted = [...notes].sort((a, b) => a.z - b.z);

    sorted.forEach((note, idx) => {
      drawSprayText(ctx, note, idx, sorted.length);
    });
  }, [notes]);

  if (notes.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 18,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎨</div>
        <div>Seinä on puhdas</div>
        <div style={{ fontSize: 13, marginTop: 8, color: 'rgba(255,255,255,0.15)' }}>
          Luo tarroja tarra-tilassa — ne näkyvät täällä graffiteina
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
