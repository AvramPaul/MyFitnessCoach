'use strict';
/* MyFitnessCoach — utilitare comune pentru ambele aplicații (client și antrenor). */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

const RO = 'ro-RO';
/** Datele „2026-11-18” se citesc ca dată locală, nu UTC. */
const D = s => s instanceof Date ? s : (typeof s === 'string' && s.length === 10 ? new Date(s + 'T00:00:00') : new Date(s));
const dayKey = d => { d = D(d); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const sameDay = (a, b) => dayKey(a) === dayKey(b);
const addDays = (d, n) => { const x = new Date(D(d)); x.setDate(x.getDate() + n); return x; };

const fmt = {
  n: v => Math.round(v).toLocaleString(RO),
  kg: v => Number(v).toLocaleString(RO, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  kgShort: v => Number(v).toLocaleString(RO, { maximumFractionDigits: 1 }),
  time: d => D(d).toLocaleTimeString(RO, { hour: '2-digit', minute: '2-digit' }),
  dayLong: d => cap(D(d).toLocaleDateString(RO, { weekday: 'long', day: 'numeric', month: 'long' })),
  dayShort: d => D(d).toLocaleDateString(RO, { day: 'numeric', month: 'short' }).replace('.', ''),
  weekday: d => D(d).toLocaleDateString(RO, { weekday: 'long' }),
  wd: d => ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'][D(d).getDay()],
  wd3: d => ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'][D(d).getDay()],
  when(d) {
    const t = new Date();
    if (sameDay(d, t)) return 'azi';
    if (sameDay(d, addDays(t, 1))) return 'mâine';
    if (sameDay(d, addDays(t, -1))) return 'ieri';
    return fmt.weekday(d);
  },
  ago(d) {
    const s = (Date.now() - D(d)) / 1000;
    if (s < 60) return 'acum';
    if (s < 3600) return `acum ${Math.floor(s / 60)} min`;
    if (sameDay(d, new Date())) return s < 4 * 3600 ? `acum ${Math.floor(s / 3600)} h` : fmt.time(d);
    if (sameDay(d, addDays(new Date(), -1))) return `ieri, ${fmt.time(d)}`;
    return fmt.dayShort(d);
  },
};

const STATUS = {
  under: { label: 'sub țintă' },
  ok: { label: 'la țintă' },
  over: { label: 'peste țintă' },
};
const statusPill = (st, extra = '') =>
  `<span class="pill"><span class="dot ${st || 'none'}"></span>${st ? STATUS[st].label : 'nimic logat'}${extra}</span>`;

const MEAL_TYPES = [
  { id: 'mic-dejun', name: 'Mic dejun', art: 'micul dejun', icon: 'coffee' },
  { id: 'pranz', name: 'Prânz', art: 'prânzul', icon: 'bowl-food' },
  { id: 'gustare', name: 'Gustare', art: 'o gustare', icon: 'fork-knife' },
  { id: 'cina', name: 'Cină', art: 'cina', icon: 'fork-knife' },
  { id: 'extra', name: 'Masă extra', art: 'o masă extra', icon: 'plus' },
];
const mealType = id => MEAL_TYPES.find(t => t.id === id) || MEAL_TYPES[4];

/** Pozele „din galeria telefonului” disponibile în demo. */
const GALLERY = ['somon-sparanghel', 'poke-creveti', 'paste-bolognese', 'salata-caesar', 'bol-quinoa-pui', 'vita-legume',
  'somon-fasole-quinoa', 'pui-teriyaki', 'pui-cartof-dulce', 'shake-proteic', 'iaurt-miere', 'toast-avocado-ou']
  .map(n => `/img/meals/${n}.jpg`);

// ——————————————— API & live ———————————————

const api = {
  async get(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },
  async post(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'A apărut o eroare.');
    return j;
  },
};

function connectLive(onChange) {
  const conn = new signalR.HubConnectionBuilder().withUrl('/hub').withAutomaticReconnect([0, 1000, 2000, 5000, 5000, 10000]).build();
  conn.on('changed', onChange);
  conn.onreconnected(() => onChange({ kind: 'reconnected' }));
  const start = () => conn.start().catch(() => setTimeout(start, 3000));
  start();
  return conn;
}

/** Redimensionează poza aleasă de utilizator înainte de trimitere. */
async function fileToDataUrl(file, max = 1280) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k);
  cv.height = Math.round(bmp.height * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  return cv.toDataURL('image/jpeg', 0.82);
}

// ——————————————— Rama de telefon ———————————————

const IN_DEVICE = new URLSearchParams(location.search).has('device');
if (IN_DEVICE) document.documentElement.classList.add('device');

const LOGO_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7.2" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="33 50" transform="rotate(-90 12 12)"/></svg>`;

function statusBarHtml() {
  const t = new Date().toLocaleTimeString(RO, { hour: '2-digit', minute: '2-digit' });
  return `<span>${t}</span><span class="sb-icons">
    <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
    <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 2.3c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .5C5.2.5 2.6 1.6.8 3.4L2 4.7a8.6 8.6 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.6 6.6 0 0 0 8 4.1a6.6 6.6 0 0 0-4.6 1.8l1.2 1.3A4.9 4.9 0 0 1 8 5.9Zm0 3.5a1.4 1.4 0 0 0-1 .4L8 11.5l1-1.7a1.4 1.4 0 0 0-1-.4Z"/></svg>
    <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2"/><path d="M25 4.5v4a2 2 0 0 0 0-4Z" opacity=".45"/></svg>
  </span>`;
}

function mountChrome(app) {
  const sb = document.createElement('div');
  sb.className = 'statusbar';
  sb.innerHTML = statusBarHtml();
  app.appendChild(sb);
  setInterval(() => { sb.innerHTML = statusBarHtml(); }, 20000);
  const banners = document.createElement('div');
  banners.className = 'banners';
  app.appendChild(banners);
}

// ——————————————— Notificări, toast, foi ———————————————

function showBanner({ title, body, avatar, image, onTap }) {
  const host = $('.banners');
  if (!host) return;
  const el = document.createElement('div');
  el.className = 'banner';
  el.innerHTML = `
    <div class="banner-av">
      ${avatar ? `<img class="avatar av-40" src="${esc(avatar)}" alt="">` : `<span class="app-badge" style="width:40px;height:40px;border-radius:10px;display:grid">${LOGO_SVG}</span>`}
      ${avatar ? `<span class="app-badge">${LOGO_SVG}</span>` : ''}
    </div>
    <div class="banner-main">
      <div class="banner-top"><span>${esc(title)}</span><small>acum</small></div>
      <div class="banner-body">${esc(body)}</div>
    </div>
    ${image ? `<img class="banner-thumb" src="${esc(image)}" alt="">` : ''}`;
  host.prepend(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  const close = () => { el.classList.add('off'); setTimeout(() => el.remove(), 350); };
  const timer = setTimeout(close, 5200);
  el.addEventListener('click', () => { clearTimeout(timer); close(); onTap && onTap(); });
  while (host.children.length > 2) host.lastElementChild.remove();
}

function toast(text, icon = 'check-circle') {
  const app = $('.app');
  let el = $('.toast', app);
  if (!el) { el = document.createElement('div'); el.className = 'toast'; app.appendChild(el); }
  el.innerHTML = `<i class="ph-fill ph-${icon}"></i>${esc(text)}`;
  el.classList.add('on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('on'), 2400);
}

const sheet = {
  current: null,
  open({ title, body, foot = '', full = false, onClose, headExtra = '' }) {
    this.close(true);
    const app = $('.app');
    const bd = document.createElement('div');
    bd.className = 'sheet-backdrop';
    const el = document.createElement('div');
    el.className = 'sheet' + (full ? ' full' : '');
    el.innerHTML = `<div class="sheet-grab"></div>
      <div class="sheet-head"><div class="sheet-title">${title}</div>${headExtra}<button class="icon-btn" data-act="sheet-close" aria-label="Închide"><i class="ph ph-x"></i></button></div>
      <div class="sheet-body">${body}</div>${foot ? `<div class="sheet-foot">${foot}</div>` : ''}`;
    app.append(bd, el);
    bd.addEventListener('click', () => this.close());
    requestAnimationFrame(() => requestAnimationFrame(() => { bd.classList.add('on'); el.classList.add('on'); }));
    this.current = { el, bd, onClose };
    bindCharts(el);
    return el;
  },
  close(immediate = false) {
    const c = this.current;
    if (!c) return;
    this.current = null;
    c.onClose && c.onClose();
    if (immediate) { c.el.remove(); c.bd.remove(); return; }
    c.el.classList.remove('on');
    c.bd.classList.remove('on');
    setTimeout(() => { c.el.remove(); c.bd.remove(); }, 340);
  },
  body() { return this.current && $('.sheet-body', this.current.el); },
  foot() { return this.current && $('.sheet-foot', this.current.el); },
};

// ——————————————— Grafice ———————————————

const svgEsc = esc;

/**
 * Inelul zilei: inelul exterior = caloriile (culoarea stării), inelul interior = împărțirea pe macro.
 * Macro-urile sunt proporționale cu caloriile pe care le aduc (P×4, C×4, G×9).
 */
function ring({ size = 160, kcal = 0, target = 1, p = 0, c = 0, f = 0, status, macros = true, center = 'full' }) {
  const sw = Math.max(5, Math.round(size * 0.085));
  const r1 = (size - sw) / 2;
  const C1 = 2 * Math.PI * r1;
  const fill = Math.max(0, Math.min(kcal / target, 1));
  const s = size / 2;
  const st = status || (kcal ? (kcal / target < .95 ? 'under' : kcal / target <= 1.05 ? 'ok' : 'over') : null);
  let inner = '';
  if (macros) {
    const sw2 = Math.max(4, Math.round(size * 0.05));
    const r2 = r1 - sw / 2 - Math.max(3, size * 0.03) - sw2 / 2;
    const C2 = 2 * Math.PI * r2;
    const tot = p * 4 + c * 4 + f * 9 || 1;
    const parts = [['p', p * 4], ['c', c * 4], ['f', f * 9]];
    const gap = 2;
    let off = 0;
    inner += `<circle r="${r2}" cx="${s}" cy="${s}" fill="none" stroke="var(--track)" stroke-width="${sw2}" opacity=".7"/>`;
    for (const [k, v] of parts) {
      const len = v / tot * fill * C2;
      if (len > gap + .5) {
        inner += `<circle class="ring-arc" r="${r2}" cx="${s}" cy="${s}" fill="none" stroke="var(--m-${k})" stroke-width="${sw2}"
          stroke-dasharray="${(len - gap).toFixed(2)} ${C2.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 ${s} ${s})"/>`;
      }
      off += len;
    }
  }
  const arc = fill > 0 ? `<circle class="ring-arc" r="${r1}" cx="${s}" cy="${s}" fill="none" stroke="var(--st-${st})" stroke-width="${sw}"
      stroke-linecap="round" stroke-dasharray="${(fill * C1).toFixed(2)} ${C1.toFixed(2)}" transform="rotate(-90 ${s} ${s})"/>` : '';
  const label = `${fmt.n(kcal)} din ${fmt.n(target)} kcal${st ? ', ' + STATUS[st].label : ''}`;
  let mid = '';
  if (center === 'full') mid = `<div class="ring-center"><div class="ring-kcal" style="font-size:${Math.round(size * .2)}px">${fmt.n(kcal)}</div><div class="ring-of" style="font-size:${Math.max(11, Math.round(size * .075))}px">din ${fmt.n(target)} kcal</div></div>`;
  else if (center === 'num') mid = `<div class="ring-center"><div class="ring-kcal" style="font-size:${Math.round(size * .26)}px">${Math.round(kcal / target * 100)}<span style="font-size:.6em">%</span></div></div>`;
  return `<div class="ring-wrap" style="width:${size}px;height:${size}px" role="img" aria-label="${esc(label)}">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle r="${r1}" cx="${s}" cy="${s}" fill="none" stroke="var(--track)" stroke-width="${sw}"/>${arc}${inner}
    </svg>${mid}</div>`;
}

function macroLegend(d, t) {
  const row = (k, name, v, tv) => `<div class="ml-row"><span class="dot ${k}"></span><span class="ml-name">${name}</span>
    <span class="ml-val">${fmt.n(v)}<small> / ${fmt.n(tv)} g</small></span></div>`;
  return `<div class="macro-legend">${row('p', 'Proteine', d.p, t.p)}${row('c', 'Carbohidrați', d.c, t.c)}${row('f', 'Grăsimi', d.f, t.f)}</div>`;
}

/** Valori „rotunde” pentru axe. */
function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || 10 * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(4));
  return { lo, hi, ticks };
}

function dataTable(caption, head, rows) {
  return `<table class="sr-only"><caption>${esc(caption)}</caption><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr>
    ${rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</table>`;
}

/** Grafic de greutate: o singură serie, ținta ca linie punctată (prag), etichetă doar la final. */
function weightChart({ points, target, width = 326, height = 150, caption = 'Greutate' }) {
  if (!points.length) return `<div class="empty"><i class="ph ph-scales"></i>Încă nu există cântăriri.</div>`;
  const padR = 30, padT = 22, padB = 22;
  const W = width, H = height + padT + padB;
  const xs = points.map(p => +D(p.at));
  const ys = points.map(p => p.kg);
  const yMin = Math.min(...ys, target ?? Infinity) - .4, yMax = Math.max(...ys, target ?? -Infinity) + .4;
  const { lo, hi, ticks } = niceTicks(yMin, yMax, 3);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const X = t => x1 === x0 ? (W - padR) / 2 : (t - x0) / (x1 - x0) * (W - padR - 8) + 4;
  const Y = v => padT + (hi - v) / (hi - lo) * height;
  const pts = points.map((p, i) => [X(xs[i]), Y(ys[i])]);
  const line = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('');
  const area = `${line}L${pts.at(-1)[0].toFixed(1)},${padT + height}L${pts[0][0].toFixed(1)},${padT + height}Z`;
  const grid = ticks.map(t => `<line x1="0" x2="${W - padR + 4}" y1="${Y(t)}" y2="${Y(t)}" stroke="var(--grid)" stroke-width="1"/>
      <text x="${W}" y="${Y(t) + 4}" text-anchor="end">${fmt.kgShort(t)}</text>`).join('');
  const tY = target != null ? Y(target) : null;
  const targetLine = tY != null ? `<line x1="0" x2="${W - padR + 4}" y1="${tY}" y2="${tY}" stroke="var(--ink-3)" stroke-width="1.25" stroke-dasharray="4 4"/>
      <text x="2" y="${tY - 6}">țintă ${fmt.kgShort(target)} kg</text>` : '';
  const last = pts.at(-1);
  const endLbl = `<text class="lbl-strong" x="${Math.min(last[0], W - padR - 2)}" y="${last[1] - 12}" text-anchor="end">${fmt.kg(ys.at(-1))} kg</text>`;
  const xl = `<text x="${pts[0][0]}" y="${H - 4}">${fmt.dayShort(points[0].at)}</text>
      <text x="${last[0]}" y="${H - 4}" text-anchor="end">${fmt.dayShort(points.at(-1).at)}</text>`;
  const tips = points.map((p, i) => ({ x: pts[i][0], y: pts[i][1], t: `${fmt.kg(p.kg)} kg`, s: fmt.dayShort(p.at) }));
  return `<div class="chart" data-tips='${esc(JSON.stringify(tips))}' data-h="${H}" style="height:${H}px">
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      ${grid}${targetLine}
      <path d="${area}" fill="var(--series-wash)"/>
      <path d="${line}" fill="none" stroke="var(--series)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="4.5" fill="var(--series)" stroke="var(--surface)" stroke-width="2"/>
      ${endLbl}${xl}
      <line class="xh" y1="${padT}" y2="${padT + height}" stroke="var(--ink-3)" stroke-width="1" opacity="0"/>
      <circle class="hl" r="5" fill="var(--series)" stroke="var(--surface)" stroke-width="2" opacity="0"/>
    </svg><div class="chart-tip"></div>
    ${dataTable(caption, ['Data', 'Kg'], points.map(p => [fmt.dayShort(p.at), fmt.kg(p.kg)]))}
  </div>`;
}

/** Bara săptămânii: o coloană pe zi, colorată după stare; ținta zilnică = linie punctată. */
function weekBars({ days, target, width = 326, height = 96 }) {
  const padT = 16, padB = 22, W = width, H = height + padT + padB;
  const maxV = Math.max(target * 1.2, ...days.map(d => d.kcal));
  const slot = W / 7, bw = Math.min(24, slot * .5);
  const Y = v => padT + height - v / maxV * height;
  const bars = days.map((d, i) => {
    const cx = slot * i + slot / 2, x = cx - bw / 2;
    if (d.isFuture || !d.kcal) return `<rect x="${x}" y="${padT + height - 3}" width="${bw}" height="3" rx="1.5" fill="var(--track)"/>`;
    const y = Y(d.kcal), r = Math.min(4, (padT + height - y) / 2);
    return `<path d="M${x},${padT + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${padT + height}Z" fill="var(--st-${d.status})"/>`;
  }).join('');
  const labels = days.map((d, i) => `<text x="${slot * i + slot / 2}" y="${H - 4}" text-anchor="middle" ${d.isToday ? 'class="lbl-strong"' : ''}>${fmt.wd(d.date)}</text>`).join('');
  const tY = Y(target);
  const tips = days.map((d, i) => ({
    x: slot * i + slot / 2, y: d.kcal ? Y(d.kcal) : padT + height,
    t: d.isFuture ? 'urmează' : `${fmt.n(d.kcal)} kcal`, s: `${cap(fmt.weekday(d.date))}${d.status ? ' · ' + STATUS[d.status].label : ''}`,
  }));
  return `<div class="chart" data-tips='${esc(JSON.stringify(tips))}' data-bars="1" style="height:${H}px">
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <line x1="0" x2="${W}" y1="${padT + height}" y2="${padT + height}" stroke="var(--grid)"/>
      ${bars}
      <line x1="0" x2="${W}" y1="${tY}" y2="${tY}" stroke="var(--ink-3)" stroke-width="1.25" stroke-dasharray="4 4"/>
      <text x="${W}" y="${tY - 5}" text-anchor="end">țintă ${fmt.n(target)}</text>
      ${labels}
    </svg><div class="chart-tip"></div>
    ${dataTable('Calorii pe zile', ['Zi', 'Kcal', 'Stare'], days.map(d => [fmt.weekday(d.date), d.isFuture ? '—' : fmt.n(d.kcal), d.status ? STATUS[d.status].label : '—']))}
  </div>`;
}

/** Forță: greutatea maximă pe perioadă (bare de la zero), cu numărul de serii la acea greutate. */
function strengthBars({ points, width = 326, height = 120, labelAll = false }) {
  if (!points.length) return '';
  const padT = 22, padB = 22, W = width, H = height + padT + padB;
  const maxV = Math.max(...points.map(p => p.kg)) * 1.08;
  const slot = W / points.length, bw = Math.min(24, slot * .56);
  const Y = v => padT + height - v / maxV * height;
  const bars = points.map((p, i) => {
    const cx = slot * i + slot / 2, x = cx - bw / 2, y = Y(p.kg), r = 4;
    const last = i === points.length - 1;
    return `<path d="M${x},${padT + height}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${padT + height}Z"
      fill="var(--series)" opacity="${last ? 1 : .55}"/>`;
  }).join('');
  const show = points.map((p, i) => labelAll || i === 0 || i === points.length - 1);
  const vals = points.map((p, i) => show[i] ? `<text x="${slot * i + slot / 2}" y="${Y(p.kg) - 7}" text-anchor="${!labelAll && i === 0 ? 'start' : !labelAll && i === points.length - 1 ? 'end' : 'middle'}"
      ${i === points.length - 1 ? 'class="lbl-strong"' : ''} dx="${!labelAll && i === 0 ? -bw / 2 : !labelAll && i === points.length - 1 ? bw / 2 : 0}">${fmt.kgShort(p.kg)} kg × ${p.sets}</text>` : '').join('');
  const xl = points.map((p, i) => (labelAll || i % 3 === 2 || i === 0) ? `<text x="${slot * i + slot / 2}" y="${H - 4}" text-anchor="middle">${esc(p.label)}</text>` : '').join('');
  const tips = points.map((p, i) => ({ x: slot * i + slot / 2, y: Y(p.kg), t: `${fmt.kgShort(p.kg)} kg × ${p.sets} serii`, s: p.sub || p.label }));
  return `<div class="chart" data-tips='${esc(JSON.stringify(tips))}' data-bars="1" style="height:${H}px">
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <line x1="0" x2="${W}" y1="${padT + height}" y2="${padT + height}" stroke="var(--grid)"/>
      ${bars}${vals}${xl}
    </svg><div class="chart-tip"></div>
    ${dataTable('Forță', ['Perioadă', 'Kg maxim', 'Serii'], points.map(p => [p.sub || p.label, fmt.kgShort(p.kg), p.sets]))}
  </div>`;
}

/** Grupează punctele săptămânale pe luni: maximul lunii și seriile la acel maxim. */
function strengthByMonth(points) {
  const m = new Map();
  for (const p of points) {
    const d = D(p.week), k = `${d.getFullYear()}-${d.getMonth()}`;
    const cur = m.get(k);
    if (!cur || p.kg > cur.kg || (p.kg === cur.kg && p.sets > cur.sets)) m.set(k, { ...p, d });
  }
  return [...m.values()].map(p => ({
    kg: p.kg, sets: p.sets,
    label: cap(p.d.toLocaleDateString(RO, { month: 'short' }).replace('.', '')),
    sub: cap(p.d.toLocaleDateString(RO, { month: 'long' })),
  }));
}

function sparkline(values, { w = 64, h = 26 } = {}) {
  if (values.length < 2) return '';
  const mn = Math.min(...values), mx = Math.max(...values), sp = mx - mn || 1;
  const pts = values.map((v, i) => [i / (values.length - 1) * (w - 4) + 2, 3 + (mx - v) / sp * (h - 6)]);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" style="display:block">
    <polyline points="${pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="var(--ink-3)" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="2.6" fill="var(--ink)"/></svg>`;
}

/** Tooltip la atingere/hover pentru toate graficele din container. */
function bindCharts(root) {
  for (const el of $$('.chart[data-tips]', root)) {
    if (el._bound) continue;
    el._bound = true;
    const tips = JSON.parse(el.dataset.tips);
    const tip = $('.chart-tip', el), xh = $('.xh', el), hl = $('.hl', el);
    const show = e => {
      const r = el.getBoundingClientRect();
      const scale = r.width / (el.querySelector('svg').viewBox.baseVal.width || r.width);
      const x = (e.clientX - r.left) / scale;
      let best = tips[0];
      for (const t of tips) if (Math.abs(t.x - x) < Math.abs(best.x - x)) best = t;
      tip.innerHTML = `${esc(best.t)}<small>${esc(best.s)}</small>`;
      tip.style.left = Math.max(40, Math.min(best.x, el.clientWidth - 40)) + 'px';
      tip.style.top = Math.max(0, best.y - 10) + 'px';
      tip.classList.add('on');
      if (xh) { xh.setAttribute('x1', best.x); xh.setAttribute('x2', best.x); xh.setAttribute('opacity', 1); }
      if (hl) { hl.setAttribute('cx', best.x); hl.setAttribute('cy', best.y); hl.setAttribute('opacity', 1); }
    };
    const hide = () => { tip.classList.remove('on'); xh && xh.setAttribute('opacity', 0); hl && hl.setAttribute('opacity', 0); };
    el.addEventListener('pointermove', show);
    el.addEventListener('pointerdown', show);
    el.addEventListener('pointerleave', hide);
    el.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') setTimeout(hide, 1600); });
  }
}

// ——————————————— Mici componente ———————————————

const icon = (name, fill = false) => `<i class="${fill ? 'ph-fill' : 'ph'} ph-${name}" aria-hidden="true"></i>`;
const CHECK_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.6 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function tabbar(tabs, active, badges = {}) {
  return `<nav class="tabbar">${tabs.map(t => `<button class="tab ${t.id === active ? 'on' : ''}" data-act="tab" data-tab="${t.id}">
      ${icon(t.icon, t.id === active)}<span>${t.label}</span>${badges[t.id] ? `<span class="badge">${badges[t.id]}</span>` : ''}</button>`).join('')}</nav>`;
}

function itemsSummary(items, max = 3) {
  const names = items.map(i => i.name.replace(/ \(.*\)$/, ''));
  return names.length > max ? names.slice(0, max).join(', ') + ` +${names.length - max}` : names.join(', ');
}

function chatHtml(messages, me, { showOriginal = {}, coachLang } = {}) {
  let out = '', lastDay = '';
  for (const m of messages) {
    const k = dayKey(m.at);
    if (k !== lastDay) {
      lastDay = k;
      const d = D(m.at);
      out += `<div class="chat-day">${sameDay(d, new Date()) ? 'Azi' : sameDay(d, addDays(new Date(), -1)) ? 'Ieri' : cap(fmt.weekday(d)) + ', ' + fmt.dayShort(d)}</div>`;
    }
    const mine = m.from === me;
    // Traducerea automată: antrenorul vede mesajele clientului în română.
    const translated = !mine && m.translated && me === 'coach';
    const text = translated && !showOriginal[m.id] ? m.translated : m.text;
    const meal = m.meal ? `<div class="reply-card"><img src="${esc(m.meal.photo)}" alt=""><div><div class="rc-k">${mine ? 'Ai comentat' : 'A comentat'} la ${esc(mealType(m.meal.type).art)}</div>
        <div class="rc-t">${esc(m.meal.title || mealType(m.meal.type).name)} · ${fmt.n(m.meal.kcal)} kcal</div></div></div>` : '';
    out += `<div class="msg ${mine ? 'me' : 'them'}">${meal}<div class="bubble">${esc(text)}</div>
      <div class="msg-meta">${fmt.time(m.at)}${translated ? ` · ${icon('translate')} Tradus din engleză · <button data-act="orig" data-id="${m.id}">${showOriginal[m.id] ? 'vezi traducerea' : 'vezi originalul'}</button>` : ''}</div></div>`;
  }
  return `<div class="chat">${out}</div>`;
}
