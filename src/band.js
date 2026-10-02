import gsap from 'gsap';
import { BPM } from './audio.js';

/*
  2D band: five flat cassette tapes (the only colour on the page, along with the violin)
  with ink-drawn people standing or sitting on them. Everything is inline SVG animated with GSAP.

  Drawing space for each tape: viewBox "0 40 240 360". The cassette fills the bottom
  (y 272-398); people stand on its top edge (y 272) or sit on it with their legs hanging down.
  Arms and legs are two-segment limbs posed with simple inverse kinematics, so hands and feet
  can be placed where they should be (on a violin, in a pocket, on the tape) and the elbows
  and knees bend naturally.
*/

const TAPES = [
  { color: '#3fb6ff', dark: '#1f86c7', stripes: ['#ff4f8b', '#ffd23f', '#8a5cff'], title: 'Sunday Grooves', side: 'B', pose: 'listen', hair: 'crop', top: 'dots', pants: 'lines', headphones: true },
  { color: '#ffc53a', dark: '#d69a12', stripes: ['#ff4f8b', '#3fb6ff', '#22d39b'], title: 'Coffee & Chords', side: 'A', pose: 'dance', hair: 'bun', top: 'lines', pants: 'ink' },
  { color: '#ff4f8b', dark: '#c42d63', stripes: ['#ffd23f', '#3fb6ff', '#22d39b'], title: 'Late Night Strings', side: 'A', pose: 'violin', hair: 'long', top: 'jacket', pants: 'ink' },
  { color: '#8a5cff', dark: '#6338d6', stripes: ['#ffd23f', '#ff4f8b', '#3fb6ff'], title: 'Slow Burn', side: 'B', pose: 'pockets', hair: 'cap', top: 'tee', pants: 'dense' },
  { color: '#22d39b', dark: '#14a476', stripes: ['#ff4f8b', '#ffd23f', '#8a5cff'], title: 'Encore', side: 'A', pose: 'wave', hair: 'afro', top: 'dense', pants: 'ink' },
];

// [x%, y%, depth] of each tape's centre inside the stage
const LAYOUT_WIDE = [[12, 55, 0.9], [31, 50, 1.05], [50, 53, 1.2], [69, 50, 1], [88, 55, 0.9]];
const LAYOUT_TALL = [[27, 16, 0.95], [73, 26, 1], [27, 50, 1.2], [73, 60, 1], [50, 84, 0.95]];

// Body proportions (roughly 7.5 heads tall when standing)
const INK = '#141414';
const SKIN = '#f6f3ec';
const HEAD_RX = 12;
const HEAD_RY = 14.5;
const NECK = 7;
const TORSO = 68;   // pelvis to shoulder line
const SH = 18;      // half shoulder width
const HIP = 8.5;    // half hip width
const UA = 40;      // upper arm
const FA = 37;      // forearm
const TH = 54;      // thigh (standing)
const SN = 50;      // shin (standing)
const TH_SIT = 12;  // thigh seen end-on when sitting (it points at the viewer)
const SN_SIT = 31;
const CX = 120;

const PAINT = {
  ink: INK,
  paper: SKIN,
  dots: 'url(#ht-dots)',
  lines: 'url(#ht-lines)',
  dense: 'url(#ht-dense)',
};
const TOPS = {
  jacket: { body: INK, sleeve: INK, fore: INK },
  tee: { body: SKIN, sleeve: SKIN, fore: SKIN },
  dots: { body: PAINT.dots, sleeve: PAINT.dots, fore: PAINT.dots },
  lines: { body: PAINT.lines, sleeve: PAINT.lines, fore: SKIN },
  dense: { body: PAINT.dense, sleeve: PAINT.dense, fore: PAINT.dense },
};

const DEG = Math.PI / 180;
const rot = (x, y, deg) => {
  const r = deg * DEG;
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
};

/** Two-bone IK. Limbs are drawn pointing down; returns [joint-1 rotation, joint-2 rotation] in degrees. */
function ik(sx, sy, tx, ty, l1, l2, bend) {
  const dx = tx - sx;
  const dy = ty - sy;
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.3);
  const phi = Math.atan2(dy, dx);
  const a = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const psi = phi + bend * a;
  const ex = sx + l1 * Math.cos(psi);
  const ey = sy + l1 * Math.sin(psi);
  const chi = Math.atan2(ty - ey, tx - ex);
  return [psi / DEG - 90, (chi - psi) / DEG];
}

/* ------------------------------------------------------------------ */
/* SVG markup                                                          */
/* ------------------------------------------------------------------ */

/** A limb segment: ink outline pass, then the fill pass, both drawn as round-capped strokes. */
const seg = (len, w, paint) =>
  `<path d="M0 0 V${len}" stroke="${INK}" stroke-width="${w + 3.4}" stroke-linecap="round"/>` +
  `<path d="M0 0 V${len}" stroke="${paint}" stroke-width="${w}" stroke-linecap="round"/>`;

function cassetteSVG(t, i) {
  const teeth = (cx, cy) =>
    Array.from({ length: 6 }, (_, k) => `<rect x="${cx - 1.6}" y="${cy - 8.5}" width="3.2" height="4" rx="1" fill="#2a2118" transform="rotate(${k * 60} ${cx} ${cy})"/>`).join('');
  return `
  <g class="cassette" transform="translate(0 150)">
    <rect x="10" y="122" width="220" height="126" rx="12" fill="${t.color}" stroke="${INK}" stroke-width="2.6"/>
    <rect x="16" y="128" width="208" height="114" rx="8" fill="none" stroke="${t.dark}" stroke-width="2" opacity=".6"/>
    <rect x="24" y="132" width="192" height="84" rx="6" fill="#fbf6ea" stroke="${INK}" stroke-width="2"/>
    <circle cx="40" cy="146" r="10" fill="${t.color}" stroke="${INK}" stroke-width="1.6"/>
    <text class="label-side" x="40" y="151.5" text-anchor="middle">${t.side}</text>
    <text class="label-text" x="206" y="148" text-anchor="end" style="font-size:9px">VOL.0${i + 1}</text>
    <text class="label-text" x="120" y="175" text-anchor="middle">${t.title}</text>
    <rect x="24" y="179" width="192" height="3" fill="${t.stripes[0]}"/>
    <rect x="24" y="183" width="192" height="3" fill="${t.stripes[1]}"/>
    <rect x="24" y="187" width="192" height="3" fill="${t.stripes[2]}"/>
    <rect x="66" y="192" width="108" height="22" rx="11" fill="#1d1712" stroke="${INK}" stroke-width="2"/>
    <circle class="spool spool-l" cx="88" cy="203" r="12" fill="#5a3a26"/>
    <circle class="spool spool-r" cx="152" cy="203" r="10" fill="#5a3a26"/>
    <rect x="104" y="196" width="32" height="14" rx="3" fill="#ffffff" opacity=".12"/>
    <g class="reel reel-l"><circle cx="88" cy="203" r="8.5" fill="#fbf6ea" stroke="${INK}" stroke-width="1.6"/>${teeth(88, 203)}</g>
    <g class="reel reel-r"><circle cx="152" cy="203" r="8.5" fill="#fbf6ea" stroke="${INK}" stroke-width="1.6"/>${teeth(152, 203)}</g>
    <path d="M62 248 L74 222 L166 222 L178 248" fill="${t.dark}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <circle cx="96" cy="236" r="3.4" fill="${INK}"/><circle cx="144" cy="236" r="3.4" fill="${INK}"/>
    <circle cx="112" cy="240" r="2.2" fill="${INK}"/><circle cx="128" cy="240" r="2.2" fill="${INK}"/>
    ${[[20, 132], [220, 132], [20, 238], [220, 238]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#e9e2d2" stroke="${INK}" stroke-width="1.2"/><path d="M${x - 2} ${y} H${x + 2}" stroke="${INK}" stroke-width="1"/>`).join('')}
  </g>`;
}

/** Head drawn around the neck base (0,0); the head centre sits at hc. */
function headSVG(t) {
  const hc = -NECK - HEAD_RY + 3;
  const back = {
    long: `<path d="M-13.5 ${hc - 4} C-15.5 ${hc + 10} -15.5 ${hc + 22} -17 ${hc + 32} L17 ${hc + 32} C15.5 ${hc + 22} 15.5 ${hc + 10} 13.5 ${hc - 4} Z" fill="${INK}"/>`,
    afro: Array.from({ length: 11 }, (_, k) => {
      const a = (150 + k * 24) * DEG;
      return `<circle cx="${(Math.cos(a) * 14).toFixed(1)}" cy="${(hc - 5 + Math.sin(a) * 13).toFixed(1)}" r="8.5" fill="${INK}"/>`;
    }).join('') + `<circle cx="0" cy="${hc - 9}" r="13" fill="${INK}"/>`,
  }[t.hair] || '';

  const front = {
    crop: `<path d="M-12.6 ${hc - 1} C-13.6 ${hc - 18} 13.6 ${hc - 18} 12.6 ${hc - 1} C11 ${hc - 8.5} 6 ${hc - 10.5} 0 ${hc - 10.5} C-6 ${hc - 10.5} -11 ${hc - 8.5} -12.6 ${hc - 1} Z" fill="${INK}"/>`,
    long: `<path d="M-13 ${hc + 5} C-15.5 ${hc - 17} 15.5 ${hc - 17} 13 ${hc + 5} C11.5 ${hc - 6} 5 ${hc - 9.5} -2 ${hc - 9.5} C-7 ${hc - 8.5} -11.5 ${hc - 4} -13 ${hc + 5} Z" fill="${INK}"/>`,
    bun: `<circle cx="0" cy="${hc - 18}" r="6.5" fill="${INK}"/><path d="M-12.6 ${hc - 1} C-13.6 ${hc - 18} 13.6 ${hc - 18} 12.6 ${hc - 1} C10 ${hc - 9} 4 ${hc - 11} 0 ${hc - 10} C-4 ${hc - 11} -10 ${hc - 9} -12.6 ${hc - 1} Z" fill="${INK}"/>`,
    cap: `<path d="M-13 ${hc - 3} C-13 ${hc - 20} 13 ${hc - 20} 13 ${hc - 3} Z" fill="${INK}"/><path d="M-13.5 ${hc - 3.5} Q0 ${hc + 0.5} 18 ${hc - 4.5} Q3 ${hc - 7} -13.5 ${hc - 5.5} Z" fill="${INK}"/><circle cx="0" cy="${hc - 16}" r="1.8" fill="${SKIN}"/>`,
    afro: `<path d="M-12 ${hc - 3} C-10 ${hc - 9} 10 ${hc - 9} 12 ${hc - 3} C11 ${hc - 13} -11 ${hc - 13} -12 ${hc - 3} Z" fill="${INK}"/>`,
  }[t.hair] || '';

  const phones = t.headphones
    ? `<path d="M-14.5 ${hc - 1} C-16 ${hc - 23} 16 ${hc - 23} 14.5 ${hc - 1}" fill="none" stroke="${INK}" stroke-width="3.6"/><rect x="-18" y="${hc - 5}" width="7.5" height="13" rx="3" fill="${INK}"/><rect x="10.5" y="${hc - 5}" width="7.5" height="13" rx="3" fill="${INK}"/>`
    : '';

  return `
    ${back}
    <rect x="-4.6" y="${-NECK - 4}" width="9.2" height="${NECK + 7}" fill="${SKIN}" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="-12" cy="${hc + 1}" rx="2.6" ry="4" fill="${SKIN}" stroke="${INK}" stroke-width="1.8"/>
    <ellipse cx="12" cy="${hc + 1}" rx="2.6" ry="4" fill="${SKIN}" stroke="${INK}" stroke-width="1.8"/>
    <ellipse cx="0" cy="${hc}" rx="${HEAD_RX}" ry="${HEAD_RY}" fill="${SKIN}" stroke="${INK}" stroke-width="2.2"/>
    <g class="eyes" style="transform-box: fill-box; transform-origin: center"><ellipse cx="-4.4" cy="${hc + 0.5}" rx="1.4" ry="1.8" fill="${INK}"/><ellipse cx="4.4" cy="${hc + 0.5}" rx="1.4" ry="1.8" fill="${INK}"/></g>
    <path d="M-7.2 ${hc - 3.6} Q-4.6 ${hc - 5.4} -2 ${hc - 4}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M7.2 ${hc - 3.6} Q4.6 ${hc - 5.4} 2 ${hc - 4}" fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M0.6 ${hc + 1.5} L-1.3 ${hc + 6} L1.3 ${hc + 6.4}" fill="none" stroke="${INK}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-3.6 ${hc + 9.6} Q0 ${hc + 11.8} 3.6 ${hc + 9.6}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linecap="round"/>
    ${front}
    ${phones}`;
}

function torsoSVG(t) {
  const top = TOPS[t.top];
  const body = `M${-SH} ${-TORSO + 5} Q0 ${-TORSO - 3} ${SH} ${-TORSO + 5} L${SH - 3} ${-TORSO + 32} Q${SH - 5} -14 ${HIP + 5} 2 L${-HIP - 5} 2 Q${-SH + 5} -14 ${-SH + 3} ${-TORSO + 32} Z`;
  const details = {
    jacket: `<path d="M-6 ${-TORSO + 1} L0 ${-TORSO + 20} L6 ${-TORSO + 1} Z" fill="${SKIN}" stroke="${INK}" stroke-width="1.6"/><path d="M-1.5 ${-TORSO + 6} L0 ${-TORSO + 20} L1.5 ${-TORSO + 6} Z" fill="${INK}"/><path d="M-6 ${-TORSO + 1} L-10 ${-TORSO + 26} M6 ${-TORSO + 1} L10 ${-TORSO + 26}" stroke="${SKIN}" stroke-width="1.2"/><circle cx="0" cy="${-TORSO + 32}" r="1.6" fill="${SKIN}"/>`,
    tee: `<path d="M-6 ${-TORSO + 1} Q0 ${-TORSO + 8} 6 ${-TORSO + 1}" fill="none" stroke="${INK}" stroke-width="1.8"/>`,
    dots: `<path d="M-7 ${-TORSO + 1} Q0 ${-TORSO + 10} 7 ${-TORSO + 1}" fill="${SKIN}" stroke="${INK}" stroke-width="1.8"/><path d="M-3 ${-TORSO + 7} V${-TORSO + 24} M3 ${-TORSO + 7} V${-TORSO + 24}" stroke="${INK}" stroke-width="1.4"/><path d="M-11 -16 H11 V-4 H-11 Z" fill="none" stroke="${INK}" stroke-width="1.4"/>`,
    lines: `<path d="M-6 ${-TORSO + 1} Q0 ${-TORSO + 8} 6 ${-TORSO + 1}" fill="${SKIN}" stroke="${INK}" stroke-width="1.8"/>`,
    dense: `<path d="M-6.5 ${-TORSO + 1} Q0 ${-TORSO + 7} 6.5 ${-TORSO + 1}" fill="${SKIN}" stroke="${INK}" stroke-width="2"/>`,
  }[t.top];
  return `
    <path d="${body}" fill="${top.body}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    ${details}
    <path d="M${-HIP - 5.5} -6 L${HIP + 5.5} -6 L${HIP + 7} 8 L${-HIP - 7} 8 Z" fill="${PAINT[t.pants]}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M${-HIP - 5.5} -6 L${HIP + 5.5} -6" stroke="${INK}" stroke-width="3"/>`;
}

function armSVG(cls, t, extra = '') {
  const top = TOPS[t.top];
  return `
  <g class="${cls}">
    ${seg(UA, 9.5, top.sleeve)}
    <g class="fore">
      ${seg(FA, 7.6, top.fore)}
      <ellipse class="hand" cx="0" cy="${FA + 4}" rx="4.4" ry="5.6" fill="${SKIN}" stroke="${INK}" stroke-width="1.8"/>
      ${extra}
    </g>
  </g>`;
}

function legSVG(side, t, sitting) {
  const th = sitting ? TH_SIT : TH;
  const sn = sitting ? SN_SIT : SN;
  const paint = PAINT[t.pants];
  const out = side === 'l' ? -1 : 1; // toes point slightly outward
  const shoe = sitting
    ? `<ellipse cx="0" cy="${sn + 4}" rx="6.5" ry="5.5" fill="${INK}"/>`
    : `<path d="M${-5 * out} ${sn - 2} Q${16 * out} ${sn} ${14 * out} ${sn + 6} L${-4 * out} ${sn + 6} Q${-5 * out} ${sn} ${5 * out} ${sn - 2} Z" fill="${INK}"/>`;
  return `
  <g class="leg leg-${side}">
    ${seg(th, sitting ? 15 : 13, paint)}
    <g class="shin">
      ${seg(sn, 10.5, paint)}
      ${shoe}
    </g>
  </g>`;
}

const VIOLIN = `
  <g class="violin">
    <path d="M0 0 C0 -12 14 -13 16 -7 C18 -6 20 -6 22 -7 C24 -11 36 -11 36 0 C36 11 24 11 22 7 C20 6 18 6 16 7 C14 13 0 12 0 0 Z" fill="#b5541c" stroke="#4a1c06" stroke-width="1.6"/>
    <ellipse cx="11" cy="-3" rx="7" ry="3" fill="#e08a3c" opacity=".55"/>
    <path d="M36 -2 H58 V2 H36 Z" fill="#8a3a10"/>
    <path d="M20 -2.2 H60 V2.2 H20 Z" fill="${INK}"/>
    <circle cx="63" cy="0" r="3.6" fill="#8a3a10" stroke="#4a1c06" stroke-width="1.2"/>
    <path d="M57 -3.5 V-6 M60 -3.5 V-6 M57 3.5 V6 M60 3.5 V6" stroke="#4a1c06" stroke-width="1.6"/>
    <path d="M10 -7 q2.5 3 0 6 M10 7 q2.5 -3 0 -6" fill="none" stroke="#3a1404" stroke-width="1.1"/>
    <path d="M6 -1.6 H60 M6 -0.5 H60 M6 0.5 H60 M6 1.6 H60" stroke="#f2e6c9" stroke-width=".45"/>
    <path d="M16 -5 V5" stroke="#efd9a8" stroke-width="1.6"/>
    <ellipse cx="3" cy="0" rx="3" ry="5" fill="${INK}"/>
  </g>`;
const BOW = `
  <g class="bow">
    <path d="M0 0 L80 0" stroke="#5a2208" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M6 3.2 L78 1.2" stroke="#f2e6c9" stroke-width="1.4"/>
    <rect x="-1" y="-2" width="9" height="6.5" rx="1.5" fill="${INK}"/>
  </g>`;
const PHONE = `<g class="phone"><rect x="-4.5" y="${FA + 1}" width="9" height="15" rx="1.8" fill="${INK}"/><rect x="-3" y="${FA + 3}" width="6" height="10" fill="${SKIN}"/></g>`;

function personSVG(t) {
  const sitting = t.pose === 'listen' || t.pose === 'wave';
  return `
  <g class="person">
    ${legSVG('l', t, sitting)}
    ${legSVG('r', t, sitting)}
    <g class="torso">${torsoSVG(t)}</g>
    <g class="head">${headSVG(t)}</g>
    ${t.pose === 'violin' ? VIOLIN : ''}
    ${armSVG('arm arm-l', t)}
    ${armSVG('arm arm-r', t, t.pose === 'wave' ? PHONE : '')}
    ${t.pose === 'violin' ? BOW : ''}
  </g>`;
}

const tapeSVG = (t, i) => `<svg viewBox="0 40 240 360" aria-hidden="true">${cassetteSVG(t, i)}${personSVG(t)}</svg>`;

/* ------------------------------------------------------------------ */
/* Poses: where the pelvis, torso, head, hands and feet go each frame  */
/* ------------------------------------------------------------------ */
function pose(type, ph, e, time, seed) {
  const s = Math.sin;
  switch (type) {
    case 'violin': {
      // slow sway, head leaning into the violin, long bow strokes
      return {
        sitting: false, px: CX + 2 * s(ph * 0.25), py: 162 + 1.5 * Math.abs(s(ph * 0.25)),
        torso: 3 * s(ph * 0.25) * e, head: 13 + 2 * s(ph * 0.25),
        feet: [[CX - 11, 266], [CX + 12, 266]],
        bow: 0.5 + 0.5 * s(ph * 0.5),
        eyesClosed: true,
      };
    }
    case 'dance': {
      const px = CX + 6 * s(ph) * e;
      const py = 162 + 5 * Math.abs(s(ph)) * e;
      return {
        sitting: false, px, py, torso: -5 * s(ph) * e, head: 7 * s(ph) * e,
        feet: [[CX - 13, 266], [CX + 13, 266]],
        hands: [[px - 25 + 6 * s(ph), py + 2 - 12 * Math.max(0, s(ph)) * e], [px + 25 + 6 * s(ph), py + 2 - 12 * Math.max(0, -s(ph)) * e]],
      };
    }
    case 'pockets': { // relaxed, hands on hips, tapping a foot
      const px = CX + 1.5 * s(ph * 0.5);
      const tap = Math.max(0, s(ph)) * e;
      return {
        sitting: false, px, py: 162, torso: 1.5 * s(ph * 0.5), head: 4 * s(ph * 0.5),
        nod: Math.pow(Math.abs(s(ph * 0.5)), 2) * 3 * e,
        feet: [[CX - 12, 266], [CX + 14, 266 - tap * 5]],
        hands: [[px - 16, 160], [px + 16, 160]], handScale: 0.55,
      };
    }
    case 'listen': {
      const nod = Math.pow(Math.abs(s(ph * 0.5)), 2.2);
      const swing = (k) => s(time * 2.4 + seed + k);
      return {
        sitting: true, px: CX, py: 266, torso: -2 + 2 * s(ph * 0.25), head: 3 * s(ph * 0.5), nod: nod * 5 * e,
        feet: [[CX - 12 + 3 * swing(0), 306 - 4 * Math.max(0, swing(0))], [CX + 12 + 3 * swing(2), 306 - 4 * Math.max(0, swing(2))]],
        hands: [[CX - 34, 272], [CX + 34, 272]],
      };
    }
    default: { // wave: sitting, phone light up like at a concert
      const sway = s(ph * 0.25);
      return {
        sitting: true, px: CX, py: 266, torso: 5 * sway * e, head: -4 * sway,
        feet: [[CX - 12 + 3 * s(time * 2 + seed), 306], [CX + 12 + 3 * s(time * 2 + seed + 1.7), 306]],
        hands: [[CX - 34, 272], [CX + 32 + 14 * sway, 130 + 4 * Math.cos(ph * 0.25)]],
        bendR: 1, // raised arm: elbow points outward, away from the face
      };
    }
  }
}

/* ------------------------------------------------------------------ */
/* Band                                                                */
/* ------------------------------------------------------------------ */
export function createBand(stage, { getBeat, isPlaying, reduceMotion = false }) {
  const tapes = TAPES.map((t, i) => {
    const el = document.createElement('div');
    el.className = 'tape';
    el.dataset.cursor = 'Spin';
    el.innerHTML = `<div class="tape-inner">${tapeSVG(t, i)}<div class="tape-shadow"></div></div>`;
    stage.appendChild(el);
    const q = (s) => el.querySelector(s);
    const tape = {
      t, el, inner: q('.tape-inner'), shadow: q('.tape-shadow'),
      reelL: q('.reel-l'), reelR: q('.reel-r'), spoolL: q('.spool-l'), spoolR: q('.spool-r'),
      torso: q('.torso'), head: q('.head'), eyes: q('.eyes'),
      legL: q('.leg-l'), shinL: q('.leg-l .shin'), legR: q('.leg-r'), shinR: q('.leg-r .shin'),
      armL: q('.arm-l'), foreL: q('.arm-l .fore'), armR: q('.arm-r'), foreR: q('.arm-r .fore'),
      handL: q('.arm-l .hand'), handR: q('.arm-r .hand'),
      violin: q('.violin'), bow: q('.bow'),
      seed: i * 1.7, base: { x: 0, y: 0, depth: 1 }, intro: { y: 0, s: 1, r: 0 }, hover: 0, hoverTo: 0, spin: { r: 0, hop: 0 },
      reelAngle: 0, blink: 0, nextBlink: 1 + Math.random() * 3,
    };
    el.addEventListener('pointerenter', () => (tape.hoverTo = 1));
    el.addEventListener('pointerleave', () => (tape.hoverTo = 0));
    el.addEventListener('click', () => spinTape(tape));
    return tape;
  });

  let tall = false;
  function layout() {
    const r = stage.getBoundingClientRect();
    tall = r.height > r.width * 0.95;
    const L = tall ? LAYOUT_TALL : LAYOUT_WIDE;
    // each tape drawing is 1.5x as tall as it is wide
    const w = tall ? Math.min(r.width * 0.44, r.height * 0.21, 230) : Math.min(r.width * 0.185, r.height * 0.6, 240);
    tapes.forEach((tp, i) => {
      const [px, py, depth] = L[i];
      tp.base = { x: (px / 100) * r.width, y: (py / 100) * r.height, depth };
      tp.el.style.setProperty('--w', `${w * (0.9 + depth * 0.1)}px`);
      tp.el.style.zIndex = String(Math.round(depth * 10));
    });
  }
  layout();
  window.addEventListener('resize', layout);

  /* ---------- interaction ---------- */
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
  });

  function spinTape(tp) {
    gsap.to(tp.spin, { r: tp.spin.r + 360, duration: 1.1, ease: 'power3.inOut' });
    gsap.timeline()
      .to(tp.spin, { hop: -46, duration: 0.32, ease: 'power2.out' })
      .to(tp.spin, { hop: 0, duration: 0.8, ease: 'bounce.out' });
    for (let k = 0; k < 9; k++) setTimeout(() => note(tp, true), k * 50);
  }

  const GLYPHS = ['♪', '♫', '♬', '♩'];
  function note(tp, burst = false) {
    const head = tp.head.getBoundingClientRect();
    const st = stage.getBoundingClientRect();
    if (!head.width) return;
    const n = document.createElement('span');
    n.className = 'note';
    n.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
    stage.appendChild(n);
    const x = head.left - st.left + head.width / 2;
    const y = head.top - st.top - 10;
    const size = gsap.utils.random(0.7, 1.3) * (tall ? 0.8 : 1);
    gsap.set(n, { x, y, scale: size, opacity: 0, rotate: gsap.utils.random(-20, 20) });
    const life = gsap.utils.random(1.8, 2.8);
    gsap.timeline({ onComplete: () => n.remove() })
      .to(n, { opacity: 1, duration: 0.25 }, 0)
      .to(n, { y: y - gsap.utils.random(burst ? 120 : 70, burst ? 200 : 130), duration: life, ease: 'sine.out' }, 0)
      .to(n, { x: x + gsap.utils.random(burst ? -90 : -30, burst ? 90 : 30), rotate: gsap.utils.random(-40, 40), duration: life, ease: 'sine.inOut' }, 0)
      .to(n, { opacity: 0, duration: 0.6 }, life - 0.6);
  }

  /* ---------- reveal (called after the intro) ---------- */
  tapes.forEach((tp, i) => Object.assign(tp.intro, { y: -window.innerHeight * 0.7, s: 0.6, r: i % 2 ? 25 : -25 }));
  let live = false;
  function reveal() {
    live = true;
    if (reduceMotion) {
      tapes.forEach((tp) => Object.assign(tp.intro, { y: 0, s: 1, r: 0 }));
      return;
    }
    tapes.forEach((tp, i) => {
      gsap.to(tp.intro, { y: 0, s: 1, r: 0, duration: 1.6, delay: 0.15 + i * 0.11, ease: 'elastic.out(1, 0.6)' });
    });
  }

  let scrollY = 0;
  const setScroll = (y) => (scrollY = y);

  /* ---------- per-frame animation ---------- */
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(stage);

  let energy = 0.3;
  let noteTimer = 0;
  let last = performance.now();
  const set = (el, v) => el && el.setAttribute('transform', v);
  const f = (n) => n.toFixed(2);

  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!visible) return;

    const time = now / 1000;
    const beat = getBeat() ?? time * (BPM / 60);
    energy += ((isPlaying() ? 1 : 0.3) - energy) * 0.04;
    const motion = reduceMotion ? 0.2 : 1;
    mouse.sx += (mouse.x - mouse.sx) * 0.06;
    mouse.sy += (mouse.y - mouse.sy) * 0.06;

    tapes.forEach((tp, i) => {
      const ph = (beat + i * 0.07) * Math.PI * 2;
      const e = (0.35 + energy) * motion;
      tp.hover += (tp.hoverTo - tp.hover) * 0.15;

      // float + parallax
      const bob = Math.sin(time * 1.1 + tp.seed) * 8 * motion;
      const px = mouse.sx * 26 * tp.base.depth * motion;
      const py = mouse.sy * 16 * tp.base.depth * motion - scrollY * 0.12 * tp.base.depth * motion;
      gsap.set(tp.el, { x: tp.base.x + px, y: tp.base.y + py + bob + tp.intro.y, xPercent: -50, yPercent: -50 });
      gsap.set(tp.inner, {
        rotation: Math.sin(time * 0.8 + tp.seed) * 2.5 * motion + tp.intro.r + tp.spin.r - tp.hover * 4,
        y: tp.spin.hop - tp.hover * 10,
        scale: tp.intro.s * (1 + tp.hover * 0.06),
      });
      gsap.set(tp.shadow, { scaleX: 1 - bob / 60, opacity: 0.8 - tp.hover * 0.3 });

      // reels: one side winds onto the other
      tp.reelAngle += dt * (90 + energy * 200 + tp.hover * 260);
      set(tp.reelL, `rotate(${f(-tp.reelAngle)} 88 203)`);
      set(tp.reelR, `rotate(${f(-tp.reelAngle)} 152 203)`);
      const prog = (Math.sin(time * 0.12 + tp.seed) + 1) / 2;
      tp.spoolL.setAttribute('r', f(9.5 + prog * 4));
      tp.spoolR.setAttribute('r', f(13.5 - prog * 4));

      // body
      const P = pose(tp.t.pose, ph, e, time, tp.seed);
      set(tp.torso, `translate(${f(P.px)} ${f(P.py)}) rotate(${f(P.torso)})`);
      const [nx, ny] = rot(0, -TORSO - 1, P.torso);
      const neck = [P.px + nx, P.py + ny + (P.nod || 0)];
      set(tp.head, `translate(${f(neck[0])} ${f(neck[1])}) rotate(${f(P.torso + P.head)})`);

      // blinking (eyes stay closed while playing the violin)
      tp.nextBlink -= dt;
      if (tp.nextBlink <= 0) {
        tp.blink = 0.14;
        tp.nextBlink = 2 + Math.random() * 4;
      }
      tp.blink = Math.max(0, tp.blink - dt);
      const eyeY = P.eyesClosed ? 0.25 : tp.blink > 0 ? 0.15 : 1;
      if (tp.eyes) tp.eyes.style.transform = `scaleY(${eyeY})`;

      // legs
      const th = P.sitting ? TH_SIT : TH;
      const sn = P.sitting ? SN_SIT : SN;
      [[tp.legL, tp.shinL, -1, P.feet[0], 1], [tp.legR, tp.shinR, 1, P.feet[1], -1]].forEach(([leg, shin, side, foot, bend]) => {
        const hx = P.px + side * HIP;
        const hy = P.py + 2;
        const [a1, a2] = ik(hx, hy, foot[0], foot[1], th, sn, bend);
        set(leg, `translate(${f(hx)} ${f(hy)}) rotate(${f(a1)})`);
        set(shin, `translate(0 ${th}) rotate(${f(a2)})`);
      });

      // arms
      let hands = P.hands;
      if (tp.t.pose === 'violin') {
        // violin tucked under the chin, pointing down and out; the bow crosses the strings
        const vAng = 24 + P.torso;
        const [ox, oy] = rot(8, 11, P.torso + P.head * 0.4);
        const vx = neck[0] + ox;
        const vy = neck[1] + oy;
        set(tp.violin, `translate(${f(vx)} ${f(vy)}) rotate(${f(vAng)})`);
        const [nkx, nky] = rot(50, 2.5, vAng);
        const [cxv, cyv] = rot(20, 0, vAng);
        const bAng = vAng - 74;
        const along = 16 + 30 * P.bow;
        const bx = vx + cxv - Math.cos(bAng * DEG) * along;
        const by = vy + cyv - Math.sin(bAng * DEG) * along;
        set(tp.bow, `translate(${f(bx - Math.cos(bAng * DEG) * 4)} ${f(by - Math.sin(bAng * DEG) * 4)}) rotate(${f(bAng)})`);
        hands = [[bx, by], [vx + nkx, vy + nky]];
      }
      const hs = P.handScale || 1;
      tp.handL?.setAttribute('ry', f(5.6 * hs));
      tp.handR?.setAttribute('ry', f(5.6 * hs));
      [[tp.armL, tp.foreL, -1, hands[0], P.bendL ?? 1], [tp.armR, tp.foreR, 1, hands[1], P.bendR ?? -1]].forEach(([arm, fore, side, hand, bend]) => {
        const [sx, sy] = rot(side * (SH - 1), -TORSO + 6, P.torso);
        const shx = P.px + sx;
        const shy = P.py + sy;
        // aim so the centre of the hand lands on the target
        const [a1, a2] = ik(shx, shy, hand[0], hand[1], UA, FA + 4, bend);
        set(arm, `translate(${f(shx)} ${f(shy)}) rotate(${f(a1)})`);
        set(fore, `translate(0 ${UA}) rotate(${f(a2)})`);
      });
    });

    // floating music notes
    if (live && !reduceMotion) {
      noteTimer -= dt;
      if (noteTimer <= 0) {
        noteTimer = 0.7 - energy * 0.4;
        note(tapes[(Math.random() * tapes.length) | 0]);
      }
    }
  });

  return { reveal, setScroll };
}
