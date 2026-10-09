import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { summarize } from "../src/summary.ts";

const empty = { total: 0, open: 0, inProgress: 0, done: 0 };

test("empty input has zero counts", () => {
  assert.deepEqual(summarize([]), empty);
});

test("archived tasks are excluded", () => {
  assert.deepEqual(summarize([
    { id: "1", title: "Retired", status: "done", archived: true },
  ]), empty);
});

test("explicitly active tasks are counted by status", () => {
  assert.deepEqual(summarize([
    { id: "1", title: "A", status: "open", archived: false },
    { id: "2", title: "B", status: "in_progress", archived: false },
    { id: "3", title: "C", status: "done", archived: false },
  ]), { total: 3, open: 1, inProgress: 1, done: 1 });
});

test("missing archived defaults to active (mixed fixture)", async () => {
  const tasks = JSON.parse(await readFile(new URL("../fixtures/tasks.json", import.meta.url), "utf8"));
  // Hand-counted from the product rule, not computed using the implementation.
  assert.deepEqual(summarize(tasks), { total: 4, open: 1, inProgress: 1, done: 2 });
});

test("summary does not mutate its input", () => {
  const tasks = Object.freeze([
    Object.freeze({ id: "1", title: "A", status: "open", archived: false }),
    Object.freeze({ id: "2", title: "B", status: "done", archived: true }),
  ]);
  const before = JSON.stringify(tasks);
  summarize(tasks);
  assert.equal(JSON.stringify(tasks), before);
});
