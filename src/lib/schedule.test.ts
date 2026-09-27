import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { easternLocalInput, parseEasternDateTime } from "./schedule.ts";

test("datetime-local values are America/New_York wall time, including daylight saving", () => {
  assert.equal(parseEasternDateTime("2026-10-01T10:00"), "2026-10-01T14:00:00.000Z");
  assert.equal(parseEasternDateTime("2026-01-15T10:00"), "2026-01-15T15:00:00.000Z");
  assert.equal(easternLocalInput("2026-10-01T14:00:00.000Z"), "2026-10-01T10:00");
  assert.equal(easternLocalInput("2026-01-15T15:00:00.000Z"), "2026-01-15T10:00");
  assert.equal(parseEasternDateTime("2026-10-01T14:00:00.000Z"), "2026-10-01T14:00:00.000Z");
  assert.equal(parseEasternDateTime(""), null);
  assert.equal(parseEasternDateTime("not-a-time"), null);
});

test("pickup and load forms parse Eastern time, and the donate form keeps contact fields", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  for (const path of [
    "../app/api/pickups/route.ts",
    "../app/api/store-desk/load/route.ts",
    "../app/api/food-donors/[id]/load/route.ts",
    "../app/api/food-loads/[id]/route.ts"
  ]) {
    assert.equal(read(path).includes("parseEasternDateTime"), true, path);
    assert.equal(read(path).includes("new Date(str(body."), false, path);
  }
  const donate = read("../app/donate/page.tsx");
  assert.equal(donate.includes('name="contactName"'), true);
  assert.equal(donate.includes('name="contactPhone"'), true);
  assert.equal(donate.includes('name="contactEmail"'), true);
  assert.equal(donate.includes('name="deskNote"'), true);
  const pickups = read("../app/api/pickups/route.ts");
  assert.equal(pickups.includes("id: pickup.id"), true);
  assert.equal(pickups.includes("contactEmail"), true);
  const desk = read("../app/run/pickups/page.tsx");
  assert.equal(desk.includes("easternLocalInput"), true);
  assert.equal(desk.includes('name="label" required'), false);
  assert.equal(desk.includes("Label, optional"), true);
  assert.equal(desk.includes("sentTo.length"), true);
  const people = read("../lib/db/queries.ts");
  assert.equal(people.includes('["created_by", "user_id"]'), true);
  assert.equal(read("../app/run/people/page.tsx").includes("listContributions(pantry.id).catch"), true);
});
