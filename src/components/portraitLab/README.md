# portraitLab

A second, independent pixel-portrait renderer, built alongside
`src/components/portraits/` rather than inside it. Neither system imports the
other (except `PortraitSwitch`, whose whole job is to choose between them), so
both can be worked on at the same time without conflicts.

## Trying it

- **`Cmd` + `` ` ``** (or `Ctrl` + `` ` ``) anywhere in the app toggles every
  portrait between the two engines. The choice is remembered across reloads.
- **`/#portrait-lab`** is the A/B bench: both engines drawing the *same*
  personas, side by side, with the spec the adapter produced printed underneath.
- **`?portraitEngine=lab`** forces an engine via the URL.
- **`npm run portrait-audit -- 300 7`** is the important one. It runs the app's
  *real* persona generator, renders every result, and reports on what it found:
  which garment kinds, coverings, ages and context packs actually occur, which
  names the adapter failed to recognise, which markings it has no case for, and
  which portraits came out structurally broken. Fixtures can only test what you
  already thought of; this tests what the app actually produces.

  The first run flagged 97 structural problems in 200 personas — 80 faces whose
  eyes were down to two visible pixels of white, and 25 whose entire garment was
  buried under a veil. Neither was reachable from the fixture set. Keep running
  it after changes; the counts at the top of the report are the regression test.

- **`npm run portrait-sheet`** renders a PNG contact sheet from the fixture set,
  with no browser involved. Add a sheet id or a fixture-name substring to narrow
  it, and a scale factor to zoom:

  ```bash
  node node_modules/.cache/renderSheet.mjs out.png context 4
  node node_modules/.cache/renderSheet.mjs zoom.png "olive · curly" 9
  ```

  Being able to *look at* the art from a terminal is what makes iterating on
  five-pixel noses tractable.

- **`npm run hat-sheet`** does the same for head coverings alone — one portrait
  per hat, so you can work on a brim without hunting for a persona wearing one.
  Pass a label substring to zoom in on a single case:

  ```bash
  npm run hat-sheet -- hats.png        # all ten
  npm run hat-sheet -- fur.png fur     # just the fur ones, 10x
  ```

- **<kbd>F2</kbd>** (or <kbd>⌘⇧D</kbd>) opens the **dev panel** over the running
  app: forty-two live-generated personas at a time, along one axis — a hat
  parade, an age ramp, a complexion ladder, forty-two seeds of the same face.
  Where the fixtures are a fixed cast chosen so diffs mean something, this draws
  straight from the generators, so it shows you the one-in-forty case a
  hand-picked cast never will. <kbd>R</kbd> rerolls, <kbd>[</kbd>/<kbd>]</kbd>
  change axis, clicking a portrait copies its JSON. On in dev; in a production
  build it stays dormant unless you load the page with `?devPanel`.

## How it is put together

```
core/      colour ramps, the pixel buffer, masks, lighting, the stamp format
spec/      the adapter from the app's character model, and where features sit
art/       the actual drawing: face, eyes, noses, mouths, hair, garments, …
render/    compile once, then draw the moving parts each frame
```

Four ideas carry most of the quality:

**1. Ramps, not colours.** Every material — skin, hair, wool, silk, bronze — is
a 7-step ramp built by `core/color.ts`, and drawing code addresses colours by
*step*, never by hex. Shadows drop in value, drift toward a cool ambient, and
gain a little chroma; highlights climb toward a warm key light and lose it. This
happens in RGB rather than HSL on purpose: rotating hue in HSL while holding
lightness makes a pale complexion's shadows march off into salmon and then
magenta, which is exactly what the first version of this file did.

**2. Relative shading.** The raster keeps two extra planes beside RGBA: which
material owns each pixel, and which ramp step it currently sits at. So a feature
can say "one step darker than whatever is already here" and be correct on any
complexion, in light or in shadow. Contact shadows, rim light, and the outline
pass all work off those planes.

**3. Features are drawn, not computed.** Noses, eyes and mouths are authored as
ASCII, in `art/`:

```
const STRAIGHT = stamp(`
  ...+.-...
  ..+^.=-..
  .~~-+-~~.
  ..-===-..
`, { anchor: { x: 4, y: 10 } });
```

`.` is transparent, `-` is one step darker than what's underneath, `=` two, `+`
and `^` lighter, and stamps may add their own characters (`w` sclera, `i` iris,
`m` the mouth line). Because most characters are *relative*, one authored nose
works on every skin tone with no recolouring. **Editing the art is editing this
text** — no logic involved.

**4. Compile once, animate cheaply.** `compilePortrait` draws everything static
into a cached raster (~10–30ms). `renderFrame` copies it and redraws only brows,
eyes and mouth (~0.03ms). Blinking and glancing around therefore cost nothing
even with a wall of portraits on screen.

The stamps are material-guarded rather than z-ordered: eyes draw `onlyOver`
skin, so a hood or a hat brim occludes them for free, and the mouth refuses to
paint over a moustache. Adding a new covering does not require touching the
face code.

## What it reads from the app

Everything comes through `spec/buildSpec.ts`, the only file here that knows any
app types. It honours the existing precedence:

```
portraitVisualOverrides   (evidence-aware, from portraitAuthenticityService)
  > equippedItems         (what the persona is actually wearing)
    > appearance          (the procedural fallback)
```

so the context packs, the clothing tables, `culturalMarkings.ts`, the disease
model, and the Big Five personality vector all reach the renderer. Personality
and health decide the *resting* face — a cheerful persona sits at a faint smile,
an exhausted one at half-lidded eyes — and occasionally flicker into a fuller
expression on their own.

## Coverage, honestly

Faces, hair, ageing, expression and animation are complete for every persona the
app can generate. Garments and headwear are drawn in depth for five context
packs — Old Bailey London, Ming China (and its Tang/Song sibling), medieval
Sahel, Mughal South Asia, and Mediterranean antiquity — and everything else
falls through to a generic silhouette for its garment kind. That is deliberately
plain rather than confidently wrong, matching the posture
`portraitAuthenticityService` already takes with its own confidence ratings.

Adding a sixth pack means one `case` in `art/garments.ts` and, if it needs one, a
covering in `art/headwear.ts`.

## Ageing

Worth calling out separately, because it is the axis most procedural portraits
fail: a sixty-year-old rendered as a twenty-year-old wearing grey hair. What
actually reads at this size, roughly in order of how much work each one does:

1. Grey hair, and a hairline receding from the temples inward
2. The upper lid folding down over the lash line (`lidDroop`), which also
   narrows the aperture — a fold without a narrower eye leaves an old face
   wearing a young stare
3. The nasolabial fold, drawn rather than stamped so its length and depth both
   scale continuously, with a lit ridge on the cheek side so it reads as a fold
   and not a scratch
4. Marionette lines, jowls, and a slackening neck
5. Thinning lips — the vermillion shrinks, so an old mouth is a narrower band
   whatever shape it started as
6. Brows going sparse and patchy (not heavier), with the odd long wiry hair
7. Under-eye bags with a lit pouch and a crease beneath, not just a dark patch
8. A few distinct age spots on the temples and cheekbones

Crow's feet are two short rays per eye. Longer horizontal lines there stop
reading as wrinkles and start reading as scratches across the temple, and age
spots past about four stop reading as age and start reading as pox — both were
mistakes made and corrected here, so resist turning either back up.

## Known rough edges

- The helmet is the least developed covering.
- The Sahel headcloth is serviceable rather than good.
- `compilePortrait` allocates a lot of full-canvas masks; at ~30ms for the
  heaviest persona it is fine for a page, but a large gallery would want mask
  pooling.
