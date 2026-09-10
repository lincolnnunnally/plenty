import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { ChannelKit } from "./compose";
import { qrPng } from "./qr";

const paper = rgb(0.969, 0.945, 0.902);
const ink = rgb(0.122, 0.165, 0.133);
const leaf = rgb(0.184, 0.365, 0.227);
const accent = rgb(0.769, 0.416, 0.114);

export async function flyerPdf(kit: ChannelKit, kind: "flyer" | "card" = "flyer") {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const qr = await pdf.embedPng(await qrPng(kit.url, 420));

  if (kind === "card") {
    const page = pdf.addPage([576, 384]);
    page.drawRectangle({ x: 0, y: 0, width: 576, height: 384, color: paper });
    page.drawRectangle({ x: 0, y: 350, width: 576, height: 34, color: leaf });
    page.drawText("PLENTY FOOD PANTRY", { x: 24, y: 361, size: 11, font: fontBold, color: rgb(1, 0.992, 0.973) });
    page.drawText(kit.flyerKicker.toUpperCase(), { x: 430, y: 361, size: 11, font: fontBold, color: rgb(1, 0.992, 0.973) });
    wrap(page, kit.flyerHeadline, 24, 300, 340, 22, fontBold, ink);
    let y = 250;
    for (const line of kit.flyerBody.slice(0, 5)) {
      y = wrap(page, line, 24, y, 340, 12, font, ink) - 6;
    }
    page.drawImage(qr, { x: 390, y: 48, width: 150, height: 150 });
    page.drawText("Scan for this week's food", { x: 390, y: 28, size: 9, font, color: leaf });
    return pdf.save();
  }

  const page = pdf.addPage([612, 792]);
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: paper });
  page.drawRectangle({ x: 0, y: 730, width: 612, height: 62, color: leaf });
  page.drawText("PLENTY FOOD PANTRY", { x: 40, y: 762, size: 14, font: fontBold, color: rgb(1, 0.992, 0.973) });
  page.drawText(kit.flyerKicker.toUpperCase(), { x: 40, y: 742, size: 12, font, color: rgb(1, 0.992, 0.973) });
  page.drawRectangle({ x: 0, y: 722, width: 612, height: 8, color: accent });
  wrap(page, kit.flyerHeadline, 40, 670, 360, 28, fontBold, ink);
  let y = 580;
  for (const line of kit.flyerBody) {
    y = wrap(page, line, 40, y, 360, 14, font, ink) - 10;
  }
  page.drawImage(qr, { x: 420, y: 430, width: 150, height: 150 });
  page.drawText("Scan for live hours", { x: 430, y: 410, size: 10, font: fontBold, color: leaf });
  page.drawText("and this week's food", { x: 430, y: 396, size: 10, font, color: leaf });
  wrap(page, kit.url, 40, 80, 530, 10, font, leaf);
  page.drawText("Bring this card. The QR always shows what is true this week.", { x: 40, y: 48, size: 11, font, color: ink });
  return pdf.save();
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
  const words = text.split(/\s+/);
  let line = "";
  let cursor = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      page.drawText(line, { x, y: cursor, size, font: font as never, color });
      cursor -= size + 4;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    page.drawText(line, { x, y: cursor, size, font: font as never, color });
    cursor -= size + 4;
  }
  return cursor;
}

export async function receiptPdf(input: {
  legalName: string;
  ein: string;
  pantryName: string;
  donorName: string;
  amount: string;
  date: string;
  year: number;
}) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const page = pdf.addPage([612, 792]);
  page.drawRectangle({ x: 0, y: 0, width: 612, height: 792, color: paper });
  page.drawRectangle({ x: 0, y: 730, width: 612, height: 62, color: leaf });
  page.drawText("PLENTY FOOD PANTRY", { x: 40, y: 762, size: 14, font: fontBold, color: rgb(1, 0.992, 0.973) });
  page.drawText("GIFT RECEIPT", { x: 40, y: 742, size: 12, font, color: rgb(1, 0.992, 0.973) });
  wrap(page, input.legalName, 40, 680, 520, 18, fontBold, ink);
  wrap(page, `EIN ${input.ein} · 501(c)(3)`, 40, 650, 520, 12, font, ink);
  wrap(page, `Thank you, ${input.donorName || "friend"}.`, 40, 600, 520, 16, fontBold, ink);
  wrap(page, `We received a gift of ${input.amount} on ${input.date} for ${input.pantryName}. No goods or services were provided in exchange for this gift.`, 40, 560, 520, 13, font, ink);
  wrap(page, `Keep this letter for your ${input.year} records.`, 40, 500, 520, 12, font, ink);
  wrap(page, "Plenty is a program of United Under God, Inc.", 40, 60, 520, 11, font, leaf);
  return pdf.save();
}
