# Assignment 1: the $1 vending machine

## Context

Assignment 1 asks for one interactive explainer — "something you think more
people should know or understand" — built as one strong idea with one dataset
or mechanic and nothing else. After brainstorming a spread of topics and two
rounds of interaction options, the chosen idea is inflation made physical: a
vending machine where a fixed $1 buys wildly different things depending on
what year you set it to. This document covers only that option, fleshed out
enough to state the core interaction plainly (per the spec line: "the visitor
does something that changes what they see — state the core interaction
plainly enough to write a test for it").

## The idea

A dollar isn't a fixed amount of stuff — it's a shrinking claim on the world.
Rather than show that as a chart or number, the machine *enacts* it: same
coin, same lever, wildly different prize depending on the year. The
punchline the whole build is aimed at: set the dial to today, pull the lever,
and get something absurdly small (or nothing at all) — the machine's own
disappointment makes the point better than a statistic would.

## The core interaction

1. **Set the year** — a dial or year selector on the machine's face (rotate a
   knob, or step through with +/- buttons so it works on touch and keyboard
   alike). Changing it updates a small year readout on the machine.
2. **Insert the coin** — click/tap the coin slot. A $1 coin animates into the
   slot.
3. **Pull the lever** — drag or click a lever. This is the moment of state
   change: the machine "processes" the selected year and dispenses.
4. **Dispensed result** — an item drops into the tray with a label/illustration
   representing what $1 bought in that year (a hot meal in the 1950s, a
   chocolate bar in the 1990s, a single gumball — or a jammed, empty tray with
   an "OUT OF STOCK" flap — today).

What visibly changes, stated plainly for the test: **pulling the lever changes
the contents of the dispenser tray, and the result depends on the year set on
the dial.** That's the one assertion worth writing — dial set to an early year
+ lever pulled → a "generous" result; dial set to the present year + lever
pulled → a "meagre/empty" result.

## Data needed

Not a full CPI series — a handful of concrete, well-sourced "$1 bought X in
year Y" facts to hang the mechanic on, e.g. (AUD, to match the course's
Australian context — worth grounding in real ABS/RBA inflation-calculator
figures rather than invented ones):

- an early decade (e.g. 1960s–70s): something substantial — a full meal, a
  cinema ticket plus snacks
- a middle decade (e.g. 1990s–2000s): something modest — a chocolate bar, a
  can of soft drink
- today (2026): something token, or the "machine keeps your dollar" jam — the
  comedic/point-of-view payoff

Three to five year-points is plenty; more only helps if the dial supports fine
scrubbing between them (in which case intermediate years can interpolate to
the nearest defined point rather than needing their own fact).

## Build notes

- Keep it to one page, one machine, no navigation required beyond the
  invariant nav landmark.
- Mark the lever and the dispensed-result element with `data-testid` (e.g.
  `core-interaction-trigger` on the lever, `core-interaction-result` on the
  tray contents) so `spec/assignment-1.test.ts` can assert on them directly.
- Dial and lever both need keyboard equivalents (buttons or `<input
  type="range">` plus a real `<button>` for the lever), not just drag
  gestures, so the interaction survives "the keyboard, a resize mid-
  interaction" the marking criteria call out.
- Animation (crumple, drop, jam) can be CSS transitions/keyframes on a couple
  of DOM elements — no canvas or animation library needed for this scope.

## Status: implemented

Built as `src/pages/index.astro` + `src/scripts/main.ts` + the `.machine-*`
rules in `src/styles/global.css`. Four year points, grounded where a real
figure was findable:

- **1970** — a standing-room ticket to the (Australian Rules) Grand Final was
  80c, so $1 covered it with 20c left over.
- **1978** — a 200g block of chocolate was 95c.
- **1995** — a can of soft drink from a vending machine, roughly $1 at the
  time (less precisely sourced than the two above).
- **2026** — nothing; the machine keeps the coin and jams.

`spec/assignment-1.test.ts` asserts the contract directly: a lever
(`core-interaction-trigger`) and a result tray (`core-interaction-result`)
exist, the year dial offers more than one year with a distinct result each,
and the latest year's result reads as scarce. Verified working (mouse,
keyboard-only activation, no console errors) at both marking viewports,
1920×1080 and 390×844, via a headless-Chromium smoke check.
