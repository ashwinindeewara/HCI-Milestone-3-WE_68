/**
 * Display-only money formatting for the admin screens.
 * The screens carry amounts as strings like "$25000000.00"; show them as "$25,000,000.00".
 * Anything that is not a plain amount is returned as is.
 */
export function formatAdminMoney(value?: string | number | null): string {
  if (value === undefined || value === null) return '';
  const raw = String(value).trim();
  const match = raw.match(/^(-?)\$?\s*(-?[\d,]+(?:\.\d+)?)$/);
  if (!match) return raw;

  const amount = Number(match[2].replace(/,/g, ''));
  if (Number.isNaN(amount)) return raw;

  const negative = match[1] === '-' || amount < 0;
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${negative ? '-' : ''}$${formatted}`;
}

export default formatAdminMoney;
