# Abhay Chandra — Portfolio

A one-page portfolio styled like an old newspaper: black ink on newsprint, blackletter headlines,
a cursive signature intro with a bird swoop, and a front page that spins in like an old newsreel.
The only colour on the page is the cassette tapes (and one violin): five flat 2D tapes with ink-drawn
people standing or sitting on them, moving to a live synthesized lo-fi soundtrack. Smooth scrolling is Lenis, animation is GSAP.

## Run it

```bash
npm install
npm run dev       # local dev server
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## The ending

It rains on the paper the whole way down, and the further you scroll the soggier it gets: wet blotches and drips stay
on the page, the paper darkens and crinkles, and the ink starts to bleed. A few coffee rings sit on the corners.
At the bottom the camera pulls back to two hands holding the soaked back page over a wet London street at night.
Scrolling tears it open, a hand points at a manhole, and clicking the cover flips it off and dives underground,
where a bulb flickers on over the website application form.

The form has no server behind it: Send opens the visitor's email app with the application filled in, addressed to
the `EMAIL` set at the top of `src/finale.js`. To receive submissions without an email app, point the form at a service
such as Formspree instead.

## The eagle transition

The intro uses the 3D eagle from `Eagle/` once it has been compressed into `public/models/eagle.glb`.
Until that file exists, a drawn SVG bird does the swoop instead, so the site always works.

1. Put the eagle in `Eagle/` in one of these two ways:
   - **Easiest:** in Blender, File > Export > glTF 2.0, set Format to **glTF Binary (.glb)**, and save it into `Eagle/`.
   - Or copy `Eagle.bin` and `Eagle.png` (the files `Eagle.gltf` points to) into `Eagle/` next to it.
2. Run:

   ```bash
   npm run compress:eagle
   ```

   This simplifies the mesh, quantizes the geometry and converts the texture to a 1024px WebP,
   so it stays light on laptops and phones. No WebAssembly decoder is needed in the browser.
3. Reload the site. If the eagle flies backwards or looks wrong, tweak the `EAGLE` settings at the top of
   `src/eagle.js` (`flipForward`, `wingspan`, `flapSpeed`, `flapAmount`, `tiltToCamera`).

The model has no animation of its own, so the wing flap is done in a shader that bends the outer wing
vertices. It works with any static bird model.

## Where to edit things

| What | Where |
| --- | --- |
| Case studies | `src/data.js` (title, client, tags, year, link, stamp text) |
| Mission text | `index.html`, the `mission` section |
| Stats (200+ clients, 10,000+ hours) | `index.html`, the `data-to` values in the `stats` section |
| Contact email | `index.html`, the `mailto:` link on the "Send a Telegram" button |
| Tapes and people | `TAPES` at the top of `src/band.js` (colours, titles, pose, hair, clothes) |
| Soundtrack | `src/audio.js` (chords, tempo, drum pattern) |
| Application form fields | `index.html`, the `#dive` form; budget and timeline options are placeholders |
| Form email, back-page story, street | `src/finale.js` |
| Rain strength and sogginess | `src/rain.js` |

## Notes

- Visitors with "reduce motion" turned on skip the intro and get a calmer page.
- The masthead font is UnifrakturMaguntia, a free lookalike of the old New York Times blackletter.
- Three.js only downloads when the eagle model exists, so the page stays light without it.
- The eagle is rendered in black and white to match the paper.
- If the intro ever stalls on a slow device, a safety net skips to the home page after 11 seconds.
