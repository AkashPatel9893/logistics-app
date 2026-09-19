# API authoring and backend contracts

Use when writing server endpoints or designing/changing a client-server contract. For calling an existing API, use [API client conventions](api-and-server-state.md). Follow [storage/security](storage-and-security.md) for shared security rules. Keep the existing backend architecture; do not introduce Expo API routes, a database, or a hosting service merely because this guide exists.

## Location and runtime

For Expo Router endpoints read `../../eas-hosting/SKILL.md` and `../../expo-router/SKILL.md`. Put HTTP handlers in `src/app/api/**/+api.ts` using the correct resource filename (for example `reports+api.ts` or `reports/[id]+api.ts`). Put server-only authentication, services, database access, and validation in `src/server/`, outside client imports. Do not expose server modules through shared client barrels. Shared contracts may live under `src/lib/contracts/` only when they contain no secrets/server dependencies.

Keep handlers thin: parse and validate, authenticate/authorize, call domain logic, serialize a response. Extract services/repositories only when they own real logic; do not add pass-through layers. Reuse the project's existing schema and error conventions.

Verify the installed Expo SDK and actual deployment runtime before using server APIs or database drivers. The Router website may include newer SDK behavior: do not apply SDK 58 defaults to SDK 57. Configure server output/origin as required by SDK 57. API routes execute on a separately hosted server, not inside the installed phone app. Native clients use the configured API origin through the shared client. Do not run deploys or change hosting simply to write a route.

## Contract before implementation

For each endpoint, establish method/path, authenticated principal, permitted roles/ownership, request schema, success/error shapes, pagination, and relevant retry/idempotency behavior. Follow the existing API convention rather than imposing a new response envelope or version prefix. Keep the contract in the existing OpenAPI/schema documentation if present; update it with code.

- Validate route/query/body values at runtime, including enum/range/length and content-type limits. Reject malformed JSON and oversized input with appropriate client errors. TypeScript assertions are not validation.
- Allowlist writable fields to avoid mass assignment. Derive user/tenant identity from verified authentication rather than a caller-supplied owner ID.
- Verify tokens/sessions through the established provider, including the relevant signature, issuer, audience, expiry, and revocation checks. Header presence or decoding a JWT alone does not authenticate a request. Never copy placeholder auth examples into production.
- Authorize the requested resource/action, including list queries, counts, attachments, and nested resources. Enforce scope in database operations; do not fetch all tenants and filter in UI.
- Use HTTP semantics consistently: reads must not perform writes; distinguish invalid input, unauthenticated, forbidden, missing, conflict, rate limiting, and server failures. Follow the project's 400/422 convention. Return no body for 204.
- Return only intended response fields, not raw database records or internal errors. Keep a stable error code, safe message, and optional field errors/request ID. Log redacted diagnostic context server-side.

## Data integrity and resource bounds

- Use bound SQL parameters or the existing ORM's safe APIs. Use transactions/constraints for multi-step invariants; avoid check-then-write races. Use optimistic concurrency/version checks where users may edit the same report.
- Bound page sizes and allowed filters/sorts. For changing feeds, prefer a stable cursor/order with a unique tie-breaker; do not claim offset pagination is stable under concurrent inserts. Return only needed fields and pagination metadata.
- Avoid N+1 queries and unbounded parallel requests. Inspect query plans before adding indexes; cap expensive search/export operations and background long-running work through an existing durable job mechanism when needed.
- Give upstream calls deadlines, validate upstream responses, and apply the shared safe-retry rules. Protect write retries with backend-supported idempotency: scope keys by principal/operation, bind them to the payload, store results atomically, and define expiry/conflict behavior.
- Rate-limit abuse-sensitive or costly endpoints using infrastructure that works across deployed instances. An in-memory counter on one serverless instance is not a global limit. Return a useful 429 response and retry guidance where appropriate.
- For private responses, set an explicit cache policy that prevents public/shared cache leakage. Scope cache keys to all authorization-relevant inputs and invalidate correctly. Cache only when freshness and privacy requirements are understood.

## External boundaries

CORS is a browser access policy, not authentication. Allow only intended web origins/methods/headers and do not combine wildcard origins with credentialed requests. Apply CSRF protection to cookie-authenticated writes as required by the session design.

For URL-fetching/proxy endpoints, restrict destination schemes/hosts and guard redirects/private network targets against SSRF. Do not create an unrestricted proxy.

Verify webhook signatures using the provider's prescribed raw body and timestamp checks before processing. Deduplicate events durably and account for retries/out-of-order delivery. Do not acknowledge work that will be lost after the request ends; use the provider's delivery contract and a durable queue when required.

For direct uploads, authenticate the signing endpoint, scope object keys to authorized users, issue short-lived grants, enforce limits using storage-provider capabilities, and verify completed file metadata/content before trusting it. A client-provided filename or MIME type is not proof of content.

## Verification and evolution

Exercise success and malformed input, missing/invalid auth, cross-account access, missing resources, conflicts, duplicate/retried writes, pagination edges, and upstream failures as applicable. Test against local/test data. Verify contracts used by existing clients; mobile clients may remain on older app versions, so prefer additive changes and planned deprecation over breaking deployed builds. Database migrations need a compatible rollout and recovery plan.

## Official references

- [Expo API routes](https://docs.expo.dev/router/web/api-routes/) — check SDK-specific notes against the installed version.
- [OWASP REST security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
