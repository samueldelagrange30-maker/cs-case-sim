#!/usr/bin/env python3
"""Build public/data/crates_index.json + public/data/crates/{id}.json from all_crates.json."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = Path("/workspace/csgo-skins/site-data/all_crates.json")

def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    out_dir = ROOT / "public" / "data"
    crates_dir = out_dir / "crates"
    crates_dir.mkdir(parents=True, exist_ok=True)

    with open(src, encoding="utf-8") as f:
        data = json.load(f)

    for p in crates_dir.glob("*.json"):
        p.unlink()

    index = []
    for c in data:
        index.append(
            {
                "id": c["id"],
                "name": c["name"],
                "type": c["type"],
                "image": c["image"],
                "market_hash_name": c.get("market_hash_name") or c["name"],
                "first_sale_date": c.get("first_sale_date") or "",
                "contains_count": len(c.get("contains") or []),
                "contains_rare_count": len(c.get("contains_rare") or []),
            }
        )
        full = {
            "id": c["id"],
            "name": c["name"],
            "description": c.get("description") or "",
            "type": c["type"],
            "image": c["image"],
            "market_hash_name": c.get("market_hash_name") or c["name"],
            "first_sale_date": c.get("first_sale_date") or "",
            "contains": c.get("contains") or [],
            "contains_rare": c.get("contains_rare") or [],
        }
        safe = c["id"].replace("/", "_")
        with open(crates_dir / f"{safe}.json", "w", encoding="utf-8") as f:
            json.dump(full, f, separators=(",", ":"), ensure_ascii=False)

    with open(out_dir / "crates_index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"), ensure_ascii=False)

    wc = out_dir / "weapon_cases.json"
    if wc.exists():
        wc.unlink()

    print(f"Wrote {len(index)} crates → {out_dir}")

if __name__ == "__main__":
    main()
