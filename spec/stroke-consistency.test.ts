import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Style guide: every outline in the machine's artwork — the teal cabinet
// itself, the lever, the coin, the "$1 ONLY" marquee, the "set the year"
// window, and the gauge step buttons — should look like the same weight of
// line on screen.
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

function ruleBody(css: string, selector: string): string | null {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|})${escaped}\\{([^}]*)}`).exec(css)?.[1] ?? null;
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

  it("draws every outline at the same pixel width on screen", () => {
    const css = builtCss();
    const doc = new JSDOM(readFileSync(join(distDir, "index.html"), "utf8")).window.document;

    const widths = {
      "gauge track": effectiveStrokeWidth(css, doc, ".gauge-track", "gauge-arc"),
      "gauge tick": effectiveStrokeWidth(css, doc, ".gauge-tick", "gauge-arc"),
      "gauge needle": effectiveStrokeWidth(css, doc, ".gauge-needle", "gauge-arc"),
      "lever bracket": effectiveStrokeWidth(css, doc, ".lever-bracket", "lever-svg"),
      "lever rod": effectiveStrokeWidth(css, doc, ".lever-rod rect", "lever-svg"),
      "lever knob": effectiveStrokeWidth(css, doc, ".lever-knob", "lever-svg"),
      "marquee border": borderWidth(css, ".machine-marquee"),
      "year window border": borderWidth(css, ".machine-window"),
      "gauge button border": borderWidth(css, ".gauge-step"),
      "coin border": borderWidth(css, ".machine-coin"),
      "cabinet border": borderWidth(css, ".machine"),
    };

    const values = Object.values(widths);
    const spread = Math.max(...values) - Math.min(...values);
    const summary = Object.entries(widths)
      .map(([label, px]) => `${label}=${px.toFixed(2)}px`)
      .join(", ");

    // A tight tolerance, not exact equality: these are drawn through two
    // different rendering paths (scaled SVG strokes vs. plain CSS borders),
    // so this asserts they read as the same weight, not that they're
    // computed identically.
    expect(spread, `outline widths should all render within 0.5px of each other, found: ${summary}`).toBeLessThanOrEqual(0.5);
  });
});
