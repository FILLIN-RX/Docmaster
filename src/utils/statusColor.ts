import type { MantineColor } from "@mantine/core";

const STATUS_COLOR_MAP: Record<string, MantineColor> = {
  // Succès / actif / complété
  COMPLETED: "green",
  completed: "green",
  success:   "green",
  ACTIVE:    "green",
  MATCHED:   "green",
  RETURNED:  "green",
  approved:  "green",
  rewarded:  "green",
  // Erreur / rejet / annulé / échoué
  FAILED:    "red",
  failed:    "red",
  REJECTED:  "red",
  rejected:  "red",
  CANCELLED: "red",
  CANCELED:  "red",
  EXPIRED:   "red",
  // En attente / neutre → gris
  PENDING:   "gray",
  pending:   "gray",
  SEARCHING: "gray",
};

export function getStatusColor(status: string): MantineColor {
  return STATUS_COLOR_MAP[status] ?? "gray";
}
