# Document de Design — Refonte Admin DocMaster avec Mantine UI v9

## Overview

Ce document décrit l'architecture technique de la refonte du panneau d'administration DocMaster vers Mantine UI v9. La stratégie est une migration couche par couche : Layout → Composants admin partagés → Composants UI → Pages, sans toucher à la logique métier, aux appels API, ni au routage existant. Le design cible est le style « Augenti » : institutionnel, sobre, sidebar verte foncée (`#1E3A2F`), accents dorés (`#D98A30`).

---

## Architecture

### Vue de haut niveau

```
src/
├── theme/
│   └── mantine.ts              # docmasterTheme (existant, à compléter)
├── utils/
│   └── statusColor.ts          # getStatusColor(status) — NOUVEAU
├── layout/
│   └── AdminLayout.tsx         # AppShell Mantine (remplace div flex)
├── components/
│   ├── admin/
│   │   ├── AdminSidebar.tsx    # Navbar Mantine + NavLink
│   │   ├── AdminTopbar.tsx     # Header Mantine + Group/TextInput/Popover
│   │   └── NotificationPanel.tsx # Drawer Mantine
│   └── ui/
│       ├── InfoTooltip.tsx     # Mantine Tooltip
│       ├── LoadingSpinner.tsx  # Mantine Loader (déjà migré)
│       ├── EmptyState.tsx      # Mantine Center + Stack + Text
│       ├── Pagination.tsx      # Mantine Pagination
│       ├── StatCard.tsx        # Mantine Card + Group + Stack
│       └── ToastContainer.tsx  # @mantine/notifications (déjà migré)
└── pages/admin/
    └── [14 pages]              # Migration page par page
```

### Graphe de dépendances

```
App.tsx (MantineProvider + docmasterTheme)
  └── AdminLayout (AppShell)
       ├── AdminSidebar   (AppShell.Navbar)
       ├── AdminTopbar    (AppShell.Header)
       ├── NotificationPanel (Drawer)
       └── <Outlet>  →  [14 pages admin]
                          └── composants UI partagés
                               └── getStatusColor (statusColor.ts)
```

---

## Components and Interfaces

### 1. Thème Mantine (`src/theme/mantine.ts`)

Le thème existant est déjà conforme aux exigences 1.1 à 1.4. Aucune modification requise.

```typescript
// Existant — conforme
export const docmasterTheme = createTheme({
  fontFamily: "Poppins, sans-serif",
  headings: { fontFamily: "Bricolage Grotesque, sans-serif", fontWeight: "700" },
  primaryColor: "gold",
  primaryShade: 5,
  colors: {
    gold: ["#FEF0DC", "#FDE3B8", "#FCD694", "#FBC970",
           "#D98A30", "#D98A30", "#BD7020", "#A05818", "#834010", "#662808"],
    green: ["#E8F5EE", "#C1E8D3", "#9ADBB8", "#73CE9D",
            "#4DC182", "#3B7A58", "#2D5A42", "#1E3A2F", "#152B22", "#0C1C15"],
  },
  defaultRadius: "md",
  components: {
    Modal:  { defaultProps: { radius: "lg", padding: "lg", centered: true,
                              transitionProps: { transition: "pop" } } },
    Button: { defaultProps: { radius: "lg" } },
    Card:   { defaultProps: { radius: "lg", padding: "lg" } },
  },
});
```

---

### 2. Utilitaire `getStatusColor` (`src/utils/statusColor.ts`)

Fonction pure centralisant le mapping statut → couleur Mantine. Réutilisée dans toutes les pages.

```typescript
import type { MantineColor } from "@mantine/core";

const STATUS_COLOR_MAP: Record<string, MantineColor> = {
  // Succès / actif
  COMPLETED: "green",
  completed: "green",
  success:   "green",
  ACTIVE:    "green",
  MATCHED:   "green",
  RETURNED:  "green",
  // Erreur / rejet
  FAILED:    "red",
  failed:    "red",
  REJECTED:  "red",
  CANCELLED: "red",
  CANCELED:  "red",
  // Attente / en cours
  PENDING:   "yellow",
  pending:   "yellow",
  SEARCHING: "yellow",
};

export function getStatusColor(status: string): MantineColor {
  return STATUS_COLOR_MAP[status] ?? "gray";
}
```

---

### 3. AdminLayout (`src/layout/AdminLayout.tsx`)

Remplace le `div.min-h-screen.flex` actuel par `AppShell` Mantine.

```typescript
import { AppShell } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export default function AdminLayout() {
  const [opened, { toggle, close }] = useDisclosure(false);
  // ... state notifications inchangé

  return (
    <AppShell
      navbar={{ width: 260, breakpoint: "lg", collapsed: { mobile: !opened } }}
      header={{ height: 64 }}
      padding="md"
      bg="var(--mantine-color-body)"
    >
      <AppShell.Header>
        <AdminTopbar
          onToggleSidebar={toggle}
          unreadCount={unreadCount}
          onNotifToggle={() => setNotifOpen(!notifOpen)}
          adminInitial={adminInitial}
        />
      </AppShell.Header>

      <AppShell.Navbar>
        <AdminSidebar onClose={close} />
      </AppShell.Navbar>

      <AppShell.Main>
        <NotificationPanel
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          notifications={notifications}
          loading={loadingNotifs}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
        />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>
      </AppShell.Main>
    </AppShell>
  );
}
```

**Props supprimées :** `open: boolean` de AdminSidebar (géré par AppShell).
**Props conservées :** tous les handlers de notifications (interface inchangée).

---

### 4. AdminSidebar (`src/components/admin/AdminSidebar.tsx`)

Rendu dans `AppShell.Navbar`. Suppression de la gestion `translate-x-full`.

```typescript
import { AppShell, NavLink, ScrollArea, Avatar, Text, Stack, Modal, Button, Group } from "@mantine/core";

interface AdminSidebarProps {
  onClose: () => void;  // simplifié : plus besoin de "open"
}

// Couleur active : gold.4 = #D98A30
// Fond navbar : green.7 = #1E3A2F (via AppShell.Navbar bg)
```

**Éléments clés :**
- `AppShell.Navbar` avec `bg="green.7"` (couleur Mantine, index 7)
- `NavLink` Mantine pour chaque entrée, avec `active={isActive(item.to)}` et `color="gold"`
- `ScrollArea` Mantine pour la liste des liens
- Icônes FontAwesome conservées dans le `leftSection` de chaque `NavLink`
- `Modal` Mantine pour la confirmation de déconnexion (remplace la div modale)

---

### 5. AdminTopbar (`src/components/admin/AdminTopbar.tsx`)

```typescript
import { Group, TextInput, ActionIcon, Indicator, Avatar, Menu, Popover } from "@mantine/core";

// Barre de recherche : TextInput avec leftSection FontAwesome
// Notifications : ActionIcon + Indicator pour le compteur
// Avatar admin : couleur gold.4
// Langue : Menu Mantine (3 entrées : fr/en/ar)
// Résultats recherche : Popover Mantine (remplace la div absolue)
```

**Logique debounce et appel API conservés intégralement.**

---

### 6. NotificationPanel (`src/components/admin/NotificationPanel.tsx`)

```typescript
import { Drawer, Stack, Loader, Center, Text } from "@mantine/core";

// position="right", size="md"
// Remplace la div positionnée en absolu
// Handlers onMarkRead / onMarkAllRead inchangés
```

---

### 7. Composants UI partagés

#### InfoTooltip

```typescript
import { Tooltip, ActionIcon } from "@mantine/core";

interface InfoTooltipProps {
  text: string;
  className?: string;  // conservé pour rétrocompatibilité
}

export default function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <Tooltip label={text} withArrow position="top">
      <span style={{ display: "inline-flex", marginLeft: 6 }}>
        <i className="fa-solid fa-circle-info" style={{ color: "var(--mantine-color-gray-5)", fontSize: 11 }} />
      </span>
    </Tooltip>
  );
}
```

#### EmptyState

```typescript
import { Center, Stack, Text } from "@mantine/core";

interface EmptyStateProps {
  icon?: string;   // classe FontAwesome — conservé
  message: string;
  colSpan?: number;
}
```

Rendu conditionnel : si `colSpan` est fourni, wrapping dans `<tr><td colSpan={colSpan}>`.

#### Pagination

```typescript
import { Pagination as MantinePagination, Group, Text } from "@mantine/core";

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}
// Calcul totalPages = Math.ceil(total / pageSize)
// MantinePagination value={current} total={totalPages} onChange={onChange}
```

#### StatCard

```typescript
import { Card, Group, Stack, Text, ThemeIcon } from "@mantine/core";

interface StatCardProps {
  icon: string;   // classe FontAwesome
  label: string;
  value: string | number;
  color?: string;   // CSS color — conservé
  bgColor?: string; // CSS color — conservé
}
```

---

## Data Models

### StatusColorMap

```typescript
type KnownStatus =
  | "COMPLETED" | "completed" | "success"
  | "ACTIVE" | "MATCHED" | "RETURNED"
  | "FAILED" | "failed" | "REJECTED" | "CANCELLED" | "CANCELED"
  | "PENDING" | "pending" | "SEARCHING";

type SemanticColor = "green" | "red" | "yellow" | "gray";
```

### Notification (inchangé)

```typescript
interface Notification {
  id: string;
  lue?: boolean;
  is_read?: boolean;
  // ... autres champs API
}
```

---

## Stratégie de migration page par page

Les 14 pages admin sont migrées dans l'ordre de criticité décroissante :

| Ordre | Page | Priorité | Changements Mantine |
|-------|------|----------|---------------------|
| 1 | AdminLogin | Critique | TextInput, PasswordInput, Button |
| 2 | AdminDashboard | Critique | SimpleGrid, Card, Table, Badge |
| 3 | AdminUsers | Critique | Table, TextInput, Select, Modal |
| 4 | AdminTransactions | Haute | Table, TextInput, Select, Badge |
| 5 | AdminDeclarations | Haute | Table, TextInput, Select, Modal |
| 6 | AdminSubscriptions | Haute | Table, Badge |
| 7 | AdminWithdrawals | Haute | Table, Modal |
| 8 | AdminDocumentTypes | Moyenne | Table, Modal, TextInput |
| 9 | AdminSettings | Moyenne | TextInput, NumberInput, Switch |
| 10 | AdminSms | Moyenne | TextInput, Textarea |
| 11 | AdminBroadcast | Moyenne | TextInput, Textarea, Select |
| 12 | AdminReferrals | Basse | Table |
| 13 | AdminMatchingMonitor | Basse | Table, Modal |
| 14 | AdminActivityLog | Basse | Table |

### Pattern de migration Table (répété sur 8 pages)

```typescript
// Avant
<table className="w-full text-sm">
  <thead><tr className="border-b ...">...</tr></thead>
  <tbody className="divide-y ...">
    {items.map(item => <tr className="hover:bg-gray-50 ...">...</tr>)}
  </tbody>
</table>

// Après
import { Table, Badge } from "@mantine/core";
import { getStatusColor } from "../../utils/statusColor";

<Table striped highlightOnHover withTableBorder>
  <Table.Thead><Table.Tr>...</Table.Tr></Table.Thead>
  <Table.Tbody>
    {items.map(item => (
      <Table.Tr key={item.id}>
        <Table.Td>
          <Badge color={getStatusColor(item.status)}>{item.status}</Badge>
        </Table.Td>
      </Table.Tr>
    ))}
  </Table.Tbody>
</Table>
```

---

## Error Handling

### Formulaires

La prop `error` des composants Mantine (`TextInput`, `Select`, etc.) remplace les divs d'erreur inline actuelles. La logique de validation existante n'est pas modifiée — seul le rendu de l'erreur change :

```typescript
// Avant
{error && <div className="text-red-500 text-xs">{error}</div>}
<input className="... border-red-500" />

// Après
<TextInput error={error || undefined} />
```

### Statut inconnu dans getStatusColor

La fonction retourne `"gray"` pour tout statut non mappé. Ce comportement défensif évite les erreurs de runtime si l'API retourne un nouveau statut non prévu.

### Chargement et états vides

- `LoadingSpinner` (Mantine `Loader`) : centré dans `<div style={{ minHeight }}>`, inchangé.
- `EmptyState` : rendu dans une cellule de tableau (`<td colSpan={n}>`) ou en standalone.

---

## Contraintes de non-régression

1. **Routes** : aucun changement dans le fichier de routage React Router.
2. **API** : signatures de `adminService` et `notificationsService` inchangées.
3. **Auth** : lecture de `localStorage.getItem("docmaster_admin_login")` inchangée.
4. **Icônes** : FontAwesome conservé partout (`fa-solid`, `fa-regular`). Pas de Tabler Icons.
5. **Graphiques** : Chart.js via `react-chartjs-2` conservé sans modification.
6. **Props publiques** : interfaces de props des composants UI partagés rétrocompatibles.

---

## Correctness Properties

*Une propriété est une caractéristique ou un comportement qui doit rester vrai pour toutes les exécutions valides d'un système — une déclaration formelle de ce que le système doit faire. Les propriétés servent de pont entre les spécifications lisibles par l'homme et les garanties de correction vérifiables automatiquement.*

### Property 1: Couleur sémantique verte pour les statuts de succès

*Pour tout* statut appartenant à l'ensemble `{COMPLETED, completed, success, ACTIVE, MATCHED, RETURNED}`, la fonction `getStatusColor(status)` doit retourner la valeur `"green"`.

**Validates: Requirements 6.1**

### Property 2: Couleur sémantique rouge pour les statuts d'erreur

*Pour tout* statut appartenant à l'ensemble `{FAILED, failed, REJECTED, CANCELLED, CANCELED}`, la fonction `getStatusColor(status)` doit retourner la valeur `"red"`.

**Validates: Requirements 6.2**

### Property 3: Couleur sémantique jaune/orange pour les statuts d'attente

*Pour tout* statut appartenant à l'ensemble `{PENDING, pending, SEARCHING}`, la fonction `getStatusColor(status)` doit retourner une valeur dans `{"yellow", "orange"}`.

**Validates: Requirements 6.3**

### Property 4: Couleur grise par défaut pour tout statut inconnu

*Pour toute* chaîne de caractères `status` qui n'appartient à aucun des ensembles de statuts connus (succès, erreur, attente), la fonction `getStatusColor(status)` doit retourner `"gray"`. Cette propriété couvre également le déterminisme : un même statut inconnu retourne toujours `"gray"`, peu importe le nombre d'appels.

**Validates: Requirements 6.4, 6.5**

### Property 5: EmptyState rend le contenu fourni

*Pour tout* couple `(icon, message)` valides, le composant `EmptyState` doit rendre un élément DOM contenant le texte `message` et l'icône `icon`, que ce soit en mode standalone ou en mode cellule de tableau (`colSpan` fourni).

**Validates: Requirements 7.3**

### Property 6: Pagination cohérente pour toute configuration

*Pour tout* triplet `(current, total, pageSize)` avec `pageSize > 0` et `total >= 0`, le composant `Pagination` doit calculer `totalPages = Math.ceil(total / pageSize)`, n'afficher aucun contrôle si `totalPages <= 1`, et ne jamais indiquer une page active en dehors de l'intervalle `[1, totalPages]`.

**Validates: Requirements 7.4**


---

## Testing Strategy

### Approche duale (tests unitaires + tests de propriétés)

**Tests unitaires** — couvrent les comportements spécifiques et les exemples concrets :
- Rendu du thème Mantine (valeurs des palettes gold/green, primaryColor, fontFamily)
- Rendu des composants layout (AppShell, AdminSidebar, AdminTopbar)
- Comportement des modaux (ouverture/fermeture, confirmation de déconnexion)
- Rendu des formulaires et gestion des erreurs de validation
- Non-régression des routes, services API et logique d'authentification

**Tests de propriétés** — couvrent les propriétés universelles via des entrées générées :
- `getStatusColor` : couverture exhaustive des groupes de statuts (Propriétés 1–4)
- `EmptyState` : rendu correct pour tout couple (icon, message) (Propriété 5)
- `Pagination` : cohérence pour tout triplet (current, total, pageSize) (Propriété 6)

### Configuration des tests de propriétés

- Minimum **100 itérations** par test de propriété
- Bibliothèque recommandée : `fast-check` (déjà dans l'écosystème TypeScript/Vite)
- Format de tag : `Feature: admin-mantine-redesign, Property {N}: {texte}`

### Exemples de tests de propriétés

```typescript
// Propriété 1 — statuts succès → "green"
import fc from "fast-check";
import { getStatusColor } from "../../utils/statusColor";

const SUCCESS_STATUSES = ["COMPLETED", "completed", "success", "ACTIVE", "MATCHED", "RETURNED"];

it("Property 1: statuts succès retournent green", () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...SUCCESS_STATUSES),
      (status) => getStatusColor(status) === "green"
    ),
    { numRuns: 100 }
  );
});

// Propriété 4 — statut inconnu → "gray"
it("Property 4: statut inconnu retourne gray", () => {
  const knownStatuses = new Set([
    "COMPLETED", "completed", "success", "ACTIVE", "MATCHED", "RETURNED",
    "FAILED", "failed", "REJECTED", "CANCELLED", "CANCELED",
    "PENDING", "pending", "SEARCHING",
  ]);
  fc.assert(
    fc.property(
      fc.string().filter((s) => !knownStatuses.has(s)),
      (status) => getStatusColor(status) === "gray"
    ),
    { numRuns: 100 }
  );
});

// Propriété 6 — Pagination cohérente
it("Property 6: totalPages cohérent pour tout (current, total, pageSize)", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 1000 }),  // total
      fc.integer({ min: 1, max: 100 }),   // pageSize
      fc.integer({ min: 1, max: 1000 }), // current (peut dépasser totalPages)
      (total, pageSize, current) => {
        const totalPages = Math.ceil(total / pageSize);
        // Propriété : totalPages >= 1
        return totalPages >= 1;
      }
    ),
    { numRuns: 100 }
  );
});
```
