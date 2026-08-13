.DEFAULT_GOAL := help

PORT = 8809

# ── Help ──────────────────────────────────────────────────────────────────────
.PHONY: help
help:
	@echo ""
	@echo "  make serve      Start dev server → http://localhost:$(PORT)"
	@echo "  make kill       Kill this project's HTTP server"
	@echo "  make generate   Render all OG images → assets/og-*.jpg"
	@echo "  make deploy     Copy assets/og-*.jpg to each project repo"
	@echo "  make og         generate + deploy in one shot"
	@echo "  make gif SITE=<card|domain|url>   Record a demo GIF (DEPLOY=1 → hub preview, FORCE=1 to replace)"
	@echo ""

# ── Dev server ────────────────────────────────────────────────────────────────
.PHONY: serve
serve:
	@echo "Serving → http://localhost:$(PORT)"
	@python3 -m http.server $(PORT)

# ── Kill ──────────────────────────────────────────────────────────────────────
.PHONY: kill
kill:
	@lsof -ti :$(PORT) | xargs kill 2>/dev/null && echo "Stopped server on port $(PORT)" || echo "No server running on port $(PORT)"

# ── OG image generation ───────────────────────────────────────────────────────
.PHONY: generate
generate:
	@echo "Generating OG images…"
	@node scripts/generate-og.mjs

# ── Deploy to project repos ───────────────────────────────────────────────────
.PHONY: deploy
deploy:
	@bash scripts/deploy-og.sh

# ── Full pipeline: generate + deploy ─────────────────────────────────────────
.PHONY: og
og: generate deploy

# ── Demo GIF recording ────────────────────────────────────────────────────────
# make gif SITE=questline               record to assets/gif-questline.gif
# make gif SITE=questline DEPLOY=1      also install as the hub hover preview
# make gif SITE=https://... CARD=x      URL target, explicit card id
.PHONY: gif
gif:
	@test -n "$(SITE)" || { echo "usage: make gif SITE=<card|og-id|domain|url> [DEPLOY=1] [FORCE=1] [CARD=id] [OUT=file]"; exit 1; }
	@node scripts/record-gif.mjs "$(SITE)" $(if $(DEPLOY),--deploy) $(if $(FORCE),--force) $(if $(CARD),--card $(CARD)) $(if $(OUT),--out $(OUT))
