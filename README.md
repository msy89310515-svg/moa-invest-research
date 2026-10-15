# MOA INVEST Research (public deployment shell)

This repository contains a **research-only Cloudflare Worker shell**, not proprietary trading models. It cannot place orders or initiate trades.

## Deployment
- Entry point: `src/index.js`
- Wrangler config: `wrangler.toml`
- Deploy command: `npx wrangler deploy`
- No build command required.
- `RESEARCH_ENABLED` defaults to `false`.
- No secrets, customer data, exchange keys or strategy internals are stored here.

**Staged integration:** Public collection, D1/job storage, authentication and the phone dashboard are implemented and tested locally. Daily/weekly computation uses a private Service Binding; strategy/model source remains private. The deployment config remains disabled. No remote migration or activation has occurred.

The root page requires configured authentication. It displays research aggregates only, with no trading or automatic adoption. See [integration instructions and remaining work](docs/INTEGRATION.md).
