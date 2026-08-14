import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Assignment 1's published spec (comp.anu.edu.au/courses/comp4020-agentic-coding-studio/assessments/assignment-1/):
//   "the visitor does something that changes what they see — state the core
//   interaction plainly enough to write a test for it"
//
// The core interaction: the visitor sets a year on the machine's dial and
// pulls the lever; the tray dispenses whatever $1 bought that year. Early
// years dispense something substantial (a 1970 footy grand-final ticket
// was 80c; a 1978 block of chocolate was 95c); today dispenses next to
// nothing. That contrast IS the point of view, so it's the one thing worth
// asserting statically here — the rest (deploy, evidence, "one strong idea",
// how it feels at both viewports) is covered elsewhere or judged at the crit.
//
// These assert the markup CONTRACT (a dial with per-year results, a lever,
// a result tray), not simulated runtime JS behaviour — consistent with how
// spec/invariants.test.ts checks the built HTML rather than executing it.
const distPath = resolve("dist/index.html");
const exists = existsSync(distPath);
const doc = exists ? new JSDOM(readFileSync(distPath, "utf8")).window.document : null;

describe("assignment 1: the $1 vending machine", () => {
  it("built the page", () => {
    expect(exists, "Run `pnpm build` first, or the machine isn't built yet.").toBe(true);
  });

  it("has a lever that triggers the dispense", () => {
    expect(doc?.querySelector('[data-testid="core-interaction-trigger"]')).toBeTruthy();
  });

  it("has a tray that shows the dispensed result", () => {
    expect(doc?.querySelector('[data-testid="core-interaction-result"]')).toBeTruthy();
  });

  it("offers more than one year, each with its own result", () => {
    const dial = doc?.querySelector('[data-testid="year-dial"]');
    const options = Array.from(dial?.querySelectorAll("option") ?? []);

    expect(options.length, "the dial needs at least two years to make the contrast").toBeGreaterThan(1);

    const results = options.map((o) => o.getAttribute("data-result")?.trim());
    expect(results.every((r) => !!r), "every year option needs a data-result").toBe(true);
    expect(new Set(results).size, "results must actually differ by year, not repeat").toBe(results.length);
  });

  it("today's dollar reads as scarce next to the earliest year's", () => {
    const dial = doc?.querySelector('[data-testid="year-dial"]');
    const options = Array.from(dial?.querySelectorAll("option") ?? []);
    const years = options.map((o) => Number(o.getAttribute("value")));
    const latest = options[years.indexOf(Math.max(...years))];

    const scarcityWords = ["nothing", "empty", "jam", "out of stock"];
    const latestResult = latest?.getAttribute("data-result")?.toLowerCase() ?? "";
    expect(
      scarcityWords.some((w) => latestResult.includes(w)),
      `the latest year's result ("${latestResult}") should read as scarce — that's the machine's whole point`,
    ).toBe(true);
  });
});
