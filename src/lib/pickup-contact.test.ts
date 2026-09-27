import assert from "node:assert/strict";
import { test } from "node:test";
import { donorPickupContact } from "./pickup-contact.ts";

test("a donor pickup needs a name plus a phone or an email", () => {
  const missingName = donorPickupContact({ name: "  ", phone: "912-555-0199", email: "ada@example.com" });
  assert.equal(missingName.ok, false);
  if (!missingName.ok) assert.equal(missingName.message, "Enter your name.");

  const missingReach = donorPickupContact({ name: "Ada", phone: " ", email: "" });
  assert.equal(missingReach.ok, false);
  if (!missingReach.ok) assert.equal(missingReach.message, "Enter a phone number or an email.");

  const badEmail = donorPickupContact({ name: "Ada", phone: "", email: "not-an-email" });
  assert.equal(badEmail.ok, false);
  if (!badEmail.ok) assert.equal(badEmail.message, "Enter an email address.");

  const phone = donorPickupContact({ name: " Ada Manager ", phone: "912-555-0199", email: "" });
  assert.equal(phone.ok, true);
  if (phone.ok) {
    assert.equal(phone.contactName, "Ada Manager");
    assert.equal(phone.contactPhone, "912-555-0199");
  }

  const email = donorPickupContact({ name: "Ada", phone: "", email: "Ada@Example.com" });
  assert.equal(email.ok, true);
  if (email.ok) {
    assert.equal(email.contactName, "Ada");
    assert.equal(email.contactPhone, "ada@example.com");
  }

  const both = donorPickupContact({ name: "Ada", phone: "912-555-0199", email: "ada@example.com" });
  assert.equal(both.ok, true);
  if (both.ok) assert.equal(both.contactPhone, "912-555-0199 · ada@example.com");
});
