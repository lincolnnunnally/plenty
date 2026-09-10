import QRCode from "qrcode";

export async function qrSvg(url: string) {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1f2a22", light: "#fffdf8" }
  });
}

export async function qrPng(url: string, size = 512) {
  return QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1f2a22", light: "#fffdf8" }
  });
}

export async function qrDataUrl(url: string, size = 280) {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#1f2a22", light: "#fffdf8" }
  });
}
