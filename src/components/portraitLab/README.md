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
- **`npm run portrait-sheet`** renders a PNG contact sheet from the command
  line, with no browser involved. Add a sheet id or a fixture-name substring to
  narrow it, and a scale factor to zoom:

  ```bash
  node node_modules/.cache/renderSheet.mjs out.png context 4
  node node_modules/.cache/renderSheet.mjs zoom.png "olive · curly" 9
  ```

  Being able to *look at* the art from a terminal is what makes iterating on
  five-pixel noses tractable.

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

## Known rough edges

- Very long hair falls as two solid masses; it could use more internal shape.
- The helmet is the least developed covering.
- `compilePortrait` allocates a lot of full-canvas masks; at ~30ms for the
  heaviest persona it is fine for a page, but a large gallery would want mask
  pooling.
