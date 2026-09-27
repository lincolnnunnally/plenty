import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  OWNER_ATTENTION_FALLBACK,
  composeOwnerPantrySignupNotice,
  deliverOwnerPantrySignupNotice,
  ownerAttentionEmail,
  ownerNoticeFailureReason,
  ownerReviewUrl,
  withOwnerPantrySignupNotice,
  type MailSender,
  type OwnerPantrySignupInput
} from "./owner-signup-notice.ts";

function withoutOwnerEnv(run: () => Promise<void> | void) {
  const previousOwner = process.env.APP_ENGINE_OWNER_EMAIL;
  const previousPublic = process.env.APP_PUBLIC_URL;
  delete process.env.APP_ENGINE_OWNER_EMAIL;
  delete process.env.APP_PUBLIC_URL;
  const finish = () => {
    if (previousOwner === undefined) delete process.env.APP_ENGINE_OWNER_EMAIL;
    else process.env.APP_ENGINE_OWNER_EMAIL = previousOwner;
    if (previousPublic === undefined) delete process.env.APP_PUBLIC_URL;
    else process.env.APP_PUBLIC_URL = previousPublic;
  };
  return Promise.resolve()
    .then(run)
    .finally(finish);
}

const signup: OwnerPantrySignupInput = {
  kind: "pantry",
  pantryName: "qa-delete-me- Lyons Pantry",
  contactName: "Ada Steward",
  email: "ada@example.com",
  phone: "912-555-0100",
  address: "12 Main St",
  city: "Lyons",
  state: "GA",
  signedUpAt: "2026-09-27T09:30:00.000Z"
};

function sent() {
  const calls: { to: string; subject: string; text: string }[] = [];
  const send: MailSender = async (to, subject, text) => {
    calls.push({ to, subject, text });
    return { ok: true, error: "" };
  };
  return { calls, send };
}

test("pantry signup emails the owner with the signup fields", async () => {
  await withoutOwnerEnv(async () => {
    const { calls, send } = sent();
    const result = await deliverOwnerPantrySignupNotice(signup, send);
    assert.equal(result.ok, true);
    assert.equal(result.skipped, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].to, ownerAttentionEmail());
    assert.equal(calls[0].to, OWNER_ATTENTION_FALLBACK);
    assert.equal(calls[0].to, "lincoln@unitedundergod.org");
    assert.equal(calls[0].subject, "New food pantry signup needs your attention: qa-delete-me- Lyons Pantry");
    assert.match(calls[0].text, /Pantry: qa-delete-me- Lyons Pantry/);
    assert.match(calls[0].text, /Contact: Ada Steward/);
    assert.match(calls[0].text, /Email: ada@example.com/);
    assert.match(calls[0].text, /Phone: 912-555-0100/);
    assert.match(calls[0].text, /Location: 12 Main St, Lyons, GA/);
    assert.match(calls[0].text, /Signed up: 2026-09-27T09:30:00.000Z/);
    assert.match(calls[0].text, /Review: https:\/\/plenty\.unitedundergod\.org\/run/);
    assert.equal(ownerReviewUrl(), "https://plenty.unitedundergod.org/run");
  });
});

test("recipient and review link follow the production owner env vars", async () => {
  await withoutOwnerEnv(async () => {
    process.env.APP_ENGINE_OWNER_EMAIL = "owner@example.com";
    process.env.APP_PUBLIC_URL = "https://plenty.unitedundergod.org/";
    const { calls, send } = sent();
    await deliverOwnerPantrySignupNotice(signup, send);
    assert.equal(calls[0].to, "owner@example.com");
    assert.match(calls[0].text, /Review: https:\/\/plenty\.unitedundergod\.org\/run/);
    process.env.APP_ENGINE_OWNER_EMAIL = "not-an-email";
    assert.equal(ownerAttentionEmail(), "lincoln@unitedundergod.org");
  });
});

test("church claim uses the same pantry desk, so the owner is emailed", async () => {
  const { calls, send } = sent();
  const result = await deliverOwnerPantrySignupNotice({ ...signup, kind: "church", pantryName: "qa-delete-me- Chapel" }, send);
  assert.equal(result.skipped, false);
  assert.equal(calls.length, 1);
  assert.match(calls[0].subject, /qa-delete-me- Chapel/);
});

test("signup still succeeds when the mailer throws", async () => {
  const logs: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    logs.push(args);
  };
  try {
    const send: MailSender = async () => {
      throw new Error("socket hang up for ada@example.com");
    };
    const response = await withOwnerPantrySignupNotice(signup, send, () => ({
      ok: true,
      pantryId: "pantry-1",
      message: "qa-delete-me- Lyons Pantry is yours to run."
    }));
    assert.equal(response.ok, true);
    assert.equal(response.pantryId, "pantry-1");
    assert.equal(logs.length, 1);
    assert.equal(logs[0][0], "[plenty] owner pantry signup notice failed:");
    assert.equal(logs[0][1], "mailer rejected");
    assert.equal(JSON.stringify(logs).includes("ada@example.com"), false);
    assert.equal(JSON.stringify(logs).includes("912-555-0100"), false);
  } finally {
    console.error = original;
  }
});

test("signup still succeeds when the mail key is missing", async () => {
  const logs: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    logs.push(args);
  };
  const previous = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  let fetched = false;
  const send: MailSender = async () => {
    if (!process.env.RESEND_API_KEY) return { ok: false, error: "Email sending is not configured." };
    fetched = true;
    throw new Error("tests must not send");
  };
  try {
    const response = await withOwnerPantrySignupNotice(signup, send, () => ({ ok: true, pantryId: "pantry-1" }));
    assert.equal(response.ok, true);
    assert.equal(response.pantryId, "pantry-1");
    assert.equal(fetched, false);
    assert.equal(logs[0][1], "email not configured");
    assert.equal(ownerNoticeFailureReason("Email sending is not configured."), "email not configured");
  } finally {
    console.error = original;
    if (previous === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previous;
  }
});

test("volunteer, neighbor, donor, and store signups do not email the owner", async () => {
  for (const kind of ["volunteer", "neighbor", "donor", "store", "thrift", "farm"]) {
    const { calls, send } = sent();
    const result = await withOwnerPantrySignupNotice({ ...signup, kind }, send, () => ({ ok: true }));
    assert.equal(result.ok, true);
    assert.equal(calls.length, 0);
    assert.equal(composeOwnerPantrySignupNotice({ ...signup, kind }), null);
  }
});

test("account register and shift signup do not call the owner notice", () => {
  const register = readFileSync(new URL("../app/api/auth/register/route.ts", import.meta.url), "utf8");
  const shift = readFileSync(new URL("../app/api/shifts/[id]/signup/route.ts", import.meta.url), "utf8");
  const household = readFileSync(new URL("../app/api/households/route.ts", import.meta.url), "utf8");
  const store = readFileSync(new URL("../app/api/store-partners/route.ts", import.meta.url), "utf8");
  const claim = readFileSync(new URL("../app/api/allies/[id]/claim/route.ts", import.meta.url), "utf8");
  for (const source of [register, shift, household, store]) {
    assert.equal(source.includes("withOwnerPantrySignupNotice"), false);
    assert.equal(source.includes("deliverOwnerPantrySignupNotice"), false);
  }
  assert.equal(claim.includes("withOwnerPantrySignupNotice"), true);
  assert.equal(claim.includes("sendPlainEmail"), true);
  const earlyClaim = claim.slice(claim.indexOf("if (ally.operator_pantry_id)"), claim.indexOf("const slug"));
  assert.match(earlyClaim, /You already run this pantry/);
  assert.equal(earlyClaim.includes("withOwnerPantrySignupNotice"), false);
});
