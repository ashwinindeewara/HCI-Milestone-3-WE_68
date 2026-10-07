/**
 * Display-only date formatting for the admin screens.
 * The backend sends LocalDateTime strings such as "2026-10-07T17:14:09.095987"; show those as
 * "Oct 7, 2026, 5:14 PM". Anything that is not an ISO timestamp ("Yesterday", "Oct 12, 2024") is returned as is.
 */
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;

export function formatAdminDateTime(value?: string | number | null): string {
  if (value === undefined || value === null) return '';
  const raw = String(value).trim();
  if (!ISO_TIMESTAMP.test(raw)) return raw;

  // Date parsing is only reliable up to millisecond precision
  const date = new Date(raw.replace(' ', 'T').replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default formatAdminDateTime;
