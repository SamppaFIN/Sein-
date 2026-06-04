import { useCallback, useRef, useState, useEffect } from 'react';
import { useWallStore, useFilteredNotes } from '@/store/useWallStore';
import { Toolbar } from '@/components/toolbar/Toolbar';
import { TagListView } from '@/components/panels/TagListView';
import { TimeFilter } from '@/components/ui/TimeFilter';
import { TagBar } from '@/components/ui/TagBar';
import { ZoomControls } from '@/components/ui/ZoomControls';
import { StickyNote } from '@/components/notes/StickyNote';
import { CosmicBackground } from '@/components/background/CosmicBackground';
import { DevPanel } from '@/components/dev/DevPanel';
import { InfoButton } from '@/components/ui/InfoButton';
import { CreateNoteDialog } from '@/components/ui/CreateNoteDialog';
import type { Note } from '@/types';

const WALL_SIZE = 5000;

export default function App() {
  const editingNoteId = useWallStore((s) => s.editingNoteId);
  const setEditingNoteId = useWallStore((s) => s.setEditingNoteId);
  const addNote = useWallStore((s) => s.addNote);
  const updateNote = useWallStore((s) => s.updateNote);
  const loadNotes = useWallStore((s) => s.loadNotes);
  const setFocusedNoteId = useWallStore((s) => s.setFocusedNoteId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const notes = useFilteredNotes();

  // Ref synkroniseen editointitilan tarkistukseen (välttää closure-ongelmat)
  const editingRef = useRef(editingNoteId);
  editingRef.current = editingNoteId;

  // Ref latauksen seurantaan (vain kerran)
  const hasCentered = useRef(false);

  // Lataa viestit tietokannasta ja kohdista uusimpaan
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Kun viestit latautuvat, kohdista canvas uusimpaan korttiin
  useEffect(() => {
    if (notes.length === 0 || hasCentered.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newest = notes[notes.length - 1];
    const noteCenterX = newest.x + newest.width / 2;
    const noteCenterY = newest.y + newest.height / 2;

    setScale(1.5);
    setPosition({
      x: rect.width / 2 - noteCenterX * 1.5,
      y: rect.height / 2 - noteCenterY * 1.5,
    });
    hasCentered.current = true;
  }, [notes]);

  // Zoom/pan -tila
  // Zoom/pan -tila — käytetään ref:iä reaaliaikaiseen renderöintiin
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const wallRef = useRef<HTMLDivElement>(null);

  // RAF-pohjainen transform-päivitys (60 FPS, ei React-renderöintiä kesken liikkeen)
  const rafTarget = useRef({ x: 0, y: 0, s: 1 });
  const rafId = useRef(0);
  const rafLoop = useCallback(() => {
    const el = wallRef.current;
    if (!el) return;
    const t = rafTarget.current;
    el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.s})`;
    rafId.current = requestAnimationFrame(rafLoop);
  }, []);

  // Käynnistä RAF-silmukka
  useEffect(() => {
    rafId.current = requestAnimationFrame(rafLoop);
    return () => cancelAnimationFrame(rafId.current);
  }, [rafLoop]);

  // Päivitä RAF-kohde aina kun scale tai position muuttuu
  useEffect(() => { rafTarget.current = { x: position.x, y: position.y, s: scale }; }, [position, scale]);

  // Pakota transform jokaisen React-renderöinnin jälkeen (estää palautumisen)
  useEffect(() => {
    const el = wallRef.current;
    if (!el) return;
    const t = rafTarget.current;
    el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.s})`;
  });

  // Kosketustuki — päivittää suoraan ref:iä, ei React-tilaa (smooth mobiili)
  const touchRef = useRef({ startX: 0, startY: 0, lastDist: 0, startScale: 1, startPos: { x: 0, y: 0 }, time: 0, moved: false });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.sticky-note, .toolbar, .tag-bar, .time-filter, .zoom-controls, .info-btn, .tag-list-view')) return;
    const touch = e.touches;
    const t = touchRef.current;
    t.startX = touch[0].clientX;
    t.startY = touch[0].clientY;
    t.startPos = { x: position.x, y: position.y };
    t.time = Date.now();
    t.moved = false;
    if (touch.length === 2) {
      t.lastDist = Math.hypot(touch[0].clientX - touch[1].clientX, touch[0].clientY - touch[1].clientY);
      t.startScale = scale;
    }
  }, [position, scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const t = touchRef.current;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - t.startX);
      const dy = Math.abs(touch.clientY - t.startY);
      if (dx > 5 || dy > 5) t.moved = true;
      // Päivitä suoraan RAF-kohdetta (ei React-tilaa → smooth)
      rafTarget.current = {
        x: t.startPos.x + (touch.clientX - t.startX),
        y: t.startPos.y + (touch.clientY - t.startY),
        s: scale,
      };
    } else if (e.touches.length === 2) {
      t.moved = true;
      const touch0 = e.touches[0];
      const touch1 = e.touches[1];
      const dist = Math.hypot(touch0.clientX - touch1.clientX, touch0.clientY - touch1.clientY);
      if (t.lastDist > 0) {
        const newScale = Math.min(Math.max(0.01, t.startScale * (dist / t.lastDist)), 4);
        rafTarget.current = { ...rafTarget.current, s: newScale };
      }
    }
  }, [scale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Synkronoi ref → React-tila kun liike loppuu
    setPosition({ x: rafTarget.current.x, y: rafTarget.current.y });
    setScale(rafTarget.current.s);
    const t = touchRef.current;
    if (!t.moved && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      if ((touch.target as HTMLElement).closest('.sticky-note, .toolbar, .tag-bar, .time-filter, .zoom-controls, .info-btn, .tag-list-view')) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect || isPanning) return;
      const currentlyEditing = editingRef.current;
      if (currentlyEditing) { setEditingNoteId(null); return; }
      const canvasX = (touch.clientX - rect.left - rafTarget.current.x) / rafTarget.current.s;
      const canvasY = (touch.clientY - rect.top - rafTarget.current.y) / rafTarget.current.s;
      addNote(canvasX, canvasY);
      setFocusedNoteId(null);
      setTimeout(() => {
        const r = containerRef.current?.getBoundingClientRect();
        if (r) { setScale(1.8); rafTarget.current.s = 1.8; setPosition({ x: r.width / 2 - canvasX * 1.8, y: r.height / 2 - canvasY * 1.8 }); rafTarget.current.x = r.width / 2 - canvasX * 1.8; rafTarget.current.y = r.height / 2 - canvasY * 1.8; }
      }, 50);
    }
  }, [isPanning, addNote, setEditingNoteId, setFocusedNoteId]);

  // Zoom käsittely — keskittää fokusoituun taikka hiiren mukaan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();

      // Päivitä RAF-kohde HETI ja React-tila samalla
      const oldScale = rafTarget.current.s;
      const oldX = rafTarget.current.x;
      const oldY = rafTarget.current.y;

      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      const newScale = Math.min(Math.max(0.01, oldScale + delta), 4);

      let newX: number, newY: number;
      const focusId = useWallStore.getState().focusedNoteId;

      if (focusId) {
        const note = useWallStore.getState().notes.find((n) => n.id === focusId);
        if (note) {
          const cx = note.x + note.width / 2;
          const cy = note.y + note.height / 2;
          newX = rect.width / 2 - cx * newScale;
          newY = rect.height / 2 - cy * newScale;
        } else {
          const cursorX = (e.clientX - rect.left);
          const cursorY = (e.clientY - rect.top);
          newX = cursorX - (cursorX - oldX) * (newScale / oldScale);
          newY = cursorY - (cursorY - oldY) * (newScale / oldScale);
        }
      } else {
        const cursorX = (e.clientX - rect.left);
        const cursorY = (e.clientY - rect.top);
        newX = cursorX - (cursorX - oldX) * (newScale / oldScale);
        newY = cursorY - (cursorY - oldY) * (newScale / oldScale);
      }

      // Päivitä RAF (välittömästi) ja React-tila (synkronointia varten)
      rafTarget.current = { x: newX, y: newY, s: newScale };
      setPosition({ x: newX, y: newY });
      setScale(newScale);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Pan käsittely (raahaus tyhjästä kohdasta)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sticky-note')) return;
    if ((e.target as HTMLElement).closest('.toolbar, .tag-panel, .zoom-controls, .tag-bar, .time-filter, .info-btn')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    // Päivitä suoraan RAF-kohdetta smooth pan
    rafTarget.current = {
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
      s: scale,
    };
  }, [isPanning, panStart, scale]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    // Synkronoi ref → React-tila
    setPosition({ x: rafTarget.current.x, y: rafTarget.current.y });
  }, []);

  // Klikkaus tyhjään → sulje editointi TAI luo uusi lappu
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isPanning) return;
    if ((e.target as HTMLElement).closest('.sticky-note')) return;

    const currentlyEditing = editingRef.current;
    if (currentlyEditing) {
      // Tarkista DOM:sta onko textarea:ssa oikeaa sisältöä (store on vanhentunut)
      const textarea = document.querySelector('.sticky-note.editing textarea') as HTMLTextAreaElement | null;
      const value = textarea?.value ?? '';
      const isEmpty = value.trim() === '' || value === 'Kirjoita uusi viesti seinälle';

      if (!isEmpty) {
        setFocusedNoteId(null);
      }

      if (isEmpty) {
        // Tyhjä tarra — siirrä klikkauskohtaan
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const canvasX = (e.clientX - rect.left - position.x) / scale;
          const canvasY = (e.clientY - rect.top - position.y) / scale;
          useWallStore.getState().updateNote(currentlyEditing, { x: canvasX, y: canvasY });
        }
        return;
      }

      // Tarraan on kirjoitettu — tallenna ja sulje
      setEditingNoteId(null);
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = (e.clientX - rect.left - position.x) / scale;
    const canvasY = (e.clientY - rect.top - position.y) / scale;

    addNote(canvasX, canvasY);
    setFocusedNoteId(null);

    // Zoomaa uuteen lappuun
    const rect2 = containerRef.current?.getBoundingClientRect();
    if (rect2) {
      const x = rect2.width / 2 - canvasX * 1.8;
      const y = rect2.height / 2 - canvasY * 1.8;
      setScale(1.8);
      setPosition({ x, y });
      rafTarget.current = { x, y, s: 1.8 };
    }
  }, [addNote, isPanning, position, scale, setEditingNoteId, setFocusedNoteId]);

  // Tuplaklikkaus lappuun → keskitä ja zoomaa
  const handleNoteDoubleClick = useCallback((note: Note) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const noteCenterX = note.x + note.width / 2;
    const noteCenterY = note.y + note.height / 2;
    const targetScale = 2;

    setScale(targetScale);
    setPosition({
      x: rect.width / 2 - noteCenterX * targetScale,
      y: rect.height / 2 - noteCenterY * targetScale,
    });
    // Päivitä RAF-kohde HETI (ei odota React-renderöintiä)
    rafTarget.current = {
      x: rect.width / 2 - noteCenterX * targetScale,
      y: rect.height / 2 - noteCenterY * targetScale,
      s: targetScale,
    };
  }, []);

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
    setScale(2);
    setPosition({ x: rect.width / 2 - cx * 2, y: rect.height / 2 - cy * 2 });
    rafTarget.current = { x: rect.width / 2 - cx * 2, y: rect.height / 2 - cy * 2, s: 2 };
  }, []);

  // Zoomaa ulos näyttämään koko seinä
  const handleShowAll = useCallback(() => {
    setScale(0.01);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Zoom-napit — keskittävät näkymän keskipisteen mukaan
  const zoomCentered = (dir: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const focusId = useWallStore.getState().focusedNoteId;
    const oldS = rafTarget.current.s;
    const newS = Math.min(Math.max(oldS + dir * 0.3, 0.01), 4);

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

    rafTarget.current = { x: newX, y: newY, s: newS };
    setPosition({ x: newX, y: newY });
    setScale(newS);
  };

  const zoomIn = () => zoomCentered(1);
  const zoomOut = () => zoomCentered(-1);

  const zoomReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className="no-select"
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', zIndex: 1 }}
    >
      {/* Kosminen tausta */}
      <CosmicBackground />

      <Toolbar onRandomNote={handleRandomNote} onNewNote={() => setShowCreateDialog(true)} />
      {showCreateDialog && <CreateNoteDialog onClose={() => setShowCreateDialog(false)} />}
      <TimeFilter />
      <TagBar />
      <TagListView />

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%',
          height: '100%',
          cursor: isPanning ? 'grabbing' : 'grab',
          overflow: 'hidden',
          position: 'relative',
          background: 'transparent',
        }}
      >
        {/* Ääretön canvas-kerros */}
        <div
          className="wall-canvas"
          ref={wallRef}
          onClick={handleCanvasClick}
          style={{
            width: WALL_SIZE,
            height: WALL_SIZE,
          }}
        >
          {notes.map((note) => (
            <StickyNote
              key={note.id}
              note={note}
              onUpdate={(data) => updateNote(note.id, data)}
              onDoubleClick={handleNoteDoubleClick}
            />
          ))}
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
