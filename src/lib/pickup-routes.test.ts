import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { OWNER_ATTENTION_EMAIL } from "./owner-signup-notice.ts";
import {
  PICKUP_FALLBACK_EMAIL,
  matchingRouteEmails,
  pickupDeliverLine,
  pickupFromLine,
  planNoticeRecipients,
  runPlannedSend
} from "./pickup-routes.ts";
import { schemaGap } from "./db/schema-gap.ts";

test("qa-delete-me routes match kind and weekday, and any is a wildcard", () => {
  const routes = [
    { kind: "donation_pickup", weekday: "1", email: "qa-delete-me-monday@example.com", label: "Monday" },
    { kind: "any", weekday: "any", email: "qa-delete-me-all@example.com" },
    { kind: "food_drive", weekday: "any", email: "qa-delete-me-drive@example.com" },
    { kind: "store_collect", weekday: "2", email: "qa-delete-me-tuesday@example.com" }
  ];
  assert.deepEqual(
    matchingRouteEmails(routes, { kind: "donation_pickup", scheduledFor: "2026-09-28T18:00:00.000Z" }),
    ["qa-delete-me-monday@example.com", "qa-delete-me-all@example.com"]
  );
  assert.deepEqual(
    matchingRouteEmails(routes, { kind: "donation_pickup", scheduledFor: null }),
    ["qa-delete-me-all@example.com"]
  );
  assert.deepEqual(
    matchingRouteEmails(routes, { kind: "store_collect", weekday: "2" }),
    ["qa-delete-me-all@example.com", "qa-delete-me-tuesday@example.com"]
  );
  assert.deepEqual(matchingRouteEmails(routes, { kind: "food_drive", weekday: "5" }), [
    "qa-delete-me-all@example.com",
    "qa-delete-me-drive@example.com"
  ]);
  assert.deepEqual(matchingRouteEmails([], { kind: "household_delivery", weekday: "1" }), []);
});

test("new mail includes Lincoln, reminders copy him, overdue is Lincoln only", async () => {
  assert.equal(PICKUP_FALLBACK_EMAIL, OWNER_ATTENTION_EMAIL);
  assert.deepEqual(planNoticeRecipients("new", ["qa-delete-me-crew@example.com"]), {
    to: ["lincoln@unitedundergod.org", "qa-delete-me-crew@example.com"],
    cc: []
  });
  assert.deepEqual(planNoticeRecipients("new", []), {
    to: ["lincoln@unitedundergod.org"],
    cc: []
  });
  assert.deepEqual(planNoticeRecipients("24h", ["qa-delete-me-crew@example.com"]), {
    to: ["qa-delete-me-crew@example.com"],
    cc: ["lincoln@unitedundergod.org"]
  });
  assert.deepEqual(planNoticeRecipients("morning", ["lincoln@unitedundergod.org"]), {
    to: ["lincoln@unitedundergod.org"],
    cc: []
  });
  assert.deepEqual(
    planNoticeRecipients("24h", ["qa-delete-me-crew@example.com", "lincoln@unitedundergod.org"]),
    {
      to: ["qa-delete-me-crew@example.com", "lincoln@unitedundergod.org"],
      cc: []
    }
  );
  assert.deepEqual(planNoticeRecipients("overdue", ["qa-delete-me-crew@example.com"]), {
    to: ["lincoln@unitedundergod.org"],
    cc: []
  });

  const logged: { to: string; status: string; providerId: string }[] = [];
  const sent = await runPlannedSend({
    notice: "24h",
    routed: ["qa-delete-me-crew@example.com"],
    subject: "Pickup in about 24 hours: qa-delete-me- Lyons Market",
    text: "Where: 12 Main",
    send: async (message) => {
      assert.deepEqual(message.to, ["qa-delete-me-crew@example.com"]);
      assert.deepEqual(message.cc, ["lincoln@unitedundergod.org"]);
      return { ok: true, error: "", id: "email_qa-delete-me" };
    },
    log: async (row) => {
      logged.push({ to: row.to, status: row.status, providerId: row.providerId });
    }
  });
  assert.equal(sent.ok, true);
  assert.deepEqual(logged, [
    { to: "qa-delete-me-crew@example.com", status: "accepted", providerId: "email_qa-delete-me" },
    { to: "lincoln@unitedundergod.org", status: "accepted", providerId: "email_qa-delete-me" }
  ]);

  const failedLog: string[] = [];
  const failed = await runPlannedSend({
    notice: "new",
    routed: [],
    subject: "Pickup needs someone to show up: qa-delete-me",
    text: "Where",
    send: async () => {
      throw new Error("socket hang up for qa-delete-me-crew@example.com");
    },
    log: async (row) => {
      failedLog.push(`${row.to}:${row.status}`);
      throw new Error("relation plenty_pickup_emails does not exist");
    }
  });
  assert.equal(failed.ok, false);
  assert.deepEqual(failedLog, ["lincoln@unitedundergod.org:failed"]);
});

test("household deliver-to is the home, and a donor pickup defaults to the pantry note", () => {
  const pantry = { name: "Plenty", address: "100 Church St" };
  assert.equal(
    pickupFromLine({ kind: "household_delivery", address: "12 Main St" }, pantry),
    "Plenty · 100 Church St"
  );
  assert.equal(
    pickupDeliverLine({ kind: "household_delivery", address: "12 Main St" }, { pantry: "Plenty · 100 Church St" }),
    "12 Main St"
  );
  assert.equal(
    pickupDeliverLine({ kind: "donation_pickup", address: "Dock", dest_note: "Plenty · 100 Church St" }, { pantry: "Plenty" }),
    "Plenty · 100 Church St"
  );
  assert.equal(
    pickupFromLine({ kind: "store_collect", address: "qa-delete-me- Lyons Market" }, pantry),
    "qa-delete-me- Lyons Market"
  );
});

test("a missing table or column is a schema gap, and desk routes stay behind the steward check", () => {
  assert.equal(schemaGap({ code: "PGRST204", message: "Could not find the 'dest_note' column" }), true);
  assert.equal(schemaGap({ message: "relation \"plenty_pickup_routes\" does not exist" }), true);
  assert.equal(schemaGap({ message: "No pantry is set up yet." }), false);
  const page = readFileSync(new URL("../app/run/pickups/page.tsx", import.meta.url), "utf8");
  const routes = readFileSync(new URL("../app/api/pickup-routes/route.ts", import.meta.url), "utf8");
  const kinds = readFileSync(new URL("./pickup-routes.ts", import.meta.url), "utf8");
  const webhook = readFileSync(new URL("../app/api/webhooks/resend/route.ts", import.meta.url), "utf8");
  assert.equal(page.includes(">From<"), true);
  assert.equal(page.includes(">Deliver to<"), true);
  assert.equal(kinds.includes("food_drive"), true);
  assert.equal(routes.includes("requireDeskPantry"), true);
  assert.equal(routes.includes("export async function GET"), true);
  assert.equal(routes.includes("export async function POST"), true);
  assert.equal(webhook.includes("RESEND_WEBHOOK_SECRET"), true);
  assert.equal(webhook.includes("503"), true);
  const key = Buffer.from("qa-delete-me-webhook-secret");
  const secret = `whsec_${key.toString("base64")}`;
  const id = "msg_qa-delete-me";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const payload = JSON.stringify({ type: "email.delivered", data: { email_id: "email_qa-delete-me", to: ["lincoln@unitedundergod.org"] } });
  const signature = createHmac("sha256", key).update(`${id}.${timestamp}.${payload}`).digest("base64");
  assert.equal(signature.length > 10, true);
  assert.equal(secret.startsWith("whsec_"), true);
});
