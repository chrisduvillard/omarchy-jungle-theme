# art/: how the Jungle images are built

Every image in the theme is rebuilt from its source by the scripts here.

```
wallpapers.json   the manifest: each wallpaper's source photograph (Commons title,
                  SHA-1, author, licence), its crop and its grade; plus the stone
                  material used for Overgrown and the boot logo
build.mjs         photo wallpapers: download, convert to sRGB, crop, resize, grade, WebP
overgrown.mjs     the carved-stone wallpaper and unlock.png
intro.mjs         the Canopy intro video
extras.mjs        preview.png, preview-unlock.png, README images, CREDITS.md
preview.html      the desktop mock-up behind preview.png
omarchy-logo.svg  the wordmark, used as a mask
```

## What you need

- Node 18 or newer
- ImageMagick 7 (`magick`) and libvips (`vips`)
- ffmpeg with libx264 and libwebp, for the intro and its README loop
- Chromium, only for `extras.mjs preview` (`npm install` pulls playwright-core,
  which drives `/usr/bin/chromium`, or whatever `CHROMIUM` points at)

On Omarchy: `sudo pacman -S --needed imagemagick libvips ffmpeg chromium`.

## Photo wallpapers

```bash
node build.mjs                      # all of them -> ../backgrounds
node build.mjs --size 2560x1600     # another screen
node build.mjs --preview /tmp/pv    # quick 1600x900 JPEGs while tuning
node build.mjs --fetch              # only download the sources
```

Sources are downloaded once into `.cache/` and checked against the SHA-1 in the
manifest, so a photograph that changes on Commons stops the build instead of
quietly changing a wallpaper. Commons throttles bursts of full-size downloads;
the script waits as long as it is told to, so a first run can take a while.

Most of the photographs are 3:2 or 4:3, so a 16:9 or 16:10 frame loses only a sliver.
A very wide frame (`--size 5120x1440`) keeps a centred strip half as tall,
which suits the landscapes but cuts into close-up animals; move the strip with
`crop.cy` in the manifest if you build for one.

Several sources are Adobe RGB or Display P3. They are converted to sRGB before
anything else, otherwise their colours would come out dull.

In the manifest, `crop` places the frame (`cx`, `cy` are the centre as fractions
of the photograph, `zoom` tightens it) and `grade` adjusts the shared look:

| Key | Default | Effect |
|---|---|---|
| `black`, `white` | 0, 100 | input levels, in percent |
| `gamma` | 1 | below 1 darkens the midtones |
| `contrast` | 0 | sigmoidal contrast; negative flattens |
| `saturation` | 100 | percent, in HCL so hues hold |
| `vignette` | 0.35 | how far the corners fall away |
| `tint` | 1 | how far black is pulled to `darker_background` and white is warmed |

To add a wallpaper, add an entry with the Commons file title, its author and
licence, and the file's SHA-1, which the Commons API reports:

```bash
curl -sG https://commons.wikimedia.org/w/api.php -d action=query -d format=json \
  -d prop=imageinfo -d iiprop=sha1 --data-urlencode 'titles=File:Example.jpg'
```

Then run `node build.mjs <name>` and `node extras.mjs assets credits`.

## Overgrown

`overgrown.mjs` loads three maps of Poly Haven's *Mossy Stone Wall* (colour,
height, ambient occlusion), cuts the wordmark into the height map with
roughened edges, grows moss in the cut, and lights the surface: a normal from
the height gradient, a march towards the sun for cast shadows, and a soft
leaf-shade pattern that clears around the carving. `unlock.png` is the same
stone raised instead of cut, on transparency. It is deterministic.

## Intro and extras

`intro.mjs` turns `01-canopy.webp` into the intro with one ffmpeg filter chain;
its last frame is the still. `extras.mjs` composes `preview-unlock.png` the
same way `omarchy plymouth preview` does (it reads the Plymouth assets from
`$OMARCHY_PATH`), renders `preview.png`, and regenerates `CREDITS.md` and the
README gallery from the manifest. It reads the palette straight from
`../colors.toml`.
