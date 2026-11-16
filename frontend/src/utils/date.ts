/**
 * Returns YYYY-MM-DD in the user's local timezone (avoids UTC off-by-one after midnight).
 */
export function getLocalDateISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses backend ISO timestamps (treating naive ISO strings without timezone suffix as UTC).
 */
export function parseApiDate(value: string): Date {
  if (!value) return new Date(NaN);
  const trimmed = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  if (trimmed.includes('T') && !hasTimezone) {
    return new Date(`${trimmed}Z`);
  }
  return new Date(trimmed);
}
