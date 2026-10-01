# Instrucțiuni pentru agenți AI

Acest repository este **prototipul modulului „Alocări DEEE”** al platformei Alegreen: o specificație vie pentru implementarea în platforma reală.

Înainte de orice modificare, citiți **`docs/SPECIFICATIE_ALOCARI_DEEE.md`**. Conține deciziile de business validate, fluxul sesiunilor lunare, modelul de date, calculul și ecranele.

Reguli de lucru:

- Calculul (`src/engine/`) e pur și separat de UI. Nu-l modificați pentru nevoi de interfață.
- `npm test` trebuie să treacă după fiecare modificare (setul golden din brief §14 + sesiunile lunare). Nu ajustați un test golden ca să treacă: dacă pică, opriți-vă și raportați.
- Nu deduceți reguli de business noi. Deciziile deschise (§12 din specificație, §15 din brief) nu se implementează fără confirmarea Alegreen.
- Fără `float` în calcul (decimal.js); rotunjire doar la afișare; text în română cu diacritice; numere `1.234,56`.
- Verificări: `npm run typecheck`, `npm test`, apoi `npm run dev` și verificare vizuală.
