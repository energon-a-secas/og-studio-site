#!/usr/bin/env bash
# deploy-og.sh — Copy generated OG images to each project's root as og-preview.jpg
# Run from og-studio-site/ directory (or the Makefile handles that via cd)

set -uo pipefail
ASSETS="$(cd "$(dirname "$0")/.." && pwd)/assets"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

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

deploy "neorgon"          "neorgon-site"
deploy "skill-roadmap"    "skill-roadmap-site"
deploy "infra-drills"     "local-drills-site"
deploy "json-studio"      "json-builder-site"
deploy "client-says"      "client-says-site"
deploy "decision-wheel"   "dynamic-wheel-game"
deploy "reference-matrix" "references-api"
deploy "presentation-sage" "presentation-sage"
deploy "emoji-archive"    "emoji-site"
deploy "pathfinder"       "pathfinder-site"
deploy "meme-vault"       "memes-site"
deploy "og-studio"        "og-studio-site"
deploy "vibe-check"       "interviews-site"
deploy "character-sheet"  "character-sheet-site"
deploy "autopilot"        "autopilot-site"
deploy "rush-q-cards"     "rush-q-cards-site"
deploy "snippets"         "snippets-site"
deploy "guild-hall"       "guild-hall-site"
deploy "parla"            "parla-site"
deploy "anatomy"            "parla-site"

echo ""
echo "Done."
