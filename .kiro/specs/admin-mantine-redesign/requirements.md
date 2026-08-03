# Document d'exigences — Refonte Admin DocMaster avec Mantine UI v9

## Introduction

Ce document décrit les exigences pour la refonte intégrale du panneau d'administration DocMaster. La migration adopte Mantine UI v9 comme bibliothèque de composants principale, en remplacement progressif des classes CSS utilitaires Tailwind actuelles. La stratégie de migration est couche par couche : Layout → Composants admin → Composants UI partagés → Pages admin une par une. Les icônes FontAwesome sont conservées. La logique métier, les appels API et la structure de routage ne sont pas modifiés.

Le design cible est dit « Augenti » : institutionnel, sobre, professionnel, espacé, moderne, avec une sidebar verte foncée (`#1E3A2F`) et des accents dorés (`#D98A30`). Un système de couleurs sémantiques strict s'applique à tous les indicateurs de statut.

## Glossaire

- **AdminPanel** : L'ensemble du panneau d'administration de DocMaster accessible via `/admin`.
- **AdminLayout** : Le composant racine de mise en page admin composé de `AdminSidebar`, `AdminTopbar` et d'une zone de contenu principal.
- **AdminSidebar** : La barre de navigation latérale fixe, de couleur `#1E3A2F`, contenant les liens de navigation.
- **AdminTopbar** : La barre d'en-tête supérieure fixe contenant la recherche globale, les notifications et le profil admin.
- **NotificationPanel** : Le panneau glissant affichant les notifications non lues de l'administrateur.
- **MantineTheme** : La configuration du thème Mantine (`docmasterTheme`) définie dans `src/theme/mantine.ts`, incluant les couleurs `gold` et `green`.
- **CouleursSémantiques** : Le système de couleurs d'état : vert pour succès/actif, rouge pour erreur/rejet, jaune-orange pour avertissement/attente.
- **Badge** : Le composant Mantine `Badge` utilisé pour afficher les statuts.
- **Table** : Le composant Mantine `Table` utilisé pour les listes de données paginées.
- **StatCard** : Le composant UI partagé affichant une métrique avec icône, valeur et tendance.
- **EmptyState** : Le composant UI partagé affiché en l'absence de données dans un tableau.
- **LoadingSpinner** : Le composant UI partagé affiché pendant le chargement des données.
- **InfoTooltip** : Le composant UI partagé affichant une infobulle contextuelle.
- **Pagination** : Le composant UI partagé de navigation entre les pages de résultats.
- **ToastContainer** : Le composant UI partagé d'affichage des notifications toast.
- **PageAdmin** : L'une des 14 pages du panneau admin (AdminDashboard, AdminUsers, AdminDeclarations, AdminTransactions, AdminSubscriptions, AdminWithdrawals, AdminMatchingMonitor, AdminSettings, AdminSms, AdminBroadcast, AdminReferrals, AdminDocumentTypes, AdminActivityLog, AdminLogin).

---

## Exigences

### Exigence 1 — Configuration du thème Mantine

**User Story :** En tant qu'administrateur, je veux que l'interface admin utilise les couleurs et polices de la charte Augenti, afin d'avoir une expérience visuelle cohérente et professionnelle.

#### Critères d'acceptation

1. THE `MantineTheme` SHALL définir `primaryColor: "gold"` et `primaryShade: 5` dans la configuration Mantine.
2. THE `MantineTheme` SHALL inclure la palette `gold` avec `#D98A30` à l'index 4 et la palette `green` avec `#1E3A2F` à l'index 7.
3. THE `MantineTheme` SHALL définir `fontFamily: "Poppins, sans-serif"` et `headings.fontFamily: "Bricolage Grotesque, sans-serif"`.
4. THE `MantineTheme` SHALL définir des `defaultProps` pour les composants `Modal` (centré, radius `lg`, transition `pop`), `Button` (radius `lg`) et `Card` (radius `lg`, padding `lg`).
5. WHEN le `MantineProvider` est rendu, THE `AdminPanel` SHALL recevoir le `MantineTheme` via le prop `theme` du `MantineProvider`.

---

### Exigence 2 — Migration du Layout admin

**User Story :** En tant qu'administrateur, je veux que la structure sidebar + topbar soit construite avec les primitives Mantine, afin de bénéficier d'une mise en page responsive et cohérente.

#### Critères d'acceptation

1. THE `AdminLayout` SHALL utiliser le composant Mantine `AppShell` avec une configuration `navbar` (largeur 260 px, breakpoint `lg`) et `header` (hauteur 64 px).
2. WHEN la largeur de la fenêtre est inférieure au breakpoint `lg`, THE `AdminSidebar` SHALL être masquée et accessible via un bouton hamburger dans l'`AdminTopbar`.
3. WHEN le bouton hamburger est activé, THE `AdminSidebar` SHALL s'afficher en overlay sur le contenu principal sur mobile.
4. THE `AdminLayout` SHALL conserver la gestion d'état des notifications (chargement, compteur non lus, marquer comme lu) sans modification de la logique métier.
5. THE `AdminLayout` SHALL utiliser le composant Mantine `motion.div` de Framer Motion pour l'animation de transition de page sur changement de route.

---

### Exigence 3 — Migration de AdminSidebar

**User Story :** En tant qu'administrateur, je veux une sidebar dans le design Augenti entièrement construite avec Mantine, afin de naviguer de façon fluide et esthétique.

#### Critères d'acceptation

1. THE `AdminSidebar` SHALL avoir un fond de couleur `green.7` (`#1E3A2F`) défini via la prop `bg` ou les styles Mantine.
2. THE `AdminSidebar` SHALL afficher le logo DocMaster en haut, inversé (blanc) sur fond vert.
3. WHEN un lien de navigation est actif (route correspondante), THE `AdminSidebar` SHALL mettre en évidence ce lien avec une couleur d'accent `gold.4` (`#D98A30`) via un style Mantine `NavLink` ou équivalent.
4. THE `AdminSidebar` SHALL conserver tous les 13 liens de navigation existants avec leurs icônes FontAwesome respectives.
5. WHEN le bouton de déconnexion est cliqué, THE `AdminSidebar` SHALL afficher un `Modal` Mantine de confirmation de déconnexion à la place de la `div` modale actuelle.
6. THE `AdminSidebar` SHALL utiliser le composant Mantine `ScrollArea` pour la zone de navigation scrollable.

---

### Exigence 4 — Migration de AdminTopbar

**User Story :** En tant qu'administrateur, je veux une barre d'en-tête construite avec Mantine, afin d'avoir une recherche globale, un accès aux notifications et un sélecteur de langue fonctionnels.

#### Critères d'acceptation

1. THE `AdminTopbar` SHALL utiliser le composant Mantine `Group` pour aligner les éléments gauche et droite dans le header.
2. THE `AdminTopbar` SHALL utiliser le composant Mantine `TextInput` avec icône de recherche pour le champ de recherche globale, en conservant la logique de debounce et d'appel API existante.
3. WHEN la recherche renvoie des résultats, THE `AdminTopbar` SHALL afficher les résultats dans un `Popover` ou `Menu` Mantine.
4. THE `AdminTopbar` SHALL utiliser le composant Mantine `ActionIcon` pour le bouton des notifications, avec un `Indicator` Mantine pour le compteur de non-lus.
5. THE `AdminTopbar` SHALL utiliser le composant Mantine `Avatar` pour l'initiale de l'administrateur, avec la couleur `gold.4`.
6. THE `AdminTopbar` SHALL utiliser le composant Mantine `Menu` pour le sélecteur de langue (Français, English, العربية).

---

### Exigence 5 — Migration de NotificationPanel

**User Story :** En tant qu'administrateur, je veux un panneau de notifications construit avec Mantine, afin de consulter et gérer les notifications de façon ergonomique.

#### Critères d'acceptation

1. THE `NotificationPanel` SHALL être implémenté avec le composant Mantine `Drawer` (position `right`, taille `md`) à la place de la `div` positionnée en absolu actuelle.
2. THE `NotificationPanel` SHALL utiliser le composant Mantine `Stack` pour lister les notifications.
3. THE `NotificationPanel` SHALL utiliser le composant Mantine `Loader` pendant le chargement des notifications.
4. WHEN aucune notification n'est présente, THE `NotificationPanel` SHALL afficher un `EmptyState` avec icône FontAwesome et message approprié.
5. THE `NotificationPanel` SHALL conserver les handlers `onMarkRead` et `onMarkAllRead` sans modification de la logique métier.

---

### Exigence 6 — Système de couleurs sémantiques des statuts

**User Story :** En tant qu'administrateur, je veux que tous les badges et indicateurs de statut respectent un code couleur sémantique universel, afin d'interpréter rapidement l'état des données.

#### Critères d'acceptation

1. THE `AdminPanel` SHALL appliquer la couleur `green` (variante Mantine) aux `Badge` dont le statut est parmi : `COMPLETED`, `ACTIVE`, `MATCHED`, `RETURNED`.
2. THE `AdminPanel` SHALL appliquer la couleur `red` (variante Mantine) aux `Badge` dont le statut est parmi : `FAILED`, `REJECTED`, `CANCELLED`.
3. THE `AdminPanel` SHALL appliquer la couleur `yellow` ou `orange` (variante Mantine) aux `Badge` dont le statut est parmi : `PENDING`, `SEARCHING`.
4. THE `AdminPanel` SHALL implémenter une fonction utilitaire `getStatusColor(status: string): MantineColor` réutilisable dans toutes les pages admin.
5. WHEN un statut inconnu est fourni à `getStatusColor`, THE `AdminPanel` SHALL retourner la couleur `gray` par défaut.

---

### Exigence 7 — Migration des composants UI partagés

**User Story :** En tant que développeur, je veux que les composants UI partagés utilisés dans le panneau admin soient migrés vers Mantine, afin d'assurer la cohérence visuelle de l'ensemble du panneau.

#### Critères d'acceptation

1. THE `InfoTooltip` SHALL être réimplémenté avec le composant Mantine `Tooltip` en conservant le prop `text` existant.
2. THE `LoadingSpinner` SHALL être réimplémenté avec le composant Mantine `Loader` (variant `oval` ou `dots`) en conservant l'interface de prop existante.
3. THE `EmptyState` SHALL être réimplémenté avec les composants Mantine `Center`, `Stack` et `Text`, en conservant les props `icon`, `message` et `colSpan`.
4. THE `Pagination` SHALL être réimplémenté avec le composant Mantine `Pagination` en conservant les props `current`, `total`, `pageSize` et `onChange`.
5. THE `StatCard` SHALL être réimplémenté avec les composants Mantine `Card`, `Group`, `Stack` et `Text` en conservant les props existants.
6. THE `ToastContainer` SHALL être remplacé par l'utilisation de `@mantine/notifications` avec `Notifications` de `@mantine/notifications`, en conservant l'API `showNotification` pour les appelants existants.
7. WHEN les composants UI partagés sont migrés, THE `AdminPanel` SHALL continuer à fonctionner sans modification des imports dans les pages admin existantes (interface de prop rétrocompatible).

---

### Exigence 8 — Migration des pages admin — Tables de données

**User Story :** En tant qu'administrateur, je veux que les tableaux de données des pages admin utilisent le composant Mantine `Table`, afin d'avoir une présentation tabulaire cohérente et accessible.

#### Critères d'acceptation

1. THE `AdminUsers` SHALL utiliser le composant Mantine `Table` avec `striped`, `highlightOnHover` et `withTableBorder` pour afficher la liste des utilisateurs.
2. THE `AdminDeclarations` SHALL utiliser le composant Mantine `Table` pour afficher la liste des déclarations.
3. THE `AdminTransactions` SHALL utiliser le composant Mantine `Table` pour afficher la liste des transactions.
4. THE `AdminSubscriptions` SHALL utiliser le composant Mantine `Table` pour afficher la liste des abonnements.
5. THE `AdminWithdrawals` SHALL utiliser le composant Mantine `Table` pour afficher la liste des retraits.
6. THE `AdminReferrals` SHALL utiliser le composant Mantine `Table` pour afficher la liste des parrainages.
7. THE `AdminActivityLog` SHALL utiliser le composant Mantine `Table` pour afficher le journal d'activité.
8. WHEN une table est en cours de chargement, THE `AdminPanel` SHALL afficher le composant `LoadingSpinner` migré (Mantine `Loader`) centré sur la zone de contenu.
9. WHEN une table ne contient aucune donnée, THE `AdminPanel` SHALL afficher le composant `EmptyState` migré (Mantine) dans une ligne de table couvrant toutes les colonnes.

---

### Exigence 9 — Migration des pages admin — Formulaires et filtres

**User Story :** En tant qu'administrateur, je veux que les champs de recherche, sélecteurs et filtres des pages admin utilisent les composants Mantine, afin d'avoir une saisie cohérente et accessible.

#### Critères d'acceptation

1. THE `AdminUsers` SHALL utiliser le composant Mantine `TextInput` pour le champ de recherche et le composant Mantine `Select` pour le filtre de statut.
2. THE `AdminDeclarations` SHALL utiliser les composants Mantine `TextInput` et `Select` pour les filtres de recherche et de statut.
3. THE `AdminSettings` SHALL utiliser les composants Mantine `TextInput`, `NumberInput` et `Switch` pour les champs de configuration.
4. THE `AdminDocumentTypes` SHALL utiliser un composant Mantine `Modal` avec `TextInput` pour le formulaire de création/édition de type de document.
5. THE `AdminSms` SHALL utiliser les composants Mantine `TextInput` et `Textarea` pour la composition des messages SMS.
6. THE `AdminBroadcast` SHALL utiliser les composants Mantine `TextInput`, `Textarea` et `Select` pour la composition des messages de diffusion.
7. WHEN un champ obligatoire est vide lors de la soumission d'un formulaire, THE `AdminPanel` SHALL afficher un message d'erreur Mantine (`error` prop du champ) sans modifier la logique de validation existante.

---

### Exigence 10 — Migration des pages admin — Modaux et actions

**User Story :** En tant qu'administrateur, je veux que les boîtes de dialogue de confirmation et de détail utilisent le composant Mantine `Modal`, afin d'avoir une expérience modale cohérente.

#### Critères d'acceptation

1. THE `AdminUsers` SHALL afficher le détail d'un utilisateur dans un composant Mantine `Modal` à la place de la `div` positionnée actuelle.
2. THE `AdminDeclarations` SHALL afficher le détail d'une déclaration dans un composant Mantine `Modal`.
3. THE `AdminWithdrawals` SHALL afficher les actions d'approbation/rejet dans un composant Mantine `Modal`.
4. THE `AdminMatchingMonitor` SHALL afficher les détails de matching dans un composant Mantine `Modal`.
5. WHEN un `Modal` est ouvert, THE `AdminPanel` SHALL bloquer le scroll de la page et afficher un overlay semi-transparent, selon le comportement par défaut du composant Mantine `Modal`.
6. THE `AdminLogin` SHALL utiliser les composants Mantine `TextInput`, `PasswordInput` et `Button` pour le formulaire de connexion, sans modifier la logique d'authentification existante.

---

### Exigence 11 — Migration du Dashboard (AdminDashboard)

**User Story :** En tant qu'administrateur, je veux que le tableau de bord utilise des composants Mantine pour les cartes de statistiques et le tableau des transactions récentes, afin d'avoir une page d'accueil visuellement cohérente.

#### Critères d'acceptation

1. THE `AdminDashboard` SHALL utiliser le composant Mantine `SimpleGrid` pour afficher les cartes de statistiques en grille responsive.
2. THE `AdminDashboard` SHALL utiliser le composant `StatCard` migré vers Mantine pour chaque métrique (utilisateurs, abonnements, revenus, documents).
3. THE `AdminDashboard` SHALL utiliser les composants Mantine `Paper` ou `Card` pour encadrer les graphiques Chart.js.
4. THE `AdminDashboard` SHALL utiliser le composant Mantine `Table` pour le tableau des transactions récentes, avec des `Badge` Mantine respectant les couleurs sémantiques pour les statuts.
5. THE `AdminDashboard` SHALL conserver l'intégration Chart.js (`Bar`, `Doughnut`) sans modification des données ni des options de graphique.

---

### Exigence 12 — Contraintes de non-régression

**User Story :** En tant que développeur, je veux que la migration vers Mantine ne casse aucune fonctionnalité existante, afin de garantir la continuité du service pour les administrateurs.

#### Critères d'acceptation

1. THE `AdminPanel` SHALL conserver toutes les routes admin existantes (`/admin`, `/admin/users`, `/admin/declarations`, etc.) sans modification du fichier de routage.
2. THE `AdminPanel` SHALL conserver tous les appels aux services API (`adminService`, `notificationsService`) sans modification des signatures de fonction.
3. THE `AdminPanel` SHALL conserver la logique d'authentification admin basée sur `localStorage.getItem("docmaster_admin_login")` sans modification.
4. THE `AdminPanel` SHALL conserver les icônes FontAwesome (`fa-solid`, `fa-regular`) dans tous les composants migrés, sans remplacement par Tabler Icons ou toute autre bibliothèque d'icônes.
5. THE `AdminPanel` SHALL conserver les intégrations tierces existantes (Chart.js via `react-chartjs-2`, Framer Motion, Socket.io) sans modification.
6. IF un composant UI partagé est migré vers Mantine, THEN THE `AdminPanel` SHALL conserver l'interface de props publique existante de ce composant afin d'éviter toute modification en cascade dans les pages non-admin.
