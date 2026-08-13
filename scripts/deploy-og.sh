#!/usr/bin/env bash
# deploy-og.sh — Copy generated OG images to each project's root as og-preview.jpg
# Run from og-studio-site/ (make deploy) after make generate. --dry-run prints only.
#
# The target directory for each og id is DERIVED, not maintained: js/state.js
# carries the domain each image belongs to, and docs/site-registry.json maps
# domains to project folders. The old hand-kept DEPLOYS map drifted both ways —
# six entries pointed at pre-rename directories that no longer exist (loud but
# harmless), and seventeen live sites had no entry at all, so their og-preview
# was never deployed and nothing said so. The registry join kills both: renames
# follow the registry automatically, and any live site missing from state.js is
# reported at the end of every run.

set -uo pipefail
ASSETS="$(cd "$(dirname "$0")/.." && pwd)/assets"
STATE="$(cd "$(dirname "$0")/.." && pwd)/js/state.js"
# ROOT is the *projects* dir, not the monorepo root: derived folders are bare
# project names joined onto it directly.
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REGISTRY="$ROOT/../docs/site-registry.json"

DRY_RUN=0
[ "${1:-}" = "--dry-run" ] && DRY_RUN=1

[ -f "$REGISTRY" ] || { echo "registry not found: $REGISTRY (run 'make registry' at the root)"; exit 1; }

# "ogid:folder" per line, joined state.js ←domain→ registry.
derive() {
  python3 - "$STATE" "$REGISTRY" <<'PY'
import json, re, sys

state = open(sys.argv[1]).read()
sites = json.load(open(sys.argv[2])).get("sites", [])
by_domain = {
    s["domain"]: s["folder"].split("/", 1)[1]
    for s in sites
    if s.get("domain") and s.get("folder", "").startswith("projects/")
}

pairs = re.findall(r"\{\s*id:\s*'([^']+)'.*?domain:\s*'([^']+)'", state)
covered = set()
for ogid, dom in pairs:
    folder = by_domain.get(dom)
    if folder:
        covered.add(dom)
        print(f"{ogid}:{folder}")
    else:
        print(f"WARN unknown-domain {ogid}: {dom} is in state.js but not the registry", file=sys.stderr)

# Live sites og-studio knows nothing about — the silent gap the old map had.
for s in sites:
    if s.get("lifecycle") == "live" and s.get("domain") and s["domain"] not in covered:
        print(f"WARN no-og-entry: {s['id']} ({s['domain']}) has no state.js entry — no og-preview deployed", file=sys.stderr)
PY
}

deploy() {
  local id="$1" dir="$2"
  local src="$ASSETS/og-${id}.jpg"
  local dst="$ROOT/${dir}/og-preview.jpg"
  if [ ! -f "$src" ]; then
    echo "  ✗  $id — source not found (run make generate first)"
  elif [ ! -d "$ROOT/$dir" ]; then
    echo "  ✗  $id — target dir not found: $dir"
  elif [ "$DRY_RUN" = 1 ]; then
    echo "  →  $id would copy to ${dir}/og-preview.jpg"
  else
    cp "$src" "$dst"
    echo "  ✓  $id → ${dir}/og-preview.jpg"
  fi
}

echo ""
[ "$DRY_RUN" = 1 ] && echo "Dry run — nothing will be copied." || echo "Deploying OG images to project repos…"
echo ""

while IFS= read -r entry; do
  deploy "${entry%%:*}" "${entry#*:}"
done < <(derive)

echo ""
echo "Done."
