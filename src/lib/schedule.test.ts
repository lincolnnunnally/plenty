import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { easternLocalInput, parseEasternDateTime, parseZonedDateTime, pickupTimeLabel, resolvePickupTimeZone, zonedLocalInput } from "./schedule.ts";

test("datetime-local values are America/New_York wall time, including daylight saving", () => {
  assert.equal(parseEasternDateTime("2026-10-01T10:00"), "2026-10-01T14:00:00.000Z");
  assert.equal(parseEasternDateTime("2026-01-15T10:00"), "2026-01-15T15:00:00.000Z");
  assert.equal(parseEasternDateTime("2026-12-03T10:00"), "2026-12-03T15:00:00.000Z");
  assert.equal(easternLocalInput("2026-10-01T14:00:00.000Z"), "2026-10-01T10:00");
  assert.equal(easternLocalInput("2026-12-03T15:00:00.000Z"), "2026-12-03T10:00");
  assert.equal(easternLocalInput("2026-01-15T15:00:00.000Z"), "2026-01-15T10:00");
  assert.equal(parseEasternDateTime("2026-10-01T14:00:00.000Z"), "2026-10-01T14:00:00.000Z");
  assert.equal(parseEasternDateTime(""), null);
  assert.equal(parseEasternDateTime("not-a-time"), null);
  assert.equal(parseZonedDateTime("2026-10-01T10:00", "America/Chicago"), "2026-10-01T15:00:00.000Z");
  assert.equal(zonedLocalInput("2026-10-01T15:00:00.000Z", "America/Chicago"), "2026-10-01T10:00");
  assert.equal(parseZonedDateTime("2026-03-08T02:30", "America/New_York"), null);
});

test("a location timezone wins, then the pantry, otherwise America/New_York", () => {
  assert.equal(resolvePickupTimeZone(), "America/New_York");
  assert.equal(resolvePickupTimeZone({ pantry: { timezone: "" } }), "America/New_York");
  assert.equal(resolvePickupTimeZone({ pantry: { timezone: "Not/AZone" } }), "America/New_York");
  assert.equal(resolvePickupTimeZone({ pantry: { timezone: "America/Chicago" } }), "America/Chicago");
  assert.equal(resolvePickupTimeZone({ pantry: { time_zone: "America/Chicago" } }), "America/Chicago");
  assert.equal(
    resolvePickupTimeZone({ pantry: { timezone: "America/Chicago" }, location: { timezone: "America/Denver" } }),
    "America/Denver"
  );
  assert.equal(
    resolvePickupTimeZone({ pantry: { timezone: "America/Chicago" }, location: { time_zone: "America/Los_Angeles" } }),
    "America/Los_Angeles"
  );
  assert.equal(
    resolvePickupTimeZone({ pantry: { timezone: "America/Chicago" }, location: { timezone: "nope" } }),
    "America/Chicago"
  );
  assert.equal(pickupTimeLabel("America/New_York"), "When (Eastern)");
  assert.equal(pickupTimeLabel("America/Chicago", "Pickup time"), "Pickup time (America/Chicago)");
});

test("pickup and load forms parse wall time in the pantry zone, and a donor pickup requires contact", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  for (const path of [
    "../app/api/pickups/route.ts",
    "../app/api/store-desk/load/route.ts",
    "../app/api/food-donors/[id]/load/route.ts",
    "../app/api/food-loads/[id]/route.ts"
  ]) {
    const source = read(path);
    assert.equal(source.includes("parseZonedDateTime"), true, path);
    assert.equal(source.includes("resolvePickupTimeZone"), true, path);
    assert.equal(source.includes("new Date(str(body."), false, path);
  }
  const donate = read("../app/donate/page.tsx");
  assert.equal(donate.includes('name="contactName" defaultValue={user.name} required'), true);
  assert.equal(donate.includes('name="contactPhone"'), true);
  assert.equal(donate.includes('name="contactEmail" defaultValue={user.email}'), true);
  assert.equal(donate.includes('name="contactPhone" required'), false);
  assert.equal(donate.includes('name="contactEmail" required'), false);
  assert.equal(donate.includes('name="deskNote"'), true);
  assert.equal(donate.includes('name="deskNote" required'), false);
  const pickups = read("../app/api/pickups/route.ts");
  assert.equal(pickups.includes("id: pickup.id"), true);
  assert.equal(pickups.includes("donorPickupContact"), true);
  assert.equal(pickups.includes('kind === "donation_pickup"'), true);
  assert.equal(pickups.includes("timeZone: zone.timeZone"), true);
  const desk = read("../app/run/pickups/page.tsx");
  assert.equal(desk.includes("resolvePickupTimeZone"), true);
  assert.equal(desk.includes("zonedLocalInput"), true);
  assert.equal(desk.includes("formatEasternWhen(p.scheduled_for, p.window_text, zone)"), true);
  assert.equal(desk.includes('name="label" required'), false);
  assert.equal(desk.includes("Label, optional"), true);
  assert.equal(desk.includes("sentTo.length"), true);
  const people = read("../lib/db/queries.ts");
  assert.equal(people.includes('["created_by", "user_id"]'), true);
  assert.equal(people.includes("colsWithZone"), true);
  assert.equal(read("../app/run/people/page.tsx").includes("listContributions(pantry.id).catch"), true);
  assert.equal(read("../app/api/cron/tick/route.ts").includes("resolvePickupTimeZone"), true);
  assert.equal(read("../lib/db/food-loads.ts").includes("timeZone"), true);
});
