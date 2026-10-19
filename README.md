# Pink Bloom · 20/10

A cinematic Vietnamese Women's Day gift built with Vite, TypeScript, HTML/CSS, Three.js and GSAP. All flowers, wrapping, ribbons, gifts, countdown numerals and greeting letters are real 3D geometry. No UI framework or external model files are used.

## Run locally

Requires Node.js 22.12+ (Node 24 is supported).

```sh
npm install
npm run dev
```

Open the URL Vite prints (normally http://localhost:5173). To install another dependency, use `npm install <package>`.

```sh
npm run typecheck
npm run build
npm run preview
```

`dist/` contains the static production site. No API keys or backend are required. The font and all required assets are served locally.

## Experience

The 30-second sequence runs automatically after assets are ready: 3–2–1 countdown, five individual flower reveals and transfers, bouquet wrapping and gifts, then the dimensional greeting. “Xem lại” replays it. Motion pauses when the browser tab is hidden. Reduced-motion visitors receive a gentle final reveal; browsers without WebGL receive a readable greeting.

## Customize

- Add `?name=Ngọc%20Anh` to the URL to personalize the dedication, signature, final caption and fallback greeting. Vietnamese names and UTF-8 URL encoding are supported; an absent or blank name keeps the default wording. Example: `http://localhost:5173/?name=Ngọc%20Anh`.
- `src/personalization.ts`: recipient name parsing and personalized copy.
- `src/config.ts`: flower order, colors, bouquet positions, names and timing.
- `src/scene/flowers.ts` and `geometry.ts`: procedural flower shapes and petal arrangements.
- `src/scene/rose.ts`: rolled rose center, cupped petals, curled edges and opening animation.
- `src/scene/materials.ts`: GLSL petal deformation, veins, gradients and backlighting.
- `src/scene/bouquet.ts`: paper, ribbon, foliage and gift geometry.
- `src/scene/experience.ts`: GSAP choreography, camera, lighting and rendering quality.
- `src/style.css`: pink atmosphere, responsive captions and controls.

Greeting text uses a subset of **Cormorant Garamond** from Google Fonts, under the SIL Open Font License in `public/fonts/OFL.txt`. After editing the scene's text, update the character set in `scripts/prepare-font.mjs`, then run:

```sh
node scripts/prepare-font.mjs public/fonts/cormorant.ttf
```

In development only, `window.__pinkBloom.seek(seconds)`, `.play()`, and `.replay()` provide deterministic inspection of each animation stage. These helpers are excluded from production.
