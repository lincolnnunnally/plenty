import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { EIN, LEGAL_NAME } from "@/lib/legal/org";
import { qrPng } from "@/lib/promote/qr";
import { plentyOrigin } from "@/lib/public-url";

const paper = rgb(0.969, 0.945, 0.902);
const ink = rgb(0.122, 0.165, 0.133);
const leaf = rgb(0.184, 0.365, 0.227);
const cream = rgb(1, 0.992, 0.973);

export type StoreCardPrint = {
  code: string;
  householdName: string;
  partnerName: string;
  holdDesk: string;
  hoursText: string;
  itemsText: string;
  stillNeedText: string;
  address: string;
  expiresAt: string | null;
  volunteersOnSite: boolean;
  meetNote: string;
};

export type HoldListRow = {
  code: string;
  householdName: string;
  itemsText: string;
  expiresAt: string | null;
};

function lookupUrl(code: string) {
  return `${plentyOrigin()}/s/${encodeURIComponent(code)}`;
}

export async function storeCardPdf(card: StoreCardPrint) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const qr = await pdf.embedPng(await qrPng(lookupUrl(card.code), 420));
  const page = pdf.addPage([612, 792]);
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: paper });
  page.drawText("Cut along the dashed line. Carry this like a membership card — not a coupon.", {
    x: 40,
    y: 760,
    size: 10,
    font,
    color: ink
  });

  drawWalletCard(page, font, fontBold, qr, card, 40, 560);
  drawWalletCard(page, font, fontBold, qr, card, 40, 330);

  page.drawText("Two copies. Keep one at home. Take one to the store.", {
    x: 40,
    y: 300,
    size: 10,
    font,
    color: leaf
  });
  wrap(
    page,
    card.volunteersOnSite
      ? "A Plenty volunteer will carry the bag to you. They can pray with you if you want — you do not have to. Then you may shop for what is not in the bag. Nothing extra is required."
      : "1. Get the bag at the desk. 2. Open it. 3. Then shop for what is not in the bag. You do not have to buy anything. Do not mix this gift with a paid cart at checkout.",
    40,
    280,
    530,
    11,
    font,
    ink
  );
  wrap(page, `${LEGAL_NAME} · EIN ${EIN} · Plenty food pantry`, 40, 248, 530, 10, font, ink);
  return pdf.save();
}

export async function bagSlipPdf(card: StoreCardPrint) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const qrBag = await pdf.embedPng(await qrPng(lookupUrl(card.code), 360));
  const qrPerson = await pdf.embedPng(await qrPng(`${plentyOrigin()}/become`, 360));
  const page = pdf.addPage([612, 792]);
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: paper });
  page.drawText("Fold and put this slip in the bag. Bags do not have to match. Mystery is part of the gift.", {
    x: 40,
    y: 762,
    size: 10,
    font,
    color: ink
  });
  drawSlip(page, font, fontBold, qrBag, qrPerson, card, 40, 400);
  drawSlip(page, font, fontBold, qrBag, qrPerson, card, 40, 36);
  return pdf.save();
}

export async function holdListPdf(input: {
  partnerName: string;
  holdDesk: string;
  hoursText: string;
  address: string;
  rows: HoldListRow[];
}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const page = pdf.addPage([612, 792]);
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: paper });
  page.drawRectangle({ x: 0, y: 730, width: 612, height: 62, color: leaf });
  page.drawText("PLENTY HOLD LIST", { x: 40, y: 762, size: 14, font: fontBold, color: cream });
  page.drawText(safe(input.partnerName).toUpperCase(), { x: 40, y: 742, size: 12, font, color: cream });

  let y = 700;
  y = wrap(page, `Volunteer carries the bag to them. Offer to pray — do not require it. They may shop after the gift is in their hands. Do not ring the gift at checkout.`, 40, y, 530, 12, fontBold, ink);
  if (input.address) y = wrap(page, input.address, 40, y - 4, 530, 11, font, ink);
  if (input.hoursText) y = wrap(page, input.hoursText, 40, y - 2, 530, 11, font, ink);
  y -= 16;

  if (!input.rows.length) {
    wrap(page, "No cards waiting to be collected right now.", 40, y, 530, 12, font, ink);
    return pdf.save();
  }

  page.drawText("Code", { x: 40, y, size: 10, font: fontBold, color: leaf });
  page.drawText("Household", { x: 140, y, size: 10, font: fontBold, color: leaf });
  page.drawText("Hold / items", { x: 300, y, size: 10, font: fontBold, color: leaf });
  y -= 16;
  for (const row of input.rows) {
    if (y < 60) break;
    page.drawText(safe(row.code), { x: 40, y, size: 11, font: fontBold, color: ink });
    page.drawText(clip(safe(row.householdName), 22), { x: 140, y, size: 11, font, color: ink });
    const items = row.itemsText || "This week's hold";
    const exp = row.expiresAt ? ` · by ${new Date(row.expiresAt).toLocaleDateString()}` : "";
    wrap(page, `${items}${exp}`, 300, y, 270, 10, font, ink);
    y -= 28;
  }
  page.drawText("Scan the QR on the card to confirm it is still good. Then mark it collected with your store PIN.", {
    x: 40,
    y: 36,
    size: 9,
    font,
    color: ink
  });
  return pdf.save();
}

function drawWalletCard(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  qr: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  card: StoreCardPrint,
  x: number,
  y: number
) {
  const w = 532;
  const h = 210;
  page.drawRectangle({ x, y, width: w, height: h, color: cream });
  page.drawRectangle({ x, y: y + h - 28, width: w, height: 28, color: leaf });
  page.drawText("PLENTY STORE CARD", { x: x + 14, y: y + h - 19, size: 11, font: fontBold, color: cream });
  page.drawText(safe(card.code), { x: x + 390, y: y + h - 19, size: 11, font: fontBold, color: cream });

  wrap(page, safe(card.householdName) || "Household", x + 14, y + h - 52, 360, 18, fontBold, ink);
  wrap(page, safe(card.partnerName), x + 14, y + h - 78, 360, 12, font, ink);
  wrap(
    page,
    card.volunteersOnSite
      ? `Look for a Plenty volunteer${card.meetNote ? ` — ${card.meetNote}` : " at customer service"}. They will carry your bag.`
      : `Get your bag first at ${card.holdDesk || "customer service"}.`,
    x + 14,
    y + 88,
    360,
    11,
    fontBold,
    ink
  );
  const items = card.itemsText || "Open the bag. That is this week's gift.";
  wrap(page, items, x + 14, y + 68, 360, 10, font, ink);
  if (card.hoursText) wrap(page, card.hoursText, x + 14, y + 44, 360, 9, font, ink);
  wrap(page, "Gift first. Then shop if you want. Nothing extra is required.", x + 14, y + 18, 360, 9, fontBold, leaf);

  page.drawImage(qr, { x: x + 394, y: y + 36, width: 118, height: 118 });
  page.drawText("Store: scan to confirm", { x: x + 394, y: y + 18, size: 8, font, color: leaf });

  // Dashed cut hint
  page.drawRectangle({ x, y: y - 8, width: w, height: 1, color: rgb(0.72, 0.68, 0.58) });
}

function drawSlip(
  page: ReturnType<PDFDocument["addPage"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>,
  qrBag: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  qrPerson: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  card: StoreCardPrint,
  x: number,
  y: number
) {
  const w = 532;
  const h = 350;
  page.drawRectangle({ x, y, width: w, height: h, color: cream });
  page.drawRectangle({ x, y: y + h - 28, width: w, height: 28, color: leaf });
  page.drawText("PLENTY BAG SLIP  ·  OPEN THIS FIRST", { x: x + 14, y: y + h - 19, size: 11, font: fontBold, color: cream });
  page.drawText(safe(card.code), { x: x + 400, y: y + h - 19, size: 11, font: fontBold, color: cream });

  wrap(page, safe(card.householdName) || "Household", x + 14, y + h - 50, 360, 16, fontBold, ink);
  wrap(page, `Bag from ${safe(card.partnerName)}. Bags can differ. Trying something new is part of the gift.`, x + 14, y + h - 74, 500, 10, font, ink);

  wrap(page, "IN THIS BAG (free)", x + 14, y + h - 102, 240, 11, fontBold, leaf);
  wrap(page, card.itemsText || "A surprise hold. Open it before you shop.", x + 14, y + h - 118, 300, 11, font, ink);

  wrap(page, "YOU MAY STILL WANT (paid only if you choose)", x + 14, y + 150, 300, 11, fontBold, leaf);
  wrap(page, card.stillNeedText || "After you open the bag, buy only what is not already in it — if you want and if you can. You do not have to buy anything.", x + 14, y + 134, 300, 10, font, ink);

  wrap(page, "Do not mix this gift with a paid cart at checkout. If you can give money to keep Plenty going, do that with us — not at this register.", x + 14, y + 70, 300, 10, font, ink);
  wrap(
    page,
    card.volunteersOnSite
      ? "A volunteer will carry this bag to you. They can pray with you if you want. You do not have to. Then you may shop. Food does not depend on a prayer."
      : "Food is the doorway. A person, a prayer if you want one, and a next step are at Plenty. Food does not depend on that.",
    x + 14,
    y + 36,
    300,
    10,
    fontBold,
    ink
  );

  page.drawImage(qrBag, { x: x + 330, y: y + 150, width: 86, height: 86 });
  page.drawText("This bag", { x: x + 342, y: y + 136, size: 8, font, color: leaf });
  page.drawImage(qrPerson, { x: x + 430, y: y + 150, width: 86, height: 86 });
  page.drawText("A person", { x: x + 444, y: y + 136, size: 8, font, color: leaf });
}

function clip(text: string, n: number) {
  return text.length > n ? `${text.slice(0, n - 1)}...` : text;
}

function safe(text: string) {
  return (text || "").replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
}

function wrap(
  page: ReturnType<PDFDocument["addPage"]>,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: { widthOfTextAtSize: (t: string, s: number) => number },
  color: ReturnType<typeof rgb>
) {
  const words = safe(text).split(/\s+/).filter(Boolean);
  let line = "";
  let cursor = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      page.drawText(line, { x, y: cursor, size, font: font as never, color });
      cursor -= size + 3;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    page.drawText(line, { x, y: cursor, size, font: font as never, color });
    cursor -= size + 3;
  }
  return cursor;
}
