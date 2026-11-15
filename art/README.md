# art/: the Jungle painter

Every image in this theme is drawn here, in code, on an HTML canvas in
headless Chromium. Nothing is photographed or traced.

```
lib/core.js         seeded RNG, simplex noise + fbm, colour mixing, blur, grain/dither
lib/palette.js      the theme palette (mirrors ../colors.toml) and a foliage ramp
lib/atmosphere.js   god rays, glows, drifting mist, bokeh, dust motes, fireflies
lib/flora.js        leaves with drip tips, Monstera (slits + holes), Alocasia, torn
                    banana leaves, gravity-bent palm/fern fronds, vines, lianas,
                    buttressed trunks, crowns, heliconias, and a foliage scatterer
lib/fauna.js        jaguar eyes and fur, keel-billed toucan, blue morpho butterflies
scenes/*.js         one file per wallpaper; canopy.js is built from depth layers so
                    intro.mjs can animate it
render.mjs          paints scenes to WebP          node render.mjs [scene…] [--size WxH] [--png dir]
intro.mjs           renders the Canopy intro (ffmpeg + libx264)
extras.mjs          unlock.png, preview-unlock.png, preview.png, README images
preview.html        the desktop mock-up behind preview.png
```

## Setup

```bash
npm install                      # installs playwright-core only
node render.mjs                  # uses /usr/bin/chromium
CHROMIUM=/usr/bin/google-chrome-stable node render.mjs
```

Scenes take a seed (see `SCENES` in `render.mjs`), so the same seed always paints
the same picture. Change one to grow a different jungle. Layouts are relative
to the frame, so any size works. They're composed for 16:9, and wider frames
just show more forest.

`extras.mjs` composes `preview-unlock.png` the same way `omarchy plymouth
preview` does (it reads the Plymouth assets from `$OMARCHY_PATH`). It reads
the palette straight from `../colors.toml`.
