'use strict';
/* MyFitnessCoach — aplicația clientului (Andrei). */

const CLIENT_ID = 'andrei';
const CHRONO = ['mic-dejun', 'pranz', 'gustare', 'cina'];

const C = {
  data: null,
  tab: 'home',
  scroll: {},
  mealsSeg: 'jurnal',
  planDay: null,
  strengthEx: 0,
  strengthMode: 'week',
  weightRange: 'all',
  draft: null,
  pendingWeight: null,
};

const TABS = [
  { id: 'home', label: 'Acasă', icon: 'house' },
  { id: 'meals', label: 'Mese', icon: 'fork-knife' },
  { id: 'workout', label: 'Antrenament', icon: 'barbell' },
  { id: 'weight', label: 'Greutate', icon: 'scales' },
  { id: 'chat', label: 'Chat', icon: 'chat-circle' },
];

const app = $('#app');
const contentW = () => Math.min($('#view').clientWidth, 480) - 32;

// ——————————————— Date ———————————————

const todayKey = () => dayKey(new Date());
const mealsToday = () => C.data.meals.filter(m => sameDay(m.at, new Date()));
const planFor = (date, type) => C.data.plans.find(p => sameDay(p.date, date) && p.type === type);
const workoutToday = () => C.data.workouts.find(w => sameDay(w.date, new Date()));
const unread = () => C.data.messages.filter(m => m.from === 'coach' && !m.read).length;
const commentsFor = mealId => C.data.messages.filter(m => m.meal && m.meal.id === mealId);

async function load(opts) {
  C.data = await api.get(`/api/client/${CLIENT_ID}`);
  render(opts);
}

// ——————————————— Shell & randare ———————————————

function shell() {
  app.innerHTML = `<div class="topbar" id="topbar"></div><main class="view" id="view"></main>
    <div id="composer-host"></div><div id="tabbar-host"></div>`;
  mountChrome(app);
  $('#view').addEventListener('scroll', onScroll, { passive: true });
}

function onScroll() {
  const st = $('#view').scrollTop;
  $('#topbar').classList.toggle('on', st > 56);
  app.classList.toggle('sb-solid', st > 0 && st <= 56);
}

const SCREENS = { home: homeScreen, meals: mealsScreen, workout: workoutScreen, weight: weightScreen, chat: chatScreen };
const TITLES = { home: 'Acasă', meals: 'Mese', workout: 'Antrenament', weight: 'Greutate', chat: 'Alex Teodorescu' };

function render({ animate = true, keepScroll = true } = {}) {
  if (!C.data) return;
  const view = $('#view');
  if (!C.data.me.active) return renderLocked();
  view.classList.remove('no-tabbar');
  const st = view.scrollTop;
  view.classList.toggle('static', !animate);
  view.innerHTML = SCREENS[C.tab]();
  if (keepScroll) view.scrollTop = st;
  $('#topbar').textContent = TITLES[C.tab];
  $('#tabbar-host').innerHTML = tabbar(TABS, C.tab, { chat: unread() });
  renderComposer();
  bindCharts(view);
  if (C.tab === 'chat') {
    view.scrollTop = view.scrollHeight;
    if (unread()) markRead();
  }
  onScroll();
}

function go(tab) {
  if (C.tab === tab) { $('#view').scrollTo({ top: 0, behavior: 'smooth' }); return; }
  C.scroll[C.tab] = $('#view').scrollTop;
  C.tab = tab;
  render({ keepScroll: false });
  $('#view').scrollTop = tab === 'chat' ? $('#view').scrollHeight : (C.scroll[tab] || 0);
}

function renderLocked() {
  sheet.close(true);
  $('#tabbar-host').innerHTML = '';
  $('#composer-host').innerHTML = '';
  $('#topbar').classList.remove('on');
  const v = $('#view');
  v.classList.add('no-tabbar');
  v.innerHTML = `<div class="locked">
      <div class="locked-icon">${icon('lock-simple', true)}</div>
      <h1>Accesul tău este suspendat</h1>
      <p>${esc(C.data.coach.firstName)} a dezactivat accesul la aplicație. Planurile, rețetele și programările primite nu mai sunt disponibile.</p>
      <p class="muted">Ia legătura cu antrenorul pentru reactivare.</p>
    </div>`;
}

// ——————————————— Acasă ———————————————

function homeScreen() {
  const d = C.data, t = d.me.targets, today = d.today, w = d.week;
  const st = today.status;

  return `
    <header class="hdr">
      <div><div class="hdr-over">${fmt.dayLong(new Date())}</div><h1 class="hdr-title">Salut, ${esc(d.me.firstName)}</h1></div>
      <div class="hdr-side"><img class="avatar av-40" src="${esc(d.me.photo)}" alt=""></div>
    </header>

    <section class="card pad today">
      <div class="today-top">
        ${ring({ size: 150, kcal: today.kcal, target: t.kcal, p: today.p, c: today.c, f: today.f, status: st })}
        ${macroLegend(today, t)}
      </div>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="sec-t">Săptămâna</span><span class="sec-a num">${fmt.n(w.total)} / ${fmt.n(w.target)} kcal</span></div>
      <div class="card pad">
        ${weekBars({ days: w.days, target: t.kcal, width: contentW() - 32 })}
      </div>
    </section>

    <section class="sec">
      <div class="sec-h"><span class="sec-t">Urmează</span></div>
      <div class="list">${nextMealRow()}${workoutRow()}${weighInRow()}</div>
    </section>`;
}

function nextMealRow() {
  const logged = new Set(mealsToday().map(m => m.type));
  const type = CHRONO.find(t => !logged.has(t));
  if (!type) return `<div class="row with-media"><span class="icon-tile">${icon('check')}</span>
      <div class="row-body"><div class="row-t">Toate mesele de azi sunt logate</div></div></div>`;
  const plan = planFor(new Date(), type);
  if (plan) {
    const r = plan.recipe;
    return `<button class="row with-media" data-act="log" data-type="${type}" data-recipe="1">
      <img class="thumb" src="${esc(r.photo)}" alt="">
      <div class="row-body"><div class="row-k">${mealType(type).name}</div>
        <div class="row-t">${esc(r.name)}</div><div class="row-s">${fmt.n(r.kcal)} kcal · P ${r.p} · C ${r.c} · G ${r.f}</div></div>
      <span class="row-end">${icon('caret-right')}</span></button>`;
  }
  return `<button class="row with-media" data-act="log" data-type="${type}">
      <span class="icon-tile">${icon('plus')}</span>
      <div class="row-body"><div class="row-k">Următoarea masă</div><div class="row-t">${mealType(type).name}</div></div>
      <span class="row-end">${icon('caret-right')}</span></button>`;
}

function workoutRow() {
  const w = workoutToday();
  if (!w) {
    const next = C.data.workouts.find(x => D(x.date) > new Date());
    return `<button class="row with-media" data-act="tab" data-tab="workout"><span class="icon-tile">${icon('barbell')}</span>
      <div class="row-body"><div class="row-k">Antrenament</div><div class="row-t">Zi de odihnă</div>
      <div class="row-s">${next ? `Următorul: ${esc(next.title)}, ${fmt.when(next.date)}` : 'Nimic programat'}</div></div>
      <span class="row-end">${icon('caret-right')}</span></button>`;
  }
  const total = w.exercises.reduce((a, e) => a + e.sets.length, 0);
  const done = w.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  return `<button class="row with-media" data-act="tab" data-tab="workout">
      <img class="thumb" src="${esc(w.photo)}" alt="">
      <div class="row-body"><div class="row-k">Antrenament azi</div><div class="row-t">${esc(w.title)}</div></div>
      <span class="row-end">${done === total ? `<span class="pill"><span class="dot ok"></span>gata</span>` : ''}${icon('caret-right')}</span></button>`;
}

function weighInRow() {
  const wi = C.data.weighIn;
  if (wi.scheduledToday && !wi.doneToday) {
    return `<button class="row with-media" data-act="weigh"><span class="icon-tile accent">${icon('scales')}</span>
      <div class="row-body"><div class="row-k">Cântărire programată</div><div class="row-t">Azi</div></div>
      <span class="row-end"><span class="btn sm primary">Cântărește-te</span></span></button>`;
  }
  return `<button class="row with-media" data-act="tab" data-tab="weight"><span class="icon-tile">${icon('scales')}</span>
      <div class="row-body"><div class="row-k">Următoarea cântărire</div>
        <div class="row-t">${wi.next ? cap(fmt.when(wi.next)) + ', ' + fmt.dayShort(wi.next) : 'Neprogramată'}</div></div>
      <span class="row-end">${icon('caret-right')}</span></button>`;
}

// ——————————————— Mese ———————————————

function mealsScreen() {
  const d = C.data;
  return `
    <header class="hdr"><div><div class="hdr-over">${fmt.dayLong(new Date())}</div><h1 class="hdr-title">Mese</h1></div></header>
    <div class="seg" style="margin-bottom:18px">
      <button class="${C.mealsSeg === 'jurnal' ? 'on' : ''}" data-act="meals-seg" data-seg="jurnal">Jurnal</button>
      <button class="${C.mealsSeg === 'propuse' ? 'on' : ''}" data-act="meals-seg" data-seg="propuse">Propuse de ${esc(d.coach.firstName)}</button>
    </div>
    ${C.mealsSeg === 'jurnal' ? journal() : proposals()}`;
}

function journal() {
  const d = C.data, t = d.me.targets, today = d.today;
  const meals = mealsToday().slice().sort((a, b) => D(a.at) - D(b.at));
  const pct = Math.min(1, today.kcal / t.kcal);
  const rows = [];
  for (const type of CHRONO) {
    const ms = meals.filter(m => m.type === type);
    if (ms.length) ms.forEach(m => rows.push(loggedRow(m)));
    else {
      const plan = planFor(new Date(), type);
      rows.push(`<button class="row with-media" data-act="log" data-type="${type}">
        <span class="icon-tile">${icon('plus')}</span>
        <div class="row-body"><div class="row-t">${mealType(type).name}</div>
          <div class="row-s">${plan ? `Propunere: ${esc(plan.recipe.name)} · ${fmt.n(plan.recipe.kcal)} kcal` : 'Încă nelogat'}</div></div>
        <span class="row-end soft">Adaugă</span></button>`);
    }
  }
  meals.filter(m => m.type === 'extra').forEach(m => rows.push(loggedRow(m)));

  return `
    <section class="card pad day-sum">
      <div class="ds-top"><span><b class="num">${fmt.n(today.kcal)}</b> <span class="muted">din ${fmt.n(t.kcal)} kcal</span></span>${statusPill(today.status)}</div>
      <div class="meter"><span style="width:${pct * 100}%;background:var(--st-${today.status || 'under'})"></span></div>
      <div class="ds-macros"><span><i class="dot p"></i>P ${today.p} g</span><span><i class="dot c"></i>C ${today.c} g</span><span><i class="dot f"></i>G ${today.f} g</span></div>
    </section>
    <section class="sec">
      <div class="sec-h"><span class="sec-t">Azi</span><span class="sec-a">${meals.length} ${meals.length === 1 ? 'masă' : 'mese'}</span></div>
      <div class="list">${rows.join('')}</div>
      <button class="btn block" style="margin-top:10px" data-act="log" data-type="extra">${icon('plus')} Masă extra</button>
      <p class="sec-note">Contează totalul zilei, nu numărul de mese. Fiecare masă are nevoie de o poză.</p>
    </section>
    ${earlierDays()}`;
}

function loggedRow(m) {
  const n = commentsFor(m.id).length;
  return `<button class="row with-media" data-act="meal" data-id="${m.id}">
    <img class="thumb lg" src="${esc(m.photo)}" alt="">
    <div class="row-body"><div class="row-k">${mealType(m.type).name} · ${fmt.time(m.at)}</div>
      <div class="row-t">${esc(m.title || itemsSummary(m.items))}</div>
      <div class="row-s">P ${m.p} · C ${m.c} · G ${m.f}${n ? ` · ${icon('chat-circle-text', true)} ${n}` : ''}</div></div>
    <span class="row-end"><b class="num" style="color:var(--ink)">${fmt.n(m.kcal)}</b> kcal</span></button>`;
}

function earlierDays() {
  const byDay = new Map();
  for (const m of C.data.meals) {
    if (sameDay(m.at, new Date())) continue;
    const k = dayKey(m.at);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(m);
  }
  const t = C.data.me.targets.kcal;
  const rows = [...byDay.entries()].slice(0, 4).map(([k, ms]) => {
    const kcal = ms.reduce((a, m) => a + m.kcal, 0);
    const st = kcal / t < .95 ? 'under' : kcal / t <= 1.05 ? 'ok' : 'over';
    return `<div class="row with-media">
      <div class="thumb-stack">${ms.slice(0, 3).map(m => `<img src="${esc(m.photo)}" alt="">`).join('')}</div>
      <div class="row-body"><div class="row-t">${cap(fmt.when(k))}, ${fmt.dayShort(k)}</div><div class="row-s">${ms.length} mese · ${fmt.n(kcal)} kcal</div></div>
      <span class="row-end">${statusPill(st)}</span></div>`;
  });
  return rows.length ? `<section class="sec"><div class="sec-h"><span class="sec-t">Zilele trecute</span></div><div class="list">${rows.join('')}</div></section>` : '';
}

function proposals() {
  const d = C.data;
  const start = d.week.days[0].date;
  const sel = C.planDay || todayKey();
  const days = d.week.days.map(x => x.date);
  const plans = CHRONO.map(type => planFor(sel, type)).filter(Boolean);
  const isToday = sameDay(sel, new Date());
  const logged = new Set(mealsToday().map(m => m.type));
  return `
    <div class="daypick">${days.map(x => `<button class="dp ${sameDay(x, sel) ? 'on' : ''}" data-act="plan-day" data-day="${dayKey(x)}">
      <span>${fmt.wd(x)}</span><b>${D(x).getDate()}</b></button>`).join('')}</div>
    <p class="sec-note" style="padding:0 2px 14px">Sugestii opționale de la ${esc(d.coach.firstName)}, ca să-ți atingi macro-urile. Poți mânca și altceva.</p>
    ${plans.length ? plans.map(p => `
      <article class="card recipe">
        <img class="photo" src="${esc(p.recipe.photo)}" alt="">
        <div class="recipe-b">
          <div class="row-k">${mealType(p.type).name}${isToday && logged.has(p.type) ? ' · deja logat' : ''}</div>
          <div class="recipe-t">${esc(p.recipe.name)}</div>
          <div class="macros-line"><b>${fmt.n(p.recipe.kcal)} kcal</b><span><i class="dot p"></i>P ${p.recipe.p}</span><span><i class="dot c"></i>C ${p.recipe.c}</span><span><i class="dot f"></i>G ${p.recipe.f}</span></div>
          <ul class="ing">${p.recipe.items.map(i => `<li><span>${esc(i.name)}</span><span class="num">${i.grams} ${i.unit}</span></li>`).join('')}</ul>
          ${isToday && !logged.has(p.type) ? `<button class="btn primary block" data-act="log" data-type="${p.type}" data-recipe="1">Loghează la ${mealType(p.type).name.toLowerCase()}</button>` : ''}
        </div>
      </article>`).join('') : `<div class="card empty">${icon('bowl-food')}Nicio propunere pentru ${fmt.when(sel)}.</div>`}`;
}

// ——————————————— Logare masă (foaie de jos) ———————————————

function openLog(type, useRecipe) {
  C.draft = { type, photo: null, items: [], title: null, recipeId: null, gallery: false, saving: false };
  const plan = planFor(new Date(), type);
  if (useRecipe && plan) applyRecipe(plan.recipe);
  sheet.open({
    title: mealType(type).name,
    full: true,
    body: `<div id="log-photo"></div><div id="log-suggest"></div>
      <div class="sec" style="margin-top:20px"><div class="sec-h"><span class="sec-t">Ingrediente</span><span class="sec-a" id="log-count"></span></div>
        <div class="search">${icon('magnifying-glass')}<input class="field" id="food-q" placeholder="Caută în baza de alimente" autocomplete="off"></div>
        <div id="food-results"></div>
        <div id="log-items"></div>
      </div>`,
    foot: '',
    onClose: () => { C.draft = null; },
  });
  $('#food-q').addEventListener('input', onFoodSearch);
  refreshLog();
}

function applyRecipe(r) {
  const dr = C.draft;
  dr.items = r.items.map(i => ({
    foodId: i.foodId, name: i.name, unit: i.unit, grams: i.grams,
    k: i.kcal / i.grams * 100, p: i.p / i.grams * 100, c: i.c / i.grams * 100, f: i.f / i.grams * 100,
  }));
  dr.title = r.name;
  dr.recipeId = r.id;
}

function draftTotals() {
  const t = { k: 0, p: 0, c: 0, f: 0 };
  for (const i of C.draft.items) { t.k += i.k * i.grams / 100; t.p += i.p * i.grams / 100; t.c += i.c * i.grams / 100; t.f += i.f * i.grams / 100; }
  return t;
}

function refreshLog() {
  const dr = C.draft;
  if (!dr) return;
  // Poza (obligatorie)
  $('#log-photo').innerHTML = dr.photo
    ? `<div class="photo-pick has"><img src="${esc(dr.photo)}" alt="Poza mesei"><button class="btn sm" data-act="gallery">${icon('camera')} Schimbă</button></div>`
    : `<button class="photo-pick" data-act="gallery">${icon('camera')}<b>Adaugă poza mesei</b><span>Obligatoriu · ${esc(C.data.coach.firstName)} vede poza alături de ingrediente</span></button>`;
  if (dr.gallery) $('#log-photo').insertAdjacentHTML('beforeend', `<div class="gallery">
      <label class="gal-up">${icon('upload-simple')}<span>Încarcă</span><input type="file" accept="image/*" data-input="upload" hidden></label>
      ${GALLERY.map(src => `<button data-act="pick" data-src="${src}"><img src="${src}" alt=""></button>`).join('')}</div>`);
  // Propunerea antrenorului
  const plan = planFor(new Date(), dr.type);
  $('#log-suggest').innerHTML = plan && dr.recipeId !== plan.recipe.id ? `
    <div class="card suggest"><img class="thumb" src="${esc(plan.recipe.photo)}" alt="">
      <div class="row-body"><div class="row-k">Propunerea lui ${esc(C.data.coach.firstName)}</div><div class="row-t">${esc(plan.recipe.name)}</div>
      <div class="row-s">${fmt.n(plan.recipe.kcal)} kcal · ${plan.recipe.items.length} ingrediente</div></div>
      <button class="btn sm primary" data-act="use-recipe">Folosește</button></div>` : '';
  // Ingrediente
  $('#log-count').textContent = dr.items.length ? `${dr.items.length}` : '';
  $('#log-items').innerHTML = dr.items.length ? `<div class="list" style="margin-top:10px">${dr.items.map((i, ix) => `
      <div class="row ing-row">
        <div class="row-body"><div class="row-t">${esc(i.name)}</div><div class="row-s"><span class="num" id="ik-${ix}">${fmt.n(i.k * i.grams / 100)}</span> kcal</div></div>
        <div class="stepper"><button data-act="g-step" data-i="${ix}" data-d="-1" aria-label="Mai puțin">${icon('minus')}</button>
          <input inputmode="numeric" value="${i.grams}" data-input="grams" data-i="${ix}" aria-label="Gramaj"><span class="unit">${i.unit}</span>
          <button data-act="g-step" data-i="${ix}" data-d="1" aria-label="Mai mult">${icon('plus')}</button></div>
        <button class="icon-btn ghost" data-act="rm-item" data-i="${ix}" aria-label="Șterge">${icon('x')}</button>
      </div>`).join('')}</div>` : `<div class="empty" style="padding:22px 8px 6px">Caută un aliment sau folosește propunerea antrenorului.</div>`;
  refreshLogFoot();
}

function refreshLogFoot() {
  const dr = C.draft, foot = sheet.foot();
  const host = foot || (() => { const f = document.createElement('div'); f.className = 'sheet-foot'; sheet.current.el.appendChild(f); return f; })();
  const t = draftTotals();
  const missing = !dr.photo ? 'Adaugă poza mesei ca să poți salva' : !dr.items.length ? 'Adaugă cel puțin un aliment' : '';
  host.innerHTML = `
    <div class="log-total"><span><b class="num">${fmt.n(t.k)}</b> kcal</span><span class="muted num">P ${Math.round(t.p)} · C ${Math.round(t.c)} · G ${Math.round(t.f)}</span></div>
    ${missing ? `<div class="sheet-hint">${missing}</div>` : ''}
    <button class="btn primary block" data-act="save-meal" ${missing || dr.saving ? 'disabled' : ''}>${dr.saving ? 'Se trimite…' : `Salvează ${mealType(dr.type).art.replace(/^o /, '')}`}</button>`;
}

let searchTimer;
function onFoodSearch(e) {
  clearTimeout(searchTimer);
  const q = e.target.value.trim();
  if (!q) { $('#food-results').innerHTML = ''; return; }
  searchTimer = setTimeout(async () => {
    const foods = await api.get(`/api/foods?q=${encodeURIComponent(q)}`);
    if (!C.draft) return;
    $('#food-results').innerHTML = foods.length ? `<div class="list results">${foods.slice(0, 6).map(f => `
      <button class="row" data-act="add-food" data-food='${esc(JSON.stringify(f))}'>
        <div class="row-body"><div class="row-t">${esc(f.name)}</div><div class="row-s">${fmt.n(f.kcal)} kcal · P ${fmt.kgShort(f.p)} · C ${fmt.kgShort(f.c)} · G ${fmt.kgShort(f.f)} / 100 ${f.unit}</div></div>
        <span class="row-end">${icon('plus-circle')}</span></button>`).join('')}</div>`
      : `<div class="empty" style="padding:14px">Nu am găsit „${esc(q)}”.</div>`;
  }, 120);
}

function addFood(f) {
  const grams = f.unit === 'ml' ? (f.kcal > 500 ? 10 : 200) : f.kcal > 450 ? 20 : 100;
  C.draft.items.push({ foodId: f.id, name: f.name, unit: f.unit, grams, k: f.kcal, p: f.p, c: f.c, f: f.f });
  $('#food-q').value = '';
  $('#food-results').innerHTML = '';
  refreshLog();
}

function setGrams(ix, g) {
  const it = C.draft.items[ix];
  it.grams = Math.max(0, Math.min(2000, Math.round(g) || 0));
  const k = $(`#ik-${ix}`);
  if (k) k.textContent = fmt.n(it.k * it.grams / 100);
  refreshLogFoot();
}

async function saveMeal() {
  const dr = C.draft;
  dr.saving = true;
  refreshLogFoot();
  try {
    await api.post(`/api/client/${CLIENT_ID}/meals`, {
      type: dr.type, photo: dr.photo, title: dr.title,
      items: dr.items.filter(i => i.grams > 0).map(i => ({ foodId: i.foodId, grams: i.grams })),
    });
    sheet.close();
    C.tab = 'meals';
    C.mealsSeg = 'jurnal';
    await load({ animate: true });
    toast(`Trimis lui ${C.data.coach.firstName}`);
  } catch (err) {
    dr.saving = false;
    refreshLogFoot();
    toast(err.message, 'warning-circle');
  }
}

function openMeal(id) {
  const m = C.data.meals.find(x => x.id === id);
  if (!m) return;
  const comments = commentsFor(id);
  sheet.open({
    title: mealType(m.type).name,
    body: `<img class="photo rounded" src="${esc(m.photo)}" alt="">
      <div class="meal-head"><div class="recipe-t">${esc(m.title || itemsSummary(m.items))}</div><div class="muted">${cap(fmt.when(m.at))}, ${fmt.time(m.at)}</div></div>
      <div class="macros-line"><b>${fmt.n(m.kcal)} kcal</b><span><i class="dot p"></i>P ${m.p}</span><span><i class="dot c"></i>C ${m.c}</span><span><i class="dot f"></i>G ${m.f}</span></div>
      <ul class="ing">${m.items.map(i => `<li><span>${esc(i.name)} <span class="muted">· ${i.grams} ${i.unit}</span></span><span class="num">${fmt.n(i.kcal)} kcal</span></li>`).join('')}</ul>
      ${comments.length ? `<div class="sec"><div class="sec-h"><span class="sec-t">Comentariul lui ${esc(C.data.coach.firstName)}</span></div>
        ${comments.map(c => `<div class="quote"><img class="avatar av-32" src="${esc(C.data.coach.photo)}" alt=""><div><div class="bubble">${esc(c.text)}</div><div class="msg-meta">${fmt.ago(c.at)}</div></div></div>`).join('')}
        <button class="btn block" data-act="tab" data-tab="chat">${icon('chat-circle')} Răspunde în chat</button></div>` : ''}`,
  });
}

// ——————————————— Antrenament ———————————————

function workoutScreen() {
  const d = C.data, w = workoutToday();
  const week = d.workouts.filter(x => sameDay(D(x.date), new Date()) || (D(x.date) >= D(d.week.days[0].date) && D(x.date) <= D(d.week.days[6].date)));
  const head = w
    ? `<header class="hdr"><div><div class="hdr-over">${fmt.dayLong(new Date())}</div><h1 class="hdr-title">${esc(w.title)}</h1></div>
         <div class="hdr-side">${setsProgress(w)}</div></header>
       <div class="hero"><img src="${esc(w.photo)}" alt=""></div>
       ${w.note ? `<div class="coach-note"><img class="avatar av-32" src="${esc(d.coach.photo)}" alt=""><div><b>${esc(d.coach.firstName)}:</b> ${esc(w.note)}</div></div>` : ''}
       ${w.exercises.map((e, ei) => exerciseCard(w, e, ei)).join('')}`
    : `<header class="hdr"><div><div class="hdr-over">${fmt.dayLong(new Date())}</div><h1 class="hdr-title">Zi de odihnă</h1></div></header>
       <div class="card empty">${icon('moon')}Azi nu ai antrenament. Recuperarea face parte din plan.</div>`;
  return `${head}
    <section class="sec"><div class="sec-h"><span class="sec-t">Săptămâna ta</span></div>
      <div class="list">${week.map(x => {
        const today = sameDay(x.date, new Date()), past = D(x.date) < new Date() && !today;
        const state = x.completed ? `<span class="pill"><span class="dot ok"></span>făcut</span>` : today ? '<span class="tag">azi</span>' : past ? '<span class="pill"><span class="dot none"></span>ratat</span>' : `<span class="muted">${fmt.dayShort(x.date)}</span>`;
        return `<div class="row"><div class="row-body"><div class="row-t">${esc(x.title)}</div><div class="row-s">${cap(fmt.weekday(x.date))} · ${x.exercises.length} exerciții</div></div><span class="row-end">${state}</span></div>`;
      }).join('')}</div></section>
    ${strengthSection(d.strength)}`;
}

function setsProgress(w) {
  const total = w.exercises.reduce((a, e) => a + e.sets.length, 0);
  const done = w.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  return `<div class="sets-prog"><b class="num">${done}</b><span>/${total} seturi</span></div>`;
}

function exerciseCard(w, e, ei) {
  const unit = e.unit;
  const plan = unit === 'min' ? `${e.planSets > 1 ? e.planSets + ' × ' : ''}${e.planMin} min` : unit === 'bw' ? `${e.planSets} × ${e.planReps} · BW` : `${e.planSets} × ${e.planReps} · ${fmt.kgShort(e.planKg)} kg`;
  const cols = unit === 'kg' ? ['Set', 'Plan', 'kg', 'Rep.', ''] : unit === 'bw' ? ['Set', 'Plan', 'Rep.', ''] : ['Set', 'Plan', 'Min', ''];
  return `<section class="card ex">
    <div class="ex-h"><div><div class="ex-t">${esc(e.name)}</div><div class="row-s">Plan: ${plan}</div></div><span class="tag">${unit === 'bw' ? 'body weight' : unit === 'min' ? 'minute' : 'kg'}</span></div>
    <div class="sets ${unit}"><div class="sets-h">${cols.map(c => `<span>${c}</span>`).join('')}</div>
    ${e.sets.map((s, si) => `<div class="set ${s.done ? 'done' : ''}">
      <span class="set-n">${si + 1}</span>
      <span class="set-plan num">${unit === 'min' ? `${e.planMin}′` : unit === 'bw' ? `${e.planReps}` : `${e.planReps}×${fmt.kgShort(e.planKg)}`}</span>
      ${unit === 'kg' ? `<input class="set-in num" inputmode="decimal" value="${fmt.kgShort(s.kg)}" data-input="set" data-w="${w.id}" data-ex="${ei}" data-set="${si}" data-k="kg" aria-label="Kilograme">` : ''}
      ${unit !== 'min' ? `<input class="set-in num" inputmode="numeric" value="${s.reps}" data-input="set" data-w="${w.id}" data-ex="${ei}" data-set="${si}" data-k="reps" aria-label="Repetări">`
        : `<input class="set-in num" inputmode="numeric" value="${s.min}" data-input="set" data-w="${w.id}" data-ex="${ei}" data-set="${si}" data-k="min" aria-label="Minute">`}
      <button class="check" data-act="set-done" data-w="${w.id}" data-ex="${ei}" data-set="${si}" aria-label="Marchează setul">${CHECK_SVG}</button>
    </div>`).join('')}</div>
    <div class="ex-f"><button class="btn sm" data-act="set-add" data-w="${w.id}" data-ex="${ei}">${icon('plus')} Set</button>
      ${e.sets.length > 1 ? `<button class="btn sm" data-act="set-rm" data-w="${w.id}" data-ex="${ei}">${icon('minus')} Set</button>` : ''}</div>
  </section>`;
}

function strengthSection(series) {
  if (!series.length) return '';
  const s = series[Math.min(C.strengthEx, series.length - 1)];
  const pts = C.strengthMode === 'week'
    ? s.points.map(p => ({ kg: p.kg, sets: p.sets, label: fmt.dayShort(p.week).split(' ')[0] + ' ' + fmt.dayShort(p.week).split(' ')[1], sub: `Săpt. din ${fmt.dayShort(p.week)}` }))
    : strengthByMonth(s.points);
  const first = s.points[0], last = s.points.at(-1);
  return `<section class="sec"><div class="sec-h"><span class="sec-t">Progres forță</span><span class="sec-a delta-good">+${fmt.kgShort(last.kg - first.kg)} kg în 12 săpt.</span></div>
    <div class="chips" style="margin-bottom:10px">${series.map((x, i) => `<button class="chip ${i === C.strengthEx ? 'on' : ''}" data-act="str-ex" data-i="${i}">${esc(x.exercise)}</button>`).join('')}</div>
    <div class="card pad">
      <div class="seg" style="margin-bottom:12px"><button class="${C.strengthMode === 'week' ? 'on' : ''}" data-act="str-mode" data-m="week">Săptămână</button><button class="${C.strengthMode === 'month' ? 'on' : ''}" data-act="str-mode" data-m="month">Lună</button></div>
      ${strengthBars({ points: pts, width: contentW() - 32, labelAll: C.strengthMode === 'month' })}
      <p class="sec-note">Greutatea maximă și numărul de serii făcute la acea greutate.</p>
    </div></section>`;
}

function saveSetField(el) {
  const { w, ex, set, k } = el.dataset;
  const val = parseFloat(el.value.replace(',', '.'));
  if (Number.isNaN(val)) return;
  const wo = C.data.workouts.find(x => x.id === w);
  wo.exercises[+ex].sets[+set][k] = val;
  api.post(`/api/workouts/${w}/sets`, { ex: +ex, set: +set, [k]: k === 'kg' ? val : Math.round(val) }).catch(() => {});
}

async function toggleSet(btn) {
  const { w, ex, set } = btn.dataset;
  const wo = C.data.workouts.find(x => x.id === w);
  const s = wo.exercises[+ex].sets[+set];
  s.done = !s.done;
  btn.closest('.set').classList.toggle('done', s.done);
  const hp = $('.sets-prog'); if (hp) hp.outerHTML = setsProgress(wo);
  if (s.done && navigator.vibrate) navigator.vibrate(10);
  const finished = wo.exercises.every(e => e.sets.every(x => x.done));
  if (finished) toast('Antrenament complet. Bravo!', 'trophy');
  try { await api.post(`/api/workouts/${w}/sets`, { ex: +ex, set: +set, done: s.done }); } catch { }
}

// ——————————————— Greutate ———————————————

function weightScreen() {
  const d = C.data, me = d.me, wi = d.weighIn;
  const all = d.weights;
  const cur = all.length ? all.at(-1).kg : me.startKg;
  const diff = cur - me.startKg;
  const towardGoal = Math.sign(me.goalKg - me.startKg) === Math.sign(diff) || diff === 0;
  const progress = Math.max(0, Math.min(1, (cur - me.startKg) / (me.goalKg - me.startKg)));
  const cutoff = C.weightRange === '4w' ? addDays(new Date(), -28) : C.weightRange === '12w' ? addDays(new Date(), -84) : new Date(0);
  const pts = all.filter(p => D(p.at) >= cutoff);
  const history = all.slice(-6).reverse();
  return `
    <header class="hdr"><div><h1 class="hdr-title">Greutate</h1></div></header>
    ${wi.scheduledToday && !wi.doneToday ? `
      <section class="card pad weigh-cta">
        <div class="wc-icon">${icon('scales')}</div>
        <div class="row-body"><div class="row-t">Cântărire azi</div></div>
        <button class="btn sm primary" data-act="weigh">Cântărește-te</button>
      </section>` : ''}
    <section class="card pad">
      <div class="w-hero"><span class="w-num">${fmt.kg(cur)}</span><span class="w-unit">kg</span></div>
      <div class="w-sub"><span class="${towardGoal ? 'delta-good' : 'delta-bad'}">${diff >= 0 ? '+' : '−'}${fmt.kg(Math.abs(diff))} kg</span> de la început</div>
      <div class="goal-meter"><div class="meter"><span style="width:${progress * 100}%;background:var(--series)"></span></div>
        <div class="gm-l"><span>${fmt.kgShort(me.startKg)}</span><span>${Math.round(progress * 100)}% din drum</span><span>${fmt.kgShort(me.goalKg)} kg</span></div></div>
      <div class="seg" style="margin:18px 0 6px">${[['4w', '4 săpt.'], ['12w', '12 săpt.'], ['all', 'Tot']].map(([k, l]) => `<button class="${C.weightRange === k ? 'on' : ''}" data-act="w-range" data-r="${k}">${l}</button>`).join('')}</div>
      ${weightChart({ points: pts, target: me.goalKg, width: contentW() - 32 })}
    </section>
    <section class="sec"><div class="sec-h"><span class="sec-t">Cântăriri programate</span></div>
      <div class="card pad">
        <div class="wd-row">${[1, 2, 3, 4, 5, 6, 7].map(n => `<span class="wd ${wi.days.includes(n) ? 'on' : ''}">${['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'][n - 1]}</span>`).join('')}</div>
        ${wi.next && !(wi.scheduledToday && !wi.doneToday) ? `<div class="kv" style="margin-top:6px"><span>Următoarea</span><b>${cap(fmt.when(wi.next))}, ${fmt.dayShort(wi.next)}</b></div>` : ''}
      </div></section>
    <section class="sec"><div class="sec-h"><span class="sec-t">Istoric</span></div>
      <div class="list">${history.map((h, i) => {
        const prev = all[all.length - 2 - i];
        const dd = prev ? h.kg - prev.kg : 0;
        return `<div class="row"><div class="row-body"><div class="row-t">${fmt.kg(h.kg)} kg</div><div class="row-s">${cap(fmt.when(h.at))}, ${fmt.dayShort(h.at)}</div></div>
          <span class="row-end num">${prev ? `${dd > 0 ? '▲' : dd < 0 ? '▼' : '='} ${fmt.kg(Math.abs(dd))}` : ''}</span></div>`;
      }).join('')}</div></section>`;
}

function openWeigh() {
  const last = C.data.weights.at(-1);
  C.pendingWeight = last ? last.kg : C.data.me.startKg;
  sheet.open({
    title: 'Cântărire',
    body: `<p class="soft" style="margin-bottom:18px">Dimineața, înainte de micul dejun, e cel mai bine.</p>
      <div class="weigh-pad">
        <button class="icon-btn lg" data-act="w-step" data-d="-0.1" aria-label="Minus 0,1">${icon('minus')}</button>
        <div class="weigh-val"><input id="w-in" inputmode="decimal" value="${fmt.kg(C.pendingWeight)}"><span>kg</span></div>
        <button class="icon-btn lg" data-act="w-step" data-d="0.1" aria-label="Plus 0,1">${icon('plus')}</button>
      </div>
      <p class="muted" style="text-align:center;margin-top:10px">Ultima: ${last ? `${fmt.kg(last.kg)} kg, ${fmt.when(last.at)}` : '—'}</p>`,
    foot: `<button class="btn primary block" data-act="save-weight">Salvează</button>`,
  });
  $('#w-in').addEventListener('input', e => { const v = parseFloat(e.target.value.replace(',', '.')); if (!Number.isNaN(v)) C.pendingWeight = v; });
}

async function saveWeight() {
  try {
    await api.post(`/api/client/${CLIENT_ID}/weight`, { kg: Math.round(C.pendingWeight * 10) / 10 });
    sheet.close();
    await load({ animate: true });
    toast('Cântărire salvată');
  } catch (err) { toast(err.message, 'warning-circle'); }
}

// ——————————————— Chat ———————————————

function chatScreen() {
  const d = C.data;
  return `<div class="chat-head"><img class="avatar av-44" src="${esc(d.coach.photo)}" alt="">
      <div><div class="ch-name">${esc(d.coach.name)}</div><div class="ch-sub">Antrenorul tău</div></div></div>
    ${chatHtml(d.messages, 'client')}<div style="height:64px"></div>`;
}

function renderComposer() {
  const host = $('#composer-host');
  if (C.tab !== 'chat') { host.innerHTML = ''; return; }
  if (!$('#chat-in', host)) {
    host.innerHTML = `<form class="composer" data-form="chat"><input id="chat-in" placeholder="Scrie-i lui ${esc(C.data.coach.firstName)}…" autocomplete="off">
      <button class="send" aria-label="Trimite">${icon('arrow-up', true)}</button></form>`;
  }
}

async function sendChat(text) {
  await api.post('/api/messages', { clientId: CLIENT_ID, from: 'client', text });
}

function markRead() {
  C.data.messages.forEach(m => { if (m.from === 'coach') m.read = true; });
  api.post('/api/messages/read', { clientId: CLIENT_ID, reader: 'client' }).catch(() => {});
  $('#tabbar-host').innerHTML = tabbar(TABS, C.tab, { chat: 0 });
}

// ——————————————— Evenimente ———————————————

const ACTIONS = {
  'tab': el => { sheet.close(); go(el.dataset.tab); },
  'sheet-close': () => sheet.close(),
  'log': el => openLog(el.dataset.type, !!el.dataset.recipe),
  'meal': el => openMeal(el.dataset.id),
  'meals-seg': el => { C.mealsSeg = el.dataset.seg; render({ keepScroll: false }); },
  'plan-day': el => { C.planDay = el.dataset.day; render({ animate: false }); },
  'gallery': () => { C.draft.gallery = !C.draft.gallery; refreshLog(); },
  'pick': el => { C.draft.photo = el.dataset.src; C.draft.gallery = false; refreshLog(); },
  'use-recipe': () => { applyRecipe(planFor(new Date(), C.draft.type).recipe); refreshLog(); },
  'add-food': el => addFood(JSON.parse(el.dataset.food)),
  'rm-item': el => { C.draft.items.splice(+el.dataset.i, 1); refreshLog(); },
  'g-step': el => {
    const ix = +el.dataset.i, it = C.draft.items[ix];
    const step = it.grams >= 100 ? 10 : 5;
    setGrams(ix, it.grams + step * +el.dataset.d);
    const inp = $(`input[data-input="grams"][data-i="${ix}"]`); if (inp) inp.value = it.grams;
  },
  'save-meal': () => saveMeal(),
  'set-done': el => toggleSet(el),
  'set-add': async el => { await api.post(`/api/workouts/${el.dataset.w}/sets/add`, { ex: +el.dataset.ex }); await load({ animate: false }); },
  'set-rm': async el => { await api.post(`/api/workouts/${el.dataset.w}/sets/remove`, { ex: +el.dataset.ex }); await load({ animate: false }); },
  'str-ex': el => { C.strengthEx = +el.dataset.i; render({ animate: false }); },
  'str-mode': el => { C.strengthMode = el.dataset.m; render({ animate: false }); },
  'w-range': el => { C.weightRange = el.dataset.r; render({ animate: false }); },
  'weigh': () => openWeigh(),
  'w-step': el => { C.pendingWeight = Math.round((C.pendingWeight + +el.dataset.d) * 10) / 10; $('#w-in').value = fmt.kg(C.pendingWeight); },
  'save-weight': () => saveWeight(),
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || !ACTIONS[el.dataset.act]) return;
  e.preventDefault();
  ACTIONS[el.dataset.act](el);
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.input === 'grams') setGrams(+el.dataset.i, parseInt(el.value, 10));
});

document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.input === 'set') saveSetField(el);
  if (el.dataset.input === 'upload' && el.files[0]) {
    C.draft.photo = await fileToDataUrl(el.files[0]);
    C.draft.gallery = false;
    refreshLog();
  }
});

document.addEventListener('submit', async e => {
  if (e.target.dataset.form !== 'chat') return;
  e.preventDefault();
  const inp = $('#chat-in');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = '';
  await sendChat(text);
});

function onLive(ev) {
  if (ev.kind === 'reset') { sheet.close(true); C.tab = 'home'; load({ keepScroll: false }); return; }
  if (ev.clientId && ev.clientId !== CLIENT_ID) return;
  const b = ev.banner;
  if (b && b.to === 'client') {
    showBanner({
      title: b.title, body: b.body, avatar: b.avatar, image: b.image,
      onTap: () => {
        sheet.close();
        const target = { chat: 'chat', home: 'home', workout: 'workout', weight: 'weight', plans: 'meals' }[b.link] || 'home';
        if (b.link === 'plans') C.mealsSeg = 'propuse';
        go(target);
      },
    });
  }
  // Nu reîncărca ecranul cât timp clientul scrie într-un câmp (ar pierde focusul).
  if (document.activeElement && document.activeElement.matches('#view input')) {
    C.reloadOnBlur = true;
    return;
  }
  load({ animate: ev.kind === 'targets' || ev.kind === 'access' });
}

document.addEventListener('focusout', e => {
  if (!C.reloadOnBlur || !e.target.matches('#view input')) return;
  C.reloadOnBlur = false;
  setTimeout(() => load({ animate: false }), 50);
});

// ——————————————— Pornire ———————————————

shell();
load().catch(() => { $('#view').innerHTML = `<div class="empty">${icon('warning-circle')}Nu mă pot conecta la server.</div>`; });
connectLive(onLive);
