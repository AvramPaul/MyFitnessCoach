'use strict';
/* MyFitnessCoach — aplicația antrenorului (Alex). */

const K = {
  data: null,
  tab: 'home',
  stack: [],
  scroll: {},
  feedDay: null,
  feedClient: 'all',
  clientsSeg: 'azi',
  planSeg: 'workouts',
  planDay: null,
  planType: 'cina',
  expanded: null,
  detail: {},
  showOriginal: {},
  newMeal: null,
  strength: { ex: 0, mode: 'week' },
  draftTargets: null,
  draftDays: null,
};

const TABS = [
  { id: 'home', label: 'Acasă', icon: 'house' },
  { id: 'feed', label: 'Calorii', icon: 'fire' },
  { id: 'clients', label: 'Clienți', icon: 'users' },
  { id: 'plan', label: 'Plan', icon: 'calendar-dots' },
  { id: 'inbox', label: 'Mesaje', icon: 'chat-circle' },
];

const app = $('#app');
const contentW = () => Math.min($('#view').clientWidth, 480) - 32;
const WD_NAMES = ['', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă', 'duminică'];

// ——————————————— Date ———————————————

const cl = id => K.data.clients.find(c => c.info.id === id);
const thread = id => (K.data.threads.find(t => t.clientId === id) || { messages: [] }).messages;
const recipe = id => K.data.recipes.find(r => r.id === id);
const activeClients = () => K.data.clients.filter(c => c.info.active);
const unreadTotal = () => K.data.clients.reduce((a, c) => a + c.unread, 0);
const firstName = id => cl(id)?.info.firstName || '';

async function load(opts) {
  K.data = await api.get('/api/coach');
  const top = K.stack.at(-1);
  if (top && top.type === 'client') K.detail[top.id] = await api.get(`/api/client/${top.id}`);
  render(opts);
}

// ——————————————— Shell & randare ———————————————

function shell() {
  app.innerHTML = `<div class="topbar" id="topbar"></div><main class="view" id="view"></main>
    <div id="composer-host"></div><div id="tabbar-host"></div>`;
  mountChrome(app);
  $('#view').addEventListener('scroll', syncBars, { passive: true });
}

function syncBars() {
  const st = $('#view').scrollTop;
  $('#topbar').classList.toggle('on', st > 56);
  app.classList.toggle('sb-solid', st > 0 && st <= 56);
}

const SCREENS = { home: homeScreen, feed: feedScreen, clients: clientsScreen, plan: planScreen, inbox: inboxScreen };
const TITLES = { home: 'Acasă', feed: 'Calorii', clients: 'Clienți', plan: 'Plan', inbox: 'Mesaje' };

function render({ animate = true, keepScroll = true } = {}) {
  if (!K.data) return;
  const view = $('#view');
  const st = view.scrollTop;
  const top = K.stack.at(-1);
  view.classList.toggle('static', !animate);
  if (top) {
    view.innerHTML = `<div class="${animate ? 'pushed' : ''}">${top.type === 'client' ? clientDetail(top.id) : threadScreen(top.id)}</div>`;
    $('#topbar').textContent = top.type === 'client' ? cl(top.id).info.name : cl(top.id).info.name;
  } else {
    view.innerHTML = SCREENS[K.tab]();
    $('#topbar').textContent = TITLES[K.tab];
  }
  if (keepScroll) view.scrollTop = st;
  $('#tabbar-host').innerHTML = tabbar(TABS, K.tab, { inbox: unreadTotal() });
  renderComposer();
  bindCharts(view);
  if (top && top.type === 'thread') {
    view.scrollTop = view.scrollHeight;
    if (cl(top.id).unread) markRead(top.id);
  }
  syncBars();
  K.newMeal = null;
}

function go(tab) {
  sheet.close();
  if (K.tab === tab && !K.stack.length) { $('#view').scrollTo({ top: 0, behavior: 'smooth' }); return; }
  K.scroll[K.tab] = $('#view').scrollTop;
  K.tab = tab;
  K.stack = [];
  render({ keepScroll: false });
  $('#view').scrollTop = K.scroll[tab] || 0;
}

async function push(type, id) {
  sheet.close();
  if (!K.stack.length) K.scroll[K.tab] = $('#view').scrollTop;
  if (type === 'client') K.detail[id] = await api.get(`/api/client/${id}`);
  K.stack.push({ type, id });
  render({ keepScroll: false });
  $('#view').scrollTop = type === 'thread' ? $('#view').scrollHeight : 0;
}

function pop() {
  K.stack.pop();
  render({ keepScroll: false });
  if (!K.stack.length) $('#view').scrollTop = K.scroll[K.tab] || 0;
}

// ——————————————— Acasă ———————————————

function homeScreen() {
  const d = K.data, s = d.stats, now = new Date();
  const h = now.getHours();
  const greet = h < 12 ? 'Bună dimineața' : h < 18 ? 'Bună ziua' : 'Bună seara';
  const weighIns = activeClients().filter(c => c.weighIn.scheduledToday);
  const acts = d.activity.slice(0, 8);
  return `
    <header class="hdr"><div><div class="hdr-over">${fmt.dayLong(now)}</div><h1 class="hdr-title">${greet}, ${esc(d.coach.firstName)}</h1></div>
      <div class="hdr-side"><img class="avatar av-40" src="${esc(d.coach.photo)}" alt=""></div></header>

    <section class="card stats">
      <button class="stat" data-act="tab" data-tab="clients"><b class="num">${s.active}</b><span>clienți activi</span>
        ${sparkline(s.history, { w: 74, h: 20 })}</button>
      <button class="stat" data-act="tab" data-tab="feed"><b class="num">${s.mealsToday}</b><span>mese postate azi</span></button>
      <button class="stat" data-act="tab" data-tab="clients"><b class="num">${s.onTarget}<em>/${s.active}</em></b><span>la țintă azi</span><small>${statusDots()}</small></button>
    </section>

    ${weighIns.length ? `<section class="sec"><div class="sec-h"><span class="sec-t">Cântăriri azi</span></div>
      <div class="list">${weighIns.map(weighInRow).join('')}</div></section>` : ''}

    <section class="sec"><div class="sec-h"><span class="sec-t">Activitate</span><button class="sec-a" data-act="tab" data-tab="feed">Toate mesele</button></div>
      <div class="list">${acts.length ? acts.map(activityRow).join('') : `<div class="empty">Încă nicio masă azi.</div>`}</div></section>

    <section class="sec"><div class="card pad invite">
      <div class="row-body"><div class="row-k">Cod de invitație</div><div class="invite-code">${esc(d.coach.inviteCode)}</div></div>
      <button class="btn sm" data-act="copy-code">${icon('copy')} Copiază</button></div></section>`;
}

function statusDots() {
  return activeClients().map(c => `<span class="dot ${c.today.status || 'none'}" title="${esc(c.info.firstName)}"></span>`).join('');
}

function weighInRow(c) {
  const wi = c.weighIn, w = c.weight;
  const done = wi.doneToday && w;
  return `<button class="row with-avatar" data-act="client" data-id="${c.info.id}">
    <img class="avatar av-40" src="${esc(c.info.photo)}" alt="">
    <div class="row-body"><div class="row-t">${esc(c.info.firstName)}</div>
      <div class="row-s">${done ? `${fmt.kg(w.kg)} kg · ${fmt.time(w.at)}` : wi.reminderSent ? 'Reamintit la 17:00' : 'Notificat dimineața'}</div></div>
    <span class="row-end">${done && w.delta != null ? `<span class="num ${deltaClass(c, w.delta)}">${w.delta > 0 ? '▲' : w.delta < 0 ? '▼' : '='} ${fmt.kg(Math.abs(w.delta))}</span>` : ''}</span>
  </button>`;
}

/** Verde dacă greutatea merge spre țintă, roșu dacă se îndepărtează. */
function deltaClass(c, delta) {
  const dir = Math.sign(c.info.goalKg - c.info.startKg);
  return delta === 0 ? 'soft' : Math.sign(delta) === dir ? 'delta-good' : 'delta-bad';
}

function activityRow(a) {
  const c = cl(a.clientId);
  if (a.kind === 'meal') {
    return `<button class="row with-avatar" data-act="open-meal" data-id="${a.mealId}">
      <img class="avatar av-40" src="${esc(c.info.photo)}" alt="">
      <div class="row-body"><div class="row-k">${cap(fmt.ago(a.at))}</div><div class="row-t act-t"><b>${esc(c.info.firstName)}</b> a postat ${mealType(a.type).art}</div>
        <div class="row-s num">${fmt.n(a.kcal)} kcal · ${fmt.n(a.dayKcal)} / ${fmt.n(a.target)}</div></div>
      <img class="thumb sm" src="${esc(a.photo)}" alt=""></button>`;
  }
  return `<button class="row with-avatar" data-act="client" data-id="${a.clientId}">
    <img class="avatar av-40" src="${esc(c.info.photo)}" alt="">
    <div class="row-body"><div class="row-k">${cap(fmt.ago(a.at))}</div><div class="row-t act-t"><b>${esc(c.info.firstName)}</b> s-a cântărit: ${fmt.kg(a.kg)} kg</div>
      <div class="row-s">${a.delta != null ? `<span class="${deltaClass(c, a.delta)}">${a.delta > 0 ? '▲' : a.delta < 0 ? '▼' : '='} ${fmt.kg(Math.abs(a.delta))} kg</span> față de data trecută` : 'Prima cântărire'}</div></div>
    <span class="icon-tile sm">${icon('scales')}</span></button>`;
}

// ——————————————— Calorii (cronologia meselor) ———————————————

function feedScreen() {
  const d = K.data;
  const day = K.feedDay || dayKey(new Date());
  const items = d.meals.filter(x => dayKey(x.meal.at) === day && (K.feedClient === 'all' || x.meal.clientId === K.feedClient));
  return `
    <header class="hdr"><div><h1 class="hdr-title">Calorii</h1></div></header>
    <div class="daystrip">${d.days.map(x => {
      const on = dayKey(x.date) === day;
      return `<button class="ds ${on ? 'on' : ''}" data-act="feed-day" data-day="${dayKey(x.date)}">
        <span>${sameDay(x.date, new Date()) ? 'Azi' : fmt.wd3(x.date)}</span><b>${D(x.date).getDate()}</b>
        <i>${x.dots.map(o => `<span class="dot ${o.status || 'none'}"></span>`).join('')}</i></button>`;
    }).join('')}</div>
    <div class="chips" style="margin-bottom:14px">
      <button class="chip ${K.feedClient === 'all' ? 'on' : ''}" data-act="feed-client" data-id="all">Toți</button>
      ${activeClients().map(c => `<button class="chip ${K.feedClient === c.info.id ? 'on' : ''}" data-act="feed-client" data-id="${c.info.id}">
        <img class="avatar av-24" src="${esc(c.info.photo)}" alt="">${esc(c.info.firstName)}</button>`).join('')}
    </div>
    ${items.length ? items.map(postCard).join('') : `<div class="card empty">${icon('fork-knife')}Nicio masă postată ${sameDay(day, new Date()) ? 'încă azi' : 'în ziua asta'}.</div>`}`;
}

function postCard({ meal: m, day }) {
  const c = cl(m.clientId);
  const comments = thread(m.clientId).filter(x => x.meal && x.meal.id === m.id).length;
  return `<article class="card post ${K.newMeal === m.id ? 'fade-in' : ''}" data-act="open-meal" data-id="${m.id}">
    <header class="post-h">
      <img class="avatar av-40" src="${esc(c.info.photo)}" alt="">
      <div class="row-body"><div class="post-name">${esc(c.info.name)}</div>
        <div class="row-s">${mealType(m.type).name} · ${fmt.time(m.at)}${comments ? ` · ${icon('chat-circle-text', true)} ${comments}` : ''}</div></div>
      ${ring({ size: 48, kcal: day.kcal, target: day.target, status: day.status, macros: false, center: 'num' })}
    </header>
    <img class="photo" src="${esc(m.photo)}" alt="" loading="lazy">
    <div class="post-b">
      <div class="post-items">${m.items.map(i => `${esc(i.name.replace(/ \(.*\)$/, ''))} <span class="num">${i.grams} ${i.unit}</span>`).join(' · ')}</div>
      <div class="post-stats">
        <div><span>Masa</span><b class="num">${fmt.n(m.kcal)} kcal</b></div>
        <div><span><i class="dot p"></i>Proteine</span><b class="num">${m.p} g</b></div>
        <div><span><i class="dot c"></i>Carbo</span><b class="num">${m.c} g</b></div>
        <div><span><i class="dot f"></i>Grăsimi</span><b class="num">${m.f} g</b></div>
      </div>
    </div>
  </article>`;
}

function openMeal(id, focus) {
  const x = K.data.meals.find(y => y.meal.id === id);
  if (!x) return;
  const { meal: m, day } = x;
  const c = cl(m.clientId);
  const comments = thread(m.clientId).filter(y => y.meal && y.meal.id === m.id);
  sheet.open({
    title: `${esc(c.info.firstName)} · ${mealType(m.type).name}`,
    full: true,
    body: `<img class="photo rounded" src="${esc(m.photo)}" alt="">
      <div class="meal-head muted">${cap(fmt.when(m.at))}, ${fmt.time(m.at)}</div>
      <ul class="ing">${m.items.map(i => `<li><span>${esc(i.name)} <span class="muted">· ${i.grams} ${i.unit}</span></span><span class="num">${fmt.n(i.kcal)} kcal</span></li>`).join('')}
        <li class="tot"><span>Total masă</span><span class="num">${fmt.n(m.kcal)} kcal</span></li></ul>
      <div class="macros-line"><span><i class="dot p"></i>P ${m.p} g</span><span><i class="dot c"></i>C ${m.c} g</span><span><i class="dot f"></i>G ${m.f} g</span></div>
      <div class="sec"><div class="sec-h"><span class="sec-t">Ziua lui ${esc(c.info.firstName)}</span></div>
        <div class="card pad today-top">${ring({ size: 112, kcal: day.kcal, target: day.target, p: day.p, c: day.c, f: day.f, status: day.status })}
          ${macroLegend(day, c.info.targets)}</div></div>
      ${comments.length ? `<div class="sec"><div class="sec-h"><span class="sec-t">Comentarii</span></div>
        ${comments.map(y => `<div class="quote"><img class="avatar av-32" src="${esc(y.from === 'coach' ? K.data.coach.photo : c.info.photo)}" alt=""><div><div class="bubble">${esc(y.text)}</div><div class="msg-meta">${fmt.ago(y.at)}</div></div></div>`).join('')}</div>` : ''}`,
    foot: `<form class="composer inline" data-form="comment" data-meal="${m.id}" data-client="${m.clientId}">
      <input id="comment-in" placeholder="Comentează masa… (apare în chat)" autocomplete="off">
      <button class="send" aria-label="Trimite">${icon('arrow-up', true)}</button></form>`,
  });
  if (focus) setTimeout(() => $('#comment-in')?.focus(), 350);
}

// ——————————————— Clienți ———————————————

function clientsScreen() {
  const list = K.data.clients;
  const active = list.filter(c => c.info.active), inactive = list.filter(c => !c.info.active);
  return `
    <header class="hdr"><div><h1 class="hdr-title">Clienți</h1></div>
      <div class="hdr-side"><button class="icon-btn" data-act="invite" aria-label="Invită client">${icon('user-plus')}</button></div></header>
    <div class="seg" style="margin-bottom:16px">
      <button class="${K.clientsSeg === 'azi' ? 'on' : ''}" data-act="clients-seg" data-seg="azi">Calorii azi</button>
      <button class="${K.clientsSeg === 'greutate' ? 'on' : ''}" data-act="clients-seg" data-seg="greutate">Greutate</button>
    </div>
    <div class="list">${active.map(clientRow).join('')}</div>
    ${inactive.length ? `<section class="sec"><div class="sec-h"><span class="sec-t">Acces dezactivat</span></div><div class="list">${inactive.map(clientRow).join('')}</div></section>` : ''}`;
}

function clientRow(c) {
  const i = c.info, t = c.today, w = c.weight;
  if (K.clientsSeg === 'greutate') {
    return `<button class="row with-avatar" data-act="client" data-id="${i.id}">
      <img class="avatar av-44" src="${esc(i.photo)}" alt="">
      <div class="row-body"><div class="row-t">${esc(i.name)}</div>
        <div class="row-s">${w ? `<b class="num" style="color:var(--ink)">${fmt.kg(w.kg)} kg</b> · <span class="${deltaClass(c, w.fromStart)}">${w.fromStart > 0 ? '+' : w.fromStart < 0 ? '−' : ''}${fmt.kg(Math.abs(w.fromStart))}</span> · țintă ${fmt.kgShort(i.goalKg)}` : '—'}</div>
        <div class="row-s muted">Următoarea: ${c.weighIn.next ? `${fmt.when(c.weighIn.next)}, ${fmt.dayShort(c.weighIn.next)}` : 'neprogramată'}</div></div>
      <span class="row-end">${sparkline(c.weights.slice(-12).map(x => x.kg))}</span></button>`;
  }
  return `<button class="row with-avatar ${i.active ? '' : 'off'}" data-act="client" data-id="${i.id}">
    <img class="avatar av-44" src="${esc(i.photo)}" alt="">
    <div class="row-body"><div class="row-t">${esc(i.name)}${i.dietOnly ? ' <span class="tag">doar dietă</span>' : ''}</div>
      <div class="row-s">${esc(i.goal)}</div></div>
    <span class="row-end">${i.active ? ring({ size: 40, kcal: t.kcal, target: t.target, status: t.status, macros: false, center: 'num' }) : '<span class="tag">inactiv</span>'}</span></button>`;
}

function clientDetail(id) {
  const s = cl(id), x = K.detail[id];
  if (!s || !x) return '';
  const i = x.me, t = i.targets, today = x.today, w = x.week;
  const weights = x.weights;
  const cur = weights.length ? weights.at(-1).kg : i.startKg;
  const fromStart = cur - i.startKg;
  const series = x.strength;
  const sx = series[Math.min(K.strength.ex, series.length - 1)];
  const workouts = x.workouts.filter(o => D(o.date) >= D(w.days[0].date) && D(o.date) <= D(w.days[6].date));
  const names = x.weighIn.days.map(n => WD_NAMES[n]);
  return `
    <button class="back" data-act="back">${icon('caret-left')} ${K.tab === 'inbox' ? 'Mesaje' : K.tab === 'clients' ? 'Clienți' : 'Înapoi'}</button>
    <header class="profile">
      <img class="avatar av-72" src="${esc(i.photo)}" alt="">
      <div class="row-body"><h1 class="profile-name">${esc(i.name)}</h1>
        <div class="soft">${esc(i.goal)}${i.dietOnly ? ' · doar dietă' : ''} · din ${fmt.dayShort(i.since)}</div></div>
      <button class="icon-btn" data-act="thread" data-id="${id}" aria-label="Mesaj">${icon('chat-circle')}</button>
    </header>
    ${!i.active ? `<div class="card pad warn-card">${icon('lock-simple')}<div><b>Acces dezactivat.</b> ${esc(i.firstName)} nu mai vede planurile și rețetele.</div></div>` : ''}

    <section class="sec"><div class="sec-h"><span class="sec-t">Azi</span></div>
      <div class="card pad today-top">${ring({ size: 128, kcal: today.kcal, target: t.kcal, p: today.p, c: today.c, f: today.f, status: today.status })}${macroLegend(today, t)}</div></section>

    <section class="sec"><div class="sec-h"><span class="sec-t">Săptămâna</span><span class="sec-a num">${fmt.n(w.total)} / ${fmt.n(w.target)}</span></div>
      <div class="card pad">${weekBars({ days: w.days, target: t.kcal, width: contentW() - 32 })}</div></section>

    <section class="sec"><div class="sec-h"><span class="sec-t">Ținte</span><button class="sec-a" data-act="edit-targets" data-id="${id}">Editează</button></div>
      <div class="card pad">
        <div class="kv"><span>Calorii pe zi</span><b class="num">${fmt.n(t.kcal)} kcal</b></div>
        <div class="kv"><span>Proteine · Carbo · Grăsimi</span><b class="num">${t.p} · ${t.c} · ${t.f} g</b></div>
      </div></section>

    <section class="sec"><div class="sec-h"><span class="sec-t">Greutate</span><button class="sec-a" data-act="edit-weighin" data-id="${id}">Programează</button></div>
      <div class="card pad">${weightChart({ points: weights, target: i.goalKg, width: contentW() - 32 })}
        <div class="kv" style="margin-top:6px"><span>De la început</span><b class="num ${deltaClass(s, fromStart)}">${fromStart >= 0 ? '+' : '−'}${fmt.kg(Math.abs(fromStart))} kg</b></div>
        <div class="kv"><span>Cântăriri</span><b>${names.length ? names.map(cap).join(', ') : '—'}</b></div>
        <div class="kv"><span>Următoarea</span><b>${x.weighIn.next ? `${cap(fmt.when(x.weighIn.next))}, ${fmt.dayShort(x.weighIn.next)}` : '—'}</b></div>
      </div></section>

    ${sx ? `<section class="sec"><div class="sec-h"><span class="sec-t">Forță</span></div>
      <div class="chips" style="margin-bottom:10px">${series.map((o, k) => `<button class="chip ${k === K.strength.ex ? 'on' : ''}" data-act="str-ex" data-i="${k}">${esc(o.exercise)}</button>`).join('')}</div>
      <div class="card pad"><div class="seg" style="margin-bottom:12px"><button class="${K.strength.mode === 'week' ? 'on' : ''}" data-act="str-mode" data-m="week">Săptămână</button><button class="${K.strength.mode === 'month' ? 'on' : ''}" data-act="str-mode" data-m="month">Lună</button></div>
        ${strengthBars({ points: K.strength.mode === 'week' ? sx.points.map(p => ({ kg: p.kg, sets: p.sets, label: fmt.dayShort(p.week), sub: `Săpt. din ${fmt.dayShort(p.week)}` })) : strengthByMonth(sx.points), width: contentW() - 32, labelAll: K.strength.mode === 'month' })}</div></section>` : ''}

    ${!i.dietOnly ? `<section class="sec"><div class="sec-h"><span class="sec-t">Antrenamente săptămâna asta</span></div>
      <div class="list">${workouts.length ? workouts.map(o => `<div class="row"><div class="row-body"><div class="row-t">${esc(o.title)}</div><div class="row-s">${cap(fmt.weekday(o.date))}</div></div>
        <span class="row-end">${o.completed ? '<span class="pill"><span class="dot ok"></span>completat</span>' : sameDay(o.date, new Date()) ? '<span class="tag">azi</span>' : D(o.date) < new Date() ? '<span class="pill"><span class="dot none"></span>necompletat</span>' : ''}</span></div>`).join('') : '<div class="empty">Niciun antrenament.</div>'}</div></section>` : ''}

    <section class="sec">
      ${i.active ? `<button class="btn block danger" data-act="deactivate" data-id="${id}">${icon('lock-simple')} Dezactivează accesul</button>`
        : `<button class="btn block primary" data-act="reactivate" data-id="${id}">Reactivează accesul</button>`}
    </section>`;
}

function editTargets(id) {
  const t = cl(id).info.targets;
  K.draftTargets = { id, kcal: t.kcal, p: t.p, c: t.c, f: t.f };
  sheet.open({ title: 'Ținte zilnice', body: targetsBody(), foot: `<button class="btn primary block" data-act="save-targets">Salvează țintele</button>` });
}

function targetsBody() {
  const d = K.draftTargets;
  const fromMacros = d.p * 4 + d.c * 4 + d.f * 9;
  const row = (k, label, unit, step) => `<div class="tgt-row"><span>${label}</span>
    <div class="stepper"><button data-act="tgt" data-k="${k}" data-d="${-step}">${icon('minus')}</button>
      <input class="num" value="${fmt.n(d[k])}" readonly><span class="unit">${unit}</span><button data-act="tgt" data-k="${k}" data-d="${step}">${icon('plus')}</button></div></div>`;
  return `<p class="soft" style="margin-bottom:12px">Pentru ${esc(firstName(d.id))}. Ținta e aceeași în fiecare zi.</p>
    <div class="card pad">${row('kcal', 'Calorii', 'kcal', 50)}${row('p', 'Proteine', 'g', 5)}${row('c', 'Carbohidrați', 'g', 5)}${row('f', 'Grăsimi', 'g', 5)}</div>
    <div class="kv" style="margin-top:8px"><span>Din macro</span><b class="num ${Math.abs(fromMacros - d.kcal) > d.kcal * .05 ? 'delta-bad' : ''}">${fmt.n(fromMacros)} kcal</b></div>
    <div class="kv"><span>Ținta săptămânală (automat)</span><b class="num">${fmt.n(d.kcal * 7)} kcal</b></div>`;
}

function editWeighIn(id) {
  K.draftDays = { id, days: [...cl(id).weighIn.days] };
  sheet.open({ title: 'Programează cântăririle', body: weighInBody(), foot: `<button class="btn primary block" data-act="save-weighin">Salvează</button>` });
}

function weighInBody() {
  const d = K.draftDays;
  return `<p class="soft" style="margin-bottom:14px">Alege zilele pentru ${esc(firstName(d.id))}. Se repetă în fiecare săptămână, până le schimbi.</p>
    <div class="wd-row big">${[1, 2, 3, 4, 5, 6, 7].map(n => `<button class="wd ${d.days.includes(n) ? 'on' : ''}" data-act="toggle-day" data-n="${n}">${['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'][n - 1]}</button>`).join('')}</div>
    <p class="sec-note" style="margin-top:14px">Cântărirea e valabilă toată ziua. Clientul primește notificare dimineața și o reamintire la 17:00 dacă nu s-a cântărit.</p>`;
}

function confirmDeactivate(id) {
  const n = firstName(id);
  sheet.open({
    title: 'Dezactivezi accesul?',
    body: `<p class="soft">${esc(n)} nu va mai putea folosi aplicația și nu va mai vedea planurile, rețetele și programările primite de la tine. Datele rămân salvate și îl poți reactiva oricând.</p>`,
    foot: `<button class="btn block danger-fill" data-act="do-deactivate" data-id="${id}">Dezactivează accesul</button>
      <button class="btn block" style="margin-top:8px" data-act="sheet-close">Renunță</button>`,
  });
}

// ——————————————— Plan ———————————————

function planScreen() {
  const d = K.data;
  const today = new Date();
  const monday = addDays(today, -((today.getDay() + 6) % 7));
  const days = [...Array(7)].map((_, i) => addDays(monday, i));
  const sel = K.planDay || dayKey(today);
  return `
    <header class="hdr"><div><div class="hdr-over">Săptămâna ${D(days[0]).getDate()} – ${fmt.dayShort(days[6])}</div><h1 class="hdr-title">Plan</h1></div></header>
    <div class="seg" style="margin-bottom:14px">
      <button class="${K.planSeg === 'workouts' ? 'on' : ''}" data-act="plan-seg" data-seg="workouts">Antrenamente</button>
      <button class="${K.planSeg === 'meals' ? 'on' : ''}" data-act="plan-seg" data-seg="meals">Mese propuse</button>
    </div>
    <div class="daypick">${days.map(x => `<button class="dp ${dayKey(x) === sel ? 'on' : ''}" data-act="plan-day" data-day="${dayKey(x)}">
      <span>${fmt.wd(x)}</span><b>${D(x).getDate()}</b>${sameDay(x, today) ? '<i></i>' : ''}</button>`).join('')}</div>
    ${K.planSeg === 'workouts' ? planWorkouts(sel) : planMeals(sel)}`;
}

function planWorkouts(sel) {
  const d = K.data;
  const rows = activeClients().map(c => {
    const i = c.info;
    if (i.dietOnly) return `<div class="row with-avatar"><img class="avatar av-40" src="${esc(i.photo)}" alt="">
      <div class="row-body"><div class="row-t">${esc(i.firstName)}</div><div class="row-s">Doar dietă, fără antrenamente</div></div></div>`;
    const w = d.workouts.find(o => o.clientId === i.id && dayKey(o.date) === sel);
    if (!w) return `<div class="row with-avatar"><img class="avatar av-40" src="${esc(i.photo)}" alt="">
      <div class="row-body"><div class="row-t">${esc(i.firstName)}</div></div>
      <button class="btn sm" data-act="assign" data-id="${i.id}" data-day="${sel}">${icon('plus')} Adaugă</button></div>`;
    const done = w.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
    const total = w.exercises.reduce((a, e) => a + e.sets.length, 0);
    const open = K.expanded === w.id;
    const state = done === total ? '<span class="pill"><span class="dot ok"></span>completat</span>'
      : done ? `<span class="pill"><span class="dot under"></span>${done}/${total} seturi</span>` : '';
    return `<div class="wo ${open ? 'open' : ''}">
      <button class="row with-avatar" data-act="expand" data-id="${w.id}">
        <img class="avatar av-40" src="${esc(i.photo)}" alt="">
        <div class="row-body"><div class="row-t">${esc(i.firstName)} · ${esc(w.title)}</div></div>
        <span class="row-end">${state}${icon(open ? 'caret-up' : 'caret-down')}</span></button>
      ${open ? `<div class="wo-body">${w.exercises.map(e => `<div class="wo-ex"><span>${esc(e.name)}</span><span class="num muted">${e.unit === 'min' ? `${e.planSets > 1 ? e.planSets + ' × ' : ''}${e.planMin} min` : e.unit === 'bw' ? `${e.planSets}×${e.planReps} · BW` : `${e.planSets}×${e.planReps} · ${fmt.kgShort(e.planKg)} kg`}</span></div>`).join('')}
        <div class="wo-actions"><button class="btn sm" data-act="assign" data-id="${i.id}" data-day="${sel}">${icon('arrows-clockwise')} Schimbă</button>
          <button class="btn sm danger" data-act="rm-workout" data-id="${w.id}">${icon('trash')} Șterge</button></div></div>` : ''}
    </div>`;
  }).join('');
  return `<div class="list">${rows}</div>
    <section class="sec"><div class="sec-h"><span class="sec-t">Șabloane</span><span class="sec-a">${d.templates.length}</span></div>
      <div class="hscroll">${d.templates.map(t => `<div class="tpl"><img src="${esc(t.photo)}" alt=""><div class="tpl-b"><b>${esc(t.title)}</b><span>${t.exercises.length} exerciții</span></div></div>`).join('')}</div></section>`;
}

function planMeals(sel) {
  const d = K.data;
  const rows = activeClients().map(c => {
    const i = c.info;
    const p = d.plans.find(o => o.clientId === i.id && dayKey(o.date) === sel && o.type === K.planType);
    const r = p && recipe(p.recipeId);
    return `<div class="row with-avatar"><img class="avatar av-40" src="${esc(i.photo)}" alt="">
      <div class="row-body"><div class="row-t">${esc(i.firstName)}</div>
        ${r ? `<div class="row-s">${esc(r.name)} · ${fmt.n(r.kcal)} kcal</div>` : ''}</div>
      ${r ? `<button class="plan-thumb" data-act="propose" data-id="${i.id}" data-day="${sel}"><img class="thumb" src="${esc(r.photo)}" alt=""></button>`
        : `<button class="btn sm" data-act="propose" data-id="${i.id}" data-day="${sel}">${icon('plus')} Propune</button>`}</div>`;
  }).join('');
  return `<div class="seg" style="margin-bottom:12px">${['mic-dejun', 'pranz', 'gustare', 'cina'].map(t => `<button class="${K.planType === t ? 'on' : ''}" data-act="plan-type" data-t="${t}">${mealType(t).name}</button>`).join('')}</div>
    <div class="list">${rows}</div>
    <section class="sec"><div class="sec-h"><span class="sec-t">Rețetele mele</span><span class="sec-a">${d.recipes.length}</span></div>
      <div class="recipe-grid">${d.recipes.map(r => `<button class="rcard" data-act="recipe" data-id="${r.id}"><img src="${esc(r.photo)}" alt="" loading="lazy">
        <b>${esc(r.name)}</b><span class="num">${fmt.n(r.kcal)} kcal · P ${r.p}</span></button>`).join('')}</div></section>`;
}

function openAssign(id, day) {
  sheet.open({
    title: `${esc(firstName(id))} · ${fmt.weekday(day)}`,
    body: `<p class="soft" style="margin-bottom:12px">Alege un șablon. Seriile, repetările și greutatea se precompletează pentru client.</p>
      <div class="list">${K.data.templates.map(t => `<button class="row with-media" data-act="do-assign" data-id="${id}" data-day="${day}" data-t="${t.id}">
        <img class="thumb" src="${esc(t.photo)}" alt=""><div class="row-body"><div class="row-t">${esc(t.title)}</div><div class="row-s">${esc(t.exercises.join(', '))}</div></div>
        <span class="row-end">${icon('caret-right')}</span></button>`).join('')}</div>`,
  });
}

function openPropose(id, day) {
  const type = K.planType;
  const ordered = [...K.data.recipes].sort((a, b) => (b.type === type) - (a.type === type));
  sheet.open({
    title: `${mealType(type).name} · ${esc(firstName(id))}`,
    full: true,
    body: `<p class="soft" style="margin-bottom:12px">${cap(fmt.weekday(day))}, ${fmt.dayShort(day)}. Clientul poate folosi rețeta ca punct de plecare.</p>
      <div class="list">${ordered.map(r => `<button class="row with-media" data-act="do-propose" data-id="${id}" data-day="${day}" data-r="${r.id}">
        <img class="thumb" src="${esc(r.photo)}" alt=""><div class="row-body"><div class="row-t">${esc(r.name)}</div><div class="row-s num">${fmt.n(r.kcal)} kcal · P ${r.p} · C ${r.c} · G ${r.f}</div></div></button>`).join('')}</div>`,
  });
}

function openRecipe(id) {
  const r = recipe(id);
  sheet.open({
    title: esc(r.name),
    body: `<img class="photo rounded" src="${esc(r.photo)}" alt="">
      <div class="macros-line" style="margin-top:14px"><b>${fmt.n(r.kcal)} kcal</b><span><i class="dot p"></i>P ${r.p}</span><span><i class="dot c"></i>C ${r.c}</span><span><i class="dot f"></i>G ${r.f}</span></div>
      <ul class="ing">${r.items.map(i => `<li><span>${esc(i.name)} <span class="muted">· ${i.grams} ${i.unit}</span></span><span class="num">${fmt.n(i.kcal)} kcal</span></li>`).join('')}</ul>
      <p class="sec-note">Macro calculate automat din baza de alimente, în funcție de gramaj.</p>`,
  });
}

// ——————————————— Mesaje ———————————————

function inboxScreen() {
  const rows = K.data.clients.map(c => ({ c, msgs: thread(c.info.id) })).filter(x => x.msgs.length)
    .sort((a, b) => D(b.msgs.at(-1).at) - D(a.msgs.at(-1).at));
  return `
    <header class="hdr"><div><h1 class="hdr-title">Mesaje</h1></div></header>
    <div class="list">${rows.map(({ c, msgs }) => {
      const last = msgs.at(-1);
      const text = last.from === 'client' && last.translated ? last.translated : last.text;
      return `<button class="row with-avatar inbox-row ${c.unread ? 'unread' : ''}" data-act="thread" data-id="${c.info.id}">
        <img class="avatar av-44" src="${esc(c.info.photo)}" alt="">
        <div class="row-body"><div class="row-t">${esc(c.info.name)}</div><div class="row-s">${last.from === 'coach' ? 'Tu: ' : ''}${last.meal ? `${icon('camera')} ` : ''}${esc(text)}</div></div>
        <span class="row-end col"><span class="muted">${fmt.ago(last.at)}</span>${c.unread ? `<span class="badge-dot">${c.unread}</span>` : ''}</span></button>`;
    }).join('')}</div>`;
}

function threadScreen(id) {
  const c = cl(id);
  return `<button class="back" data-act="back">${icon('caret-left')} ${K.tab === 'inbox' ? 'Mesaje' : 'Înapoi'}</button>
    <button class="chat-head" data-act="client" data-id="${id}"><img class="avatar av-44" src="${esc(c.info.photo)}" alt="">
      <div style="text-align:left"><div class="ch-name">${esc(c.info.name)}</div><div class="ch-sub">${esc(c.info.goal)}${c.info.lang === 'en' ? ' · scrie în engleză' : ''}</div></div></button>
    ${chatHtml(thread(id), 'coach', { showOriginal: K.showOriginal })}<div style="height:64px"></div>`;
}

function renderComposer() {
  const host = $('#composer-host');
  const top = K.stack.at(-1);
  if (!top || top.type !== 'thread') { host.innerHTML = ''; return; }
  if (host.dataset.id !== top.id || !$('#chat-in', host)) {
    host.dataset.id = top.id;
    host.innerHTML = `<form class="composer" data-form="chat"><input id="chat-in" placeholder="Scrie-i lui ${esc(firstName(top.id))}…" autocomplete="off">
      <button class="send" aria-label="Trimite">${icon('arrow-up', true)}</button></form>`;
  }
}

function markRead(id) {
  cl(id).unread = 0;
  api.post('/api/messages/read', { clientId: id, reader: 'coach' }).catch(() => {});
  $('#tabbar-host').innerHTML = tabbar(TABS, K.tab, { inbox: unreadTotal() });
}

// ——————————————— Evenimente ———————————————

const post = async (url, body, ok) => {
  try { await api.post(url, body); if (ok) toast(ok); return true; }
  catch (err) { toast(err.message, 'warning-circle'); return false; }
};

const ACTIONS = {
  'tab': el => go(el.dataset.tab),
  'back': () => pop(),
  'sheet-close': () => sheet.close(),
  'client': el => push('client', el.dataset.id),
  'thread': el => push('thread', el.dataset.id),
  'open-meal': el => openMeal(el.dataset.id, !!el.dataset.focus),
  'feed-day': el => { K.feedDay = el.dataset.day; render({ animate: false }); },
  'feed-client': el => { K.feedClient = el.dataset.id; render({ animate: false }); },
  'clients-seg': el => { K.clientsSeg = el.dataset.seg; render({ animate: false }); },
  'plan-seg': el => { K.planSeg = el.dataset.seg; render({ animate: false }); },
  'plan-day': el => { K.planDay = el.dataset.day; K.expanded = null; render({ animate: false }); },
  'plan-type': el => { K.planType = el.dataset.t; render({ animate: false }); },
  'expand': el => { K.expanded = K.expanded === el.dataset.id ? null : el.dataset.id; render({ animate: false }); },
  'assign': el => openAssign(el.dataset.id, el.dataset.day),
  'do-assign': async el => { if (await post('/api/coach/workouts', { clientId: el.dataset.id, date: el.dataset.day, template: el.dataset.t }, 'Antrenament programat')) sheet.close(); },
  'rm-workout': async el => { K.expanded = null; await post(`/api/coach/workouts/${el.dataset.id}/remove`, {}, 'Antrenament șters'); },
  'propose': el => openPropose(el.dataset.id, el.dataset.day),
  'do-propose': async el => { if (await post('/api/coach/plans', { clientId: el.dataset.id, date: el.dataset.day, type: K.planType, recipeId: el.dataset.r }, 'Propunere trimisă')) sheet.close(); },
  'recipe': el => openRecipe(el.dataset.id),
  'str-ex': el => { K.strength.ex = +el.dataset.i; render({ animate: false }); },
  'str-mode': el => { K.strength.mode = el.dataset.m; render({ animate: false }); },
  'edit-targets': el => editTargets(el.dataset.id),
  'tgt': el => {
    const d = K.draftTargets, k = el.dataset.k;
    d[k] = Math.max(0, d[k] + +el.dataset.d);
    sheet.body().innerHTML = targetsBody();
  },
  'save-targets': async () => {
    const d = K.draftTargets;
    if (await post(`/api/coach/clients/${d.id}/targets`, { kcal: d.kcal, p: d.p, c: d.c, f: d.f }, 'Ținte actualizate')) sheet.close();
  },
  'edit-weighin': el => editWeighIn(el.dataset.id),
  'toggle-day': el => {
    const d = K.draftDays, n = +el.dataset.n;
    d.days = d.days.includes(n) ? d.days.filter(x => x !== n) : [...d.days, n].sort();
    sheet.body().innerHTML = weighInBody();
  },
  'save-weighin': async () => {
    const d = K.draftDays;
    if (await post(`/api/coach/clients/${d.id}/weighin`, { days: d.days }, 'Cântăriri programate')) sheet.close();
  },
  'deactivate': el => confirmDeactivate(el.dataset.id),
  'do-deactivate': async el => { if (await post(`/api/coach/clients/${el.dataset.id}/access`, { active: false }, 'Acces dezactivat')) sheet.close(); },
  'reactivate': el => post(`/api/coach/clients/${el.dataset.id}/access`, { active: true }, 'Acces reactivat'),
  'orig': el => { K.showOriginal[el.dataset.id] = !K.showOriginal[el.dataset.id]; render({ animate: false }); },
  'copy-code': () => { navigator.clipboard?.writeText(K.data.coach.inviteCode).catch(() => {}); toast('Cod copiat'); },
  'invite': () => sheet.open({
    title: 'Invită un client',
    body: `<p class="soft">Trimite-i codul de mai jos. După ce își face cont și îl introduce, apare automat în lista ta.</p>
      <div class="invite-big">${esc(K.data.coach.inviteCode)}</div>`,
    foot: `<button class="btn primary block" data-act="copy-code">${icon('copy')} Copiază codul</button>`,
  }),
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || !ACTIONS[el.dataset.act]) return;
  e.preventDefault();
  ACTIONS[el.dataset.act](el);
});

document.addEventListener('submit', async e => {
  const f = e.target;
  e.preventDefault();
  if (f.dataset.form === 'chat') {
    const inp = $('#chat-in'), text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    await post('/api/messages', { clientId: K.stack.at(-1).id, from: 'coach', text });
  }
  if (f.dataset.form === 'comment') {
    const inp = $('#comment-in'), text = inp.value.trim();
    if (!text) return;
    if (await post('/api/messages', { clientId: f.dataset.client, from: 'coach', text, mealId: f.dataset.meal }, 'Comentariu trimis în chat')) sheet.close();
  }
});

function onLive(ev) {
  if (ev.kind === 'reset') { sheet.close(true); K.stack = []; K.tab = 'home'; K.detail = {}; load({ keepScroll: false }); return; }
  const b = ev.banner;
  if (b && b.to === 'coach') {
    showBanner({
      title: b.title, body: b.body, avatar: b.avatar, image: b.image,
      onTap: () => {
        const [kind, id] = (b.link || '').split(':');
        if (kind === 'meal') openMeal(id);
        else if (kind === 'chat') { K.tab = 'inbox'; K.stack = []; push('thread', id); }
        else if (kind === 'client') { K.tab = 'clients'; K.stack = []; push('client', id); }
      },
    });
  }
  if (ev.kind === 'meal' && ev.data) K.newMeal = ev.data.mealId;
  load({ animate: false });
}

// ——————————————— Pornire ———————————————

shell();
load().catch(() => { $('#view').innerHTML = `<div class="empty">${icon('warning-circle')}Nu mă pot conecta la server.</div>`; });
connectLive(onLive);
