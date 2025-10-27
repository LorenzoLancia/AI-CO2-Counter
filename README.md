AI CO₂ Counter — Chrome Extension

Struttura riorganizzata per chiarezza e riuso.

Struttura
- manifest.json
- styles.css (foglio unico storico, riusato via src/styles/app.css)
- src/
  - background/
    - service_worker.js (ES module)
  - content/
    - contentScript.js (non-module)
  - popup/
    - index.html
    - index.js (ES module)
  - options/
    - index.html
    - index.js (ES module)
  - styles/
    - app.css (importa ../../styles.css)
  - common/
    - config.js (DEFAULTS condivisi, helper)
- icons/
  - icon16.png, icon48.png, icon128.png

Modifiche principali
- Spostati file in cartelle dedicate (background, content, popup, options).
- Centralizzati i DEFAULTS e il calcolo grammi in src/common/config.js.
- Convertiti popup e options a ES modules (script type="module").
- Corrette stringhe e caratteri (CO₂, accenti) nelle UI.
- Mantenuto styles.css originale e referenziato da src/styles/app.css.

Sviluppo
- Carica la cartella in chrome://extensions con "Modalità sviluppatore" attiva.
- Verifica popup e pagina opzioni: i percorsi ora sono in src/…
- Content script e CSS restano dichiarati nel manifest.

Note
- Se vuoi separare gli stili in fogli specifici (widget/popup/opzioni), possiamo estrarre porzioni di styles.css in file dedicati e aggiornare i riferimenti.

