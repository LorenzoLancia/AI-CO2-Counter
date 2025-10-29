// Rileva il provider e conta quando invii una richiesta.
// Mostra un widget flottante con le stime locali della pagina.

const HOST = location.hostname;

const SELECTORS = [
  // ChatGPT
  {
    host: /chat\.openai\.com$/,
    submit: 'textarea, input[type="text"], input[type="search"], [contenteditable] ',
    button:
      'button[data-testid="send-button"], button:has(svg[data-icon="paper-plane"]), button[aria-label*="Send" i], button[aria-label*="Invia" i]'
  },
  // Gemini
  {
    host: /gemini\.google\.com$/,
    submit: 'textarea, input[type="text"], input[type="search"], [contenteditable] ',
    button: 'button[type="submit"], button[aria-label*="Send" i]'
  },
  // Claude
  {
    host: /claude\.ai$/,
    submit: 'textarea, input[type="text"], input[type="search"], [contenteditable] ',
    button: 'button[type="submit"], button[aria-label*="Send" i]'
  },
  // Perplexity
  {
    host: /(www\.)?perplexity\.ai$/,
    submit: 'textarea, input[type="text"], input[type="search"], [contenteditable] ',
    button: 'button[type="submit"], button[aria-label*="Send" i]'
  },
  // Copilot/Bing
  {
    host: /^(www\.bing\.com|copilot\.microsoft\.com)$/,
    submit: 'textarea, input[type="text"], input[type="search"], [contenteditable] ',
    button: 'button[type="submit"], button[aria-label*="Send" i]'
  }
];

let pageRequests = 0;
let pageGrams = 0;
let lastCountAt = 0;

// UI widget
function ensureWidget() {
  if (document.getElementById("ai-co2-counter-widget")) return;

  const box = document.createElement("div");
  box.id = "ai-co2-counter-widget";
  // livello colore di default (0-100g => bianco)
  box.classList.add("aicc-l-white");
  box.innerHTML = `
    <div class="aicc-title">AI CO₂ Counter</div>
    <div class="aicc-line"><span>Host:</span><strong>${HOST}</strong></div>
    <div class="aicc-line"><span>Richieste (pagina):</span><strong id="aicc-page-req">0</strong></div>
    <div class="aicc-line"><span>CO₂ stimata (pagina):</span><strong id="aicc-page-g">0 g</strong></div>
    <hr />
    <div class="aicc-line"><span>Totale (estensione):</span><strong id="aicc-total">—</strong></div>
    <div class="aicc-actions">
      <a id="aicc-info-link" class="aicc-icon-btn" href="https://github.com/LorenzoLancia/AI-CO2-Counter" title="Informazioni" aria-label="Informazioni">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.75"/>
          <line x1="12" y1="10.5" x2="12" y2="16" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
          <circle cx="12" cy="7.5" r="1.1" fill="currentColor"/>
        </svg>
      </a>
      <button id="aicc-open-options" class="aicc-icon-btn" title="Opzioni" aria-label="Opzioni">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm9-3.5c0-.5-.04-.99-.1-1.47l2.04-1.59a1 1 0 0 0 .24-1.34l-1.93-3.34a1 1 0 0 0-1.27-.44l-2.4.97a8.1 8.1 0 0 0-2.55-1.47l-.37-2.56A1 1 0 0 0 12.4 0h-3.8a1 1 0 0 0-.99.85l-.37 2.56c-.9.33-1.76.8-2.55 1.36l-2.4-.97a1 1 0 0 0-1.27.45L.1 7.95c-.2.38-.13.85.24 1.13L2.35 10.7C2.28 11.15 2.25 11.58 2.25 12s.03.85.1 1.29l-2.02 1.6a1 1 0 0 0-.24 1.33l1.93 3.35a1 1 0 0 0 1.27.44l2.4-.96c.8.56 1.65 1.02 2.55 1.35l.37 2.56c.07.5.5.86 1 .86h3.8c.5 0 .93-.36 1-.85l.37-2.57c.9-.32 1.75-.78 2.55-1.35l2.4.96a1 1 0 0 0 1.27-.44l1.93-3.35a1 1 0 0 0-.24-1.33l-2.02-1.6c.07-.44.1-.87.1-1.29Zm-3.75 0a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
  document.documentElement.appendChild(box);

  // Posizione salvata (se presente)
  try {
    chrome.storage?.local?.get({ aiccWidgetPos: null }, (res) => {
      const pos = res && res.aiccWidgetPos;
      if (pos && typeof pos.left === "string" && typeof pos.top === "string") {
        box.style.left = pos.left;
        box.style.top = pos.top;
        box.style.right = "auto";
        box.style.bottom = "auto";
      }
    });
  } catch {}

  // Drag manuale del widget
  const handle = box.querySelector(".aicc-title") || box;
  handle.style.cursor = "move";
  const drag = { active: false, sx: 0, sy: 0, sl: 0, st: 0 };

  function aiccGetPoint(ev) {
    if (ev.touches && ev.touches[0]) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
    return { x: ev.clientX, y: ev.clientY };
  }
  function onDown(ev) {
    if (ev.target && ev.target.closest && ev.target.closest("button, a")) return;
    const p = aiccGetPoint(ev);
    const r = box.getBoundingClientRect();
    drag.active = true;
    drag.sx = p.x;
    drag.sy = p.y;
    drag.sl = r.left;
    drag.st = r.top;
    box.classList.add("aicc-dragging");
    box.style.right = "auto";
    box.style.bottom = "auto";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onUp);
    if (ev.cancelable) ev.preventDefault();
  }
  function onMove(ev) {
    if (!drag.active) return;
    if (ev.cancelable) ev.preventDefault();
    const p = aiccGetPoint(ev);
    let left = drag.sl + (p.x - drag.sx);
    let top = drag.st + (p.y - drag.sy);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bw = box.offsetWidth;
    const bh = box.offsetHeight;
    left = Math.max(0, Math.min(left, vw - bw));
    top = Math.max(0, Math.min(top, vh - bh));
    box.style.left = left + "px";
    box.style.top = top + "px";
  }
  function onUp() {
    if (!drag.active) return;
    drag.active = false;
    box.classList.remove("aicc-dragging");
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onUp);
    try {
      const pos = { left: box.style.left || "", top: box.style.top || "" };
      chrome.storage?.local?.set({ aiccWidgetPos: pos });
    } catch {}
  }
  handle.addEventListener("mousedown", onDown);
  handle.addEventListener("touchstart", onDown, { passive: false });

  document.getElementById("aicc-open-options").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "GET_STATE" }, () => {
      chrome.runtime.openOptionsPage();
    });
  });

  // Info: lasciato come placeholder, l'utente aggiungerà il link
  const info = document.getElementById("aicc-info-link");
  if (info) {
    info.addEventListener("click", (e) => {
      e.preventDefault();
      // window.open('URL', '_blank');
      window.open("https://github.com/LorenzoLancia/AI-CO2-Counter", "_blank");
    });
  }
}

function getWidgetEl() {
  return document.getElementById("ai-co2-counter-widget");
}

function setWidgetLevel(totalGrams) {
  const el = getWidgetEl();
  if (!el) return;
  const levels = ["aicc-l-white", "aicc-l-green", "aicc-l-yellow", "aicc-l-orange", "aicc-l-red"];
  levels.forEach((c) => el.classList.remove(c));
  let cls = "aicc-l-white";
  const g = Number(totalGrams) || 0;
  if (g >= 500) cls = "aicc-l-red";
  else if (g >= 400) cls = "aicc-l-orange";
  else if (g >= 200) cls = "aicc-l-yellow";
  else if (g >= 100) cls = "aicc-l-green";
  el.classList.add(cls);
}

// Formattazione CO₂: kg sopra 1000 g, altrimenti g
function formatCO2(grams) {
  const g = Number(grams) || 0;
  if (Math.abs(g) >= 1000) return (g / 1000).toFixed(2) + " kg";
  return g.toFixed(2) + " g";
}

function updateWidgetTotals(totalRequests, totalGrams) {
  const totalEl = document.getElementById("aicc-total");
  if (!totalEl) return;
  const gramsText = formatCO2(Number.isFinite(totalGrams) ? totalGrams : 0);
  totalEl.textContent = `${gramsText} (${totalRequests} richieste)`;
  // aggiorna colore del riquadro in base ai grammi totali
  setWidgetLevel(totalGrams);
  // salva per badge periodico
  currentTotalGrams = Number(totalGrams) || 0;
}

function updateWidgetPage() {
  const reqEl = document.getElementById("aicc-page-req");
  const gEl = document.getElementById("aicc-page-g");
  if (reqEl) reqEl.textContent = String(pageRequests);
  if (gEl) gEl.textContent = formatCO2(pageGrams);
}

function matchesHost(h) {
  return h.host.test(HOST);
}

function hookSendEvents(sel) {
  // Enter su textarea
  document.querySelectorAll(sel.submit).forEach((ta) => {
    if (!ta || ta.dataset.aiccHooked) return;
    ta.dataset.aiccHooked = "1";
    ta.addEventListener(
      "keydown",
      (e) => {
        const isEnter = e.key === "Enter" || e.key === "Return";
        if (isEnter && !e.shiftKey) {
          setTimeout(() => countOne(), 0);
        }
      },
      true
    );
  });

  // Click su pulsante invio
  const btns = document.querySelectorAll(sel.button);
  btns.forEach((b) => {
    if (!b || b.dataset.aiccHooked) return;
    b.dataset.aiccHooked = "1";
    b.addEventListener("click", () => setTimeout(() => countOne(), 0), true);
  });
}

function countOne() {
  const now = Date.now();
  if (now - lastCountAt < 800) return; // antirimbalzo per evitare doppi conteggi
  lastCountAt = now;
  chrome.runtime.sendMessage({ type: "AI_REQUEST_SENT", host: HOST }, (res) => {
    if (!res?.ok) return;
    const { gramsLast, totalRequests, totalGrams } = res.state;
    pageRequests += 1;
    pageGrams += gramsLast;
    updateWidgetPage();
    updateWidgetTotals(totalRequests, totalGrams);
  });
}

// Stato globale semplice per badge
let currentTotalGrams = 0;

function showNudgeBadge() {
  const box = getWidgetEl();
  if (!box) return;
  const existing = box.querySelector('.aicc-badge');
  if (existing) existing.remove();
  const badge = document.createElement('div');
  badge.className = 'aicc-badge';
  const gramsStr = formatCO2(currentTotalGrams);
  badge.textContent = `Hai prodotto ${gramsStr} CO₂ — perché non pianti un albero?`;
  // Appendi all'interno del box per ancorarlo e avere stessa larghezza
  box.appendChild(badge);
  // Decide la posizione (sopra/sotto) in base allo spazio disponibile a schermo
  try {
    const r = box.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const aboveSpace = Math.max(0, r.top);
    const belowSpace = Math.max(0, vh - r.bottom);
    const h = badge.offsetHeight || 36; // stima fallback
    let pos = 'above';
    if (aboveSpace < h + 12 && belowSpace >= h + 12) pos = 'below';
    else if (aboveSpace < h + 12 && belowSpace < h + 12) pos = belowSpace >= aboveSpace ? 'below' : 'above';
    badge.dataset.pos = pos;
  } catch {}

  // Animate in
  requestAnimationFrame(() => {
    badge.dataset.show = '1';
  });
  // Auto-hide dopo 5s
  const hideAfter = 5000;
  setTimeout(() => {
    badge.dataset.show = '0';
    // remove after transition
    const remove = () => badge.remove();
    badge.addEventListener('transitionend', remove, { once: true });
    // fallback removal
    setTimeout(remove, 800);
  }, hideAfter);
}

// Avvio
(function init() {
  ensureWidget();

  // Lega gli handler per il sito corrente se supportato
  const site = SELECTORS.find(matchesHost);
  if (site) {
    const observer = new MutationObserver(() => hookSendEvents(site));
    observer.observe(document.documentElement, { subtree: true, childList: true });
    hookSendEvents(site); // primo pass
  }

  // Fallback: intercetta Invio su elementi editabili anche se i selettori cambiano
  document.addEventListener(
    "keydown",
    (e) => {
      const isEnter = e.key === "Enter" || e.key === "Return";
      if (!isEnter || e.shiftKey) return;
      const t = e.target;
      const isEditable =
        (t && (t.tagName === "TEXTAREA" || t.isContentEditable)) ||
        (t && t.tagName === "INPUT" && /^(text|search)$/i.test(t.type)) ||
        (t && t.closest && t.closest('textarea, input[type="text"], input[type="search"], [contenteditable]'));
      if (isEditable) setTimeout(() => countOne(), 0);
    },
    true
  );

  // Fallback: intercetta submit dei form (alcune UI inviano così)
  document.addEventListener(
    "submit",
    () => setTimeout(() => countOne(), 0),
    true
  );

  // carica totali iniziali
  chrome.runtime.sendMessage({ type: "GET_STATE" }, (st) => {
    if (st && typeof st.totalRequests === "number" && typeof st.totalGrams === "number") {
      updateWidgetTotals(st.totalRequests, st.totalGrams);
    }
  });

  // Badge periodico ogni 3 minuti
  setInterval(() => {
    try { showNudgeBadge(); } catch {}
  }, 3 * 60 * 1000);
})();
