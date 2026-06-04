import { useCallback, useRef, useState, useEffect } from 'react';
import { useWallStore } from '@/store/useWallStore';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { TagListView } from '@/components/panels/TagListView';
import { TimeFilter } from '@/components/ui/TimeFilter';
import { TagBar } from '@/components/ui/TagBar';
import { ZoomControls } from '@/components/ui/ZoomControls';
import { NotesCanvas } from '@/components/canvas/NotesCanvas';
import { CosmicBackground } from '@/components/background/CosmicBackground';
import { DevPanel } from '@/components/dev/DevPanel';
import { InfoButton } from '@/components/ui/InfoButton';
import { CreateNoteDialog } from '@/components/ui/CreateNoteDialog';
import type { Note } from '@/types';
import { computeNotesBounds } from '@/lib/notes';

const WALL_SIZE = 5000;

export default function App() {
  const editingNoteId = useWallStore((s) => s.editingNoteId);
  const setEditingNoteId = useWallStore((s) => s.setEditingNoteId);
  const loadNotes = useWallStore((s) => s.loadNotes);
  const setFocusedNoteId = useWallStore((s) => s.setFocusedNoteId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const pendingPos = useRef({ x: 300, y: 300 });
  const notes = useWallStore((s) => s.notes);

  // Ref synkroniseen editointitilan tarkistukseen (välttää closure-ongelmat)
  const editingRef = useRef(editingNoteId);
  editingRef.current = editingNoteId;

  // Ref latauksen seurantaan (vain kerran)
  const hasCentered = useRef(false);

  // Lataa viestit tietokannasta ja kohdista uusimpaan
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Kun viestit latautuvat, kohdista niiden keskipisteeseen
  useEffect(() => {
    if (notes.length === 0 || hasCentered.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const bounds = computeNotesBounds(notes);
    const margin = 100;

    // Jos kaikki laput mahtuvat yhteen nippuun, zoomaa sopivasti
    const maxS = Math.min(rect.width / ((bounds.maxX - bounds.minX) + margin * 2), 1.5);
    const s = Math.min(maxS, rect.height / ((bounds.maxY - bounds.minY) + margin * 2), 1.5);

    zoomGoal.current = { x: rect.width / 2 - bounds.cx * s, y: rect.height / 2 - bounds.cy * s, s };
    setScale(s);
    setPosition({ x: rect.width / 2 - bounds.cx * s, y: rect.height / 2 - bounds.cy * s });
    hasCentered.current = true;
  }, [notes]);

  // Zoom/pan -tila
  // Zoom/pan -tila
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const panRef = useRef({ panning: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);

  // 5 kiinteää zoom-tasoa — + zoomGoal/rafTarget refsit (yhteensopivuus)
  const ZOOM_LEVELS = [0.15, 0.35, 0.6, 1, 1.8, 3.5];
  const zoomIdx = useRef(2);
  const zoomGoal = useRef({ x: 0, y: 0, s: 1 });
  const rafTarget = useRef({ x: 0, y: 0, s: 1 });

  // Yksinkertainen RAF: päivittää seinän + parallaxin suoraan DOM:iin
  const rafPos = useRef({ x: 0, y: 0 }); // vain pan-dragille
  const rafId = useRef(0);
  useEffect(() => {
    const loop = () => {
      const wall = wallRef.current;
      const bg = document.querySelector('.cosmic-bg-canvas') as HTMLCanvasElement | null;
      const px = rafPos.current.x + position.x;
      const py = rafPos.current.y + position.y;
      if (wall) wall.style.transform = `translate(${px}px, ${py}px) scale(${scale})`;
      if (bg) bg.style.transform = `translate(${px * 0.15}px, ${py * 0.15}px) scale(${Math.min(1, 0.5 + scale * 0.5)})`;
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, [scale, position]);

  // Päivitä inline style jokaisen renderöinnin jälkeen (React pitää ajan tasalla)
  useEffect(() => {
    const wall = wallRef.current;
    if (!wall) return;
    wall.style.transformOrigin = '0 0';
    wall.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scale})`;
  }, [scale, position]);

  // Zoom — 5 kiinteää tasoa, rulla siirtyy tasojen välillä
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const dir = e.deltaY > 0 ? -1 : 1;
      const next = Math.min(Math.max(zoomIdx.current + dir, 0), ZOOM_LEVELS.length - 1);
      if (next === zoomIdx.current) return;
      zoomIdx.current = next;
      const newScale = ZOOM_LEVELS[next];

      // Pidä hiiren alla oleva kohta paikallaan
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const newX = cursorX - (cursorX - position.x) * (newScale / scale);
      const newY = cursorY - (cursorY - position.y) * (newScale / scale);

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Pan käsittely — NotesCanvas hoitaa

  // Tuplaklikkaus lappuun → keskitä ja zoomaa
  const handleNoteDoubleClick = useCallback((note: Note) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const noteCenterX = note.x + note.width / 2;
    const noteCenterY = note.y + note.height / 2;
    const targetScale = 1.8;

    // Synkronoi zoomIdx kiinteisiin tasoihin
    zoomIdx.current = ZOOM_LEVELS.indexOf(targetScale);
    if (zoomIdx.current < 0) zoomIdx.current = 3;

    setScale(targetScale);
    setPosition({
      x: rect.width / 2 - noteCenterX * targetScale,
      y: rect.height / 2 - noteCenterY * targetScale,
    });
    zoomGoal.current = {
      x: rect.width / 2 - noteCenterX * targetScale,
      y: rect.height / 2 - noteCenterY * targetScale,
      s: targetScale,
    };
    setFocusedNoteId(note.id);
  }, [setFocusedNoteId]);

  // Satunnainen lappu
  const handleRandomNote = useCallback(() => {
    const notes = useWallStore.getState().notes;
    if (notes.length === 0) return;
    const randomIdx = Math.floor(Math.random() * notes.length);
    const note = notes[randomIdx];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = note.x + note.width / 2;
    const cy = note.y + note.height / 2;
    const s = 1.8;
    zoomGoal.current = { x: rect.width / 2 - cx * s, y: rect.height / 2 - cy * s, s };
    zoomIdx.current = ZOOM_LEVELS.indexOf(s);
    setScale(s);
    setPosition({ x: rect.width / 2 - cx * s, y: rect.height / 2 - cy * s });
  }, []);

  // Keskitä kaikkiin lappuihin
  const handleShowAll = useCallback(() => {
    const notes = useWallStore.getState().notes;
    if (notes.length === 0) {
      zoomGoal.current = { x: 0, y: 0, s: 1 };
      setScale(1); setPosition({ x: 0, y: 0 });
      return;
    }
    const bounds = computeNotesBounds(notes);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Valitse skaala niin, että kaikki laput mahtuvat + marginaali
    const margin = 200;
    const s = Math.min(
      Math.min(rect.width / (bounds.maxX - bounds.minX + margin * 2), 1.5),
      Math.min(rect.height / (bounds.maxY - bounds.minY + margin * 2), 1.5),
    );
    zoomGoal.current = { x: rect.width / 2 - bounds.cx * s, y: rect.height / 2 - bounds.cy * s, s };
    setScale(s);
    setPosition({ x: rect.width / 2 - bounds.cx * s, y: rect.height / 2 - bounds.cy * s });
  }, []);

  // Zoom-napit — keskittävät näkymän keskipisteen mukaan
  const zoomCentered = (dir: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const focusId = useWallStore.getState().focusedNoteId;
    const oldS = rafTarget.current.s;
    const newS = Math.min(Math.max(oldS * (dir > 0 ? 1.3 : 0.75), 0.01), 4);

    let newX = rafTarget.current.x;
    let newY = rafTarget.current.y;

    if (focusId) {
      const note = useWallStore.getState().notes.find((n) => n.id === focusId);
      if (note) {
        const cx = note.x + note.width / 2;
        const cy = note.y + note.height / 2;
        newX = rect.width / 2 - cx * newS;
        newY = rect.height / 2 - cy * newS;
      }
    } else {
      newX = rect.width / 2 - (rect.width / 2 - rafTarget.current.x) * (newS / oldS);
      newY = rect.height / 2 - (rect.height / 2 - rafTarget.current.y) * (newS / oldS);
    }

    setPosition({ x: newX, y: newY });
    setScale(newS);
    setPosition({ x: newX, y: newY });
    setScale(newS);
  };

  const zoomIn = () => zoomCentered(1);
  const zoomOut = () => zoomCentered(-1);

  const zoomReset = () => {
    zoomGoal.current = { x: 0, y: 0, s: 1 };
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Pinch-zoom — keskittyy sormien väliin, clamp kiinteisiin rajoihin
  const handlePinchZoom = useCallback(({ scale: newScale, centerX, centerY }: { scale: number; centerX: number; centerY: number }) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const oldScale = scale;
    const clamped = Math.min(3.5, Math.max(0.15, newScale));

    // Zoom keskittyy pinch-keskipisteeseen: uusi positio = piste pysyy paikallaan
    const worldX = (centerX - rect.left - position.x) / oldScale;
    const worldY = (centerY - rect.top - position.y) / oldScale;

    setScale(clamped);
    setPosition({
      x: centerX - rect.left - worldX * clamped,
      y: centerY - rect.top - worldY * clamped,
    });

    // Synkronoi zoomIdx lähimpään kiinteään tasoon
    const ZOOM_LEVELS = [0.15, 0.35, 0.6, 1, 1.8, 3.5];
    let bestDiff = Infinity;
    let bestIdx = zoomIdx.current;
    for (let i = 0; i < ZOOM_LEVELS.length; i++) {
      const diff = Math.abs(ZOOM_LEVELS[i] - clamped);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
    zoomIdx.current = bestIdx;
  }, [scale, position]);

  return (
    <div
      className="no-select"
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}
    >
      {/* Kosminen tausta */}
      <CosmicBackground />

      <Toolbar onRandomNote={handleRandomNote} onNewNote={() => setShowCreateDialog(true)} />
      {showCreateDialog && <CreateNoteDialog onClose={() => setShowCreateDialog(false)} x={pendingPos.current.x} y={pendingPos.current.y} />}
      <TimeFilter />
      <TagBar />
      <TagListView />

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          overflow: 'hidden',
          position: 'relative',
          background: 'transparent',
          touchAction: 'none',
        }}
      >
        {/* Ääretön canvas-kerros */}
        <div
          className="wall-canvas"
          ref={wallRef}

          style={{
            width: WALL_SIZE,
            height: WALL_SIZE,
          }}
        >
          <NotesCanvas
            scale={scale}
            onNoteClick={(note) => setEditingNoteId(note.id)}
            onNoteDblClick={(note) => { setFocusedNoteId(note.id); handleNoteDoubleClick(note); }}
            onCanvasClick={(cx, cy) => {
              if (editingNoteId) { setEditingNoteId(null); return; }
              pendingPos.current = { x: cx, y: cy };
              setShowCreateDialog(true);
            }}
            onPanStart={({ clientX, clientY }) => {
              panRef.current = {
                panning: true,
                startX: clientX,
                startY: clientY,
                startPosX: position.x,
                startPosY: position.y,
              };
            }}
            onPanMove={({ clientX, clientY }) => {
              if (!panRef.current.panning) return;
              const dx = clientX - panRef.current.startX;
              const dy = clientY - panRef.current.startY;
              rafPos.current = { x: dx, y: dy };
            }}
            onPanEnd={() => {
              panRef.current.panning = false;
              const totalX = position.x + rafPos.current.x;
              const totalY = position.y + rafPos.current.y;
              setPosition({ x: totalX, y: totalY });
              rafPos.current = { x: 0, y: 0 };
            }}
            onPinchZoom={handlePinchZoom}
          />
        </div>
      </div>

      <ZoomControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={zoomReset}
        onShowAll={handleShowAll}
        scale={scale}
      />

      {import.meta.env.DEV && <DevPanel />}
      <InfoButton />

      {/* Ohjeistus uudelle käyttäjälle */}
      {notes.length === 0 && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)',
            pointerEvents: 'none',
            zIndex: 5000,
            textShadow: '0 0 20px rgba(100,150,255,0.5)',
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>
          <div style={{ fontSize: 20, marginBottom: 8, fontWeight: 500 }}>
            Klikkaa seinää ja jätä viesti
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
            Raahaa tyhjästä kohdasta liikkuaksesi • Rullaa zoomataksesi
          </div>
        </div>
      )}
    </div>
  );
}
