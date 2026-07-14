export function extractApiError(err: any): string {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    "Une erreur est survenue"
  );
}
