# Ordre de priorité de refactoring

- [] On a besoin de la partie Rust uniquement pour l'OAuth, le reste se fera du côté front en tirant parti de zustand avec la mise en place d'un store pour éviter de spam les requêtes. Dans le cas contraire, le plugin shell de Tauri ouvre un terminal pour ouvrir le navigateur par défaut et c'est moche (entraîne aussi des ralentissements).
- [] DRY : pas respecté ! Normal le copaing à demandé à l'IA de le faire et n'a pas connaissance de ce genre de bonnes pratiques.
    - [x] Suppression de Postmaster.tsx (inutilisé)
- [] Ergonomie désastreuse : besoin de revoir avec lui l'organisation de l'app, on s'y perd bcp trop vite.
- [] MVC : clairement pas respecté !
- [] Utlisation de Shacn pour les composants parce que la maintenance est horrible sinon et pas opti surtout
    - [x] Utilisation du composant Toaster au lieu de la version Wish de Claude
- [] Séparation claire des constantes / utils / hooks et lib (clairement mélangé)