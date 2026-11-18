// Apple Fitness Rings & Design System Helpers

/**
 * Renders an authentic Apple Fitness-style ring
 * Outer ring: Calories with vibrant color (Green/Yellow/Red based on target)
 * Inner ring: Concentric macro progression (P, C, F)
 */
function ring(el, o) {
  const size = o.size || 120;
  const s = size / 2;
  const rOut = s - 8;
  const rIn = s - 20;
  const cOut = 2 * Math.PI * rOut;
  const cIn = 2 * Math.PI * rIn;

  const pct = o.kcal / o.target;
  const state = pct > 1.05 ? 'over' : (pct >= 0.95 ? 'ok' : 'warn');
  
  // Apple Colors: Emerald Green, Amber Orange, Neon Rose Red
  const ringColors = {
    ok: '#30D158',    // Apple vibrant green
    warn: '#FF9F0A',  // Apple orange
    over: '#FF453A'   // Apple red
  };
  const mainCol = ringColors[state];
  const fill = Math.min(pct, 1);
  const strokeW = Math.max(Math.round(size / 13), 8);

  // Macro calculation
  const tot = (o.p * 4) + (o.c * 4) + (o.f * 9) || 1;
  const fr = [(o.p * 4) / tot, (o.c * 4) / tot, (o.f * 9) / tot];
  const macroCols = ['#0A84FF', '#FF9F0A', '#FF375F']; // Apple Blue, Orange, Pink
  let off = 0, segs = '';

  fr.forEach((f, i) => {
    const len = f * fill * cIn;
    if (len > 0) {
      segs += `
        <circle r="${rIn}" cx="${s}" cy="${s}" fill="none" 
          stroke="${macroCols[i]}" stroke-width="${strokeW - 2}" 
          stroke-linecap="round"
          stroke-dasharray="${Math.max(len - 2, 0.1)} ${cIn}" 
          stroke-dashoffset="${-off}" 
          transform="rotate(-90 ${s} ${s})"/>
      `;
      off += len;
    }
  });

  el.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.06));">
      <!-- Background track outer -->
      <circle r="${rOut}" cx="${s}" cy="${s}" fill="none" stroke="rgba(0, 0, 0, 0.06)" stroke-width="${strokeW}"/>
      
      <!-- Progress outer -->
      <circle r="${rOut}" cx="${s}" cy="${s}" fill="none" stroke="${mainCol}" stroke-width="${strokeW}"
        stroke-linecap="round"
        stroke-dasharray="${Math.max(fill * cOut, 0.01)} ${cOut}" 
        transform="rotate(-90 ${s} ${s})"
        style="transition: stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1);" />

      <!-- Background track inner -->
      <circle r="${rIn}" cx="${s}" cy="${s}" fill="none" stroke="rgba(0, 0, 0, 0.04)" stroke-width="${strokeW - 2}"/>
      ${segs}

      <!-- Center text in SF Pro bold -->
      <text x="${s}" y="${s + 1}" text-anchor="middle" font-size="${size / 5.8}" font-weight="700" 
        letter-spacing="-0.5px" fill="#1D1D1F">${o.kcal.toLocaleString()}</text>
      <text x="${s}" y="${s + size / 6.8}" text-anchor="middle" font-size="${size / 13}" font-weight="500" 
        letter-spacing="-0.2px" fill="#86868B">/ ${o.target.toLocaleString()} kcal</text>
    </svg>
  `;
  return state;
}

/**
 * macOS Sequoia styled sidebar
 */
function sidebar(active) {
  const items = [
    ['acasa', '􀎞', 'Acasă', 'trainer.html'],
    ['calorii', '􀎩', 'Calorii & Mese', 'trainer.html'],
    ['greutate', '􀙪', 'Greutate', '#'],
    ['antrenamente', '􀙯', 'Antrenamente', '#'],
    ['mese', '􀒚', 'Mese Propuse', '#'],
    ['clienti', '􀉪', 'Clienți', '#'],
    ['chat', '􀌤', 'Mesaje', '#']
  ];

  return `
    <div class="brand">
      <div class="logo-icon"></div>
      <span>FitnessCoach</span>
    </div>

    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #86868B; letter-spacing: 0.5px; padding: 0 12px 6px;">
      Meniu Principal
    </div>

    <nav class="nav">
      ${items.map(i => `
        <a href="${i[3]}" class="${i[0] === active ? 'on' : ''}">
          <span class="ic">${getAppleIcon(i[0])}</span>
          ${i[2]}
        </a>
      `).join('')}
    </nav>

    <div class="foot">
      <div class="av" style="background: linear-gradient(135deg, #0071E3, #47A3FF);">AT</div>
      <div style="overflow: hidden;">
        <div style="font-weight: 600; font-size: 13px; color: #1D1D1F;">Alex Teodorescu</div>
        <div style="font-size: 11.5px; color: #86868B; display: flex; align-items: center; gap: 4px;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #34C759; display: inline-block;"></span>
          Antrenor Personal
        </div>
      </div>
    </div>
  `;
}

function getAppleIcon(type) {
  const icons = {
    'acasa': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    'calorii': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`,
    'greutate': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18m-9-6l9 6 9-6M3 9l9-6 9 6"></path></svg>`,
    'antrenamente': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    'mese': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`,
    'clienti': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
    'chat': `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`
  };
  return icons[type] || '•';
}

const AV = {
  'Andrei Popescu': '#0071E3',
  'Andrei': '#0071E3',
  'Paul': '#AF52DE',
  'Denis': '#30B0C7',
  'Angelica': '#FF2D55',
  'Maria': '#FF9500',
  'Șerban': '#34C759'
};

function av(n) {
  const initial = n ? n[0] : 'U';
  const color = AV[n] || '#0071E3';
  return `<div class="av" style="background:${color}">${initial}</div>`;
}

/**
 * Apple Dynamic Island / iOS Banner Notification
 */
function showToast(message) {
  const existing = document.querySelector('.apple-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'apple-toast';
  toast.innerHTML = `
    <span style="font-size: 16px;">⚡</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.4s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px) scale(0.9)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
