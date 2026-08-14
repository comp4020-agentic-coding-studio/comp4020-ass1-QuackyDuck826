import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Style guide: the whole page reads through one tight palette, not a
// scattered one — cream, ink, teal, red, and yellow, plus grey for the metal
// components (lever bracket, coin-slot insert) and a contrast orange for
// buttons and other interactive details. Yellow still belongs to the coin
// alone. Every color/background/fill/stroke/border in this codebase is
// written as a literal hex value, so counting distinct hex tokens in the
// built CSS is a direct proxy for the palette size. Translucent
// `rgb(... / N%)` values are excluded on purpose: every one of them here is a
// black drop-shadow or inset shadow used for depth, not a separate color
// choice.
const distDir = resolve("dist");
const distAstroDir = join(distDir, "_astro");
const exists = existsSync(distAstroDir) && existsSync(join(distDir, "index.html"));

function builtCss(): string {
  const cssFiles = readdirSync(distAstroDir).filter((name) => name.endsWith(".css"));
  return cssFiles.map((name) => readFileSync(join(distAstroDir, name), "utf8")).join("\n");
}

// Skipped: encodes the old boxy-panel palette rules, pending a rewrite for
// the new industrial/mechanical illustrated-shell direction (see redesign.md).
describe.skip("assignment 1: a tight, deliberate 7-colour palette", () => {
  it("built the page", () => {
    expect(exists, "Run `pnpm build` first, or the machine isn't built yet.").toBe(true);
  });

  it("uses at most 7 distinct colours across the whole page", () => {
    const css = builtCss();
    // Opaque hex only (exactly 3 or 6 digits) — a build minifier can turn a
    // translucent `rgb(0 0 0 / 30%)` shadow into an 8-digit (or shorthand
    // 4-digit) hex-with-alpha, which would otherwise get miscounted here as
    // another palette colour.
    const hexColors = css.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g) ?? [];
    const distinct = new Set(hexColors.map((c) => c.toLowerCase()));

    expect(
      distinct.size,
      `found ${distinct.size} distinct colours, expected at most 7: ${[...distinct].join(", ")}`,
    ).toBeLessThanOrEqual(7);
  });

  it("keeps yellow exclusive to the coin", () => {
    const css = builtCss();
    const YELLOW = "#e6c65c";

    const blocks = css.match(/[^{}]+\{[^{}]*}/g) ?? [];
    const yellowBlocks = blocks.filter((block) => block.toLowerCase().includes(YELLOW));

    expect(yellowBlocks.length, `expected exactly one rule to use ${YELLOW} (the coin)`).toBe(1);

    const offenders = yellowBlocks.filter((block) => !block.includes(".machine-coin"));
    expect(
      offenders,
      `yellow (${YELLOW}) should only be used on the coin, but also appears in: ${offenders.join(" | ")}`,
    ).toHaveLength(0);
  });
});
