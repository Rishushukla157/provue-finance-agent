export function normalizeMerchant(
  merchant: string
): string {
  return merchant
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}