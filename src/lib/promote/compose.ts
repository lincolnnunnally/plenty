import type { Distribution, InventoryItem, Pantry } from "@/lib/db/queries";
import { pantryPublicUrl } from "@/lib/public-url";

export const AUDIENCES = ["families", "volunteers", "donors"] as const;
export type Audience = (typeof AUDIENCES)[number];

export function isAudience(value: string): value is Audience {
  return (AUDIENCES as readonly string[]).includes(value);
}

/** Requested at the line. Not a charge for groceries. */
export const HANDLING_DONATION =
  "The food is free. We request a donation for handling and orchestration — pickup, routing, and running the line — not for the groceries.";

export const HANDLING_IF_NOT = "If you cannot help with handling, you still get food.";

export function donationPolicyCopy(pantry: Pantry) {
  const extra = pantry.donation_note.trim();
  switch (pantry.donation_policy) {
    case "none":
      return extra || "No donation is asked. Come as you are. The food is free.";
    case "suggested":
      return `${extra || "A handling donation is suggested when you can — not a payment for food."} ${HANDLING_IF_NOT}`;
    case "expected":
      return `${extra || "We request a handling donation when you pick up. That pays pickup, routing, and the line — not the food."} ${HANDLING_IF_NOT}`;
    default:
      return `${extra || HANDLING_DONATION} ${HANDLING_IF_NOT}`;
  }
}

export function receiveRulesCopy(pantry: Pantry) {
  const parts: string[] = [];
  if (pantry.receive_rules.trim()) parts.push(pantry.receive_rules.trim());
  if (pantry.residency_rules.trim()) parts.push(pantry.residency_rules.trim());
  if (pantry.id_required) parts.push("Please bring a photo ID.");
  if (pantry.frequency_rules.trim()) parts.push(pantry.frequency_rules.trim());
  parts.push(donationPolicyCopy(pantry));
  return parts.join(" ");
}

export function placeLine(pantry: Pantry) {
  if (pantry.address.trim()) {
    return `${pantry.address}, ${pantry.city || "Vidalia"}${pantry.state ? `, ${pantry.state}` : ""} ${pantry.zip}`.trim();
  }
  return `${pantry.city || "Vidalia"}, ${pantry.state || "Georgia"}`.trim();
}

export function hoursLine(pantry: Pantry) {
  return pantry.hours_text.trim() || "Hours are posted on the pantry page when we are open — we will not invent them.";
}

export type PromoteFacts = {
  pantry: Pantry;
  url: string;
  week: InventoryItem[];
  needs: InventoryItem[];
  distributions: Distribution[];
  extra: string;
  audience: Audience;
};

export type ChannelKit = {
  audience: Audience;
  audienceLabel: string;
  headline: string;
  url: string;
  facebook: string;
  instagram: string;
  nextdoor: string;
  sms: string;
  bulletin: string;
  xPost: string;
  emailSubject: string;
  emailPreview: string;
  emailHtml: string;
  flyerHeadline: string;
  flyerKicker: string;
  flyerBody: string[];
  hashtags: string;
};

function audienceLabel(audience: Audience) {
  if (audience === "volunteers") return "people who can serve";
  if (audience === "donors") return "people who can give";
  return "families who need food";
}

function weekLine(week: InventoryItem[]) {
  if (!week.length) return "";
  return `This week we have: ${week.map((i) => i.name).join(", ")}.`;
}

function needLine(needs: InventoryItem[]) {
  if (!needs.length) return "";
  return `We especially need: ${needs.map((i) => i.name).join(", ")}.`;
}

function distLine(days: Distribution[]) {
  const upcoming = days.filter((d) => d.status !== "cancelled" && d.status !== "done");
  if (!upcoming.length) return "";
  return upcoming
    .slice(0, 3)
    .map((d) => `${d.title} — ${new Date(d.starts_at).toLocaleString()}`)
    .join("; ");
}

export function composeKit(facts: PromoteFacts): ChannelKit {
  const { pantry, url, week, needs, distributions, extra, audience } = facts;
  const place = placeLine(pantry);
  const hours = hoursLine(pantry);
  const weekText = weekLine(week);
  const needText = needLine(needs);
  const dist = distLine(distributions);
  const rules = receiveRulesCopy(pantry);
  const extraLine = extra.trim();
  const name = pantry.name || "Plenty food pantry";
  const city = pantry.city || "Vidalia";
  const hashtags = "#VidaliaFoodPantry #PlentyPantry #GeorgiaFoodPantry #ToombsCounty #FeedMyFamily";

  const familyCore = [
    `Need groceries in ${city}? ${name} is a food pantry.`,
    "Free food for households who are having a hard time feeding their family.",
    hours,
    place,
    dist ? `Coming up: ${dist}.` : "",
    weekText,
    `What to know when you come: ${rules}`,
    extraLine,
    `See this week's food and scan in: ${url}`
  ].filter(Boolean);

  const volunteerCore = [
    `Volunteer with ${name} in ${city}.`,
    "Pick up donated food, set up tables, pack bags, welcome families, drive a delivery, or meet a family at a grocery store with their bag. No experience needed — we will show you.",
    hours,
    place,
    dist ? `Next distribution: ${dist}.` : "",
    extraLine,
    `Take a shift: ${url.replace(/\/p\/.+$/, "/volunteer")}`
  ].filter(Boolean);

  const donorCore = [
    `Give to ${name}, a food pantry in ${city}.`,
    "Food, money, a vehicle, a warehouse, or a place to distribute — it goes on a family's table, not in one person's pocket.",
    needText,
    extraLine,
    `Offer a gift: ${url.replace(/\/p\/.+$/, "/donate")}`
  ].filter(Boolean);

  const core = audience === "volunteers" ? volunteerCore : audience === "donors" ? donorCore : familyCore;
  const body = core.join(" ");

  const headline =
    audience === "volunteers"
      ? `Help neighbors get groceries in ${city}`
      : audience === "donors"
        ? `Your gift becomes groceries in ${city}`
        : `Need groceries in ${city}? This is a food pantry.`;

  const cta =
    audience === "volunteers" ? `${plentyVolunteer(url)}` : audience === "donors" ? plentyDonate(url) : url;

  const facebook = [
    headline,
    "",
    ...core,
    "",
    "Share this with someone who needs it, or someone who can help.",
    "",
    hashtags
  ].join("\n");

  const instagram = [
    headline,
    "",
    ...core.slice(0, 6),
    "",
    "Scan the QR on our flyer, or tap the link in bio.",
    "",
    hashtags
  ].join("\n");

  const nextdoor = [
    `Neighbors — ${headline}`,
    body,
    "This is a local food pantry, not a fundraiser in someone's pocket. Come, volunteer, or give."
  ].join("\n\n");

  const sms = `${headline} ${hours} ${url}`.slice(0, 300);

  const bulletin = `${headline} ${hours} ${place}. ${weekText} ${audience === "families" ? rules : ""} Details: ${url}`.replace(/\s+/g, " ").trim();

  const xPost = `${headline} ${hours} ${cta}`.slice(0, 260);

  const emailSubject =
    audience === "volunteers"
      ? `${name}: we need hands this week`
      : audience === "donors"
        ? `${name}: this week's shelves need you`
        : `${name}: groceries for your family this week`;

  const emailPreview = core[0] || headline;
  const emailHtml = emailTemplate({
    pantry,
    headline,
    url: cta,
    lines: core,
    week,
    needs,
    distributions,
    audience
  });

  const flyerKicker = audience === "volunteers" ? "Volunteer" : audience === "donors" ? "Give" : "Get food";
  const flyerBody = [
    hours,
    place,
    dist ? `Distribution: ${dist}` : "",
    audience === "families" ? weekText : audience === "donors" ? needText : "Pickup · setup · serve · delivery",
    audience === "families" ? rules : extraLine || "You do not need experience. We will show you.",
    `Scan for live hours and this week's food`
  ].filter(Boolean);

  return {
    audience,
    audienceLabel: audienceLabel(audience),
    headline,
    url: cta,
    facebook,
    instagram,
    nextdoor,
    sms,
    bulletin,
    xPost,
    emailSubject,
    emailPreview,
    emailHtml,
    flyerHeadline: headline,
    flyerKicker,
    flyerBody,
    hashtags
  };
}

function plentyVolunteer(publicUrl: string) {
  try {
    const u = new URL(publicUrl);
    return `${u.origin}/volunteer`;
  } catch {
    return "https://plenty.unitedundergod.org/volunteer";
  }
}

function plentyDonate(publicUrl: string) {
  try {
    const u = new URL(publicUrl);
    return `${u.origin}/donate`;
  } catch {
    return "https://plenty.unitedundergod.org/donate";
  }
}

function emailTemplate(input: {
  pantry: Pantry;
  headline: string;
  url: string;
  lines: string[];
  week: InventoryItem[];
  needs: InventoryItem[];
  distributions: Distribution[];
  audience: Audience;
}) {
  const { pantry, headline, url, lines, week, needs, distributions, audience } = input;
  const weekItems = week.map((i) => `<li>${escapeHtml(i.name)}</li>`).join("");
  const needItems = needs.map((i) => `<li>${escapeHtml(i.name)}</li>`).join("");
  const days = distributions
    .filter((d) => d.status !== "cancelled" && d.status !== "done")
    .slice(0, 4)
    .map((d) => `<li><strong>${escapeHtml(d.title)}</strong> — ${escapeHtml(new Date(d.starts_at).toLocaleString())}</li>`)
    .join("");
  const cta = audience === "volunteers" ? "Take a shift" : audience === "donors" ? "Offer a gift" : "Get food this week";
  return `<!doctype html>
<html><body style="margin:0;background:#f7f1e6;font-family:Georgia,serif;color:#1f2a22;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1e6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fffdf8;border:1px solid #e4d8c4;border-radius:12px;padding:28px;">
        <tr><td>
          <p style="margin:0 0 8px;color:#2f5d3a;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:700;">Plenty food pantry · ${escapeHtml(pantry.city || "Vidalia")}</p>
          <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;">${escapeHtml(headline)}</h1>
          ${lines.map((line) => `<p style="margin:0 0 10px;font-size:16px;line-height:1.5;">${escapeHtml(line)}</p>`).join("")}
          ${weekItems && audience === "families" ? `<h2 style="font-size:18px;margin:18px 0 8px;">This week</h2><ul>${weekItems}</ul>` : ""}
          ${needItems && audience === "donors" ? `<h2 style="font-size:18px;margin:18px 0 8px;">We need</h2><ul>${needItems}</ul>` : ""}
          ${days ? `<h2 style="font-size:18px;margin:18px 0 8px;">Distribution</h2><ul>${days}</ul>` : ""}
          <p style="margin:22px 0 0;">
            <a href="${escapeHtml(url)}" style="display:inline-block;background:#c46a1d;color:#fffdf8;text-decoration:none;padding:12px 20px;border-radius:999px;font-family:Arial,sans-serif;font-weight:700;">${escapeHtml(cta)}</a>
          </p>
          <p style="margin:18px 0 0;color:#5d6a60;font-size:13px;">Scan a flyer QR code anytime for live hours and this week's food. A flyer is attached when we have one.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function facebookShareUrl(pageUrl: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
}

export function xIntentUrl(text: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function smsLink(text: string) {
  return `sms:?&body=${encodeURIComponent(text)}`;
}

export function mailtoLink(subject: string, body: string) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export { pantryPublicUrl };
