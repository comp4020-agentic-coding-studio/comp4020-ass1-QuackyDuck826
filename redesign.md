# Redesign: industrial/mechanical direction

Design-direction record for the visual overhaul of "The $1 Machine." The prior
design had no cohesion between the machine and the rest of the site, and the
machine itself read as a pile of independently-bordered, independently-shadowed
boxy panels rather than one designed object.

## Direction

- **Machine**: redrawn as one cohesive illustrated cabinet shell instead of a
  stack of separately-chromed boxes. The coin and lever, which used to
  protrude past the boxy cabinet's own edge, now sit inside a widened hull
  with a side-console bulge.
- **Site chrome**: header/nav/h1/intro paragraph themed to share the machine's
  material language (a `.placard` treatment for the heading/intro, a brass-tab
  nav) instead of sitting unstyled on a blank page.
- **Palette**: full overhaul, organized as tonal families — steel/graphite for
  housing and structure, brass/copper for accents and the coin, plus two
  functional accents (danger, focus) — rather than the old flat 7-hex set.
- **Mood**: industrial/mechanical — brushed metal greys, brass/copper accents,
  riveted linework, monospace/stencil type (Space Mono). Reads as an honest
  piece of old coin-op machinery.

## Color tokens

```css
:root {
  /* steel/graphite — housing, structure, neutral text */
  --steel-900: #1b1e22;
  --steel-700: #33383f;
  --steel-500: #5a6169;
  --steel-300: #8b939c;
  --steel-100: #c7ccd1;

  /* brass/copper — accents, coin, interactive fills */
  --brass-700: #7a5327;
  --brass-500: #b3813f;
  --brass-300: #dcb279;

  /* neutrals */
  --paper: #eae6da;
  --ink: var(--steel-900);

  /* functional accents */
  --danger: #b3502f; /* jam state */
  --focus: #f2c14e;  /* focus-visible outline, kept distinct from brass */
}
```

The coin moved into the brass family instead of keeping a unique yellow — more
materially honest for an industrial machine.

## Spec tests pending rewrite

`spec/color-palette.test.ts` and `spec/stroke-consistency.test.ts` encoded the
old design's constraints (a flat 7-hex cap, a uniform ~6px border/stroke
weight). They're skipped (not deleted) while this direction settles, and will
be rewritten to match the new tonal-family palette and the illustrated shell's
varied stroke weights once the direction is stable.
