import gsap from 'gsap';

/*
  Rain over the newspaper.
  - A fixed canvas draws falling streaks; how hard it rains follows the scroll position.
  - Drops that "land" leave wet blotches and drips on the paper. They are absolutely positioned
    inside <main>, so they stay on the page as you scroll, and the page gets soggier the further you go.
  - setWet(0..1) is exposed through the CSS variable --wet, which darkens and crinkles the paper
    and makes the ink bleed (see .soak and text-shadow rules in style.css).
*/
export function createRain({ canvas, surface, reduceMotion = false }) {
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const drops = [];
  const ripples = [];
  let intensity = 0.15; // 0..1, follows the scroll
  let target = 0.15;
  let mode = 'paper';   // 'paper' leaves stains, 'street' makes ripples
  let wet = 0;
  let wetShown = -1;
  let stainBudget = 0;
  let stainsOn = true;
  let paused = false;
  const stains = [];
  const MAX_STAINS = reduceMotion ? 60 : 220;

  function spawnDrop() {
    const z = Math.random(); // depth: near drops are longer, faster, brighter
    drops.push({
      x: Math.random() * (W + 200) - 100,
      y: -40 - Math.random() * H * 0.4,
      len: 10 + z * 26,
      speed: 900 + z * 900,
      z,
      land: H * (0.2 + Math.random() * 0.85),
    });
  }

  function stain(xView, yView, big) {
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const el = document.createElement('i');
    const drip = !big && Math.random() < 0.18;
    el.className = drip ? 'wet-drip' : 'wet-spot';
    const size = big ? 60 + Math.random() * 140 : 8 + Math.random() * 30 * (0.6 + wet);
    el.style.left = `${xView - rect.left - size / 2}px`;
    el.style.top = `${yView - rect.top - size / 2}px`;
    el.style.width = `${size}px`;
    el.style.height = `${drip ? size * (2.5 + Math.random() * 3) : size}px`;
    el.style.setProperty('--o', (0.35 + Math.random() * 0.4).toFixed(2));
    surface.appendChild(el);
    stains.push(el);
    if (stains.length > MAX_STAINS) stains.shift().remove();
    if (!reduceMotion) gsap.from(el, { scale: 0.2, opacity: 0, duration: drip ? 1.2 : 0.35, ease: 'power2.out', transformOrigin: '50% 0%' });
  }

  function setScroll(p) {
    target = 0.15 + Math.min(1, p) * 0.85;
    const nextWet = Math.min(1, Math.max(0, (p - 0.04) / 0.9));
    wet = nextWet;
    if (Math.abs(wet - wetShown) > 0.01) {
      wetShown = wet;
      document.documentElement.style.setProperty('--wet', wet.toFixed(3));
    }
  }

  function setMode(m) {
    mode = m;
  }

  let last = performance.now();
  let running = true;
  document.addEventListener('visibilitychange', () => (running = !document.hidden));

  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!running || paused) return;
    intensity += (target - intensity) * 0.04;
    const storm = mode === 'street' ? 1 : intensity;

    // how many streaks should be in the air
    const want = Math.round((reduceMotion ? 30 : 60) + storm * (reduceMotion ? 60 : 340));
    while (drops.length < want) spawnDrop();

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    const wind = 0.12;
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.speed * dt;
      d.x += d.speed * wind * dt;
      if (d.y > d.land) {
        // landed: stain the paper, or ripple the puddles
        if (mode === 'paper' && stainsOn && Math.random() < 0.05 + storm * 0.1) stainBudget += 1;
        if (mode === 'street' && Math.random() < 0.35) ripples.push({ x: d.x, y: d.y, r: 1, life: 0, max: 0.6 + Math.random() * 0.5 });
        drops.splice(i, 1);
        if (drops.length > want) continue;
        spawnDrop();
        continue;
      }
      const a = mode === 'street' ? 0.18 + d.z * 0.35 : 0.1 + d.z * 0.28;
      ctx.strokeStyle = mode === 'street' ? `rgba(200,215,235,${a})` : `rgba(40,44,52,${a})`;
      ctx.lineWidth = 0.6 + d.z * 1.1;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * wind, d.y - d.len);
      ctx.stroke();
    }

    // puddle ripples (street mode)
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.life += dt;
      const k = r.life / r.max;
      if (k >= 1) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = `rgba(210,220,240,${0.35 * (1 - k)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, 2 + k * 16, 1 + k * 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // stains are added a few per frame so the DOM never gets hammered
    let made = 0;
    while (stainBudget >= 1 && made < 2) {
      stainBudget -= 1;
      made++;
      stain(Math.random() * W, H * (0.1 + Math.random() * 0.85), Math.random() < 0.04 * wet);
    }
  });

  return {
    setScroll,
    setMode,
    setStains: (on) => (stainsOn = on),
    setPaused: (p) => {
      paused = p;
      if (p) ctx.clearRect(0, 0, W, H);
    },
  };
}
