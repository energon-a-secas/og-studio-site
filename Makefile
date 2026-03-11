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
