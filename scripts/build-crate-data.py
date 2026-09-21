#!/usr/bin/env python3
"""Build public/data/crates_index.json + public/data/crates/{id}.json.

Source: ByMykel CSGO-API crates dump (or site-data/all_crates.json).

Includes:
  - every crate that already has a typed category (Case, Souvenir, capsules, …)
  - plus weapon packages that ship with type=null in the API but contain skins:
    Terminals, X-Ray P250 Package, Anubis Collection Package → typed as Case
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = Path("/workspace/csgo-skins/crates.json")
FALLBACK_SRC = Path("/workspace/csgo-skins/site-data/all_crates.json")

# API often leaves these without a type; they are weapon containers.
WEAPON_PACKAGE_IDS = {
    "crate-4668",  # X-Ray P250 Package
    "crate-4882",  # Anubis Collection Package
    "crate-5176",  # Sealed Genesis Terminal
    "crate-5181",  # Sealed Dead Hand Terminal
}


def slim_item(it: dict) -> dict:
    rarity = it.get("rarity") or {}
    return {
        "id": it.get("id") or "",
        "name": it.get("name") or "",
        "rarity": {
            "id": rarity.get("id") or "",
            "name": rarity.get("name") or "",
            "color": rarity.get("color") or "",
        },
        "paint_index": it.get("paint_index"),
        "image": it.get("image") or "",
        "phase": it.get("phase"),
    }


def normalize_crate(c: dict) -> dict | None:
    cid = c.get("id") or ""
    name = c.get("name") or ""
    ctype = c.get("type")
    contains = [slim_item(it) for it in (c.get("contains") or [])]
    contains_rare = [slim_item(it) for it in (c.get("contains_rare") or [])]

    if not ctype:
        if cid in WEAPON_PACKAGE_IDS:
            ctype = "Case"
        else:
            # Skip empty gifts / sticker storage units without a type
            return None

    # Skip crates with nothing to open
    if not contains and not contains_rare:
        return None

    return {
        "id": cid,
        "name": name,
        "description": c.get("description") or "",
        "type": ctype,
        "image": c.get("image") or "",
        "market_hash_name": c.get("market_hash_name") or name,
        "first_sale_date": c.get("first_sale_date") or "",
        "contains": contains,
        "contains_rare": contains_rare,
    }


def main() -> None:
    if len(sys.argv) > 1:
        src = Path(sys.argv[1])
    elif DEFAULT_SRC.exists():
        src = DEFAULT_SRC
    else:
        src = FALLBACK_SRC

    out_dir = ROOT / "public" / "data"
    crates_dir = out_dir / "crates"
    crates_dir.mkdir(parents=True, exist_ok=True)

    with open(src, encoding="utf-8") as f:
        data = json.load(f)

    for p in crates_dir.glob("*.json"):
        p.unlink()

    index = []
    promoted = []
    for raw in data:
        c = normalize_crate(raw)
        if c is None:
            continue
        if raw.get("id") in WEAPON_PACKAGE_IDS and not raw.get("type"):
            promoted.append(c["name"])

        index.append(
            {
                "id": c["id"],
                "name": c["name"],
                "type": c["type"],
                "image": c["image"],
                "market_hash_name": c["market_hash_name"],
                "first_sale_date": c["first_sale_date"],
                "contains_count": len(c["contains"]),
                "contains_rare_count": len(c["contains_rare"]),
                "contains_names": sorted({it["name"] for it in c["contains"] + c["contains_rare"] if it.get("name")}),
            }
        )
        safe = c["id"].replace("/", "_")
        with open(crates_dir / f"{safe}.json", "w", encoding="utf-8") as f:
            json.dump(c, f, separators=(",", ":"), ensure_ascii=False)

    # Stable-ish order: Cases first by sale date, then the rest as in source
    # Keep source order for reproducibility (API order).
    with open(out_dir / "crates_index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"), ensure_ascii=False)

    # Also refresh site-data mirror when writable
    site = Path("/workspace/csgo-skins/site-data/all_crates.json")
    if site.parent.exists():
        full_list = []
        for raw in data:
            c = normalize_crate(raw)
            if c is None:
                continue
            full_list.append(c)
        with open(site, "w", encoding="utf-8") as f:
            json.dump(full_list, f, separators=(",", ":"), ensure_ascii=False)

    wc = out_dir / "weapon_cases.json"
    if wc.exists():
        wc.unlink()

    by_type: dict[str, int] = {}
    for e in index:
        by_type[e["type"]] = by_type.get(e["type"], 0) + 1

    print(f"Wrote {len(index)} crates → {out_dir} (from {src})")
    print("By type:", dict(sorted(by_type.items(), key=lambda x: (-x[1], x[0]))))
    if promoted:
        print("Promoted null-type weapon packages → Case:", ", ".join(promoted))


if __name__ == "__main__":
    main()
