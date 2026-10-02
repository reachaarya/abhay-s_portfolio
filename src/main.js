import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import { LofiPlayer } from './audio.js';
import { createBand } from './band.js';
import { caseStudies } from './data.js';
import { createRain } from './rain.js';
import { createFinale } from './finale.js';
import { coffeeStain } from './coffee.js';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const q = (s, el = document) => el.querySelector(s);
const qa = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const EAGLE_URL = '/models/eagle.glb';

/* ---------------- Smooth scroll (Lenis + ScrollTrigger) ---------------- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
lenis.stop();

const audio = new LofiPlayer();
setupCursor();

boot();

async function boot() {
  // start fetching the eagle (if one has been added) while the signature is being written
  const eagleReady = reduceMotion ? Promise.resolve(null) : loadEagleIfPresent();
  await fontsReady();

  buildWork();
  setDates();

  const band = createBand(q('#band'), {
    getBeat: () => audio.getBeat(),
    isPlaying: () => audio.playing,
    reduceMotion,
  });

  setupSound();
  setupNav();
  setupMagnetic();
  setupTilt();
  setupClock();
  const front = prepareFront();
  setupScroll(band);
  addCoffeeStains();

  // rain gets heavier and the paper soggier the further down the page you go
  const rain = createRain({ canvas: q('.rain'), surface: q('main'), reduceMotion });
  ScrollTrigger.create({
    trigger: 'main',
    start: 'top top',
    endTrigger: '#finale',
    end: 'top top',
    onUpdate: (self) => rain.setScroll(self.progress),
  });
  createFinale({ root: q('#finale'), dive: q('#dive'), lenis, rain, reduceMotion });

  let frontShown = false;
  let finished = false;
  const frontIn = () => {
    if (frontShown) return;
    frontShown = true;
    front.intro();
    band.reveal();
  };
  const done = () => {
    if (finished) return;
    finished = true;
    q('#intro')?.remove();
    q('#bird')?.remove();
    document.body.classList.remove('is-loading');
    lenis.start();
    ScrollTrigger.refresh();
  };

  if (reduceMotion) {
    frontIn();
    done();
    return;
  }
  playIntro(eagleReady, frontIn, done);
  // Safety net: if anything stalls the intro (slow device, blocked GPU), never trap the visitor on it.
  setTimeout(() => {
    if (finished) return;
    gsap.to(['#intro', '#bird', '#eagle-canvas'], {
      autoAlpha: 0,
      duration: 0.6,
      onComplete: () => {
        q('#eagle-canvas')?.remove();
        frontIn();
        done();
      },
    });
  }, 11000);
}

function fontsReady() {
  const wanted = ['190px "Great Vibes"', '100px "UnifrakturMaguntia"', '900 100px "Playfair Display"', '400 16px "Old Standard TT"', '16px "Special Elite"'];
  const timeout = new Promise((r) => setTimeout(r, 3000));
  return Promise.race([Promise.all(wanted.map((f) => document.fonts.load(f))).then(() => document.fonts.ready), timeout]);
}

/** Loads Three.js and the eagle only when public/models/eagle.glb actually exists. */
async function loadEagleIfPresent() {
  try {
    const head = await fetch(EAGLE_URL, { method: 'HEAD' });
    const type = head.headers.get('content-type') || '';
    if (!head.ok || type.includes('text/html')) return null; // dev server answers missing files with index.html
    const mod = await import('./eagle.js');
    const eagle = await mod.loadEagle(EAGLE_URL);
    return eagle ? { eagle, createEagleFlight: mod.createEagleFlight } : null;
  } catch (err) {
    console.warn('Eagle unavailable, using the drawn bird.', err);
    return null;
  }
}

function setDates() {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  q('.dateline .today').textContent = fmt.format(d);
  q('.year').textContent = d.getFullYear();
}

/* ---------------- Intro: cursive signature + bird swoop ---------------- */
function playIntro(eagleReady, frontIn, done) {
  const text = q('.sig-text');
  const clip = q('.sig-clip-rect');
  const nib = q('.sig-nib');
  const num = q('.intro-count-num');
  const bb = text.getBBox();
  const startX = bb.x - 10;
  const endX = bb.x + bb.width + 20;

  gsap.set(clip, { attr: { x: 0, width: startX } });
  gsap.set(nib, { attr: { cx: startX, cy: bb.y + bb.height * 0.62 } });
  gsap.set('.intro-meta', { y: 12 });

  const counter = { v: 0 };
  const write = { p: 0 };
  gsap.timeline({ delay: 0.3 })
    .to(counter, { v: 100, duration: 3.6, ease: 'power1.inOut', onUpdate: () => (num.textContent = Math.round(counter.v)) }, 0)
    .to(nib, { opacity: 1, duration: 0.3 }, 0)
    .to(write, {
      p: 1, duration: 2.9, ease: 'power1.inOut',
      onUpdate: () => {
        const x = startX + (endX - startX) * write.p;
        clip.setAttribute('width', x);
        // the "pen" wiggles up and down like it's writing loops
        const wig = Math.sin(write.p * 46) * bb.height * 0.22 + Math.sin(write.p * 13) * bb.height * 0.08;
        nib.setAttribute('cx', x);
        nib.setAttribute('cy', bb.y + bb.height * 0.58 + wig);
      },
    }, 0.1)
    .to(text, { strokeDashoffset: 0, duration: 3.1, ease: 'power2.inOut' }, 0)
    .to(text, { fillOpacity: 1, duration: 1, ease: 'power2.out' }, 2.4)
    .to(text, { strokeOpacity: 0.25, duration: 1 }, 2.6)
    .to(nib, { opacity: 0, duration: 0.4 }, 3.0)
    .to('.intro-meta', { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 2.7)
    .call(() => {
      // give a slow connection a moment to finish the eagle, then fly whatever is ready
      const wait = new Promise((r) => setTimeout(() => r(null), 1500));
      Promise.race([eagleReady, wait]).then((loaded) => birdSwoop(loaded, frontIn, done));
    }, null, 3.7);
}

/** Catmull-Rom path through screen points, sampled by arc length. */
function makePath(points) {
  const pts = [points[0], ...points, points[points.length - 1]];
  const samples = [];
  for (let i = 1; i < pts.length - 2; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
    for (let k = 0; k < 40; k++) {
      const t = k / 40;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      samples.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  samples.push(points[points.length - 1]);
  const lens = [0];
  for (let i = 1; i < samples.length; i++) lens.push(lens[i - 1] + Math.hypot(samples[i][0] - samples[i - 1][0], samples[i][1] - samples[i - 1][1]));
  const total = lens[lens.length - 1];
  return (p) => {
    const target = Math.min(Math.max(p, 0), 1) * total;
    let i = 1;
    while (i < lens.length - 1 && lens[i] < target) i++;
    const seg = lens[i] - lens[i - 1] || 1;
    const k = (target - lens[i - 1]) / seg;
    const [a, b] = [samples[i - 1], samples[i]];
    return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  };
}

/** Moves either the 3D eagle or the drawn bird along the swoop. */
function makeFlyer(loaded) {
  if (loaded) {
    try {
      const flight = loaded.createEagleFlight(loaded.eagle);
      q('#bird')?.remove();
      return { move: flight.setProgress, finish: flight.dispose, glide() {} };
    } catch (err) {
      console.warn('Eagle flight failed, using the drawn bird.', err);
    }
  }
  const W = window.innerWidth;
  const H = window.innerHeight;
  const bird = q('#bird');
  const at = makePath([[-0.15, 0.02], [0.2, 0.3], [0.5, 0.8], [0.8, 0.42], [1.2, -0.3]].map(([u, v]) => [u * W, v * H]));
  gsap.set(bird, { xPercent: -50, yPercent: -50, scale: W < 700 ? 0.6 : 1, opacity: 1 });
  return {
    move(p) {
      const pt = at(p);
      gsap.set(bird, { x: pt.x, y: pt.y, rotate: (pt.angle * 180) / Math.PI });
      return pt;
    },
    glide(on) { bird.classList.toggle('is-gliding', on); },
    finish() { bird.remove(); },
  };
}

function birdSwoop(loaded, frontIn, done) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const flyer = makeFlyer(loaded);
  const flight = { p: 0 };
  let frame = 0;

  gsap.timeline({ onComplete: () => flyer.finish() })
    .to(flight, {
      p: 1,
      duration: 2.3,
      ease: 'power1.inOut',
      onUpdate: () => {
        const at = flyer.move(flight.p);
        if (frame++ % 2 === 0) spark(at.x, at.y);
      },
    })
    .call(() => flyer.glide(true), null, 0.35)
    .call(() => flyer.glide(false), null, 1.05)
    .call(() => feathers(W * 0.5, H * 0.8), null, 1.1)
    .to('.signature', { y: -60, scale: 0.94, opacity: 0, duration: 0.8, ease: 'power2.in' }, 0.95)
    .to(['.intro-meta', '.intro-count'], { opacity: 0, duration: 0.4 }, 0.95)
    // the bird pulls the curtain up behind it, and the front page spins in like an old newsreel
    .to('#intro', { yPercent: -100, duration: 1.35, ease: 'power3.inOut' }, 1.05)
    .fromTo('.intro-curve', { scaleY: 1 }, { scaleY: 0, duration: 1.35, ease: 'power2.in' }, 1.05)
    .call(frontIn, null, 1.25)
    .call(done, null, 2.6);
}

function spark(x, y) {
  const el = document.createElement('div');
  el.className = 'spark';
  document.body.appendChild(el);
  gsap.set(el, { x: x + gsap.utils.random(-14, 14), y: y + gsap.utils.random(-6, 10), scale: gsap.utils.random(0.5, 1.2) });
  gsap.to(el, { y: `+=${gsap.utils.random(10, 40)}`, x: `-=${gsap.utils.random(0, 30)}`, scale: 0, opacity: 0, duration: gsap.utils.random(0.6, 1.1), ease: 'power2.out', onComplete: () => el.remove() });
}

function feathers(x, y) {
  for (let i = 0; i < 12; i++) {
    const f = document.createElement('div');
    f.className = 'feather';
    document.body.appendChild(f);
    gsap.set(f, { x, y, rotate: gsap.utils.random(0, 360), scale: gsap.utils.random(0.6, 1.4) });
    gsap.to(f, { x: x + gsap.utils.random(-220, 220), duration: gsap.utils.random(2, 3.2), ease: 'sine.out' });
    gsap.to(f, { y: y + gsap.utils.random(120, 380), opacity: 0, duration: gsap.utils.random(2, 3.2), ease: 'power1.in', onComplete: () => f.remove() });
    gsap.to(f, { rotate: `+=${gsap.utils.random(180, 540)}`, duration: 3, ease: 'sine.inOut' });
  }
}

/* ---------------- Front page ---------------- */
function prepareFront() {
  const mast = new SplitText('.masthead', { type: 'chars', charsClass: 'char' });
  if (!reduceMotion) {
    gsap.set('.front-inner', { scale: 0.06, rotation: -720, autoAlpha: 0 });
    gsap.set(['.nav'], { autoAlpha: 0, y: -20 });
  }

  // the masthead leans gently toward the mouse
  if (finePointer && !reduceMotion) {
    const xTo = gsap.quickTo('.masthead', 'x', { duration: 1.2, ease: 'power3' });
    window.addEventListener('pointermove', (e) => xTo((e.clientX / window.innerWidth - 0.5) * -16));
  }

  return {
    intro() {
      if (reduceMotion) return;
      gsap.timeline()
        .to('.front-inner', { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.5, ease: 'power4.out' })
        .from(mast.chars, { yPercent: -30, opacity: 0.2, duration: 0.6, stagger: 0.03, ease: 'power2.out' }, 0.9)
        .to('.nav', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' }, 1.0);
    },
  };
}

/* ---------------- Scroll-driven animation ---------------- */
/** Coffee rings on a few corners of the paper. */
function addCoffeeStains() {
  const spots = [
    ['.front-inner', 'right:-70px;top:40px;rotate:24deg', true],
    ['.mission', 'left:-40px;bottom:4vh;rotate:-12deg', false],
    ['.ledger', 'right:-50px;top:-90px;rotate:60deg', true],
    ['.classified-grid', 'left:-60px;bottom:-140px;rotate:-30deg', false],
  ];
  spots.forEach(([sel, style, partial]) => {
    const host = q(sel);
    if (!host) return;
    host.insertAdjacentHTML('beforeend', coffeeStain({ partial }));
    host.lastElementChild.setAttribute('style', style);
  });
}

function setupScroll(band) {
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      gsap.set('.progress', { scaleX: self.progress });
      band.setScroll(self.scroll());
    },
  });

  // masthead drifts up a little slower than the page
  gsap.to('.masthead', { yPercent: 35, ease: 'none', scrollTrigger: { trigger: '.front', start: 'top top', end: 'bottom top', scrub: true } });

  // marquee driven by scroll velocity
  const track = q('.marquee-track');
  let mx = 0;
  let dir = -1;
  gsap.ticker.add(() => {
    const v = lenis.velocity || 0;
    if (v > 0.1) dir = -1;
    else if (v < -0.1) dir = 1;
    mx += dir * (1.1 + Math.min(Math.abs(v) * 0.6, 22));
    const half = track.scrollWidth / 2;
    if (half > 0) {
      if (mx <= -half) mx += half;
      if (mx > 0) mx -= half;
    }
    gsap.set(track, { x: mx, skewX: gsap.utils.clamp(-10, 10, v * -0.5) });
  });

  // section rules print across, small labels typewrite in
  qa('.section-head').forEach((head) => {
    gsap.fromTo(head, { '--rule-p': 0 }, { '--rule-p': 1, duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: head, start: 'top 88%' } });
    gsap.from(q('.sec-title', head), { yPercent: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: head, start: 'top 88%' } });
    qa('.sec-meta', head).forEach((el) => {
      const txt = el.textContent;
      ScrollTrigger.create({
        trigger: head, start: 'top 88%', once: true,
        onEnter: () => gsap.to(el, { duration: 1, scrambleText: { text: txt, chars: 'upperCase', speed: 0.5 } }),
      });
    });
  });

  // editorial: words ink in as you read
  const mission = new SplitText('.mission-words', { type: 'words', wordsClass: 'word' });
  gsap.to(mission.words, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.mission-text', start: 'top 80%', end: 'bottom 45%', scrub: true },
  });
  gsap.from('.dropcap', { scale: 2.4, opacity: 0, rotate: -12, transformOrigin: '20% 80%', duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: '.mission-text', start: 'top 80%' } });
  gsap.from('.mission-sig', { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.mission-sig', start: 'top 92%' } });

  // numbers
  gsap.from('.ledger-item', {
    y: 90, rotateX: -25, opacity: 0, duration: 1.3, stagger: 0.14, ease: 'expo.out',
    scrollTrigger: { trigger: '.ledger', start: 'top 85%' },
  });
  qa('.spark-line path').forEach((path) => {
    const len = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', scrollTrigger: { trigger: path, start: 'top 88%' } });
  });
  qa('.count').forEach((el) => {
    const to = +el.dataset.to;
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 2.6, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString('en-US')) }),
    });
  });

  // stories: horizontal scroll through the clippings
  const wTrack = q('.work-track');
  const dist = () => Math.max(0, wTrack.scrollWidth - window.innerWidth);
  const hScroll = gsap.to(wTrack, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: '.work', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
  });
  qa('.clip').forEach((card) => {
    gsap.from(card, {
      y: 120, rotate: () => gsap.utils.random(-14, 14), opacity: 0, ease: 'none',
      scrollTrigger: { trigger: card, containerAnimation: hScroll, start: 'left 105%', end: 'left 60%', scrub: true },
    });
    gsap.from(q('.stamp', card), {
      scale: 2.6, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: card, containerAnimation: hScroll, start: 'left 70%', end: 'left 50%', scrub: true },
    });
  });

  // classifieds
  const contact = new SplitText('.contact-title .split', { type: 'chars', charsClass: 'char' });
  gsap.from(contact.chars, {
    yPercent: 120, rotate: 10, duration: 1.2, stagger: 0.03, ease: 'expo.out',
    scrollTrigger: { trigger: '.contact-title', start: 'top 80%' },
  });
  gsap.from('.ad-box', { y: 60, rotate: 3, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ad-box', start: 'top 88%' } });
  gsap.from('.telegram', { scale: 2.2, rotate: -40, opacity: 0, duration: 0.7, ease: 'power4.in', scrollTrigger: { trigger: '.telegram', start: 'top 92%' } });
}

/* ---------------- Story clippings ---------------- */
function tornEdge() {
  // jagged top and bottom edges like a clipping torn from the page
  const pts = [];
  for (let x = 0; x <= 100; x += 4) pts.push(`${x}% ${(Math.random() * 1.6).toFixed(2)}%`);
  for (let x = 100; x >= 0; x -= 4) pts.push(`${x}% ${(98.4 + Math.random() * 1.6).toFixed(2)}%`);
  return `polygon(${pts.join(',')})`;
}

function buildWork() {
  const track = q('.work-track');
  const html = caseStudies.map((c, i) => {
    const tag = c.href ? 'a' : 'article';
    const href = c.href ? ` href="${c.href}"` : '';
    const tilt = (i % 2 ? 1.4 : -1.2) * (0.6 + Math.random() * 0.6);
    return `
      <${tag} class="clip" data-tilt data-cursor="${c.href ? 'Read' : 'Soon'}"${href} style="clip-path:${tornEdge()};rotate:${tilt.toFixed(2)}deg">
        <div class="clip-photo" style="--gx:${20 + Math.random() * 50}%;--gy:${20 + Math.random() * 40}%">
          <span class="clip-no">0${i + 1}</span>
        </div>
        <p class="clip-kicker">${c.tags.join(' · ')} · ${c.year}</p>
        <h3 class="clip-head">${c.title}</h3>
        <p class="clip-body">${c.client}. The full story is being set in type and will run in the next edition of this paper.</p>
        <span class="stamp">${c.status}</span>
      </${tag}>`;
  }).join('');
  track.innerHTML = html + `
    <div class="clip-end">
      <p>More stories going to press.</p>
      <span>New case studies are being typeset right now. Check back for the next edition.</span>
    </div>`;
}

/* ---------------- Cursor ---------------- */
function setupCursor() {
  if (!finePointer) return;
  document.body.classList.add('has-cursor');
  const ring = q('.cursor');
  const dot = q('.cursor-dot');
  const label = q('.cursor-label');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
  gsap.set([ring, dot], { autoAlpha: 0 });
  let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (!shown) {
      shown = true;
      gsap.set(ring, { x: e.clientX, y: e.clientY });
      gsap.to([ring, dot], { autoAlpha: 1, duration: 0.3 });
    }
    rx(e.clientX);
    ry(e.clientY);
    gsap.set(dot, { x: e.clientX, y: e.clientY });
  });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor]');
    ring.classList.toggle('is-active', !!t);
    if (t) label.textContent = t.dataset.cursor;
  });
  window.addEventListener('pointerdown', () => gsap.to(ring, { scale: 0.8, duration: 0.15 }));
  window.addEventListener('pointerup', () => gsap.to(ring, { scale: 1, duration: 0.4, ease: 'elastic.out(1,0.5)' }));
}

/* ---------------- Sound toggle + live EQ ---------------- */
function setupSound() {
  const btn = q('.sound-btn');
  const lbl = q('.sound-label');
  const bars = qa('.eq i');
  btn.addEventListener('click', async () => {
    const on = await audio.toggle();
    btn.setAttribute('aria-pressed', on);
    lbl.textContent = on ? 'Sound on' : 'Sound off';
  });
  gsap.ticker.add((time) => {
    if (audio.playing) {
      audio.getBands(bars.length).forEach((v, i) => (bars[i].style.transform = `scaleY(${0.15 + Math.min(1, v * 1.6) * 0.85})`));
    } else {
      bars.forEach((b, i) => (b.style.transform = `scaleY(${0.2 + (Math.sin(time * 2 + i) + 1) * 0.06})`));
    }
  });
}

/* ---------------- Nav: smooth anchors + scramble ---------------- */
function setupNav() {
  qa('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = q(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    });
  });
  qa('[data-scramble]').forEach((a) => {
    const text = a.textContent;
    a.addEventListener('mouseenter', () => gsap.to(a, { duration: 0.6, scrambleText: { text, chars: 'upperCase', speed: 0.6 } }));
  });
}

/* ---------------- Magnetic telegram button ---------------- */
function setupMagnetic() {
  if (!finePointer) return;
  qa('.telegram').forEach((btn) => {
    const inner = q('.telegram-inner', btn);
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const ixTo = gsap.quickTo(inner, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const iyTo = gsap.quickTo(inner, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    window.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const cx = r.left - (gsap.getProperty(btn, 'x') || 0) + r.width / 2;
      const cy = r.top - (gsap.getProperty(btn, 'y') || 0) + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const near = Math.hypot(dx, dy) < r.width * 0.9;
      xTo(near ? dx * 0.35 : 0);
      yTo(near ? dy * 0.35 : 0);
      ixTo(near ? dx * 0.15 : 0);
      iyTo(near ? dy * 0.15 : 0);
    });
  });
}

/* ---------------- 3D tilt for ledger items and clippings ---------------- */
function setupTilt() {
  if (!finePointer) return;
  qa('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      gsap.to(el, { rotateY: (px - 0.5) * 10, rotateX: -(py - 0.5) * 10, transformPerspective: 900, duration: 0.6, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1, ease: 'elastic.out(1, 0.5)' }));
  });
}

/* ---------------- Footer clock ---------------- */
function setupClock() {
  const el = q('.clock');
  const fmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => (el.textContent = `Local time ${fmt.format(new Date())}`);
  tick();
  setInterval(tick, 1000);
}
