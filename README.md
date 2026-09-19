# Skin Csgo — Simulateur de caisses

Simulateur **gratuit** d'ouverture de caisses d'armes Counter-Strike (CS2 / CS:GO).

> **Disclaimer :** Simulateur gratuit — aucun skin réel, aucun argent réel. Non affilié à Valve / Steam / Counter-Strike.

## Démo

Site public (GitHub Pages) : https://samueldelagrange30-maker.github.io/cs-case-sim/

Déploiement : branche `gh-pages` (build statique `dist/`).

## Fonctionnalités

- Grille de 42 caisses d'armes avec recherche
- Page caisse : contenu par rareté, ouverture ×1 / ×5 / ×10
- Roulette animée style CS
- Probabilités approximatives officielles (Mil-Spec 79,92 % · Restricted 15,98 % · Classified 3,2 % · Covert 0,64 % · Rare Special 0,26 %)
- Usure FN/MW/FT/WW/BS + float, StatTrak™ (~10 %)
- Inventaire local (`localStorage`)

## Lancer en local

```bash
npm install
npm run dev
```

Build de production :

```bash
npm run build
npm run preview
```

Le `base` Vite est configuré pour GitHub Pages : `/cs-case-sim/`.

## Données

Les skins / caisses proviennent de **[ByMykel CSGO-API](https://github.com/ByMykel/CSGO-API)** (`crates.json`, filtrées en caisses d'armes). Images via le CDN Steam Community.

Fichier utilisé : `public/data/weapon_cases.json`.

## Tech

Vite + React + TypeScript + Tailwind CSS (SPA).

## Licence

Projet éducatif / divertissement. Counter-Strike et les marques associées appartiennent à Valve Corporation.
