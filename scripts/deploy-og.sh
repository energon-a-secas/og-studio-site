#!/usr/bin/env bash
# deploy-og.sh — Copy generated OG images to each project's root as og-preview.jpg
# Run from og-studio-site/ (make deploy) after make generate.

set -uo pipefail
ASSETS="$(cd "$(dirname "$0")/.." && pwd)/assets"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# id:project-dir (id must match assets/og-{id}.jpg from state.js)
DEPLOYS=(
  neorgon:neorgon-site
  skill-roadmap:skill-roadmap-site
  infra-drills:local-drills-site
  json-studio:json-builder-site
  client-says:client-says-site
  decision-wheel:dynamic-wheel-game
  reference-matrix:references-api
  presentation-sage:presentation-sage-site
  emoji-archive:emoji-site
  pathfinder:pathfinder-site
  meme-vault:memes-site
  og-studio:og-studio-site
  vibe-check:interviews-site
  character-sheet:character-sheet-site
  autopilot:autopilot-site
  rush-q-cards:rush-q-cards-site
  snippets:snippets-site
  guild-hall:guild-hall-site
  parla:parla-site
  anatomy:anatomy-site
  agent-lore:agentlore-site
  buy-hacks:buyhacks-site
  team-play:team-play-site
  playbook:playbook-site
)

deploy() {
  local id="$1" dir="$2"
  local src="$ASSETS/og-${id}.jpg"
  local dst="$ROOT/${dir}/og-preview.jpg"
  if [ ! -f "$src" ]; then
    echo "  ✗  $id — source not found (run make generate first)"
  elif [ ! -d "$ROOT/$dir" ]; then
    echo "  ✗  $id — target dir not found: $dir"
  else
    cp "$src" "$dst"
    echo "  ✓  $id → ${dir}/og-preview.jpg"
  fi
}

echo ""
echo "Deploying OG images to project repos…"
echo ""

for entry in "${DEPLOYS[@]}"; do
  deploy "${entry%%:*}" "${entry#*:}"
done

echo ""
echo "Done."
