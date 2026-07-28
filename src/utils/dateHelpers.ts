/**
 * Date helpers shared across the docmaster app.
 */

/**
 * Add a number of months to an ISO date string (YYYY-MM-DD), clamped to the
 * last day of the target month when the source day doesn't fit (e.g. 31 Jan +
 * 1 month → 28/29 Feb).
 *
 * @param dateStr Source date in YYYY-MM-DD format
 * @param months  Number of months to add
 * @returns        New date in YYYY-MM-DD, or "" if the input is empty
 */
export function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) d.setDate(0);
  return d.toISOString().split("T")[0];
}

/**
 * Convert an ISO date string (YYYY-MM-DD) to a localized short string
 * (DD/MM/YYYY). Returns "" for falsy input.
 */
export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}
