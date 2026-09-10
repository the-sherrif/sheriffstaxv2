# The Sheriff’s Tax — Deputy Registry

Source: https://github.com/the-sherrif/sheriffstaxv2

Private preview: https://sheriffs-tax-registry.rhadokrypt.chatgpt.site

This pre-launch release implements saved applications, four mandatory Field Orders, sequential badges, Founding Deputy status for numbers 1–100, persistent referrals, a real recruitment leaderboard and private recovery codes. The official Warrant is not published yet; applications can be saved while claims remain closed.

## Development

Requires Node 22.13+ and pnpm. Install dependencies with `pnpm install --config.node-linker=hoisted` on Windows. For an empty local database, run `pnpm exec wrangler d1 execute DB --local --config wrangler.local.json --file drizzle/0000_gigantic_absorbing_man.sql`. Do not apply that migration twice. Run `pnpm dev`, then visit http://localhost:3000. Local data is separate from the hosted database.

Checks: `node --experimental-strip-types --test tests/registry.test.ts`, `pnpm exec tsc --noEmit`, `pnpm build`.

## Open badge claims

Publish the real recruitment post from `@sheriffstax`. Configure `ACTIVE_WARRANT_URL`, `TURNSTILE_SITE_KEY`, and secret `TURNSTILE_SECRET_KEY` in Sites runtime settings. Register the exact hostname in the free Turnstile widget and test it. `.env.example` lists local keys; never commit populated environment files. Existing applicants select **Check for the Warrant** to attach it. Assigned applications retain their original Warrant and rules. Opening claims does not make the private site public.

Follow and like use visitor declarations. Quote and comment URLs must contain the applicant’s normalized username. A plain repost uses the original Sheriff post URL. The server checks allowed domains, full paths, handles, distinct post IDs and the original Warrant identity. It does not call X or prove account ownership, post existence, content or engagement. There are no artificial verification delays. Handle uniqueness does not prove a unique person; impersonation is possible without ownership checks.

## Records

D1 holds applications, Deputies, expiring referral visits, rate limits and future verified contributions. Session/recovery secrets are hashed. Attribution is fixed at application creation; credit is earned once at badge issuance. Transactional insertion is unique by application and normalized handle. Revoked numbers never recycle. Counts/ranks derive from active stored records.

Public identifiers are not credentials. Return using the original browser or private recovery code. Recovery rotates the session. Replacing a recovery code invalidates the previous one. Before badge issuance, saved progress resumes in the same browser.

## Fundraising is not enabled

`config/campaign.ts` centralizes brand, phase, Warrant rules, referral window and contribution targets. This release does not connect wallets, collect payments, accept transaction hashes or automatically advance tax phases. The contribution table has no public write endpoint.

Before fundraising opens, implement and test treasury/network configuration, wallet connection, server quotes, ETH/USDG receipt verification, confirmation policy, transaction uniqueness, USD valuation, phase limits, pending/failed payments, reconciliation and threshold transitions. Changing `paymentsEnabled` alone intentionally does not enable payment collection.

The approved mascot artwork is still needed for final integration. The notice currently uses a standard badge icon.

## Deployment and validation

Sites provisions D1 and applies the generated migrations declared by `.openai/hosting.json`. Commit validated source to this GitHub repository and mirror that exact commit to the registered Sites source repository. Build, package with the Sites helper, save a version and deploy privately. Never persist source credentials in files, Git configuration or remotes.

Tests execute the real generated schema and production SQL in in-memory SQLite. They cover invalid links, username matching, missing Warrants, saved drafts, pinned rules, concurrent retries, duplicate handles, first-recruiter credit, stale applications and permanent founding numbers. They do not establish real X activity or validate a live Turnstile widget.
