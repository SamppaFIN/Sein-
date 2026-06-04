import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Note } from '@/types';
import { EDIT_WINDOW_MINUTES, PRESET_COLORS } from '@/types';
import { getFadeOpacity } from '@/lib/notes';
import { useWallStore } from '@/store/useWallStore';

interface StickyNoteProps {
  note: Note;
  onUpdate: (data: Partial<Note>) => void;
  onDoubleClick: (note: Note) => void;
}

export const StickyNote = React.memo(function StickyNote({ note, onUpdate, onDoubleClick }: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localContent, setLocalContent] = useState(note.content);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const editingNoteId = useWallStore((s) => s.editingNoteId);
  const setEditingNoteId = useWallStore((s) => s.setEditingNoteId);
  const setActiveListViewTag = useWallStore((s) => s.setActiveListViewTag);
  const setFocusedNoteId = useWallStore((s) => s.setFocusedNoteId);
  const focusedNoteId = useWallStore((s) => s.focusedNoteId);

  const isEditing = editingNoteId === note.id;

  // Tarkista onko muokkausaika mennyt umpeen
  const createdAt = new Date(note.created_at).getTime();
  const editDeadline = createdAt + EDIT_WINDOW_MINUTES * 60 * 1000;
  const timeLeft = editDeadline - Date.now();
  const canEdit = timeLeft > 0;
  const minutesLeft = Math.max(0, Math.floor(timeLeft / 60000));
  const secondsLeft = Math.max(0, Math.floor((timeLeft % 60000) / 1000));

  // Haalistuminen — pois päältä jos editoidaan tai fokusoitu
  const isActive = isEditing || focusedNoteId === note.id;
  const fadeOpacity = isActive ? 1 : getFadeOpacity(note.created_at);

  // Sulje väripaletti klikkauksesta ulkopuolelle
  useEffect(() => {
    if (!showColorPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showColorPicker]);

  // Tuplaklikkaus → zoom + fokus
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFocusedNoteId(note.id);
    onDoubleClick(note);
  }, [note, onDoubleClick, setFocusedNoteId]);

  // Raahauksen aloitus
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing) return;

    setIsDragging(true);
    const rect = noteRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, [isEditing]);

  // Raahauksen aikainen liike
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const parent = noteRef.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const transform = window.getComputedStyle(parent).transform;
      const scaleMatch = /matrix\(([^)]+)\)/.exec(transform);
      let scale = 1;
      if (scaleMatch) {
        const values = scaleMatch[1].split(', ').map(Number);
        scale = values[0];
      }
      const newX = (e.clientX - parentRect.left - dragOffset.x) / scale;
      const newY = (e.clientY - parentRect.top - dragOffset.y) / scale;
      onUpdate({ x: newX, y: newY });
    };

    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, dragOffset, onUpdate]);

  // Fokus textarea kun editointi alkaa
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Tallenna editointi
  const saveEdit = useCallback(() => {
    setEditingNoteId(null);
    if (localContent !== note.content) {
      onUpdate({ content: localContent });
    }
  }, [localContent, note.content, onUpdate, setEditingNoteId]);

  // Käsittele tagien poiminta
  const extractTags = (text: string): string[] => {
    const tagRegex = /#([\wäöåÄÖÅ-]+)/g;
    const tags: string[] = [];
    let match;
    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1].toLowerCase());
    }
    return [...new Set(tags)];
  };

  const handleSaveWithTags = useCallback(() => {
    const tags = extractTags(localContent);
    onUpdate({ content: localContent, tags });
    setEditingNoteId(null);
  }, [localContent, onUpdate, setEditingNoteId]);

  // Päivitetään localContent kun note muuttuu ulkoa
  useEffect(() => {
    if (!isEditing) setLocalContent(note.content);
  }, [note.content, isEditing]);

  // Automaattinen tallennus kun editointi lopetetaan ulkoisesti (esim. canvas-klikkaus)
  const wasEditingRef = useRef(isEditing);
  useEffect(() => {
    const wasEditing = wasEditingRef.current;
    wasEditingRef.current = isEditing;
    // Jos siirryttiin editoinnista pois ulkoisen syyn takia → tallenna
    if (wasEditing && !isEditing && localContent !== note.content) {
      const tags = extractTags(localContent);
      onUpdate({ content: localContent, tags });
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Aloita editointi klikkauksella
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) return;
    if (!canEdit) return; // lukittu — aika umpeutunut
    if (editingNoteId && editingNoteId !== note.id) return; // toinen on jo auki
    setEditingNoteId(note.id);
  }, [isDragging, canEdit, editingNoteId, note.id, setEditingNoteId]);

  // Tagin klikkaus → lista-näkymä
  const handleTagClick = useCallback((e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    setActiveListViewTag(tag);
  }, [setActiveListViewTag]);

  // Värikoodin tekstuuriefekti (gradient based on color)
  const bgGradient = isEditing
    ? `linear-gradient(135deg, ${note.color}, ${note.color}dd)`
    : `linear-gradient(135deg, ${note.color}, ${note.color}cc)`;

  return (
    <div
      ref={noteRef}
      className={`sticky-note ${isDragging ? 'dragging' : ''} ${isEditing ? 'editing' : ''} ${!canEdit && !isEditing ? 'locked' : ''}`}
      style={{
        left: note.x,
        top: note.y,
        zIndex: isEditing ? 10000 : note.z,
        transform: `rotate(${note.rotation}deg)`,
        opacity: fadeOpacity * 0.92,
        background: bgGradient,
        borderColor: isEditing ? '#888' : note.color === '#fafafa' ? '#ddd' : undefined,
      }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleDragStart}
      onClick={handleClick}
    >
      {isEditing ? (
        <>
          {/* Väripaletti */}
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <button
              className="color-toggle"
              onClick={(e) => { e.stopPropagation(); setShowColorPicker(!showColorPicker); }}
              title="Vaihda väri"
              style={{
                width: 22, height: 22, borderRadius: 11,
                background: note.color, border: '1px solid #ccc', cursor: 'pointer',
              }}
            />
            {showColorPicker && (
              <div
                ref={colorPickerRef}
                className="color-picker-dropdown"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    className={`color-swatch ${note.color === c.hex ? 'active' : ''}`}
                    style={{ background: c.hex }}
                    title={c.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate({ color: c.hex });
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="edit-timer" style={{
            fontSize: 10, color: timeLeft < 60000 ? '#e55' : '#999', marginBottom: 4, textAlign: 'right',
          }}>
            {timeLeft < 60000
              ? `⚠️ ${secondsLeft}s jäljellä`
              : `⏱ ${minutesLeft}min ${secondsLeft}s`}
          </div>

          <textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { saveEdit(); }
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { handleSaveWithTags(); }
            }}
            placeholder="Kirjoita viestisi... #tagit toimii!"
            style={{ minHeight: Math.max(60, note.height - 80) }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveWithTags();
              }}
              style={{
                fontSize: 11,
                padding: '3px 10px',
                border: 'none',
                borderRadius: 6,
                background: '#333',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Tallenna
            </button>
            <span style={{ fontSize: 9, color: '#bbb' }}>
              Ctrl+Enter • Esc
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="note-content">
            {note.content ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {note.content}
              </ReactMarkdown>
            ) : (
              <span style={{ color: '#bbb', fontStyle: 'italic' }}>
                Tyhjä lappu...
              </span>
            )}
          </div>

          {note.tags.length > 0 && (
            <div className="tags-row">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="tag"
                  onClick={(e) => handleTagClick(e, tag)}
                  title={`Näytä kaikki #${tag}-viestit`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="note-time">
            {new Date(note.created_at).toLocaleDateString('fi-FI', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </>
      )}
    </div>
  );
});
