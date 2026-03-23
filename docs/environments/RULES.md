## How We Work
- Keep environment handling boring. Prefer explicit files and small scripts over abstractions, config managers, or runtime heuristics.
- Runtime code reads environment variables directly. Do not add runtime YAML loading, `config.get(...)`, or hidden fallback chains.
- Split configuration by deploy target:
  - Pages web app: public build-time `VITE_*` values only.
  - Cloudflare Worker: runtime secrets and runtime non-secret values from Cloudflare.
  - Agent runtime and scripts: process env at startup.
- Add new required config only by updating the schema, profile files, examples, and doctor.

## Configuration & Secrets Contract
- Non-secrets live in `config/profiles/*.json`.
- Secrets live only in app-owned local secret files (`apps/agent/.env.local`, `apps/edge/.dev.vars`) or provider secret stores (Cloudflare Worker secrets, CI secrets).
- Rendered artifacts are generated into `.runtime/` and are never committed.
- `config/schema.mjs` is the source of truth for keys, targets, and requirements.
- `config/doctor.mjs` is authoritative. CI and local commands should fail if Doctor fails.

## Target Rules
- Web / Pages:
  - Public values only, prefixed with `VITE_`.
  - Never put `SUPABASE_SECRET_KEY`, Twilio credentials, or other private tokens into Pages env vars.
  - The web app may know the Worker origin, feature flags, and other non-secret public config.
- Edge / Worker:
  - Runtime secrets stay in Cloudflare Worker secrets.
  - Non-secret runtime values may be rendered from profiles and applied through deployment automation later.
  - The Worker remains the trust boundary for Supabase service role, Twilio, GitHub, and internal action auth.
- Agent:
  - Reads `process.env` on startup.
  - Required keys must be validated before the runtime is started.
  - Do not silently create empty-string clients for required services long term.

## Environment Files
- `config/profiles/base.json` holds shared non-secret defaults.
- `config/profiles/<profile>.json` overrides by environment, e.g. `development`, `staging`, `production`.
- `apps/agent/.env.local.example` documents local agent and migration secrets for development.
- Root `.env` and root `.env.local` are not part of the config contract and should not be relied on by repo scripts.
- `apps/edge/.dev.vars.example` documents local Worker secrets for `wrangler dev`.
- `.runtime/<profile>.<target>.env` is generated output for inspection, local tooling, and future CI usage.

## Render Pipeline
- Use `node scripts/render-env.mjs <profile>` to render non-secret env files into `.runtime/`.
- Use `node config/doctor.mjs <profile>` to validate merged profile config before running builds or deploys.
- Rendered files are an artifact of the profile contract, not a second source of truth.

## Current Public Config
- `VITE_WORKER_URL`
- `VITE_OPS_DESK_URL`
- `VITE_ADMIN_FEEDBACK_ENABLED`
- `VITE_APP_VERSION`
- `VITE_DISPATCHER_API_KEY`
- `VITE_SIMULATOR_TWILIO_NUMBER`

## Current Runtime Secrets
- Worker:
  - `SUPABASE_SECRET_KEY`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_PHONE_NUMBER`
  - `OPENCLAW_API_KEY`
  - `DISPATCHER_API_KEY`
  - optional `GITHUB_TOKEN`
  - optional `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- Agent:
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - model provider keys like `OPENROUTER_API_KEY`, `GROQ_API_KEY`
- Migrations / scripts:
  - optional `DATABASE_URL`
  - otherwise `SUPABASE_URL` + `SUPABASE_SECRET_KEY`

## Networking Rules
- Public URLs must come from config, not from hardcoded strings in app code.
- Internal local development may use `localhost`; production URLs must not be derived from request headers.
- `development` should remain fully local.
- `staging` should be cloud-like and isolated from production.
- Optional developer tunnels are allowed for local reachability, but they are convenience paths, not the default development contract.
- The web app should point at the Worker via `VITE_WORKER_URL` in deployed environments.

## Guardrails
- Do not commit generated `.runtime/*` files.
- Do not commit new `.env.*` files containing secrets.
- Do not rely on Cloudflare UI manual edits as the only record of configuration.
- If a target requires config not represented in profiles/schema/examples, stop and fix the contract first.
