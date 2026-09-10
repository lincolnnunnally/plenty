import { NextResponse } from "next/server";
import { requireStewardFor, requireUser } from "@/lib/api";
import { getDefaultPantry, getStoreVoucher, householdForUser, listStorePartners, listStoreVouchers } from "@/lib/db/queries";
import { bagSlipPdf, holdListPdf, storeCardPdf } from "@/lib/store-card/pdf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const pantry = await getDefaultPantry();
  if (!pantry) return NextResponse.json({ ok: false, message: "No pantry is set up yet." }, { status: 503 });
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "card";
  const voucherId = searchParams.get("voucherId") || "";
  const partnerId = searchParams.get("partnerId") || "";

  if (kind === "hold-list") {
    const { error } = await requireStewardFor(pantry.id);
    if (error) return error;
    if (!partnerId) return NextResponse.json({ ok: false, message: "Choose a store." }, { status: 400 });
    const partners = await listStorePartners(pantry.id);
    const partner = partners.find((p) => p.id === partnerId);
    if (!partner) return NextResponse.json({ ok: false, message: "Store not found." }, { status: 404 });
    const rows = (await listStoreVouchers(pantry.id, { partnerId })).filter((v) => v.status === "issued");
    const bytes = await holdListPdf({
      partnerName: partner.name,
      holdDesk: partner.hold_desk,
      hoursText: partner.hours_text,
      address: [partner.address, partner.city, partner.state].filter(Boolean).join(", "),
      rows: rows.map((v) => ({
        code: v.code,
        householdName: v.household_name || "Household",
        itemsText: v.items_text,
        expiresAt: v.expires_at
      }))
    });
    return pdfResponse(bytes, `plenty-hold-list-${partner.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
  }

  if (!voucherId) return NextResponse.json({ ok: false, message: "Choose a card to print." }, { status: 400 });
  const voucher = await getStoreVoucher(voucherId);
  if (!voucher || voucher.pantry_id !== pantry.id) {
    return NextResponse.json({ ok: false, message: "Card not found." }, { status: 404 });
  }

  const steward = await requireStewardFor(pantry.id);
  if (steward.error) {
    const { error, user } = await requireUser();
    if (error || !user) return error || NextResponse.json({ ok: false, message: "Sign in first." }, { status: 401 });
    const mine = await householdForUser(pantry.id, user.id);
    if (!mine || mine.id !== voucher.household_id) {
      return NextResponse.json({ ok: false, message: "You can only print your own store card." }, { status: 403 });
    }
  }

  const print = {
    code: voucher.code,
    householdName: voucher.household_name || "Household",
    partnerName: voucher.partner_name || "Partner store",
    holdDesk: voucher.hold_desk || "Customer service",
    hoursText: voucher.hours_text || "",
    itemsText: voucher.items_text,
    stillNeedText: voucher.still_need_text || "",
    address: voucher.partner_address || "",
    expiresAt: voucher.expires_at
  };
  if (kind === "slip") {
    const bytes = await bagSlipPdf(print);
    return pdfResponse(bytes, `plenty-bag-slip-${voucher.code.toLowerCase()}.pdf`);
  }
  const bytes = await storeCardPdf(print);
  return pdfResponse(bytes, `plenty-store-card-${voucher.code.toLowerCase()}.pdf`);
}

function pdfResponse(bytes: Uint8Array, filename: string) {
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
