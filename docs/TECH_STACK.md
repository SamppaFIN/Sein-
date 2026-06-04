# 🔧 Seinä — Teknologiavalinnat

> Miksi valitsimme juuri nämä työkalut, ja mitä vaihtoehtoja harkittiin.

---

## 1. Yhteenveto

| Kerros | Valinta | Rooli |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | SPA-sovellus |
| **Tyylit** | Tailwind CSS 3 | Utility-first CSS |
| **Canvas** | Konva.js (react-konva) | Graffiti-piirto + tarra-renderöinti |
| **Tilanhallinta** | Zustand | Kevyt globaali tila |
| **Markdown** | react-markdown + remark-gfm | Sisällön renderöinti |
| **Zoom/pan** | Oma toteutus (wheel + pan) | Canvas-navigaatio |
| **Backend** | Supabase | PostgreSQL + Realtime + Auth |
| **Deploy** | Vercel | Frontend-hosting |
| **Analytiikka** | — (ei mitään) | Anonymiteetti |

---

## 2. Frontend

### 2.1 React + TypeScript + Vite

**Miksi:**
- TypeScript tuo tyyppiturvaa datamallille (erityisesti `notes`-taulu)
- Vite on nopea kehitykseen, HMR toimii erinomaisesti
- React on laajalti tuettu, hyvä ekosysteemi

**Vaihtoehdot joita harkittiin:**
- **Svelte** — pienempi bundle, mutta pienempi ekosysteemi; Konva.js-tuki heikompi
- **Solid.js** — hyvä suorituskyky, mutta epäkypsä ekosysteemi
- **Vanilla JS** — liian työläs monimutkaiseen UI-tilaan

### 2.2 Tailwind CSS

**Miksi:**
- Nopea prototyyppaus
- Ei erillisiä CSS-tiedostoja
- Responsiivisuus sisäänrakennettuna
- Hyvä tuki ehdollisille tyyleille (`dark:`, `hover:`, jne.)

### 2.3 Konva.js (react-konva)

**Miksi:**
- Tarjoaa HTML5 Canvas -pohjaisen renderöinnin, jossa on DOM-tyylinen tapahtumamalli (klikkaukset, raahaus)
- **Kriittinen:** Graffiti-tila tarvitsee matalan tason canvas-piirtoa (spray-partikkelit, brush strokes)
- react-konva mahdollistaa React-komponenttien käytön canvas-elementeille
- Tukee layer-järjestelmää (z-index canvasilla)
- Suorituskykyinen: virtualisoi renderöinnin, ei piirrä elementtejä näytön ulkopuolella

**Vaihtoehdot:**
- **Puhdas DOM (absolute-divit)** — toimii tarra-tilassa hyvin, mutta graffiti on mahdoton
- **Fabric.js** — hyvä canvas-kirjasto, mutta React-integraatio heikompi
- **PixiJS** — ylilyönti; WebGL-pohjainen pelimoottori, ei tarpeen
- **react-zoom-pan-pinch** — hyvä zoom/pan, mutta ei canvas-tukea

### 2.4 Zustand

**Miksi:**
- Erittäin kevyt (~1 kB)
- Ei boilerplatea (vs. Redux)
- Suora tuki TypeScriptille
- Toimii hyvin Supabasen reaaliaikaisen tilan kanssa

**Tilan rakenne:**
```typescript
interface WallStore {
  notes: Note[];
  viewMode: 'sticky' | 'graffiti';
  selectedTags: string[];
  addNote: (note: Note) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  setViewMode: (mode: 'sticky' | 'graffiti') => void;
  toggleTag: (tag: string) => void;
}
```

---

## 3. Backend: Supabase

### 3.1 Miksi Supabase?

| Tarve | Supabasen ratkaisu |
|---|---|
| Tietokanta | PostgreSQL — täysi relaatiokanta, ei rajoituksia |
| Reaaliaikaisuus | Supabase Realtime — WebSocket-pohjainen, toimii suoraan Postgren kanssa |
| Autentikointi | Ei tarvita MVP:ssä, mutta valmiina kun halutaan |
| Row Level Security | Sisäänrakennettu — anonyymit käyttäjät turvallisesti |
| REST API | Automaattisesti generoitu tietokantatauluista |
| Hinta | Ilmainen tier riittää pitkälle (500 MB tietokanta, 2 GB kaistaa) |
| Hostaus | Hallittu palvelu — ei tarvitse ylläpitää palvelinta |

### 3.2 Vaihtoehdot

| Vaihtoehto | Plussat | Miinukset |
|---|---|---|
| **Firebase** | Hyvä reaaliaikaisuus | NoSQL — huono tagien hakuun ja suodatukseen |
| **Cloudflare Workers + D1** | Edge-lähellä, edullinen | D1 on SQLite — ei reaaliaikaisuutta; vaatii enemmän koodia |
| **GitHub Pages + JSON** | Yksinkertaisin | Ei tietokantaa, konfliktit, ei skaalaudu |
| **Oma Express/PHP-palvelin** | Täysi kontrolli | Liikaa vaivaa MVP:lle; ylläpito |

### 3.3 Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Reaaliaikainen tilaus
export const subscribeToNotes = (callback: (notes: Note[]) => void) => {
  return supabase
    .channel('notes-channel')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'notes' },
      (payload) => callback(payload.new as Note)
    )
    .subscribe();
};
```

---

## 4. Deploy: Vercel

**Miksi:**
- Yhden klikkauksen deploy GitHubista
- Automaattinen HTTPS
- Ilmainen tier riittää
- Hyvä tuki Vite-sovelluksille
- Edge Functions -tuki (jos tarvitaan myöhemmin)

**Vaihtoehdot:**
- **Cloudflare Pages** — nopeampi edge-verkko, mutta Vite-tuki hieman heikompi
- **Netlify** — hyvä, samankaltainen kuin Vercel
- **GitHub Pages** — ei serverless-funktioita, staattinen vain

---

## 5. Graffiti-tekniikka: Konva + Custom Brush Engine

### 5.1 Spray-efektin toteutus

```typescript
// Yksinkertainen spray-partikkeli
interface SprayParticle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  color: string;
}

const createSprayPattern = (
  centerX: number,
  centerY: number,
  color: string,
  density: number = 50
): SprayParticle[] => {
  return Array.from({ length: density }, () => ({
    x: centerX + (Math.random() - 0.5) * 30,
    y: centerY + (Math.random() - 0.5) * 30,
    radius: Math.random() * 4 + 1,
    opacity: Math.random() * 0.6 + 0.2,
    color: color,
  }));
};
```

### 5.2 Tallennus

Graffiti-stroket tallennetaan JSONB-muodossa:
```json
{
  "strokes": [
    {
      "points": [100, 200, 105, 205, 110, 210],
      "color": "#ff0000",
      "width": 5,
      "style": "spray"
    }
  ]
}
```

---

## 6. Kehitystyökalut

| Työkalu | Käyttö |
|---|---|
| **VS Code** | Editori |
| **GitHub** | Versionhallinta |
| **Supabase CLI** | Paikallinen kehitys, migraatiot |
| **pnpm** | Paketinhallinta (nopeampi kuin npm) |
| **ESLint** + **Prettier** | Koodin laatu |
| **Vitest** | Yksikkötestit (vaihe 2) |
| **Playwright** | E2E-testit (vaihe 3) |

---

## 7. Riippuvuudet (package.json)

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-konva": "^18.0.0",
    "konva": "^9.0.0",
    "react-markdown": "^10.0.0",
    "remark-gfm": "^4.0.0",
    "zustand": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/uuid": "^10.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "vitest": "^3.0.0"
  }
}
```

---

*Tämä dokumentti päivittyy kun teknologiavalinnat tarkentuvat. Viimeisin muokkaus: 2026-06-04*
