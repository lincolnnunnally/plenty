import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import {
  emailStatusFromEvent,
  readResendEmailEvent,
  shouldApplyEmailStatus,
  verifyResendWebhook
} from "./resend-webhook.ts";

function sign(secretBody: string, id: string, timestamp: string, payload: string) {
  const key = Buffer.from(secretBody);
  const secret = `whsec_${key.toString("base64")}`;
  const signature = `v1,${createHmac("sha256", key).update(`${id}.${timestamp}.${payload}`).digest("base64")}`;
  return { secret, signature };
}

test("Svix verification accepts a fresh signature and rejects a bad one", () => {
  const payload = JSON.stringify({
    type: "email.delivered",
    data: { email_id: "email_qa-delete-me", to: ["lincoln@unitedundergod.org"] }
  });
  const id = "msg_qa-delete-me";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const good = sign("qa-delete-me-webhook-secret", id, timestamp, payload);
  assert.deepEqual(
    verifyResendWebhook({ secret: good.secret, payload, id, timestamp, signature: good.signature }),
    { ok: true }
  );
  assert.equal(
    verifyResendWebhook({ secret: good.secret, payload, id, timestamp, signature: "v1,not-the-signature" }).ok,
    false
  );
  const missing = verifyResendWebhook({ secret: "", payload, id, timestamp, signature: good.signature });
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.reason, "unconfigured");
  const stale = verifyResendWebhook({
    secret: good.secret,
    payload,
    id,
    timestamp: String(Math.floor(Date.now() / 1000) - 600),
    signature: good.signature
  });
  assert.equal(stale.ok, false);
  if (!stale.ok) assert.equal(stale.reason, "timestamp");
  const event = readResendEmailEvent(payload);
  assert.equal(event?.emailId, "email_qa-delete-me");
  assert.deepEqual(event?.to, ["lincoln@unitedundergod.org"]);
  assert.equal(emailStatusFromEvent("email.delivered"), "delivered");
  assert.equal(emailStatusFromEvent("email.bounced"), "bounced");
  assert.equal(emailStatusFromEvent("email.failed"), "failed");
  assert.equal(emailStatusFromEvent("email.delivery_delayed"), "delayed");
  assert.equal(emailStatusFromEvent("email.sent"), null);
});

test("delivery status moves forward and does not wipe a bounce", () => {
  assert.equal(shouldApplyEmailStatus("accepted", "delivered"), true);
  assert.equal(shouldApplyEmailStatus("accepted", "delayed"), true);
  assert.equal(shouldApplyEmailStatus("delayed", "delivered"), true);
  assert.equal(shouldApplyEmailStatus("delivered", "delayed"), false);
  assert.equal(shouldApplyEmailStatus("delivered", "bounced"), true);
  assert.equal(shouldApplyEmailStatus("bounced", "delivered"), false);
  assert.equal(shouldApplyEmailStatus("accepted", "failed"), true);
});
