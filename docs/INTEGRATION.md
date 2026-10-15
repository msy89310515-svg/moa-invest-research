# Research integration boundary (staged, not deployed)

The public repository contains only market-data collection, dedicated D1 schema, job scheduling,
authentication, a read-only phone dashboard, and an aggregate result contract.
Do not merge private repository history or copy model/strategy source into this repository.

## Boundary

Public Worker → `RESEARCH_ENGINE` Service Binding → private Worker (no public routes).
The private Worker reads the dedicated market DB and writes full artifacts to a separate private DB.
Only `src/contract.js` allowlisted aggregate results may return to the public Worker.
Dashboard routes, scripts and data API require HTTPS and Basic authentication with Worker secrets.
The public `/health` endpoint contains flags only. The dashboard has no run/deploy/adopt buttons.

## Scheduling

The reviewed example config is disabled. Existing `wrangler.toml` is left disabled without bindings or cron.
When separately configured and verified, a single 30-minute scheduled handler:

1. Saves closed BTCUSDT/ETHUSDT OHLCV bars, at most96 per symbol/catchup run.
2. Claims one daily job for the UTC day and one weekly job for UTC Monday.
3. Calls only the private binding for computation; there is no external model URL or model API key.

Durable D1 job leases prevent concurrent duplicate processing. Failed jobs retry at most3 times.
A late first run in the week can claim the missed Monday slot. Completed slots never rerun.
History is immutable: differing candles at the same key abort the write batch, rather than overwrite.
No HTTP endpoint starts research or sends orders. Collection uses the public market-data-only endpoint.

## Storage and deployment prerequisites

`migrations/0001_research.sql` must be applied only to a **dedicated research D1**, never to an existing paper DB.
No database IDs, account IDs or credentials are provided. The example uses deliberately invalid placeholder IDs.
Configure `DB`, the private Service Binding, and independent dashboard secrets outside Git.
The private engine must have no workers.dev/preview URL or public route.
No deployment, migration to remote D1, cron enablement, paid plan or billing change was performed here.

Before enabling anything: verify actual Workers CPU, D1 queries/rows/storage and account quota.
Local Node timing is not Cloudflare CPU evidence. Heavy research may require a different existing free runtime;
do not enable paid resources to compensate. Keep disabled until an unbilled execution design is proven.

## What was tested

`node --test` exercises real SQLite migrations, atomic conflict rejection, job leasing, market validation,
contract redaction, authenticated phone HTML/API, HTTPS enforcement and disabled scheduling.
`node --test` uses Node24's `node:sqlite`; no additional package download is needed in this environment.

A private integration verifier ran the public Worker and the actual private engine with separate in-memory
SQLite databases, existing historical data plus real public market acquisition. All three scheduled stages
completed; replay skipped them; authenticated HTML/API returned200 with no model or trade-detail keys.
See `VERIFICATION.json`. These are local checks, not deployed D1/workerd or physical iPhone checks.

The phone layout has a viewport, wrapping text, readable controls and status messages. Physical iPhone and
Safari authentication/usability still require device verification after a separately reviewed deployment.

The bounded private research implementation is exploratory and does not prove a profitable strategy or
reproduce the complete offline three-year research. Its score metrics are aggregate simulation summaries;
they do not represent production account balances. Adoption always remains false.

## Publication check

Stage only the public allowlisted files, then run `node scripts/check-publication.mjs` before any push.
The check examines staged blobs and reports file/rule only; model artifacts, private code and raw data are
not allowlisted. Pattern checks cannot prove the absence of every possible secret.
Use a dedicated review branch. No push or merge was performed as part of this implementation stage.

Official platform references:
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.binance.com/en/docs/products/spot/faqs/market_data_only
