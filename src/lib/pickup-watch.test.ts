import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { deliverOwnerAttention } from "./owner-signup-notice.ts";
import {
  composePickupAttention,
  composeReminder,
  dueReminders,
  groupPickups,
  pickupIsOverdue,
  pickupNeedsScheduling,
  runPickupWatch,
  sortUpcoming,
  type ReminderRow
} from "./pickup-watch.ts";

const reviewUrl = "https://plenty.unitedundergod.org/run/pickups";

function row(patch: Partial<ReminderRow> = {}): ReminderRow {
  return {
    id: "qa-delete-me-pickup",
    status: "requested",
    scheduled_for: "2026-09-28T16:00:00.000Z",
    assigned_user_id: null,
    kind: "donation_pickup",
    address: "12 Main St, Lyons, GA",
    contact_name: "qa-delete-me- Lyons Market",
    contact_phone: "912-555-0199",
    notes: "leftover produce",
    window_text: "",
    reminder_24h_at: null,
    reminder_morning_at: null,
    overdue_alert_at: null,
    ...patch
  };
}

test("a new pickup notice has when, where, what, org, contact, and the desk link", () => {
  const notice = composePickupAttention({
    org: "qa-delete-me- Lyons Market",
    contactName: "Ada Manager",
    contactPhone: "912-555-0199",
    address: "12 Main St, Lyons, GA",
    whenIso: "2026-09-27T13:30:00.000Z",
    what: "leftover produce",
    reviewUrl
  });
  assert.equal(notice.subject, "Pickup needs someone to show up: qa-delete-me- Lyons Market");
  assert.match(notice.text, /When: .+EDT/);
  assert.match(notice.text, /9:30/);
  assert.match(notice.text, /Where: 12 Main St, Lyons, GA/);
  assert.match(notice.text, /What: leftover produce/);
  assert.match(notice.text, /Org: qa-delete-me- Lyons Market/);
  assert.match(notice.text, /Contact: Ada Manager 912-555-0199/);
  assert.match(notice.text, /Review: https:\/\/plenty\.unitedundergod\.org\/run\/pickups/);
});

test("the request still completes when the owner email fails", async () => {
  const saved = { ok: true, id: "qa-delete-me-pickup" };
  const original = console.error;
  console.error = () => undefined;
  const failed = await deliverOwnerAttention(
    { subject: "Pickup needs someone to show up: qa-delete-me- Lyons Market", text: "Where: 12 Main St" },
    async () => {
      throw new Error("socket hang up for ada@example.com");
    }
  );
  console.error = original;
  assert.equal(failed.ok, false);
  assert.equal(saved.ok, true);

  const marked: string[] = [];
  const watch = await runPickupWatch({
    rows: [row()],
    now: new Date("2026-09-28T15:00:00.000Z"),
    reviewUrl,
    deliver: async () => ({ ok: false }),
    mark: async (id, kind) => {
      marked.push(`${id}:${kind}`);
    }
  });
  assert.equal(watch.failed > 0, true);
  assert.deepEqual(marked, []);
  assert.deepEqual(watch.sent, []);
});

test("unscheduled requests sit above upcoming pickups, then overdue", () => {
  const now = new Date("2026-09-28T16:00:00.000Z");
  const rows = [
    row({ id: "later", scheduled_for: "2026-09-29T16:00:00.000Z" }),
    row({ id: "none", scheduled_for: null, window_text: "" }),
    row({ id: "window", scheduled_for: null, window_text: "sometime Tuesday" }),
    row({ id: "marked", status: "needs_scheduling", scheduled_for: "2026-09-29T18:00:00.000Z" }),
    row({ id: "done", status: "done", scheduled_for: "2026-09-27T16:00:00.000Z" }),
    row({ id: "overdue", scheduled_for: "2026-09-28T15:00:00.000Z" }),
    row({ id: "stale-unscheduled", status: "needs_scheduling", scheduled_for: "2026-09-28T12:00:00.000Z" }),
    row({ id: "cancelled", status: "cancelled", scheduled_for: "2026-09-28T14:00:00.000Z" })
  ];
  assert.deepEqual(sortUpcoming(rows, now).map((item) => item.id), ["none", "window", "marked", "stale-unscheduled", "later", "overdue", "done", "cancelled"]);
  const groups = groupPickups(rows, now);
  assert.deepEqual(groups.needsScheduling.map((item) => item.id), ["none", "window", "marked", "stale-unscheduled"]);
  assert.deepEqual(groups.upcoming.map((item) => item.id), ["later"]);
  assert.deepEqual(groups.overdue.map((item) => item.id), ["overdue"]);
  const byId = (id: string) => rows.find((item) => item.id === id)!;
  assert.equal(pickupNeedsScheduling(byId("none")), true);
  assert.equal(pickupNeedsScheduling(byId("window")), true);
  assert.equal(pickupNeedsScheduling(byId("marked")), true);
  assert.equal(pickupNeedsScheduling(byId("later")), false);
  assert.equal(pickupIsOverdue(byId("overdue"), now), true);
  assert.equal(pickupIsOverdue(byId("done"), now), false);
  assert.equal(pickupIsOverdue(byId("cancelled"), now), false);
});

test("reminders send once about 24h before, once at 7 AM Eastern on the pickup day, and once when overdue", async () => {
  const soon = row({ scheduled_for: "2026-09-28T20:00:00.000Z" });
  assert.deepEqual(dueReminders(soon, new Date("2026-09-27T20:00:00.000Z")), ["24h"]);
  assert.deepEqual(dueReminders({ ...soon, reminder_24h_at: "sent" }, new Date("2026-09-27T20:00:00.000Z")), []);

  const today = row({ scheduled_for: "2026-09-28T18:00:00.000Z", reminder_24h_at: "sent" });
  assert.deepEqual(dueReminders(today, new Date("2026-09-28T10:59:00.000Z")), []);
  assert.deepEqual(dueReminders(today, new Date("2026-09-28T11:00:00.000Z")), ["morning"]);
  assert.deepEqual(
    dueReminders({ ...today, assigned_user_id: "driver-1" }, new Date("2026-09-28T11:00:00.000Z")),
    ["morning"]
  );
  assert.deepEqual(dueReminders({ ...today, reminder_morning_at: "sent" }, new Date("2026-09-28T12:00:00.000Z")), []);

  const late = row({ scheduled_for: "2026-09-28T15:00:00.000Z", reminder_24h_at: "sent", reminder_morning_at: "sent" });
  assert.deepEqual(dueReminders(late, new Date("2026-09-28T16:00:00.000Z")), ["overdue"]);
  assert.deepEqual(dueReminders({ ...late, overdue_alert_at: "sent" }, new Date("2026-09-28T16:00:00.000Z")), []);
  assert.deepEqual(dueReminders({ ...late, status: "done" }, new Date("2026-09-28T16:00:00.000Z")), []);

  const marked: string[] = [];
  const subjects: string[] = [];
  const first = await runPickupWatch({
    rows: [row({ id: "qa-delete-me-watch", scheduled_for: "2026-09-28T20:00:00.000Z" })],
    now: new Date("2026-09-27T20:00:00.000Z"),
    reviewUrl,
    deliver: async (notice) => {
      subjects.push(notice.subject);
      assert.match(notice.text, /qa-delete-me- Lyons Market/);
      assert.match(notice.text, /12 Main St/);
      assert.match(notice.text, /leftover produce/);
      assert.match(notice.text, new RegExp(reviewUrl.replace(/[.]/g, "\\.")));
      return { ok: true };
    },
    mark: async (id, kind) => {
      marked.push(`${id}:${kind}`);
    }
  });
  assert.deepEqual(first.sent, ["24h"]);
  assert.equal(subjects[0], "Pickup in about 24 hours: qa-delete-me- Lyons Market");
  assert.deepEqual(marked, ["qa-delete-me-watch:24h"]);

  const overdue = composeReminder(late, "overdue", reviewUrl);
  assert.match(overdue.subject, /time passed/);
  const morning = composeReminder(today, "morning", reviewUrl);
  assert.equal(morning.subject, "Pickup today: qa-delete-me- Lyons Market");
});

test("the pickup desk lists unscheduled requests under Needs scheduling", () => {
  const page = readFileSync(new URL("../app/run/pickups/page.tsx", import.meta.url), "utf8");
  const calendar = readFileSync(new URL("../app/run/calendar/page.tsx", import.meta.url), "utf8");
  assert.equal(page.indexOf("Needs scheduling") < page.indexOf("Upcoming pickups"), true);
  assert.equal(page.indexOf("Upcoming pickups") < page.indexOf(">Overdue<"), true);
  assert.equal(page.includes("groupPickups"), true);
  assert.equal(calendar.includes("Needs scheduling"), true);
  assert.equal(calendar.includes("groupPickups"), true);
});

test("owner pickup mail is only on pickup, food-load, and store request paths", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  for (const path of [
    "../app/api/pickups/route.ts",
    "../lib/db/food-loads.ts",
    "../app/api/store-partners/route.ts",
    "../app/api/cron/tick/route.ts"
  ]) {
    assert.equal(read(path).includes("composePickupAttention") || read(path).includes("runPickupWatch"), true, path);
  }
  for (const path of ["../app/api/donations/route.ts", "../app/api/visits/route.ts", "../app/api/households/route.ts"]) {
    const source = read(path);
    assert.equal(source.includes("composePickupAttention"), false, path);
    assert.equal(source.includes("runPickupWatch"), false, path);
  }
});
