import { create } from 'zustand';
import type { Note, ViewMode, TimeMode } from '@/types';
import { createStickyNote, randomColor } from '@/lib/notes';
import { supabase } from '@/lib/supabase';

interface WallState {
  notes: Note[];
  viewMode: ViewMode;
  allTags: string[];
  selectedTags: string[];
  editingNoteId: string | null;
  activeColor: string;
  activeListViewTag: string | null;
  isLoading: boolean;

  // Aikafiltteri
  timeMode: TimeMode;
  timeOffset: number;

  // Tuplaklikkauksella korostettu lappu
  focusedNoteId: string | null;

  loadNotes: () => Promise<void>;
  addNote: (x: number, y: number) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  seedNotes: (count: number) => Promise<void>;
  clearNotes: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  toggleTag: (tag: string) => void;
  setNotes: (notes: Note[]) => void;
  setEditingNoteId: (id: string | null) => void;
  setActiveColor: (color: string) => void;
  setActiveListViewTag: (tag: string | null) => void;
  setTimeMode: (mode: TimeMode) => void;
  setTimeOffset: (offset: number) => void;
  setFocusedNoteId: (id: string | null) => void;
}

export const useWallStore = create<WallState>((set, get) => ({
  notes: [],
  viewMode: 'sticky',
  allTags: [],
  selectedTags: [],
  editingNoteId: null,
  activeColor: randomColor(),
  activeListViewTag: null,
  isLoading: false,
  timeMode: 'all',
  timeOffset: 0,
  focusedNoteId: null,

  // Lataa kaikki viestit Supabasesta
  loadNotes: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Virhe ladattaessa viestejä:', error.message);
      set({ isLoading: false });
      return;
    }

    const notes = (data || []) as Note[];
    const allTags = [...new Set(notes.flatMap((n) => n.tags))];
    set({ notes, allTags, isLoading: false });
  },

  addNote: async (x, y) => {
    const { notes, editingNoteId } = get();
    if (editingNoteId !== null) return;

    const newNote = createStickyNote(x, y, notes.length + 1);

    // Optimistinen lokaali lisäys — ei rollbackia vaikka DB kaatuisi
    set({ notes: [...notes, newNote], editingNoteId: newNote.id });

    // Yritä tallentaa Supabaseen (älä kaada sovellusta jos ei onnistu)
    supabase.from('notes').insert([newNote]).then(({ error }) => {
      if (error) console.warn('DB-tallennus epäonnistui (ei hätää, toimii lokaalisti):', error.message);
    });
  },

  removeNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      editingNoteId: state.editingNoteId === id ? null : state.editingNoteId,
    }));
  },

  updateNote: (id, data) => {
    // Optimistinen lokaali päivitys
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...data, updated_at: new Date().toISOString() } : n
      ),
    }));

    // Yritä päivittää Supabaseen (älä kaada jos ei onnistu)
    supabase
      .from('notes')
      .update(data)
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('DB-päivitys epäonnistui:', error.message);
      });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  toggleTag: (tag) => {
    const { selectedTags } = get();
    const isSelected = selectedTags.includes(tag);
    set({
      selectedTags: isSelected
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag],
    });
  },

  setNotes: (notes) => {
    const allTags = [...new Set(notes.flatMap((n) => n.tags))];
    set({ notes, allTags });
  },

  setEditingNoteId: (id) => set({ editingNoteId: id }),
  setActiveColor: (color) => set({ activeColor: color }),
  setActiveListViewTag: (tag) => set({ activeListViewTag: tag }),

  setTimeMode: (mode) => { set({ timeMode: mode, timeOffset: 0 }); },
  setTimeOffset: (offset) => set({ timeOffset: offset }),
  setFocusedNoteId: (id) => set({ focusedNoteId: id }),

  // Kehitys: Siivoa kanta
  clearNotes: async () => {
    const { error } = await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.warn('Tyhjennys epäonnistui:', error.message);
      return;
    }
    set({ notes: [], allTags: [], editingNoteId: null });
  },

  // Kehitys: Täytä kanta testidatalla (30 päivän ajalta)
  seedNotes: async (count) => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const messages = [
      'Aamukahvi on päivän paras hetki ☕',
      'Tänään sataa, mutta mieli on aurinkoinen',
      'Elämä on liian lyhyt huonolle musiikille',
      '#inspiraatio iski kesken kokouksen',
      'Kävin lenkillä ekaa kertaa viikkoon 🏃',
      'Uusi projekti käyntiin, jännittää!',
      'Mikään ei voita hiljaista aamua',
      'Mietin tässä elämän tarkoitusta...',
      'Tänään opin jotain uutta #oppiminen',
      'Aurinko paistaa vihdoin! ☀️',
      'Testaan tätä uutta juttua #testi',
      'Hyvää yötä seinä 🌙',
      'Mitä jos kaikki onkin ihan hyvin?',
      '#musiikki on vastaus kaikkeen',
      'Tämä viikko on ollut pitkä...',
      'Uusi ennätys: 3 kuppia kahvia ennen lounasta',
      'Miksi kukaan ei puhu tästä?',
      '#idea: maailman paras sovellus',
      'Kiitos eilisestä, seinä ❤️',
      'Huomenna on uusi päivä',
      'Kuka muu on hereillä näin myöhään?',
      'Elokuva oli parempi kuin kirja',
      '#filosofia: mitä on onni?',
      'Tänään tein hyvän teon',
      'Onko kukaan muu huomannut tätä?',
      'Vihdoin perjantai! 🎉',
      'Maanantai, mutta hyvällä fiiliksellä',
      'Tämä biisi soi päässä koko päivän 🎵',
      '#muisto eiliseltä',
      'Uusi kuukausi, uudet kujeet',
      'Löysin vanhan kirjeen laatikosta',
      'Paras sää ikinä — älkää menkö sisälle!',
      'Mietin tässä avaruuden äärettömyyttä 🌌',
      'Tänään on hyvä päivä aloittaa jotain',
      '#vinkki: hengitä syvään',
      'Seinä, olet aina täällä minua varten',
      'Luin hyvän kirjan, suosittelen',
      'Onkohan kukaan koskaan lukenut näitä kaikkia?',
      '#pohdinta tulevaisuudesta',
      'Kevät tulee, lupaan sen',
    ];

    const tags = ['idea', 'testi', 'musiikki', 'filosofia', 'inspiraatio', 'muisto', 'vinkki', 'kysymys', 'pohdinta', 'ilo'];

    const seeded: Note[] = [];
    for (let i = 0; i < count; i++) {
      // Jaa viestit tasaisesti 30 päivälle
      const daysAgo = Math.floor((i / count) * 30);
      const createdAt = new Date(now - daysAgo * DAY - Math.random() * DAY * 0.8).toISOString();
      const msg = messages[i % messages.length];
      const noteTags: string[] = [];
      const tagCount = Math.floor(Math.random() * 3);
      for (let t = 0; t < tagCount; t++) {
        const tag = tags[Math.floor(Math.random() * tags.length)];
        if (!noteTags.includes(tag)) noteTags.push(tag);
      }

      seeded.push({
        id: crypto.randomUUID(),
        x: 200 + Math.random() * 3500,
        y: 150 + Math.random() * 2800,
        z: i + 1,
        content: msg,
        tags: noteTags,
        style: 'sticky',
        color: randomColor(),
        rotation: Math.random() * 6 - 3,
        width: 220,
        height: 180,
        created_at: createdAt,
        updated_at: createdAt,
      } as Note);
    }

    // Tyhjennä ensin vanhat
    await supabase.from('notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Lisää uudet (batch 50 kerrallaan)
    for (let i = 0; i < seeded.length; i += 50) {
      const batch = seeded.slice(i, i + 50);
      const { error } = await supabase.from('notes').insert(batch);
      if (error) console.warn('Seed-erä epäonnistui:', error.message);
    }

    // Päivitä lokaali tila
    const allTags = [...new Set(seeded.flatMap((n) => n.tags))];
    set({ notes: seeded, allTags, editingNoteId: null });
  },
}));

// Selektori suodatetuille noteille
export function useFilteredNotes() {
  const notes = useWallStore((s) => s.notes);
  const selectedTags = useWallStore((s) => s.selectedTags);
  const timeMode = useWallStore((s) => s.timeMode);
  const timeOffset = useWallStore((s) => s.timeOffset);

  // Aikafiltteri
  let filtered = notes;
  if (timeMode !== 'all') {
    const now = Date.now();
    const msInDay = 86400000;
    const range = timeMode === 'day' ? 1 : timeMode === 'week' ? 7 : 30;
    const start = now - (timeOffset + range) * msInDay;
    const end = now - timeOffset * msInDay;
    filtered = notes.filter((n) => {
      const t = new Date(n.created_at).getTime();
      return t >= start && t <= end;
    });
  }

  // Tagifiltteri
  if (selectedTags.length > 0) {
    filtered = filtered.filter((n) => selectedTags.some((t) => n.tags.includes(t)));
  }

  return filtered;
}
