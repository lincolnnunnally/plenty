/** Donor pickups need a name and a phone or an email. Notes stay optional. */
export function donorPickupContact(input: { name: string; phone: string; email: string }):
  | { ok: true; contactName: string; contactPhone: string }
  | { ok: false; message: string } {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { ok: false, message: "Enter your name." };
  if (!phone && !email) return { ok: false, message: "Enter a phone number or an email." };
  if (email && !email.includes("@")) return { ok: false, message: "Enter an email address." };
  return { ok: true, contactName: name, contactPhone: [phone, email].filter(Boolean).join(" · ") };
}
