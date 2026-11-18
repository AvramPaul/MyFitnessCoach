// Helper pentru mockup-uri: desenează inelul zilnic (calorii + macro) și sidebar-ul.
// Nu este cod de aplicație, doar ilustrație vizuală.
function ring(el, o){
  const size=o.size||120, s=size/2, rOut=s-6, rIn=s-17, cOut=2*Math.PI*rOut, cIn=2*Math.PI*rIn;
  const pct=o.kcal/o.target, state = pct>1.05?'over':(pct>=0.95?'ok':'warn');
  const col={ok:'var(--ok)',warn:'var(--warn)',over:'var(--over)'}[state];
  const fill=Math.min(pct,1);
  // macro segments (fractions of eaten kcal)
  const tot=o.p*4+o.c*4+o.f*9||1; const fr=[o.p*4/tot,o.c*4/tot,o.f*9/tot];
  const cols=['var(--prot)','var(--carb)','var(--fat)']; let off=0, segs='';
  fr.forEach((f,i)=>{const len=f*fill*cIn; segs+=`<circle r="${rIn}" cx="${s}" cy="${s}" fill="none" stroke="${cols[i]}" stroke-width="7" stroke-dasharray="${Math.max(len-2,0)} ${cIn}" stroke-dashoffset="${-off}" transform="rotate(-90 ${s} ${s})"/>`; off+=len;});
  el.innerHTML=`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle r="${rOut}" cx="${s}" cy="${s}" fill="none" stroke="#eef0f3" stroke-width="9"/>
    <circle r="${rOut}" cx="${s}" cy="${s}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${fill*cOut} ${cOut}" transform="rotate(-90 ${s} ${s})"/>
    <circle r="${rIn}" cx="${s}" cy="${s}" fill="none" stroke="#f3f4f6" stroke-width="7"/>
    ${segs}
    <text x="${s}" y="${s-1}" text-anchor="middle" font-size="${size/6.2}" font-weight="800" fill="var(--ink)">${o.kcal}</text>
    <text x="${s}" y="${s+size/8}" text-anchor="middle" font-size="${size/12}" fill="var(--muted)">/ ${o.target} kcal</text>
  </svg>`;
  return state;
}
function sidebar(active){
  const items=[['acasa','⌂','Acasă','01-acasa.html'],['calorii','🔥','Calorii','02-calorii.html'],['greutate','⚖','Greutate','03-greutate.html'],['antrenamente','⚡','Antrenamente','04-antrenamente.html'],['mese','🍽','Mese propuse','05-mese-propuse.html'],['clienti','👤','Clienți','06-client-detaliu.html'],['chat','💬','Mesaje','#']];
  return `<div class="brand"><div class="logo">M</div>MyFitnessCoach</div><nav class="nav">${items.map(i=>`<a href="${i[3]}" class="${i[0]===active?'on':''}"><span class="ic">${i[1]}</span>${i[2]}</a>`).join('')}</nav>
  <div class="foot"><div class="av" style="background:#0f766e">AT</div><div><b>Antrenor</b><div class="small muted">Română · EN</div></div></div>`;
}
const AV={Andrei:'#2563eb',Paul:'#7c3aed',Denis:'#0891b2',Angelica:'#db2777',Maria:'#ea580c',Șerban:'#4d7c0f',Ioana:'#9333ea'};
function av(n){return `<div class="av" style="background:${AV[n]||'#64748b'}">${n[0]}</div>`}
