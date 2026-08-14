import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Style guide: every outline in the machine's artwork — the teal cabinet
// itself, the coin, the "$1 ONLY" marquee, the "set the year" window, and
// the gauge step buttons — should look like the same weight of line on
// screen. The lever is a deliberate exception: at a matching stroke-width it
// still read as visually thinner than the rest (a small, sparse shape reads
// lighter than a big filled one even at the same pixel weight), so it's
// drawn heavier on purpose.
//
// A matching declared `stroke-width` is NOT the same thing: an SVG stroke is
// drawn in the shape's own viewBox units, then scaled up or down to whatever
// CSS size the <svg> is rendered at. `.gauge-arc` renders its 200-wide
// viewBox at 9rem, and `.lever-svg` renders its 120-wide viewBox at 6.5rem —
// two different scale factors — so a `stroke-width: 3` in each renders at two
// different pixel widths, even though the declared number matches. This
// check converts each stroke to the pixel width it actually paints at
// (accounting for that scale, unless `vector-effect: non-scaling-stroke`
// pins it to real pixels) and compares that to the plain CSS `border-width`
// on the non-SVG controls, which is always already in real pixels.
const distDir = resolve("dist");
const distAstroDir = join(distDir, "_astro");
const exists = existsSync(distAstroDir) && existsSync(join(distDir, "index.html"));
const REM_PX = 16; // this site never overrides the root font-size

function builtCss(): string {
  const cssFiles = readdirSync(distAstroDir).filter((name) => name.endsWith(".css"));
  return cssFiles.map((name) => readFileSync(join(distAstroDir, name), "utf8")).join("\n");
}

// A minifier merges rules that end up with identical declarations (e.g. two
// selectors that both resolve to the same color once the palette is small),
// turning `.a{...}` and `.b{...}` into `.a,.b{...}`. Scan selector lists
// rather than matching one exact selector string so that merge still resolves.
function ruleBody(css: string, selector: string): string | null {
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)}/g)) {
    const [, selectorList, body] = match;
    if (selectorList.split(",").some((part) => part.trim() === selector)) return body;
  }
  return null;
}

function toPx(value: string): number {
  const match = /^([\d.]+)(rem|px)$/.exec(value.trim());
  if (!match) throw new Error(`unrecognised length: ${value}`);
  return match[2] === "rem" ? Number(match[1]) * REM_PX : Number(match[1]);
}

// The declared stroke-width, converted to the pixels it actually renders at.
function effectiveStrokeWidth(css: string, doc: Document, shapeSelector: string, svgClass: string): number {
  const body = ruleBody(css, shapeSelector);
  if (!body) throw new Error(`no rule found for ${shapeSelector}`);

  const strokeWidth = /stroke-width:\s*([\d.]+)px/.exec(body);
  if (!strokeWidth) throw new Error(`no stroke-width found for ${shapeSelector}`);
  const declaredPx = Number(strokeWidth[1]);

  if (/vector-effect:\s*non-scaling-stroke/.test(body)) return declaredPx;

  const svg = doc.querySelector(`svg.${svgClass}`);
  const viewBoxWidth = Number(svg?.getAttribute("viewBox")?.split(/\s+/)[2]);
  const renderedWidth = toPx(/width:\s*([^;]+)/.exec(ruleBody(css, `.${svgClass}`) ?? "")?.[1] ?? "");
  return declaredPx * (renderedWidth / viewBoxWidth);
}

function borderWidth(css: string, selector: string): number {
  const body = ruleBody(css, selector);
  const match = body ? /border:\s*([\d.]+)px/.exec(body) : null;
  if (!match) throw new Error(`no border found for ${selector}`);
  return Number(match[1]);
}

describe("assignment 1: consistent outline stroke widths", () => {
  it("built the page", () => {
    expect(exists, "Run `pnpm build` first, or the machine isn't built yet.").toBe(true);
  });

  it("draws every outline (except the lever) at the same pixel width on screen", () => {
    const css = builtCss();
    const doc = new JSDOM(readFileSync(join(distDir, "index.html"), "utf8")).window.document;

    const baseline = {
      "gauge track": effectiveStrokeWidth(css, doc, ".gauge-track", "gauge-arc"),
      "gauge tick": effectiveStrokeWidth(css, doc, ".gauge-tick", "gauge-arc"),
      "gauge needle": effectiveStrokeWidth(css, doc, ".gauge-needle", "gauge-arc"),
      "marquee border": borderWidth(css, ".machine-marquee"),
      "year window border": borderWidth(css, ".machine-window"),
      "gauge button border": borderWidth(css, ".gauge-step"),
      "coin border": borderWidth(css, ".machine-coin"),
      "cabinet border": borderWidth(css, ".machine"),
    };

    const values = Object.values(baseline);
    const spread = Math.max(...values) - Math.min(...values);
    const summary = Object.entries(baseline)
      .map(([label, px]) => `${label}=${px.toFixed(2)}px`)
      .join(", ");

    // A tight tolerance, not exact equality: these are drawn through two
    // different rendering paths (scaled SVG strokes vs. plain CSS borders),
    // so this asserts they read as the same weight, not that they're
    // computed identically.
    expect(spread, `outline widths should all render within 0.5px of each other, found: ${summary}`).toBeLessThanOrEqual(0.5);
  });

  it("draws the lever heavier than the baseline outlines, on purpose", () => {
    const css = builtCss();
    const doc = new JSDOM(readFileSync(join(distDir, "index.html"), "utf8")).window.document;

    const baselineMax = Math.max(
      effectiveStrokeWidth(css, doc, ".gauge-track", "gauge-arc"),
      borderWidth(css, ".machine"),
    );

    const lever = {
      "lever bracket": effectiveStrokeWidth(css, doc, ".lever-bracket", "lever-svg"),
      "lever rod": effectiveStrokeWidth(css, doc, ".lever-rod rect", "lever-svg"),
      "lever knob": effectiveStrokeWidth(css, doc, ".lever-knob", "lever-svg"),
    };

    for (const [label, px] of Object.entries(lever)) {
      expect(
        px,
        `${label} should render heavier than the baseline outline weight (${px.toFixed(2)}px vs ${baselineMax.toFixed(2)}px)`,
      ).toBeGreaterThan(baselineMax);
    }
  });
});
