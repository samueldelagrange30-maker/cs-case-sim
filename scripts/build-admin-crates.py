#!/usr/bin/env python3
"""Build admin-{slug}.json rarity crates from skins.json and merge into crates_index.json."""
from __future__ import annotations

import json
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SKINS = Path("/workspace/csgo-skins/skins.json")

ADMIN_RARITIES = OrderedDict(
    [
        (
            "rarity_common_weapon",
            ("consumer", "Consumer Grade", "Caisses ADMIN — Consumer Grade uniquement"),
        ),
        (
            "rarity_uncommon_weapon",
            ("industrial", "Industrial Grade", "Caisses ADMIN — Industrial Grade uniquement"),
        ),
        (
            "rarity_rare_weapon",
            ("mil-spec", "Mil-Spec", "Caisses ADMIN — Mil-Spec uniquement"),
        ),
        (
            "rarity_mythical_weapon",
            ("restricted", "Restricted", "Caisses ADMIN — Restricted uniquement"),
        ),
        (
            "rarity_legendary_weapon",
            ("classified", "Classified", "Caisses ADMIN — Classified uniquement"),
        ),
        (
            "rarity_ancient_weapon",
            ("covert", "Covert", "Caisses ADMIN — Covert uniquement"),
        ),
        (
            "rarity_ancient",
            (
                "extraordinary",
                "Extraordinary",
                "Caisses ADMIN — Extraordinary (couteaux / gants) uniquement",
            ),
        ),
        (
            "rarity_contraband_weapon",
            ("contraband", "Contraband", "Caisses ADMIN — Contraband (très rare)"),
        ),
    ]
)


def main() -> None:
    import sys

    skins_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SKINS
    out_dir = ROOT / "public" / "data"
    crates_dir = out_dir / "crates"
    crates_dir.mkdir(parents=True, exist_ok=True)

    with open(skins_path, encoding="utf-8") as f:
        skins = json.load(f)

    buckets: dict[str, list] = {rid: [] for rid in ADMIN_RARITIES}
    for s in skins:
        rid = (s.get("rarity") or {}).get("id")
        if rid not in buckets:
            continue
        paint = s.get("paint_index")
        if paint is not None:
            paint = str(paint)
        buckets[rid].append(
            {
                "id": s["id"],
                "name": s["name"],
                "rarity": s["rarity"],
                "paint_index": paint,
                "image": s["image"],
                "phase": s.get("phase"),
            }
        )

    fallback_img = None
    for p in sorted(crates_dir.glob("crate-*.json")):
        with open(p, encoding="utf-8") as f:
            c = json.load(f)
        if c.get("image"):
            fallback_img = c["image"]
            break

    index_path = out_dir / "crates_index.json"
    if index_path.exists():
        with open(index_path, encoding="utf-8") as f:
            index = json.load(f)
    else:
        index = []

    index = [
        e
        for e in index
        if not str(e.get("id", "")).startswith("admin-") and e.get("type") != "Admin"
    ]
    for p in crates_dir.glob("admin-*.json"):
        p.unlink()

    created = 0
    for rid, (slug, label, desc) in ADMIN_RARITIES.items():
        items = buckets[rid]
        if not items:
            print(f"SKIP {slug}: 0 skins")
            continue
        cid = f"admin-{slug}"
        image = items[0]["image"] or fallback_img or ""
        full = {
            "id": cid,
            "name": f"ADMIN — {label}",
            "description": (
                f"{desc}\n\nContient {len(items)} skin(s) de rareté pure. "
                "Probabilité uniforme."
            ),
            "type": "Admin",
            "image": image,
            "market_hash_name": f"ADMIN {label} Case",
            "first_sale_date": "",
            "contains": items,
            "contains_rare": [],
        }
        with open(crates_dir / f"{cid}.json", "w", encoding="utf-8") as f:
            json.dump(full, f, separators=(",", ":"), ensure_ascii=False)
        index.append(
            {
                "id": cid,
                "name": full["name"],
                "type": "Admin",
                "image": image,
                "market_hash_name": full["market_hash_name"],
                "first_sale_date": "",
                "contains_count": len(items),
                "contains_rare_count": 0,
            }
        )
        created += 1
        print(f"OK {cid}: {len(items)} skins")

    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"), ensure_ascii=False)

    print(f"Wrote {created} admin crates · index size {len(index)}")


if __name__ == "__main__":
    main()
