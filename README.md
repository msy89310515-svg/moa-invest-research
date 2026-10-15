# MOA INVEST Research (public deployment shell)

This repository contains a **research-only Cloudflare Worker shell**, not proprietary trading models. It cannot place orders or initiate trades.

## Deployment
- Entry point: `src/index.js`
- Wrangler config: `wrangler.toml`
- Deploy command: `npx wrangler deploy`
- No build command required.
- `RESEARCH_ENABLED` defaults to `false`.
- No secrets, customer data, exchange keys or strategy internals are stored here.

**Important:** This shell does **not** yet collect market data, retrain models, or discover strategies. Those components remain in the private `heigoro` repository. Do not enable the cron until private logic, storage, access control and runtime tests are integrated.

The root page intentionally shows only a safe deployment status; it is not an authenticated trading dashboard.
