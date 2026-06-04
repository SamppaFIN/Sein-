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
  addNote: (x: number, y: number, color?: string, content?: string) => void;
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
  timeMode: 'week',
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

  addNote: async (x, y, color?, content?) => {
    const { notes, editingNoteId } = get();
    if (editingNoteId !== null) return;

    const newNote = createStickyNote(x, y, notes.length + 1, content, color);

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
      // ── Aavistuksen 50 pohjadataa ──
      'Aamukahvi maistui tänään erityisen hyvältä. Ehkä se on merkki siitä, että tästä päivästä tulee hyvä. Tai sitten pavut olivat vain tuoreita.',
      'Näin unta jossa osasin lentää. Ei sellaista räpiköivää, vaan rauhallista liitelyä kaupungin yllä. Herätessä harmitti hetken, mutta sitten tajusin: uni oli lahja.',
      '#ilo Huomasin että naapurin pihalla kukkii syreeni. Tuoksu kantautui aamulla ikkunasta sisään. Pieniä asioita, isoja iloja.',
      'Mietin tässä että jos jokainen meistä kirjoittaisi yhden hyvän asian päivässä tälle seinälle, maailma olisi himpun verran parempi paikka.',
      'Luin eilen artikkelin merien puhdistamisesta. Joku keksi laitteen joka kerää muovia satamista. Onneksi on vielä ihmisiä jotka uskovat ratkaisuihin.',
      '#inspiraatio Aloitin tänään uuden harrastuksen — savityöt. Ensimmäinen ruukku näyttää perunalta, mutta olen ylpeä siitä. Täydellisyys on yliarvostettua.',
      'Tiedättekö sen tunteen kun kuuntelet biisiä joka osuu juuri siihen hetkeen? Mulle kävi niin tänään. Suosittelen: laittakaa kuulokkeet ja kävelkää hidastamatta.',
      '#pohdinta Mitä jos kuoleman jälkeen herääkin toisessa ulottuvuudessa ja kaikki ne ihmiset joita kaipasit ovat siellä? En ole uskonnollinen, mutta tämä ajatus rauhoittaa.',
      'Tänään satoi ensimmäistä kertaa viikkoon. Seisoimme kadulla kasvot taivasta kohti kuin lapset. Sade on aliarvostettua.',
      '#vinkki Opettele sanomaan "en tiedä" ilman häpeää. Se avaa enemmän ovia kuin teeskennelty varmuus. Viisaus alkaa epävarmuudesta.',
      'Aurinko laski tänään oranssina. Istuin puiston penkillä ja katsoin kun taivas vaihtoi väriä viidessä minuutissa. Kenellekään ei maksanut mitään.',
      '#musiikki Löysin vanhan vinyylilevyn kirpputorilta. En omista levysoitinta, mutta kansi on niin kaunis että se riittää. Joskus taide on katsomista varten.',
      'Mummoni sanoi aina että "kiire on mielen keksintö". Nyt kolmekymppisenä alan vihdoin ymmärtää mitä hän tarkoitti.',
      '#kysymys Jos voisit antaa yhden neuvon 10 vuotta nuoremmalle itsellesi, mikä se olisi? Mietin tätä eilen pitkään.',
      'Kävin eilen metsässä. Ei mitään erikoista reittiä, ihan vain lähimetsä. Mutta siellä oli peuran jälkiä ja sammalta joka tuoksui vihreältä. Suosittelen metsäterapiaa.',
      '#muisto Muistan kun olin pieni ja luulin että kuu seuraa minua. Tavallaan se seuraa edelleen — se on siellä vaikken katsoisikaan. Luotettavampi kuin moni muu asia.',
      'Tänään hymyilin tuntemattomalle bussissa. Hän hymyili takaisin. Se oli koko päivän paras hetki. Tuntemattomat, hymyilkää useammin.',
      '#filosofia Olemme kaikki samaa tähtipölyä, kirjaimellisesti. Hiiliatomit käsissäsi syntyivät tähdissä miljardeja vuosia sitten. Miten voisimme olla toisillemme vieraita?',
      'Leivoin tänään pullaa. Paloi vähän pohjasta mutta sisus oli pehmeää. Sama pätee ihmisiin — ulkokuori voi olla karu, mutta sisältä löytyy usein jotain hyvää.',
      '#inspiraatio Lopetin tänään sometauon, joka kesti 30 päivää. Olo on kevyempi ja ajatukset kirkkaampia. Ehkä jatkan taukoa.',
      'Kissa tuli tänään syliin kehräämään. En omista kissaa, se oli naapurin. Silti se valitsi juuri minut. Eläimet tietävät.',
      '#ilo Löysin taskusta kaksikymppisen jonka olin unohtanut. Pieni yllätys itseltä menneisyydestä. Ostin jäätelön ja soitin äidille.',
      '#pohdinta Aika kuluu eri tavalla kun tekee asioita joita rakastaa. Flow-tila on lähimpänä taikuutta mitä arjessa on tarjolla. Etsikää sitä.',
      'Tänään on torstai. Torstai on aliarvostetuin viikonpäivä — se ei ole perjantain juhlaa eikä keskiviikon käännekohta, mutta juuri siksi se on rehellinen. Hyvää torstaita.',
      '#vinkki Kirjoita käsin. Ihan mitä vain — kauppalista, päiväkirjaa, runo. Käsiala on hidasta ajattelua ja juuri siksi arvokasta.',
      '#musiikki Suosittelen kuuntelemaan yhden albumin alusta loppuun ilman keskeytyksiä. Ei soittolistaa, ei shufflea. Niin kuin ennen vanhaan. Se on meditatiivista.',
      'Näin tänään perhosen. Helmikuussa. Joko se on aikainen tai minä myöhäinen, mutta toivo se oli kummassakin tapauksessa.',
      '#filosofia Hyvyys ei vaadi suuria tekoja. Se on pieniä valintoja: ovi auki seuraavalle, roska maasta, kuuntelu ilman keskeytystä. Näistä rakentuu kaikki.',
      '#kysymys Mikä on paras neuvo jonka olet koskaan saanut? Minulle se oli: "Älä usko kaikkea mitä ajattelet."',
      'Tänään kiitän itseäni siitä että jaksoin. Joskus se on ihan tarpeeksi. Jos sinäkin luet tätä ja olet väsynyt: sinä riität.',
      '#muisto Isoisä opetti minut onkimaan. Hän ei koskaan puhunut paljon, mutta hiljaisuus laiturilla oli täyttä puhetta. Kaipaan sitä hiljaisuutta.',
      '#inspiraatio Aloitin tänään projektin jota olen lykännyt vuoden. Tiedättekö sen tunteen? Ensimmäinen askel on aina raskain, mutta ottakaa se. Lentoon lähtö vaatii irrottautumisen.',
      'Kahvi, kirja, sateen ropina ikkunaan. Kolme asiaa jotka tekevät elämästä elettävää. Mikä on sinun kolmikkosi?',
      '#pohdinta Tietoisuus on universumin tapa kokea itsensä. Meissä kaikissa on pala jotain valtavaa ja selittämätöntä. Se tekee jokaisesta kohtaamisesta pyhän.',
      '#vinkki Jos eksyt, pysähdy. Vakavin virhe on jatkaa väärään suuntaan. Tämä pätee metsässä, kaupungissa, ja elämässä ylipäätään.',
      'Tänään oli niin kaunis ilma että peruin kaikki suunnitelmat ja menin ulos. Joskus paras suunnitelma on suunnitelmattomuus.',
      '#ilo Naapurin lapsi oppi ajamaan polkupyörällä. Kaaduttuaan hän nousi, pyyhki kyyneleet ja yritti uudelleen. Me aikuiset voisimme oppia tästä jotain.',
      '#musiikki Lauloin tänään suihkussa. Naapurit saivat kärsiä, mutta minä nautin. Musiikki ei tarvitse yleisöä ollakseen arvokasta.',
      '#filosofia Jos maailmankaikkeus on ääretön, niin jossain on planeetta jossa teit sen valinnan jonka jätit tekemättä. Ehkä siellä olet onnellisempi. Tai ehkä et. Joka tapauksessa: tässä ja nyt on se mikä on.',
      'Löysin ullakolta vanhan valokuvan tuntemattomasta pariskunnasta. Keitä he olivat? Miten kuva päätyi minulle? Jokainen esine kantaa tarinaa jota emme koskaan saa tietää.',
      '#inspiraatio Tänään sanoin "rakastan sinua" ensimmäistä kertaa. Pelotti ihan hirveästi. Mutta se sanottiin ja maailma ei loppunut. Päinvastoin.',
      '#pohdinta Aika on olemassa vain siksi että asiat muuttuvat. Jos mikään ei muuttuisi, ei olisi aikaakaan. Muutos on siis ajan lahja, ei kirous.',
      '#vinkki Osta kukkia. Ei kenellekään erityiselle, vaan itsellesi. Laita ne pöydälle josta näet ne aamulla. Pienet asiat, iso vaikutus.',
      '#kysymys Uskallatko sanoa ääneen sen mitä oikeasti ajattelet? Entä jos joku muu ajattelee samoin mutta ei uskalla? Ole se joka murtaa hiljaisuuden.',
      '#muisto Ensimmäinen suudelma satoi vettä. Olimme molemmat läpimärkiä emmekä välittäneet. Sade pesi pois kaiken ylimääräisen ja jäljelle jäi vain hetki.',
      'Tänään on hyvä päivä olla olemassa. Ei sen kummempaa syytä. Joskus riittää että on.',
      '#inspiraatio Unelmat eivät vanhene. Se haave jonka haudutit kaksikymppisenä on yhä siellä. Kaiva se esiin, pyyhi pölyt, katso sitä uusin silmin. Et ole myöhässä.',
      '#ilo Kävelin tänään paljain jaloin nurmikolla. Varpaat muistavat vieläkin miltä se tuntui. Olemme liian vähän paljain jaloin.',
      '#filosofia Elon merkitys ei ole päämäärässä vaan matkassa. Kliseistä, tiedän. Mutta kliseet ovat kliseitä siksi että ne ovat totta. Hyväksy klisee, elä se.',
      '#pohdinta Viimeinen ajatus ennen nukahtamista on usein se rehellisin. Päivän kiireen takaa kuuluu hiljainen ääni. Kuuntele sitä.',
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
