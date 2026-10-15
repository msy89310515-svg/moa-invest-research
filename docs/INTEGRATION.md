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

Stage only the public allowlisted files, then run `node scripts/check-publication.mjs origin/main` before any push.
The check examines staged blobs and reports file/rule only; model artifacts, private code and raw data are
not allowlisted. Pattern checks cannot prove the absence of every possible secret.
Use a dedicated review branch. No push or merge was performed as part of this implementation stage.

Official platform references:
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.binance.com/en/docs/products/spot/faqs/market_data_only

## Connection runbook (review only; no remote commands executed)

1. Keep the public and private checkouts separate. Never merge private Git history into this repository.
2. After separate deployment approval, use two new dedicated D1 databases: market and private artifacts.
   Public `DB` and private `MARKET_DB` must identify the same market database. Private `PRIVATE_DB`
   must identify a different database. Never bind the existing paper-trading database.
3. Review `wrangler.research.example.toml` and the private repository's example together.
   Fill real identifiers only in ignored, local configuration outside the publication allowlist.
   Public migration directory is `migrations`; private artifact migration directory is
   `private-research/migrations`. The private market binding owns no migrations.
4. Public `RESEARCH_ENGINE` must target the exact private Worker name in the same account/environment.
   Use the HTTP Service Binding, not a public URL. Keep private workers.dev, previews and routes disabled.
5. Keep both RESEARCH_ENABLED values false, and Cron absent, until all acceptance gates pass.
   Set dashboard credentials using a secret input interface; never put values in command arguments or Git.

When Wrangler is already installed, the following commands are **local only**, from each respective
configuration directory. Replace LOCAL_CONFIG with an untracked reviewed configuration; do not add
`--remote` or `remote = true`. These examples were not executed in this preparation stage:

```text
wrangler d1 migrations apply moa-research-market-db --local --config LOCAL_CONFIG
wrangler d1 migrations apply moa-private-research-db --local --config LOCAL_CONFIG
```

Run each migration only with its owning configuration. Verify table names through local SQLite and
check market writes are invisible in the private artifact database and vice versa. For local multi-Worker
verification use the private integration verifier described in the private runbook; it calls the actual
handlers with separate SQLite stores without touching Cloudflare. This is not workerd parity proof.
The dashboard requires HTTPS even locally: a plain HTTP dev server returning rejection is expected.
Do not relax authentication or the HTTPS gate to make a smoke check pass.

## Free CPU acceptance protocol

The official Workers limits reviewed on 2026-10-15 list Free CPU limits of 10ms per HTTP invocation
and per Cron invocation. Network waiting time is excluded. Service Binding separation does not prove
that a workload fits the quota. Node wall-clock or process CPU measurements cannot certify edge CPU.

Before any separately authorized isolated deployment, inspect account plan, remaining request and D1
read/write/storage quotas read-only. Include other applications sharing those quotas. Do not upgrade.
After separate approval for research-only staging, measure actual invocation CPU in Cloudflare
Workers metrics/log invocation metadata for both caller and private callee, with no payload/credential
logging. Record version, scenario, sample count, p50/p95/p99/max CPU and errors. Observe the complete
Service Binding call chain; do not assume each hop provides an extra CPU budget.

Exercise disabled mode, empty data, normal 30-minute collection, maximum catchup, concurrent/replayed
jobs, daily and weekly research at maximum supported history, and failed/retried jobs. Use at least100
samples per relevant scenario, including cold starts. Review D1 rows read/written, query counts, storage,
and request totals. Error1102, missing measurements, insufficient margin or exhausted quotas blocks
enablement. A conservative project gate is max CPU below8ms with no resource-limit errors; this is
an engineering margin, not a Cloudflare guarantee. Keep research disabled if it fails; evaluate the
existing private local execution environment instead of buying resources. Preserve manual adoption.

Actual edge CPU, workerd behavior, account quota and physical iPhone checks remain unverified.
Do not push until repository visibility, branch, all outgoing commits, secrets and deployment hooks
have been reviewed. Skip markers are an extra precaution, not proof that every integration is disabled.

References:
- https://developers.cloudflare.com/d1/best-practices/local-development/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/
- https://developers.cloudflare.com/workers/platform/limits/#cpu-time
