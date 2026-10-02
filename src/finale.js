import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/*
  The ending:
  1. At the bottom of the page the camera pulls back: the (soaked) back page is being held by two hands,
     over a wet London street at night, seen from straight above.
  2. Scrolling tears the page down the middle; the halves and the hands fall away.
  3. A hand snaps into frame and points at a manhole cover.
  4. Clicking the cover flips it off towards the camera, the camera dives into the hole, it goes black,
     a bulb flickers on and lights up the website application form.
*/

const INK = '#141414';
const SKIN = '#f6f3ec';
const EMAIL = 'aaryachandra41@gmail.com';

/* ------------------------------------------------------------------ */
/* Artwork                                                             */
/* ------------------------------------------------------------------ */

// Right hand holding the right edge of the page. The page edge is at x = 66 of 240.
// The palm and fingers sit behind the page; the thumb is drawn on a separate layer in front of it.
const HOLD_BACK = `
<svg class="hold hold-back" viewBox="0 0 240 300" aria-hidden="true">
  <path d="M146 232 L188 202 L252 260 L252 312 L176 312 Z" fill="url(#ht-dots)" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M144 230 L190 198" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
  <path d="M66 102 C94 98 120 108 140 130 C160 152 174 178 184 200 L148 228 C130 212 110 196 94 186 C84 180 74 178 66 178 Z" fill="${SKIN}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M66 122 C78 120 90 124 98 132 M66 142 C78 141 90 146 96 154 M66 160 C76 160 86 164 92 170" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  <path d="M128 150 Q140 164 146 182" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;
// The thumb rests on the front of the page, so it lives on a layer above it.
const HOLD_THUMB = `
<svg class="hold hold-thumb" viewBox="0 0 240 300" aria-hidden="true">
  <path d="M104 126 C86 118 64 106 50 100 C38 95 31 106 38 114 C50 126 70 136 92 148 C102 152 112 140 104 126 Z" fill="${SKIN}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M42 104 C39 109 43 115 50 113 C53 109 49 103 42 104 Z" fill="none" stroke="${INK}" stroke-width="1.8"/>
  <path d="M70 112 Q74 120 72 128" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

// Pointing hand, index finger up. Tip at (86, 22), wrist/sleeve at the bottom.
const POINT_HAND = `
<svg viewBox="0 0 200 380" aria-hidden="true">
  <path d="M46 384 L58 268 Q100 254 142 268 L154 384 Z" fill="url(#ht-dots)" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M55 268 Q100 252 145 268 L147 286 Q100 270 53 286 Z" fill="${INK}"/>
  <path d="M60 262 C50 236 52 200 66 186 L136 182 C150 196 152 236 142 262 Z" fill="${SKIN}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M98 186 C98 176 112 174 114 186 M112 188 C113 178 128 178 128 192 M126 194 C128 186 142 188 140 202" fill="${SKIN}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  <path d="M100 206 Q120 200 140 210 M100 224 Q120 218 142 228 M102 242 Q120 238 140 246" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M70 196 C67 150 70 82 74 40 C76 22 96 20 99 40 C103 82 101 150 99 194 Z" fill="${SKIN}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M78 44 C78 31 95 31 95 44 L94 57 C89 59 83 59 79 57 Z" fill="none" stroke="${INK}" stroke-width="2"/>
  <path d="M75 118 Q85 114 96 118 M75 80 Q85 77 96 80" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M62 232 C54 216 60 196 78 194 C96 194 106 206 102 218 C98 228 80 230 62 232 Z" fill="${SKIN}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
</svg>`;

const MANHOLE = `
<svg viewBox="-100 -100 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="mh-metal" cx="32%" cy="28%" r="85%">
      <stop offset="0" stop-color="#62656b"/><stop offset=".5" stop-color="#2e3136"/><stop offset="1" stop-color="#15171a"/>
    </radialGradient>
    <linearGradient id="mh-lamp" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffb060" stop-opacity=".45"/><stop offset=".55" stop-color="#ffb060" stop-opacity="0"/>
    </linearGradient>
    <pattern id="mh-grid" width="11" height="11" patternUnits="userSpaceOnUse" x="-5.5" y="-5.5">
      <rect x="1.5" y="1.5" width="8" height="8" rx="1.6" fill="#3e4248" stroke="#121417" stroke-width="1"/>
    </pattern>
    <path id="mh-top" d="M-64 0 A64 64 0 0 1 64 0"/>
    <path id="mh-bot" d="M-71 0 A71 71 0 0 0 71 0"/>
  </defs>
  <circle r="86" fill="url(#mh-metal)" stroke="#0b0c0e" stroke-width="3"/>
  <circle r="80" fill="none" stroke="#1b1d21" stroke-width="2"/>
  <circle r="53" fill="url(#mh-grid)"/>
  <circle r="53" fill="none" stroke="#121417" stroke-width="3.5"/>
  <circle r="27" fill="#2e3136" stroke="#111316" stroke-width="3"/>
  <text font-family="UnifrakturMaguntia, serif" font-size="25" fill="#a9aeb6" text-anchor="middle" y="9">AC</text>
  <text font-family="Playfair Display, serif" font-weight="900" font-size="11" letter-spacing="3.5" fill="#a3a8b0"><textPath href="#mh-top" startOffset="50%" text-anchor="middle">CITY OF LONDON</textPath></text>
  <text font-family="Playfair Display, serif" font-weight="900" font-size="11" letter-spacing="3.5" fill="#a3a8b0"><textPath href="#mh-bot" startOffset="50%" text-anchor="middle">SEWER · 1897</textPath></text>
  <ellipse cx="-74" cy="0" rx="3" ry="7" fill="#08090a"/><ellipse cx="74" cy="0" rx="3" ry="7" fill="#08090a"/>
  <circle r="86" fill="url(#mh-lamp)"/>
  <g fill="#ffffff" opacity=".35"><ellipse cx="-30" cy="-40" rx="3" ry="1.6"/><ellipse cx="22" cy="-58" rx="2" ry="1.2"/><ellipse cx="-52" cy="18" rx="2.4" ry="1.4"/><ellipse cx="40" cy="30" rx="1.8" ry="1"/></g>
</svg>`;

const BULB = `
<svg viewBox="0 0 80 260" aria-hidden="true">
  <path d="M40 -1000 V150" stroke="#1d1d1d" stroke-width="2.5"/>
  <rect x="31" y="146" width="18" height="24" rx="3" fill="#2a2a2a"/>
  <path d="M33 152 H47 M33 158 H47 M33 164 H47" stroke="#555" stroke-width="1.4"/>
  <path class="bulb-glass" d="M30 170 C14 186 12 214 26 230 C33 238 47 238 54 230 C68 214 66 186 50 170 Z" fill="#fff4d6" stroke="#c9b48a" stroke-width="1.5"/>
  <path d="M35 176 V200 Q40 212 45 200 V176" fill="none" stroke="#c88a2a" stroke-width="1.6"/>
</svg>`;

/** Back page of the paper, shown on both torn halves. */
const BACK_PAGE = `
  <div class="bp-dateline"><span>Late Final</span><span class="bl">Abhay Chandra</span><span>Back Page</span></div>
  <h2 class="bp-head">Something Is Waiting Beneath the Street</h2>
  <p class="bp-dek">Reader advised to keep scrolling and tear this page open. Officials confirm the rain will not stop.</p>
  <div class="bp-cols">
    <p><span class="bl bp-drop">I</span>t started, as these things often do, with a single drop of rain on page one. By the time the reader reached the classifieds, the ink had begun to run and the paper had gone soft at the edges.</p>
    <p>Witnesses describe a manhole cover near the corner, stamped with two initials. Nobody knows who put it there. Nobody knows what is underneath. Some say it is where every good website begins.</p>
    <p>“Just tear it,” said one passer-by, who asked not to be named. “Everyone does eventually.”</p>
  </div>`;

/* ------------------------------------------------------------------ */
/* Street                                                              */
/* ------------------------------------------------------------------ */
function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wet London bricks at night, seen from above, with sodium streetlight and puddles. */
function drawStreet(canvas, hole) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const c = canvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = rng(1897);

  c.fillStyle = '#07080a';
  c.fillRect(0, 0, W, H);

  // stretcher-bond bricks
  const bw = Math.max(54, Math.min(W, 1600) / 20);
  const bh = bw * 0.42;
  const gap = Math.max(2, bw * 0.04);
  for (let row = -1, y = -bh; y < H + bh; row++, y += bh) {
    const off = row % 2 ? -bw / 2 : 0;
    for (let x = off - bw; x < W + bw; x += bw) {
      const l = 12 + r() * 11;
      const h = 6 + r() * 16;
      const s = 18 + r() * 22;
      c.fillStyle = `hsl(${h} ${s}% ${l}%)`;
      c.fillRect(x + gap / 2, y + gap / 2, bw - gap, bh - gap);
      // wet sheen on the upper edge of each brick
      const g = c.createLinearGradient(0, y, 0, y + bh);
      g.addColorStop(0, `rgba(255,255,255,${0.04 + r() * 0.06})`);
      g.addColorStop(0.35, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(x + gap / 2, y + gap / 2, bw - gap, bh - gap);
      if (r() < 0.08) {
        c.fillStyle = `rgba(0,0,0,${0.2 + r() * 0.3})`; // worn, chipped bricks
        c.fillRect(x + gap / 2 + r() * bw * 0.5, y + gap / 2 + r() * bh * 0.4, bw * 0.3, bh * 0.35);
      }
    }
  }

  // faded double yellow lines along the kerb
  const lx = W * 0.07;
  for (let y = 0; y < H; y += 6) {
    c.fillStyle = `rgba(214,170,46,${0.45 + r() * 0.3})`;
    c.fillRect(lx, y, 6, 6.5);
    c.fillRect(lx + 14, y, 6, 6.5);
  }
  // kerb stones
  c.fillStyle = '#1a1b1e';
  c.fillRect(0, 0, lx - 10, H);
  for (let y = 0; y < H; y += bw * 1.4) {
    c.fillStyle = `hsl(220 6% ${12 + r() * 6}%)`;
    c.fillRect(2, y + 3, lx - 16, bw * 1.4 - 6);
  }

  // drain grate by the kerb
  const gx = lx + 30;
  const gy = H * 0.72;
  c.fillStyle = '#0c0d0f';
  c.fillRect(gx, gy, bw * 0.9, bw * 1.3);
  c.fillStyle = '#2b2d31';
  for (let i = 0; i < 7; i++) c.fillRect(gx + 4, gy + 6 + i * (bw * 1.3 - 12) / 7, bw * 0.9 - 8, 3);

  // puddles that reflect the lamp light (kept away from the manhole)
  for (let i = 0; i < 6; i++) {
    let px;
    let py;
    do {
      px = lx + 60 + r() * (W - lx - 120);
      py = r() * H;
    } while (Math.hypot(px - hole.x, py - hole.y) < hole.r * 1.8);
    const rw = 60 + r() * 140;
    const rh = rw * (0.35 + r() * 0.3);
    c.save();
    c.translate(px, py);
    c.rotate((r() - 0.5) * 0.6);
    const pts = Array.from({ length: 9 }, (_, k) => {
      const a = (k / 9) * Math.PI * 2;
      const wob = 0.82 + r() * 0.3;
      return [Math.cos(a) * rw * wob, Math.sin(a) * rh * wob];
    });
    // smooth outline: curve through the midpoints between the wobbly points
    const mid = (k) => {
      const p0 = pts[k % pts.length];
      const p1 = pts[(k + 1) % pts.length];
      return [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    };
    c.beginPath();
    c.moveTo(...mid(0));
    for (let k = 1; k <= pts.length; k++) c.quadraticCurveTo(pts[k % pts.length][0], pts[k % pts.length][1], ...mid(k));
    c.closePath();
    const pg = c.createLinearGradient(-rw, -rh, rw, rh);
    pg.addColorStop(0, 'rgba(255,170,90,0.28)');
    pg.addColorStop(0.4, 'rgba(16,22,36,0.7)');
    pg.addColorStop(1, 'rgba(8,12,22,0.78)');
    c.fillStyle = pg;
    c.filter = 'blur(1.5px)';
    c.fill();
    c.filter = 'none';
    // soft reflected lamp light on the water
    const glint = c.createRadialGradient(-rw * 0.3, -rh * 0.2, 0, -rw * 0.3, -rh * 0.2, rw * 0.5);
    glint.addColorStop(0, 'rgba(255,190,120,0.22)');
    glint.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = glint;
    c.fill();
    c.restore();
  }

  // the manhole frame casts a dark ring onto the bricks
  const ring = c.createRadialGradient(hole.x, hole.y, hole.r * 0.95, hole.x, hole.y, hole.r * 1.45);
  ring.addColorStop(0, 'rgba(0,0,0,0.7)');
  ring.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = ring;
  c.fillRect(0, 0, W, H);

  // sodium streetlamps (off frame) and cold moonlight
  c.globalCompositeOperation = 'screen';
  const lamp = (x, y, rad, a) => {
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(255,168,80,${a})`);
    g.addColorStop(0.5, `rgba(255,140,60,${a * 0.35})`);
    g.addColorStop(1, 'rgba(255,140,60,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  };
  lamp(W * 0.1, H * 0.06, Math.max(W, H) * 0.8, 0.42);
  lamp(W * 0.98, H * 0.95, Math.max(W, H) * 0.55, 0.28);
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = 'rgb(150,165,205)';
  c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over';

  const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.8);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.7)');
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
}

/* ------------------------------------------------------------------ */
/* Tear                                                                */
/* ------------------------------------------------------------------ */
function tearPaths() {
  // a ragged line from the top of the page to the bottom, wandering around the middle
  const pts = [];
  let x = 50;
  for (let y = 0; y < 100; y += 1.6) {
    x = Math.max(46, Math.min(54, x + (Math.random() - 0.5) * 2));
    pts.push([x + (Math.random() - 0.5) * 0.7, y]);
  }
  pts.push([x, 100]);
  const pct = (n) => `${n.toFixed(2)}%`;
  const line = (dx) => pts.map(([px, py]) => `${pct(px + dx)} ${pct(py)}`).join(', ');
  const top = (dx) => `${pct(pts[0][0] + dx)} -50%`;
  const bottom = (dx) => `${pct(pts[pts.length - 1][0] + dx)} 150%`;
  const half = (outer, dx) => `polygon(${outer} -50%, ${top(dx)}, ${line(dx)}, ${bottom(dx)}, ${outer} 150%)`;
  return {
    left: half('-50%', 0),
    leftRim: half('-50%', 0.9),   // pale torn fibres peeking past the edge
    right: half('150%', 0),
    rightRim: half('150%', -0.9),
  };
}

/* ------------------------------------------------------------------ */
/* Finale                                                              */
/* ------------------------------------------------------------------ */
export function createFinale({ root, dive, lenis, rain, reduceMotion = false }) {
  const q = (s, el = root) => el.querySelector(s);
  const cam = q('.street-cam');
  const street = q('.street');
  const mh = q('.manhole');
  const cover = q('.manhole-cover');
  const hole = q('.manhole-hole');
  const hit = q('.manhole-hit');
  const point = q('.point-hand');
  const sheet = q('.sheet');
  const halves = [q('.tear-left'), q('.tear-right')];

  // build the torn page halves
  const tear = tearPaths();
  halves.forEach((half, i) => {
    const side = i ? 'right' : 'left';
    half.innerHTML = `
      ${HOLD_BACK}
      <div class="tear-rim" style="clip-path:${i ? tear.rightRim : tear.leftRim}"></div>
      <div class="tear-face" style="clip-path:${i ? tear.right : tear.left}"><div class="sheet-page">${BACK_PAGE}</div></div>
      ${HOLD_THUMB}`;
    half.classList.add(`is-${side}`);
  });
  cover.innerHTML = MANHOLE;
  point.innerHTML = POINT_HAND;
  q('.bulb', dive).innerHTML = BULB;

  // layout: manhole position, street drawing, pointing hand aim
  const geo = { x: 0, y: 0, r: 0 };
  let pointPose = { x: 0, y: 0, rotate: 0 };
  function layout() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    geo.r = Math.min(W * 0.17, H * 0.2);
    geo.x = W * (W < 700 ? 0.5 : 0.52);
    geo.y = H * 0.44;
    gsap.set(mh, { left: geo.x - geo.r, top: geo.y - geo.r, width: geo.r * 2, height: geo.r * 2 });
    drawStreet(street, geo);

    // hand comes from the bottom right and points at the cover's rim
    const hh = geo.r * 2.5;
    const hw = hh * (200 / 380);
    const ang = (W < 700 ? 70 : 52) * (Math.PI / 180);
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    const reach = geo.r * 1.08 + hh * 0.94;
    const bx = geo.x + ux * reach;
    const by = geo.y + uy * reach;
    gsap.set(point, { width: hw, height: hh, left: bx - hw / 2, top: by - hh, transformOrigin: '50% 100%' });
    pointPose = { x: 0, y: 0, rotate: (Math.atan2(-uy, -ux) * 180) / Math.PI + 90, ux, uy, hh };
    if (snapped) gsap.set(point, { x: 0, y: 0, rotate: pointPose.rotate });
    else gsap.set(point, offPose());
  }
  const offPose = () => ({ x: pointPose.ux * pointPose.hh * 1.2, y: pointPose.uy * pointPose.hh * 1.2, rotate: pointPose.rotate + 28 });
  let snapped = false;
  layout();
  window.addEventListener('resize', () => {
    layout();
  });

  /* ---------- scroll: pull back, tear, fall away ---------- */
  gsap.set(sheet, { scale: 1 });
  gsap.set(root.querySelectorAll('.tear-rim'), { opacity: 0 }); // torn fibres only show once it rips
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root,
      start: 'top top',
      end: () => `+=${window.innerHeight * 3.2}`,
      pin: true,
      scrub: reduceMotion ? true : 0.8,
      anticipatePin: 1,
      onEnter: () => rain.setStains(false),
      onLeaveBack: () => rain.setStains(true),
      onUpdate: (self) => {
        const p = self.progress;
        const inStreet = p > 0.42;
        document.body.classList.toggle('street-mode', inStreet);
        rain.setMode(inStreet ? 'street' : 'paper');
        if (p > 0.86 && !snapped) snapIn();
        if (p < 0.8 && snapped) snapOut();
      },
    },
  });
  tl.to(sheet, { scale: 0.8, duration: 1 })
    .to('.finale-hint', { opacity: 1, duration: 0.3 }, 0.6)
    .to(root.querySelectorAll('.tear-rim'), { opacity: 1, duration: 0.12 }, 1.1)
    .to(halves[0], { rotation: -11, x: '-5vw', duration: 1.4, transformOrigin: '50% 100%' }, 1.1)
    .to(halves[1], { rotation: 11, x: '5vw', duration: 1.4, transformOrigin: '50% 100%' }, 1.1)
    .to('.finale-hint', { opacity: 0, duration: 0.3 }, 1.2)
    .to(halves[0], { x: '-75vw', y: '35vh', rotation: -48, duration: 1.1, ease: 'power1.in' }, 2.5)
    .to(halves[1], { x: '75vw', y: '35vh', rotation: 48, duration: 1.1, ease: 'power1.in' }, 2.5)
    .fromTo(cam, { scale: 1.06 }, { scale: 1, duration: 1.6 }, 2.4)
    .to({}, { duration: 0.8 });

  function snapIn() {
    snapped = true;
    root.classList.add('is-ready');
    gsap.killTweensOf(point);
    gsap.timeline()
      .to(point, { x: 0, y: 0, rotate: pointPose.rotate, duration: reduceMotion ? 0.01 : 0.42, ease: 'back.out(2.2)' })
      .to(point, { x: -pointPose.ux * 10, y: -pointPose.uy * 10, duration: 0.12, yoyo: true, repeat: 3, ease: 'power1.inOut' })
      .to(point, { x: -pointPose.ux * 5, y: -pointPose.uy * 5, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
  function snapOut() {
    snapped = false;
    root.classList.remove('is-ready');
    gsap.killTweensOf(point);
    gsap.to(point, { ...offPose(), duration: 0.35, ease: 'power2.in' });
  }

  /* ---------- manhole → dive → form ---------- */
  const form = q('.apply', dive);
  const status = q('.apply-status', dive);
  let diving = false;

  function splash() {
    for (let i = 0; i < 26; i++) {
      const d = document.createElement('i');
      d.className = 'splash';
      root.appendChild(d);
      const a = Math.random() * Math.PI * 2;
      const r0 = geo.r * 0.95;
      const dist = geo.r * (0.5 + Math.random() * 1.2);
      gsap.set(d, { x: geo.x + Math.cos(a) * r0, y: geo.y + Math.sin(a) * r0, scale: 0.5 + Math.random() });
      gsap.to(d, { x: `+=${Math.cos(a) * dist}`, y: `+=${Math.sin(a) * dist}`, scale: 0, opacity: 0, duration: 0.7 + Math.random() * 0.5, ease: 'power2.out', onComplete: () => d.remove() });
    }
  }

  function openDive() {
    if (diving) return;
    diving = true;
    lenis.stop();
    rain.setPaused(true);
    root.classList.add('is-diving');
    gsap.killTweensOf(point);
    const fast = reduceMotion ? 0.01 : 1;
    gsap.set(cam, { transformOrigin: `${geo.x}px ${geo.y}px` });
    gsap.set(dive, { autoAlpha: 0, display: 'block' });
    gsap.set(dive, { '--lr': '0vmax' });
    gsap.set([form, '.dive-close', '.bulb'], { autoAlpha: 0 });

    const t = gsap.timeline();
    t.call(splash)
      .to(cover, { rotationX: 640, rotationY: 150, scale: 4.2, opacity: 0, duration: 1.0 * fast, ease: 'power2.in', transformPerspective: 700 }, 0)
      .to(point, { x: pointPose.ux * pointPose.hh * 1.4, y: pointPose.uy * pointPose.hh * 1.4, duration: 0.5 * fast, ease: 'power2.in' }, 0.05)
      .to(cam, { scale: 46, duration: 1.05 * fast, ease: 'power4.in' }, 0.38 * fast)
      .to(dive, { autoAlpha: 1, duration: 0.3 * fast }, 1.15 * fast)
      // darkness... then the bulb flickers on
      .fromTo('.bulb', { y: -180, autoAlpha: 1 }, { y: 0, duration: 0.9 * fast, ease: 'bounce.out' }, 1.9 * fast)
      .set(dive, { '--lr': '6vmax' }, 2.9 * fast)
      .set(dive, { '--lr': '0vmax' }, 3.0 * fast)
      .set(dive, { '--lr': '24vmax' }, 3.12 * fast)
      .set(dive, { '--lr': '4vmax' }, 3.2 * fast)
      .to(dive, { '--lr': '78vmax', duration: 0.9 * fast, ease: 'power2.out' }, 3.32 * fast)
      .add(() => dive.classList.add('is-lit'), 2.9 * fast)
      .fromTo(form, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 * fast, ease: 'expo.out' }, 3.3 * fast)
      .to('.dive-close', { autoAlpha: 1, duration: 0.5 }, 3.8 * fast)
      .call(() => {
        dive.setAttribute('aria-hidden', 'false');
        q('input', form)?.focus({ preventScroll: true });
      });
  }

  function closeDive() {
    if (!diving) return;
    dive.setAttribute('aria-hidden', 'true');
    gsap.timeline({
      onComplete: () => {
        diving = false;
        dive.classList.remove('is-lit');
        root.classList.remove('is-diving');
        gsap.set(dive, { display: 'none' });
        lenis.start();
        rain.setPaused(false);
        if (snapped) snapIn();
      },
    })
      .to(dive, { autoAlpha: 0, duration: 0.4 })
      .to(cam, { scale: 1, duration: 0.9, ease: 'power3.out' }, 0.2)
      .set(cover, { rotationX: 0, rotationY: 0, scale: 1.6, opacity: 0 }, 0.2)
      .to(cover, { scale: 1, opacity: 1, duration: 0.7, ease: 'bounce.out' }, 0.7);
  }

  hit.addEventListener('click', openDive);
  q('.dive-close', dive).addEventListener('click', closeDive);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && diving) closeDive();
  });

  // the application goes out through the visitor's own email app (no server needed)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const subject = `Website application from ${data.name}${data.company ? ` (${data.company})` : ''}`;
    const body = [
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Company / brand: ${data.company || '-'}`,
      `What they need: ${data.type}`,
      `Budget: ${data.budget}`,
      `Timeline: ${data.timeline}`,
      '',
      'About the project:',
      data.details,
    ].join('\n');
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = 'Your email app should open with the application filled in. Hit send and it goes straight up the pipe to Abhay.';
    gsap.fromTo(status, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5 });
  });

  // hovering the cover lifts it a touch
  hit.addEventListener('pointerenter', () => !diving && gsap.to(cover, { scale: 1.04, rotate: 4, duration: 0.4, ease: 'power2.out' }));
  hit.addEventListener('pointerleave', () => !diving && gsap.to(cover, { scale: 1, rotate: 0, duration: 0.5, ease: 'power2.out' }));

  ScrollTrigger.refresh();
  return { layout };
}
