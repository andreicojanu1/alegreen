# Alegreen · prototip modul „Alocări DEEE"

Prototip local al modulului de alocare DEEE (admin + client), folosit ca specificație vie pentru platforma reală.
Sursele normative sunt în [`docs/`](docs): brieful tehnic v1.0, metodologia de reguli și fișierul Excel de referință.

## Pornire

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testele golden ale motorului (Vitest)
npm run seed       # regenerează src/data/seed/excelData.ts din docs/raport_alocare_2167.xlsx (python3 + openpyxl)
```

Pentru un link de test (build cu navigare în memorie, fără export/print): `npm run build:artifact` → `dist-artifact/`.

Comutatorul **„Prototip · perspectivă"** (dreapta jos) schimbă rolul: doi admini (Andrei C, Ion Popescu, pentru fluxul de
aprobare de către alt admin) sau oricare dintre clienți. Butonul ↺ de lângă el resetează datele demo. Starea se păstrează în `localStorage`.

Capturi de ecran: cu serverul pornit, `node scripts/screenshots.mjs` (în mediul cloud:
`PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/screenshots.mjs`) → `screenshots-out/`.

## Structură

| Cale | Rol |
| --- | --- |
| `src/engine/` | **Motorul de alocare**, funcție pură (`allocate.ts`), după pseudocodul din brief §6.2. Aritmetică zecimală `decimal.js`, fără float; rotunjire doar la afișare (`rounding.ts`). Testele golden: `allocate.test.ts`. |
| `src/data/` | Stratul de date de înlocuit cu API-ul real: tipuri (≈ brief §4), seed extras din Excel, store local (reducer + localStorage), construirea intrării motorului dintr-o rulare. |
| `src/components/allocation/` | Componentele modulului admin: `AllocationTabs`, `RulesEditor` (tab-ul de reguli) + `CategoryRulesTable`, `AvailabilitySection` cu `AvailabilityDonut` și `CategoryLegend`, `NewAllocationPanel`, `RunWorkspace`, `PlaybackBar`, `ClientAllocationTable` cu `MonthProgressCell` și `AnnualProgressBar`, `CategoryResultTable`, `WarningsPanel`, `FinalizationCard`, `RunHistoryTable`. |
| `src/lib/allocationTimeline.ts`, `src/hooks/useAllocationPlayback.ts` | Animația live (M4), derivată din rezultatul final al motorului; nu atinge calculul. |
| `src/lib/categoryStyle.ts` | Culorile (paletă validată pentru daltoniști) și iconițele fixe pe categorie. |
| `src/pages/` | Ecranele: Alocări DEEE (listă + rulare nouă), detaliul rulării, Cantități colectate, Client → Alocări EEE. |

O rulare păstrează o copie (snapshot) a regulilor, declarațiilor și cantităților colectate cu care a fost calculată;
rezultatul se recalculează determinist din snapshot (RB-14), deci nu se schimbă retroactiv.
