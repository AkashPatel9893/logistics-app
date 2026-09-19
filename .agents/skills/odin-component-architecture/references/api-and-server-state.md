# Shared API client and server state

Read alongside `../../expo-data-fetching/SKILL.md` for every API, authentication, query, mutation, or caching change. These project rules refine the generic examples in that skill.

## Choose from the actual project

Inspect package.json, the lockfile, and existing clients/providers before selecting APIs. Keep the established transport and server-state library unless migration is requested. For a new transport, prefer `expo/fetch` as the Expo skill recommends; Axios is acceptable when already adopted or a concrete requirement justifies it. Do not install Axios solely to obtain interceptors: fetch supports equivalent centralized request/response handling through a wrapper. Do not monkey-patch global fetch or Axios defaults.

When shared server-state caching is needed and no library exists, prefer TanStack Query. If SWR or another library is already used, follow its installed version's official guidance and use the equivalent cache, cancellation, and mutation mechanisms. Do not maintain two caches for the same server resource. Adding this guidance does not itself require installing packages or scaffolding unused infrastructure. Install needed packages with `npx expo install`.

## One request pipeline

All first-party API calls go through an app-owned client. Screens and UI components do not call fetch/Axios directly or repeat URLs, auth headers, parsing, or refresh logic. Third-party SDKs retain their own transport and must not receive first-party credentials.

Use the existing structure; if absent, create only the files required by the feature:

- `src/lib/api/client.ts`: base URL, request preparation, response handling, timeout/cancellation, and shared errors.
- `src/lib/api/api-error.ts`: normalized error contract, when large enough to extract.
- `src/lib/api/<resource>.ts`: typed endpoint functions, for example `reports.ts`; accept an optional AbortSignal and return parsed domain data.
- `src/lib/query-client.ts`: query-client creation/default policy if TanStack Query is used.
- `src/lib/queries/<resource>.ts`: reusable query keys/options when multiple callers need them.
- `src/hooks/use-<resource>.ts`: shared query/mutation hooks; private hooks remain under their screen.

Dependency direction: screen → query hook/options → endpoint function → client. Endpoint functions and the client must not import React UI, navigation, or query hooks.

For fetch, put interceptor-like steps in the shared wrapper. For Axios, use a dedicated instance and register request/response interceptors once at initialization; eject scoped interceptors during cleanup. Never register them on every render. Preserve rejection on failure instead of returning an error as successful data.

The pipeline must:

- Validate configuration, encode path/query parameters, and merge headers correctly. Read current auth state per request rather than capturing an old token. Attach credentials only to the intended API origin; do not forward them to arbitrary absolute URLs.
- Apply JSON encoding only to JSON requests. Let the runtime set multipart boundaries for FormData. Explicitly handle empty/204, JSON, text, and binary responses as required; do not unconditionally parse JSON.
- Check HTTP status for fetch. Normalize HTTP, network, timeout, and parsing errors while preserving useful status/code, cause, and safe field-validation details. TypeScript generics alone do not validate untrusted JSON; validate responses at boundaries where correctness depends on their shape.
- Forward caller cancellation through every layer. If adding a timeout, combine it with caller cancellation and clean up timers/listeners. Keep user cancellation distinct from failures and suppress error notifications/retries for intentional aborts.
- Keep navigation and toast presentation outside the transport. Redact tokens, authorization headers, and sensitive bodies from logs. Never place secrets in EXPO_PUBLIC variables; use the established secure auth storage.

## Authentication and retries

Implement refresh only if the backend provides a refresh contract. Share one in-flight refresh across concurrent unauthorized requests. Exclude login/refresh requests from refresh interception, retry an eligible original request at most once, and reject if refresh fails. Do not refresh on every 403 or enter recursive refresh loops.

Preserve aborts while waiting for refresh and do not replay an aborted request. Guard refresh completion against logout/account changes so an old response cannot restore an ended session. Replaying writes or consumed upload bodies requires a documented safe replay/idempotency contract.

Assign retry ownership to one layer, normally the query library for queries. Avoid multiplying client retries by query retries. Bound transient retries with backoff; honor Retry-After where relevant. Do not retry cancellation, validation/auth failures, or non-idempotent mutations blindly. A timeout does not prove the server failed to apply a write; use backend-supported idempotency keys when retrying such operations.

## TanStack Query, when used

Read the installed major version's docs before implementation; do not mix v4 and v5 APIs.

- Keep one stable QueryClient per running app session, not one per screen or render. If server rendering is introduced, isolate server clients per request to avoid sharing user data.
- Define serializable keys that include every input affecting the result: resource ID, filters, sort, page, and account/tenant scope where relevant. Do not put access tokens in keys. Share key factories/options with invalidation callers.
- Query functions call endpoint functions, return defined data, and throw on failure. Pass the query function's `signal` into the endpoint and transport: unmounting does not cancel the network request unless the signal is consumed.
- Configure staleTime by freshness needs and gcTime by retention needs; they are different. Avoid universal infinite freshness, aggressive polling, or disabling refetching without a requirement. Gate dependent/authenticated queries until prerequisites and auth hydration are ready.
- Keep server data in the query cache; do not mirror it into useState, context, or another store via effects. Local form drafts and ephemeral UI state remain local.
- Mutations use endpoint functions. Update the relevant cache from authoritative responses or invalidate affected keys; avoid invalidating the whole cache. Prevent repeated submissions and preserve drafts on failure.
- For optimistic changes, cancel conflicting queries, snapshot, update immutably, roll back on failure, then reconcile. Handle concurrent mutations explicitly; a stale rollback must not erase newer work.
- For infinite queries, use the API's cursor/page contract and stop when no next page exists. Include required version-specific options rather than copying examples from another major version.
- Integrate native AppState and connectivity with focusManager/onlineManager when using foreground/reconnect behavior; register listeners once and clean them up. Browser focus events alone do not cover native lifecycle.
- Render initial loading, error, empty, content, disabled/prerequisite, and offline-paused states correctly. Keep cached content visible during background refresh and refresh errors.
- On logout/account switch, cancel prior-user work and remove its cached/persisted private data. Cache persistence and offline mutation queues require explicit retention, security, conflict, and replay policies; persistence alone is not an offline sync system.

For SWR or another server-state library, preserve these outcomes using its documented primitives rather than introducing QueryClient alongside it.

## Verification when implementing

Test the meaningful failure paths for the change: non-JSON errors/204 responses, cancellation, concurrent unauthorized requests, refresh failure/logout races, retry limits, mutation failures, and account/cache isolation as applicable. Check affected loading and refresh states. Use deterministic mocked transport tests for pipeline behavior; do not contact production services to test mutations.

## Official references

Use documentation matching installed versions:

- [Expo SDK 57 APIs](https://docs.expo.dev/versions/v57.0.0/sdk/expo/)
- [Axios interceptors](https://axios-http.com/docs/interceptors)
- [TanStack Query cancellation](https://tanstack.com/query/v5/docs/framework/react/guides/query-cancellation)
- [TanStack Query native lifecycle integration](https://tanstack.com/query/v5/docs/framework/react/react-native)
- [TanStack Query defaults](https://tanstack.com/query/v5/docs/framework/react/guides/important-defaults)
