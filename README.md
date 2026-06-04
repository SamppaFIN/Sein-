# ⚡ Seinä — The Anonymous Wall

> *Paikka minne kuka tahansa voi jättää ajatuksensa — lapulle tai spray-maalilla.*

**Seinä** on anonyymi, ääretön digitaalinen seinä, jonne käyttäjät voivat jättää viestejä kahdella visuaalisella tyylillä:

- 🟨 **Post-it / Tarra** — perinteinen keltainen muistilappu, Markdown-tuella
- 🎨 **Graffiti** — spray-maaliefekti, vapaalla kädellä tai tekstinä

Kukaan ei tiedä kuka kirjoitti. Vain ajatus jää.

---

## 🎯 Perusidea

| Ominaisuus | Kuvaus |
|---|---|
| Ääretön canvas | Zoom + pan, ei rajoja |
| Kaksi esitysmallia | Tarra (post-it) ja Graffiti (spray) — togglella vaihto |
| Täysi anonymiteetti | Ei kirjautumista, ei seurantaa |
| Markdown-tuki | Lihavointi, linkit, koodiblokit tarroissa |
| Reaaliaikainen | Uudet viestit ilmestyvät kaikille livenä |
| Tägäys | Vapaat tagit, suodatus |

---

## 🚀 Pika-aloitus (MVP)

```bash
npm create vite@latest seina -- --template react-ts
cd seina
npm install
npm run dev
```

---

## 📁 Projektin rakenne

```
seina/
├── public/
├── src/
│   ├── components/
│   │   ├── canvas/          # Ääretön canvas + zoom/pan
│   │   ├── notes/           # Tarrakomponentit
│   │   ├── graffiti/        # Graffiti-komponentit
│   │   ├── toolbar/         # Työkalupalkki (toggle, tagit, jne.)
│   │   └── ui/              # Yleiset UI-komponentit
│   ├── hooks/               # React hookit
│   ├── lib/                 # Apufunktiot, Supabase-client
│   ├── store/               # Tila (Zustand)
│   ├── types/               # TypeScript-tyypit
│   ├── App.tsx
│   └── main.tsx
├── docs/
│   ├── PLAN.md              # Yksityiskohtainen suunnitelma
│   └── TECH_STACK.md        # Teknologiavalinnat
├── supabase/                # Supabase-migraatiot
├── package.json
└── README.md
```

---

## ⚡ Pikalinkit

- [📋 Projektisuunitelma](./docs/PLAN.md)
- [🔧 Teknologiavalinnat](./docs/TECH_STACK.md)

---

*"Seinä kuuntelee, Seinä näyttää, Seinä unohtaa."*
