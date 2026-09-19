#!/usr/bin/env python3
"""Build public/data/collections.json + skin_collections.json from ByMykel dumps."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COLLECTIONS_SRC = Path("/workspace/csgo-skins/collections.json")
SKINS_SRC = Path("/workspace/csgo-skins/skins.json")


def main() -> None:
    col_src = Path(sys.argv[1]) if len(sys.argv) > 1 else COLLECTIONS_SRC
    skin_src = Path(sys.argv[2]) if len(sys.argv) > 2 else SKINS_SRC
    out_dir = ROOT / "public" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    with open(col_src, encoding="utf-8") as f:
        collections = json.load(f)

    slim = []
    name_to_cols: dict[str, list[str]] = {}

    for col in collections:
        items = []
        for it in col.get("contains") or []:
            iid = str(it.get("id") or "")
            if not iid.startswith("skin-"):
                continue
            rarity = it.get("rarity") or {}
            name = it.get("name") or ""
            entry = {
                "id": iid,
                "name": name,
                "image": it.get("image") or "",
                "rarity": {
                    "name": rarity.get("name") or "",
                    "color": rarity.get("color") or "",
                },
            }
            items.append(entry)
            if name:
                lst = name_to_cols.setdefault(name, [])
                if col["id"] not in lst:
                    lst.append(col["id"])

        if not items:
            continue

        slim.append(
            {
                "id": col["id"],
                "name": col["name"],
                "image": col.get("image") or "",
                "release_date": col.get("release_date") or "",
                "crates": [cr.get("name") or "" for cr in (col.get("crates") or [])],
                "items": items,
            }
        )

    # Enrich name→collections from skins.json when present
    if skin_src.exists():
        with open(skin_src, encoding="utf-8") as f:
            skins = json.load(f)
        for sk in skins:
            name = sk.get("name") or ""
            cols = sk.get("collections") or []
            if not name or not cols:
                continue
            lst = name_to_cols.setdefault(name, [])
            for c in cols:
                cid = c.get("id") if isinstance(c, dict) else None
                if cid and cid not in lst:
                    lst.append(cid)

    coll_path = out_dir / "collections.json"
    map_path = out_dir / "skin_collections.json"
    index_path = out_dir / "collections_index.json"

    with open(coll_path, "w", encoding="utf-8") as f:
        json.dump(slim, f, separators=(",", ":"), ensure_ascii=False)

    with open(map_path, "w", encoding="utf-8") as f:
        json.dump(name_to_cols, f, separators=(",", ":"), ensure_ascii=False)

    index = [
        {
            "id": c["id"],
            "name": c["name"],
            "image": c["image"],
            "release_date": c["release_date"],
            "crates": c["crates"],
            "item_count": len(c["items"]),
        }
        for c in slim
    ]
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"), ensure_ascii=False)

    print(
        f"Wrote {len(slim)} collections → {coll_path} "
        f"({coll_path.stat().st_size} bytes)"
    )
    print(
        f"Wrote {len(name_to_cols)} skin→collections → {map_path} "
        f"({map_path.stat().st_size} bytes)"
    )
    print(f"Wrote index ({len(index)}) → {index_path}")


if __name__ == "__main__":
    main()
