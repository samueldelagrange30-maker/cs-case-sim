# Skin Csgo — Simulateur de caisses & capsules

Simulateur **gratuit** d'ouverture de caisses, capsules et packages Counter-Strike (CS2 / CS:GO).

> **Disclaimer :** Simulateur gratuit — aucun skin réel, aucun argent réel. Non affilié à Valve / Steam / Counter-Strike.

## Démo

Site public (GitHub Pages) : https://samueldelagrange30-maker.github.io/cs-case-sim/

Déploiement : branche `gh-pages` (build statique `dist/`).

## Fonctionnalités

- **472** caisses & capsules (filtre par type + recherche)
- Types : Caisses, Stickers, Autographes, Souvenirs, Music Kits, Patches, Pins, Graffiti, Highlights
- Page détail : contenu par rareté, ouverture ×1 / ×5 / ×10
- Roulette animée style CS
- Probabilités approx. officielles pour les caisses d'armes ; poids style capsule pour les autres types
- Usure FN/MW/FT/WW/BS + float pour skins ; N/A pour stickers / graffiti / pins / patches / music kits
- Inventaire local (`localStorage`)
- **Marché aux enchères simulé** ($SIM) : mise en vente, bots, courbe de prix

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

Source : **[ByMykel CSGO-API](https://github.com/ByMykel/CSGO-API)** (`crates.json` / `all_crates.json`).

Fichiers publiés (léger pour l'accueil) :

- `public/data/crates_index.json` — liste (~220 Ko)
- `public/data/crates/{id}.json` — contenu complet chargé à l'ouverture

Régénération : `python3 scripts/build-crate-data.py [chemin/all_crates.json]`

## Tech

Vite + React + TypeScript + Tailwind CSS (SPA).

## Licence

Projet éducatif / divertissement. Counter-Strike et les marques associées appartiennent à Valve Corporation.
