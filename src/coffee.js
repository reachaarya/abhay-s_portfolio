// Coffee-cup rings for the corners of the paper: a wobbly ring with a darker rim, a faint fill
// and a couple of drips. Each stain gets its own noise seed so no two look the same.
let n = 0;

export function coffeeStain({ partial = false } = {}) {
  const id = `cf${++n}`;
  const seed = 3 + n * 7;
  const arc = partial
    ? `<path d="M38 132 A70 70 0 0 1 64 42" fill="none" stroke="#5a300e" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>`
    : '';
  return `
  <svg class="coffee" viewBox="0 0 220 220" aria-hidden="true">
    <defs>
      <filter id="${id}w" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${seed}"/>
        <feDisplacementMap in="SourceGraphic" scale="10"/>
      </filter>
      <radialGradient id="${id}f">
        <stop offset=".5" stop-color="#7a4a1e" stop-opacity=".05"/>
        <stop offset=".88" stop-color="#7a4a1e" stop-opacity=".16"/>
        <stop offset="1" stop-color="#6b3c14" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <g filter="url(#${id}w)">
      <circle cx="105" cy="105" r="74" fill="url(#${id}f)"/>
      <circle cx="105" cy="105" r="74" fill="none" stroke="#6b3c14" stroke-opacity=".42" stroke-width="3.5"/>
      <circle cx="105" cy="105" r="69" fill="none" stroke="#6b3c14" stroke-opacity=".12" stroke-width="7"/>
      ${arc}
      <circle cx="186" cy="168" r="7" fill="#6b3c14" fill-opacity=".24"/>
      <circle cx="200" cy="150" r="3.5" fill="#6b3c14" fill-opacity=".22"/>
      <circle cx="170" cy="192" r="2.5" fill="#6b3c14" fill-opacity=".2"/>
    </g>
  </svg>`;
}
