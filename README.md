# Cruzer Compagnon

Application desktop tout-en-un pour **Destiny 2**, basée sur l'**API Bungie officielle**. Regroupe à terme les fonctionnalités de DIM, Light.gg, Braytech, D2ArmorPicker et Raid Report dans une seule app portable (clé USB).

## Stack

- **Tauri UI** (https://tauriui.vercel.app/)
- **Tauri 2** (Rust) — binaire natif léger et portable
- **React 19 + TypeScript + Vite**
- **TailwindCSS** — thème UI
- **Shadcn** — Bibliothèque de composants React
- **TanStack Query** — cache des appels API Bungie
- **Zustand** — state (auth persistante)
- **i18next** — 10 langues (FR, EN, ES, DE, IT, PT-BR, JA, KO, RU, ZH-CHS)
- **bungie-api-ts** — types officiels
- **Bun** — Gestionaire de dépendances

## Prérequis

1. **Node.js 20+** — `node --version`
2. **Rust (stable)** — installer depuis https://rustup.rs/
3. **Dépendances système Tauri** — voir https://v2.tauri.app/start/prerequisites/
   - Windows : WebView2 (déjà présent sur Win11) + Visual Studio Build Tools (MSVC)
4. **Clé API Bungie** — https://www.bungie.net/en/Application
   - Type d'app recommandé : **Public** (PKCE, pas de `client_secret` exposé)
   - OAuth redirect à renseigner : `http://localhost:1420/auth/callback` (dev)

## Configuration

```.env
# .env
VITE_BUNGIE_API_KEY=
VITE_BUNGIE_CLIENT_ID=
VITE_BUNGIE_REDIRECT_URI=
```

⚠️ **Ne jamais commiter `.env`.** Déjà ignoré via `.gitignore`.

## Développement

```bash
bun install
bun tauri dev
# Pour l'ajout d'un nouveau plugin sur Tauri
bun tauri add <plugin_name>
```

Le frontend tourne sur `http://localhost:1420` et Tauri ouvre une fenêtre native.

## Build production (portable)

```bash
bun tauri build
```

**Avec la mise en place de l'auto-update, le build nécessitera forcément des variables d'environnement suivants :**

```bash
export TAURI_SIGNING_PRIVATE_KEY=<your_private_key>
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=<your_private_key_password>
```

Pour plus d'information, se réferrer sur le site officiel (https://v2.tauri.app/plugin/updater/).

L'exécutable portable est généré dans `src-tauri/target/release/`.

## Publier une release (dev → public)

**Le repo GitHub est public**, donc l'updater peut utiliser GitHub
Releases : contient les installers + `latest.json`.

Publier une nouvelle version met à jour **tous les clients installés** à
leur prochaine ouverture.

## Structure

```
src/
├── api/             # Client Bungie + OAuth PKCE + manifest + vendors
├── assets/          # Comporte tout les logos / images
├── components/      # UI partagée (Layout, LanguageSwitcher, etc.)
├── constants/       # Valeurs partagées app-wide
├── pages/           # Vue par dossier (auth, dashboard, inventory, checklist, reports, activities, database, tools, …)
├── hooks/           # Custom hooks (useProfile, useItemDef, useAppSettings)
├── i18n/            # 10 fichiers de traduction
├── lib/             # Utilitaires utilisé par les services tiers (Shadcn, Tauri, etc)
├── store/           # Zustand stores (auth, settings, tags, drag, ui, …)
├── utils/           # format.ts, itemClassify.ts, itemFilter.ts, sanitizeHtml.ts
└── main.tsx

src-tauri/           # Backend Rust (Tauri)
```

## Roadmap v1

- [x] Auth OAuth PKCE + profil / personnages
- [x] Inventaire + transfert d'objets
- [x] Loadouts (persistés via Bungie API v2)
- [x] Rolls d'armes (god rolls communautaires)
- [x] Optimiseur d'armure
- [x] Checklist hebdo / triomphes / raid stats
- [x] Statistiques · Rapports · Marchands · Xûr · Bannière · Trials · Nightfall
- [x] Database (parcours complet du manifeste)

## Sécurité

Voir [SECURITY.md](SECURITY.md) pour le threat model complet, les contrôles
en place et les limites connues. Points saillants :

- OAuth PKCE (S256) — pas de `client_secret` côté client
- Tokens **non persistés** sur disque quand "Remember me" est désactivé (memory-only)
- CSP Tauri stricte — seul `bungie.net` (+ quelques CDNs statiques) en `connect-src`
- Sanitizer HTML pour tout contenu Bungie rendu via `dangerouslySetInnerHTML`
- Commandes Rust (deep-link, injection chat D2) validées avant exécution
- Checksums SHA-256 publiés pour chaque release sur [cruzer.gg](https://cruzer.gg)

## Licence

Projet personnel. Non affilié à Bungie, Inc. Destiny 2 est une marque de Bungie.