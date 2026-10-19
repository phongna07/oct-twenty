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

The 30-second sequence runs automatically after assets are ready: 3–2–1 countdown, five individual flower reveals and transfers, bouquet wrapping and gifts, then the dimensional greeting. Motion pauses when the browser tab is hidden. Reduced-motion visitors receive a gentle final reveal; browsers without WebGL receive a readable greeting.

## Customize

- Add `?name=Ngọc%20Anh` to the URL to personalize the dedication, signature, final caption and fallback greeting. Vietnamese names and UTF-8 URL encoding are supported; an absent or blank name keeps the default wording. Example: `http://localhost:5173/?name=Ngọc%20Anh`.
- `src/personalization.ts`: recipient name parsing and personalized copy.
- `src/config.ts`: flower order, colors, bouquet positions, names and timing.
- `src/scene/flowers.ts` and `geometry.ts`: procedural flower shapes and petal arrangements.
- `src/scene/rose.ts`: rolled rose center, cupped petals, curled edges and opening animation.
- `src/scene/peony.ts`: double peony with broad guard petals, a dense ruffled crown and staged opening.
- `src/scene/tulip.ts`: six overlapping, rounded tepals in two alternating whorls, with a bud-to-cup morph.
- `src/scene/lily.ts`: six pointed, recurved tepals, six curved stamens and a three-lobed stigma.
- `src/scene/materials.ts`: GLSL petal deformation, veins, gradients and backlighting.
- `src/scene/bouquet.ts`: paper, ribbon, foliage and gift geometry.
- `src/scene/experience.ts`: GSAP choreography, camera, lighting and rendering quality.
- `src/style.css`: pink atmosphere, responsive captions and controls.

The double peony's broad guard petals and densely petalled center follow the botanical forms described by [Matthaei Botanical Gardens & Nichols Arboretum](https://mbgna.umich.edu/floral-forms). Its geometry is generated locally, including the bud-to-bloom morphs.

The tulip's upright cup and broad leaves follow the [RHS tulip guide](https://www.rhs.org.uk/plants/tulip/growing-guide). The lily's flared, recurved tepals follow [Missouri Botanical Garden's Lilium description](https://www.missouribotanicalgarden.org/PlantFinder/PlantFinderDetails.aspx?taxonid=258357); its six tepals, six stamens and single pistil also follow the lily modeling example in [Ijiri et al., Floral diagrams and inflorescences](https://www-ui.is.s.u-tokyo.ac.jp/~takeo/papers/ijiri_siggraph2005_flower.pdf). Both models and their opening morphs are generated locally; no downloaded meshes or textures are required.

Greeting text uses a subset of **Cormorant Garamond** from Google Fonts, under the SIL Open Font License in `public/fonts/OFL.txt`. After editing the scene's text, update the character set in `scripts/prepare-font.mjs`, then run:

```sh
node scripts/prepare-font.mjs public/fonts/cormorant.ttf
```

In development only, `window.__pinkBloom.seek(seconds)` and `.play()` provide deterministic inspection of each animation stage. These helpers are excluded from production.
