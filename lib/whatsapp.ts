export function cleanPhone(tel: string): string {
  const cleaned = tel.replace(/[\s\-()]/g, "");
  if (!/^\+/.test(cleaned) && !/^52/.test(cleaned)) return "52" + cleaned;
  return cleaned.replace(/^\+/, "");
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
}
