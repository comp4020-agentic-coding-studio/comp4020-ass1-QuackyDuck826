import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// Assignment 1's published spec (comp.anu.edu.au/courses/comp4020-agentic-coding-studio/assessments/assignment-1/):
//   "the visitor does something that changes what they see — state the core
//   interaction plainly enough to write a test for it"
//
// The rest of the spec is covered elsewhere: deploy/invariants/evidence are
// checked by the template and CI already; "one strong idea" and "works at both
// viewports" are judged by a person at the crit, not by this suite.
//
// TODO once the idea is chosen: replace TRIGGER_TESTID and RESULT_TESTID below
// with real data-testid values from the prototype, and describe what changing
// should mean in the test name and assertion. This test is deliberately red
// until then — that's the point, not a bug.
const TRIGGER_TESTID = "core-interaction-trigger";
const RESULT_TESTID = "core-interaction-result";

const NOT_YET =
  "Core interaction not defined yet. Pick the idea, then replace this test: " +
  "mark the interactive element with data-testid (or similar) and assert what " +
  "changes when the visitor uses it. See spec/assignment-1.test.ts.";

describe("assignment 1: core interaction", () => {
  it("the visitor does something that changes what they see", () => {
    const distPath = resolve("dist/index.html");
    expect(existsSync(distPath), NOT_YET).toBe(true);

    const doc = new JSDOM(readFileSync(distPath, "utf8")).window.document;
    expect(doc.querySelector(`[data-testid="${TRIGGER_TESTID}"]`), NOT_YET).toBeTruthy();
    expect(doc.querySelector(`[data-testid="${RESULT_TESTID}"]`), NOT_YET).toBeTruthy();
  });
});
