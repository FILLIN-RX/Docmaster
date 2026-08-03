# Plan d'implémentation : Refonte Admin DocMaster avec Mantine UI v9

## Vue d'ensemble

Migration couche par couche du panneau d'administration vers Mantine UI v9 selon le style Augenti (sidebar `#1E3A2F`, accents `#D98A30`). Ordre : utilitaires → composants partagés → layout → pages admin → tests de propriétés. La logique métier, les appels API et le routage ne sont pas modifiés.

## Tâches

- [ ] 1. Créer l'utilitaire `getStatusColor` (`src/utils/statusColor.ts`)
  - [x] 1.1 Créer le fichier `src/utils/statusColor.ts` avec la constante `STATUS_COLOR_MAP` et la fonction exportée `getStatusColor(status: string): MantineColor`
    - Mapper `COMPLETED`, `completed`, `success`, `ACTIVE`, `MATCHED`, `RETURNED` → `"green"`
    - Mapper `FAILED`, `failed`, `REJECTED`, `CANCELLED`, `CANCELED` → `"red"`
    - Mapper `PENDING`, `pending`, `SEARCHING` → `"yellow"`
    - Retourner `"gray"` pour tout statut non mappé (fallback via `?? "gray"`)
    - _Exigences : 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 1.2 Écrire les tests de propriétés pour `getStatusColor` (fast-check)
    - **Propriété 1 : statuts succès retournent `"green"`** — `fc.constantFrom(...SUCCESS_STATUSES)`
    - **Propriété 2 : statuts erreur retournent `"red"`** — `fc.constantFrom(...ERROR_STATUSES)`
    - **Propriété 3 : statuts attente retournent `"yellow"` ou `"orange"`** — `fc.constantFrom(...PENDING_STATUSES)`
    - **Propriété 4 : statut inconnu retourne `"gray"` (déterminisme)** — `fc.string().filter(s => !knownStatuses.has(s))`
    - Minimum 100 itérations par propriété (`numRuns: 100`)
    - _Exigences : 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 2. Migrer les composants UI partagés (`src/components/ui/`)
  - [ ] 2.1 Migrer `InfoTooltip.tsx` — remplacer la div avec titre par `Tooltip` Mantine
    - Importer `Tooltip` depuis `@mantine/core`
    - Conserver le prop `text: string` et `className?: string` (rétrocompatibilité)
    - Envelopper l'icône FontAwesome `fa-circle-info` dans le `Tooltip` avec `withArrow position="top"`
    - _Exigences : 7.1, 12.6_

  - [ ] 2.2 Migrer `LoadingSpinner.tsx` — remplacer le spinner CSS par `Loader` Mantine
    - Importer `Loader`, `Center` depuis `@mantine/core`
    - Conserver l'interface de props existante (taille, couleur si applicable)
    - Utiliser `variant="oval"` par défaut, centré via `Center`
    - _Exigences : 7.2, 8.8, 12.6_

  - [ ] 2.3 Migrer `EmptyState.tsx` — remplacer la div HTML par `Center` + `Stack` + `Text` Mantine
    - Importer `Center`, `Stack`, `Text` depuis `@mantine/core`
    - Conserver les props `icon?: string`, `message: string`, `colSpan?: number`
    - Si `colSpan` fourni, wrapper dans `<tr><td colSpan={colSpan}>` ; sinon rendu standalone
    - _Exigences : 7.3, 8.9, 12.6_

  - [ ] 2.4 Écrire les tests de propriétés pour `EmptyState` (fast-check)
    - **Propriété 5 : `EmptyState` rend le texte `message` pour tout couple `(icon, message)` valides**
    - Tester en mode standalone et en mode cellule de tableau (`colSpan` fourni)
    - _Exigences : 7.3_

  - [ ] 2.5 Migrer `Pagination.tsx` — remplacer la pagination HTML par `Pagination` Mantine
    - Importer `Pagination as MantinePagination`, `Group`, `Text` depuis `@mantine/core`
    - Conserver les props `current: number`, `total: number`, `pageSize: number`, `onChange: (page: number) => void`
    - Calculer `totalPages = Math.ceil(total / pageSize)` ; ne pas afficher si `totalPages <= 1`
    - _Exigences : 7.4, 12.6_

  - [ ] 2.6 Écrire les tests de propriétés pour `Pagination` (fast-check)
    - **Propriété 6 : `totalPages = Math.ceil(total / pageSize) >= 1` pour tout `(total >= 0, pageSize > 0)`**
    - Vérifier qu'aucun contrôle n'est affiché si `totalPages <= 1`
    - Vérifier que la page active est toujours dans `[1, totalPages]`
    - _Exigences : 7.4_

  - [ ] 2.7 Migrer `StatCard.tsx` — remplacer la div HTML par `Card` + `Group` + `Stack` + `Text` Mantine
    - Importer `Card`, `Group`, `Stack`, `Text`, `ThemeIcon` depuis `@mantine/core`
    - Conserver les props `icon: string` (FontAwesome), `label: string`, `value: string | number`, `color?: string`, `bgColor?: string`
    - Utiliser `ThemeIcon` pour l'icône avec la couleur sémantique
    - _Exigences : 7.5, 12.6_

  - [ ] 2.8 Vérifier/Migrer `ToastContainer.tsx` — s'assurer de l'utilisation de `@mantine/notifications`
    - Confirmer que `Notifications` de `@mantine/notifications` est utilisé
    - S'assurer que l'API `showNotification` est disponible pour les appelants existants
    - _Exigences : 7.6, 12.6_

- [ ] 3. Checkpoint — Composants partagés
  - Vérifier que tous les composants UI partagés compilent sans erreur TypeScript
  - Vérifier que les interfaces de props sont rétrocompatibles (aucune modification requise dans les pages existantes)
  - Assurer que tous les tests passent, demander à l'utilisateur en cas de questions.

- [ ] 4. Migrer `AdminLayout` (`src/layout/AdminLayout.tsx`)
  - [ ] 4.1 Remplacer la div `min-h-screen flex` par `AppShell` Mantine
    - Importer `AppShell` depuis `@mantine/core` et `useDisclosure` depuis `@mantine/hooks`
    - Configurer `navbar={{ width: 260, breakpoint: "lg", collapsed: { mobile: !opened } }}` et `header={{ height: 64 }}`
    - Placer `AdminTopbar` dans `AppShell.Header`, `AdminSidebar` dans `AppShell.Navbar`, contenu dans `AppShell.Main`
    - Conserver la gestion d'état des notifications (chargement, compteur non lus, marquer comme lu) sans modification
    - Conserver l'animation Framer Motion `motion.div` sur `<Outlet />`
    - _Exigences : 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Migrer `AdminSidebar` (`src/components/admin/AdminSidebar.tsx`)
  - [ ] 5.1 Reconstruire la sidebar avec `AppShell.Navbar` + `NavLink` + `ScrollArea` Mantine
    - Appliquer `bg="green.7"` (`#1E3A2F`) sur `AppShell.Navbar`
    - Utiliser `NavLink` Mantine pour chaque lien avec `active={isActive(item.to)}` et `color="gold"`
    - Conserver toutes les icônes FontAwesome dans le `leftSection` de chaque `NavLink`
    - Utiliser `ScrollArea` Mantine pour la zone de navigation scrollable
    - Afficher le logo DocMaster inversé (blanc) en haut
    - Adapter l'interface de props : `onClose: () => void` (supprimer `open: boolean`)
    - _Exigences : 3.1, 3.2, 3.3, 3.4, 3.6_

  - [ ] 5.2 Remplacer la modale de déconnexion HTML par un `Modal` Mantine
    - Utiliser `Modal` Mantine pour la confirmation de déconnexion (remplace la div positionnée)
    - Conserver la logique de déconnexion (`localStorage.removeItem`) sans modification
    - _Exigences : 3.5_

- [ ] 6. Migrer `AdminTopbar` (`src/components/admin/AdminTopbar.tsx`)
  - [ ] 6.1 Reconstruire la topbar avec `Group`, `TextInput`, `ActionIcon`, `Indicator`, `Avatar`, `Menu` Mantine
    - Utiliser `Group` Mantine pour aligner les éléments gauche et droite dans le header
    - Utiliser `TextInput` Mantine avec icône FontAwesome en `leftSection` pour la recherche globale
    - Utiliser `ActionIcon` + `Indicator` Mantine pour le bouton des notifications (compteur non lus)
    - Utiliser `Avatar` Mantine avec `color="gold"` pour l'initiale de l'administrateur
    - Utiliser `Menu` Mantine pour le sélecteur de langue (Français, English, العربية)
    - Conserver la logique de debounce et d'appel API de recherche sans modification
    - _Exigences : 4.1, 4.2, 4.4, 4.5, 4.6_

  - [ ] 6.2 Remplacer la div absolue des résultats de recherche par un `Popover` Mantine
    - Utiliser `Popover` Mantine pour afficher les résultats de recherche
    - Conserver la logique d'affichage conditionnel des résultats
    - _Exigences : 4.3_

- [ ] 7. Migrer `NotificationPanel` (`src/components/admin/NotificationPanel.tsx`)
  - [ ] 7.1 Remplacer la div absolue par un `Drawer` Mantine
    - Importer `Drawer`, `Stack`, `Loader`, `Center`, `Text` depuis `@mantine/core`
    - Configurer `position="right"`, `size="md"` sur le `Drawer`
    - Utiliser `Stack` Mantine pour lister les notifications
    - Utiliser `Loader` Mantine pendant le chargement (`loading === true`)
    - Utiliser le composant `EmptyState` migré quand aucune notification n'est présente
    - Conserver les handlers `onMarkRead` et `onMarkAllRead` sans modification
    - _Exigences : 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Checkpoint — Layout et navigation
  - Vérifier la navigation sidebar complète (13 liens, icônes FontAwesome, état actif)
  - Vérifier le comportement mobile (hamburger → overlay sidebar) sur breakpoint `lg`
  - Vérifier les modaux de déconnexion et le panneau de notifications
  - Assurer que tous les tests passent, demander à l'utilisateur en cas de questions.

- [ ] 9. Migrer `AdminLogin` (`src/pages/admin/AdminLogin.tsx`)
  - [ ] 9.1 Remplacer les inputs HTML par `TextInput`, `PasswordInput`, `Button` Mantine
    - Importer `TextInput`, `PasswordInput`, `Button`, `Paper`, `Stack`, `Title` depuis `@mantine/core`
    - Conserver la logique d'authentification (`localStorage.setItem("docmaster_admin_login")`) sans modification
    - Utiliser la prop `error` de `TextInput`/`PasswordInput` pour les messages d'erreur Mantine
    - _Exigences : 10.6, 12.3_

- [ ] 10. Migrer `AdminDashboard` (`src/pages/admin/AdminDashboard.tsx`)
  - [ ] 10.1 Remplacer la grille de stat-cards HTML par `SimpleGrid` + `StatCard` Mantine
    - Importer `SimpleGrid`, `Paper` depuis `@mantine/core`
    - Utiliser `SimpleGrid` avec `cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}` pour la grille responsive
    - Remplacer chaque div stat-card par le composant `StatCard` migré
    - _Exigences : 11.1, 11.2_

  - [ ] 10.2 Remplacer la table HTML des transactions récentes par `Table` + `Badge` Mantine
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Remplacer les spans de statut par `Badge color={getStatusColor(tx.status)}` Mantine
    - Utiliser `Paper` ou `Card` Mantine pour encadrer les graphiques Chart.js existants
    - Conserver l'intégration `Bar` et `Doughnut` de `react-chartjs-2` sans modification
    - _Exigences : 11.3, 11.4, 11.5_

- [ ] 11. Migrer `AdminUsers` (`src/pages/admin/AdminUsers.tsx`)
  - [ ] 11.1 Remplacer la table HTML par `Table` Mantine + filtres `TextInput` et `Select`
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Utiliser `TextInput` Mantine (avec `leftSection` FontAwesome) pour la recherche
    - Utiliser `Select` Mantine pour le filtre de statut (ACTIVE / EXPIRED / CANCELED)
    - Remplacer les spans de statut par `Badge color={getStatusColor(u.subscription_status)}` Mantine
    - _Exigences : 8.1, 9.1_

  - [ ] 11.2 Remplacer la modale HTML de détail utilisateur par un `Modal` Mantine
    - Utiliser le composant Mantine `Modal` (centré, radius `lg`) pour le détail utilisateur
    - Conserver tout le contenu de la grille info (rôle, vérification, abonnement, wallet, points, code parrainage)
    - _Exigences : 10.1, 10.5_

- [ ] 12. Migrer `AdminTransactions` (`src/pages/admin/AdminTransactions.tsx`)
  - [ ] 12.1 Remplacer la table HTML par `Table` + `Badge` Mantine
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Remplacer tous les badges de statut par `Badge color={getStatusColor(tx.status)}` Mantine
    - _Exigences : 8.3, 8.4_

- [ ] 13. Migrer `AdminDeclarations` (`src/pages/admin/AdminDeclarations.tsx`)
  - [ ] 13.1 Remplacer la table HTML et les filtres par composants Mantine
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Utiliser `TextInput` Mantine pour la recherche et `Select` pour les filtres type/statut
    - Remplacer les spans de statut par `Badge color={getStatusColor(d.status)}` Mantine
    - _Exigences : 8.2, 9.2_

  - [ ] 13.2 Remplacer la modale HTML de détail déclaration par un `Modal` Mantine
    - Utiliser `Modal` Mantine (radius `lg`, taille `xl` ou `fullScreen` sur mobile) pour le détail
    - Conserver les aperçus PDF (`<iframe>`), les photos et la logique `loadPdfPreview` sans modification
    - _Exigences : 10.2, 10.5_

- [ ] 14. Migrer `AdminSubscriptions` (`src/pages/admin/AdminSubscriptions.tsx`)
  - [ ] 14.1 Remplacer la table HTML par `Table` + `Badge` + `Card` Mantine
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Remplacer les badges de statut par `Badge color={getStatusColor(sub.status)}` Mantine
    - Utiliser `Card` Mantine pour les encadrés récapitulatifs si présents
    - _Exigences : 8.4_

- [ ] 15. Migrer `AdminWithdrawals` (`src/pages/admin/AdminWithdrawals.tsx`)
  - [ ] 15.1 Remplacer la table HTML et la modale d'action par composants Mantine
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Remplacer les badges de statut par `Badge color={getStatusColor(w.status)}` Mantine
    - Utiliser `Modal` Mantine pour les actions d'approbation/rejet
    - _Exigences : 8.5, 10.3, 10.5_

- [ ] 16. Checkpoint — Pages critiques (Login, Dashboard, Users, Transactions, Declarations, Subscriptions, Withdrawals)
  - Vérifier que toutes les tables s'affichent correctement avec les composants Mantine
  - Vérifier les badges sémantiques (vert/rouge/jaune) sur toutes les pages migrées
  - Vérifier l'ouverture/fermeture des modaux et le blocage de scroll
  - Assurer que tous les tests passent, demander à l'utilisateur en cas de questions.

- [ ] 17. Migrer `AdminDocumentTypes` (`src/pages/admin/AdminDocumentTypes.tsx`)
  - [ ] 17.1 Remplacer la table HTML et le formulaire de création/édition par composants Mantine
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Utiliser `Modal` Mantine avec `TextInput` pour le formulaire de création/édition de type de document
    - Utiliser la prop `error` de `TextInput` pour les messages d'erreur de validation
    - _Exigences : 8.7 (via pattern table), 9.4, 10.4, 9.7_

- [ ] 18. Migrer `AdminSettings` (`src/pages/admin/AdminSettings.tsx`)
  - [ ] 18.1 Remplacer les inputs HTML par `TextInput`, `NumberInput`, `Switch` Mantine
    - Utiliser `TextInput` pour les champs texte, `NumberInput` pour les champs numériques
    - Utiliser `Switch` Mantine pour les interrupteurs booléens
    - Utiliser la prop `error` de chaque champ pour les messages d'erreur de validation
    - _Exigences : 9.3, 9.7_

- [ ] 19. Migrer `AdminSms` (`src/pages/admin/AdminSms.tsx`)
  - [ ] 19.1 Remplacer les inputs HTML par `TextInput` et `Textarea` Mantine
    - Utiliser `TextInput` pour le destinataire/sujet et `Textarea` pour le corps du message
    - Utiliser la prop `error` pour les messages d'erreur de validation
    - _Exigences : 9.5, 9.7_

- [ ] 20. Migrer `AdminBroadcast` (`src/pages/admin/AdminBroadcast.tsx`)
  - [ ] 20.1 Remplacer les inputs HTML par `TextInput`, `Textarea`, `Select` Mantine
    - Utiliser `TextInput` pour le sujet, `Textarea` pour le message, `Select` pour les cibles/filtres
    - Utiliser la prop `error` pour les messages d'erreur de validation
    - _Exigences : 9.6, 9.7_

- [ ] 21. Migrer `AdminReferrals` (`src/pages/admin/AdminReferrals.tsx`)
  - [ ] 21.1 Remplacer la table HTML par `Table` Mantine
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Conserver toutes les colonnes existantes (parrain, filleul, code, date, statut)
    - _Exigences : 8.6_

- [ ] 22. Migrer `AdminMatchingMonitor` (`src/pages/admin/AdminMatchingMonitor.tsx`)
  - [ ] 22.1 Remplacer la table HTML et la modale de détail par composants Mantine
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Utiliser `Modal` Mantine pour les détails de matching
    - _Exigences : 8.7 (via pattern table), 10.4, 10.5_

- [ ] 23. Migrer `AdminActivityLog` (`src/pages/admin/AdminActivityLog.tsx`)
  - [ ] 23.1 Remplacer la table HTML par `Table` Mantine
    - Utiliser `Table` Mantine avec `striped highlightOnHover withTableBorder`
    - Conserver toutes les colonnes existantes (date, action, utilisateur, détails)
    - _Exigences : 8.7_

- [ ] 24. Checkpoint final — Toutes les pages migrées
  - Vérifier la non-régression complète : routes, services API, authentification, icônes FontAwesome, Chart.js
  - Vérifier que `localStorage.getItem("docmaster_admin_login")` fonctionne sur AdminLogin
  - Vérifier que les intégrations Chart.js (`Bar`, `Doughnut`), Framer Motion et Socket.io sont intactes
  - Assurer que tous les tests passent, demander à l'utilisateur en cas de questions.

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale après chaque couche
- Les tests de propriétés (fast-check) valident les propriétés universelles des fonctions/composants purs
- Les tests unitaires valident les exemples concrets et les cas limites
- La logique métier, les signatures API et le routage ne sont **jamais** modifiés
- Les icônes FontAwesome (`fa-solid`, `fa-regular`) sont conservées partout — aucun remplacement

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2", "2.3", "2.5", "2.7", "2.8"] },
    { "id": 2, "tasks": ["2.4", "2.6", "4.1"] },
    { "id": 3, "tasks": ["5.1", "5.2", "6.1", "6.2", "7.1"] },
    { "id": 4, "tasks": ["9.1", "10.1", "10.2", "11.1", "11.2", "12.1", "13.1", "13.2", "14.1", "15.1"] },
    { "id": 5, "tasks": ["17.1", "18.1", "19.1", "20.1", "21.1", "22.1", "23.1"] }
  ]
}
```
