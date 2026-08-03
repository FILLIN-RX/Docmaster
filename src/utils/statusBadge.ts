const SUCCESS_BADGE = "bg-green-50 text-green-700 border-green-200";
const ERROR_BADGE = "bg-red-50 text-red-700 border-red-200";
const NEUTRAL_BADGE = "bg-gray-100 text-gray-500 border-gray-200";

const SUCCESS_STATUSES = new Set([
  "SUCCESS", "COMPLETED", "COMPLETE", "PAID", "APPROVED", "ACTIVE", "MATCHED",
  "RETURNED", "REWARDED", "VALIDATED", "CONFIRMED", "EXECUTED", "VERIFIED",
]);

const ERROR_STATUSES = new Set([
  "FAILED", "REJECTED", "REJECT", "CANCELED", "CANCELLED", "EXPIRED", "ERROR", "LOW",
]);

export function statusBadgeClass(status?: string | null): string {
  const s = (status || "").toUpperCase();
  if (!s) return NEUTRAL_BADGE;
  if (SUCCESS_STATUSES.has(s)) return SUCCESS_BADGE;
  if (ERROR_STATUSES.has(s)) return ERROR_BADGE;
  return NEUTRAL_BADGE;
}
