# State ownership, persistence, and forms

Use for state, stores, providers, forms, or local persistence. Inspect existing dependencies and conventions first. Keep the established library and read its installed version's official docs before implementing; do not add a global-state or form library merely because this reference exists.

## Choose one owner

| Kind of state | Default owner |
| --- | --- |
| Transient UI: expanded row, open sheet, input visibility | Component-local useState; lift only to the nearest shared parent when necessary. |
| Related transitions in a screen or workflow | Local useReducer with explicit actions/statuses. |
| Server resources, request status, remote cache | Existing query library; follow api-and-server-state.md. |
| Shareable navigation state: entity ID, search/filter for a deep link | Validated Expo Router parameters; avoid a second synchronized store. |
| In-progress form values and validation | Local form state or the existing form library. |
| Cross-screen client state: preferences, a multi-screen draft | A focused context/provider or existing client-state store. |
| Values derived from other state | Compute during render or through a selector; do not store another copy. |
| Values that must survive restart | Explicit persistence of the minimum required subset, not a blanket store dump. |

Use Context for scoped dependencies or low-frequency shared values; separate unrelated providers so changes do not broadcast unnecessarily. If complex cross-screen client state requires fine-grained subscriptions, choose a dedicated store only after examining the actual need. Zustand, Redux Toolkit, or another existing library can fit; do not combine them for the same responsibility or replace a functioning setup without a requested migration.

## State invariants

- Each value has one source of truth. Do not mirror query data into a client store or props into state through effects. A form draft is an intentional editable snapshot; define when it initializes, resets, and reconciles with newer server data.
- Model mutually exclusive states with a status/discriminated union instead of conflicting booleans. Store selected IDs rather than duplicate entity objects when the canonical entity already exists.
- Update immutably and use functional updates when based on previous state. Group transitions that must happen together. Keep reducers pure and perform side effects outside render/reducers.
- Use effects to synchronize external systems, with correct dependencies and cleanup. User-triggered work belongs in event handlers. Avoid effect chains that copy state or recalculate derived values.
- Keep stores scoped by domain and subscribe to the smallest required slice. For Zustand, follow the installed version's selector/equality rules and avoid unstable selector results; for Redux Toolkit, use slice actions and selectors. Do not subscribe every screen to an entire root store.
- State modules must not import screens, components, or navigation. Keep query-cache updates in the orchestration layer rather than creating store/client dependency cycles.
- Cancel or invalidate stale asynchronous work on unmount, reset, or account switch. A late response must not repopulate a cleared user session or overwrite a newer edit.
- Use memoization for a demonstrated cost or identity contract; do not add useMemo/useCallback to every value or use them to fix incorrect ownership.

## Placement

Keep local state/hooks with their screen. Create `src/stores/<domain>-store.ts` only for real shared client state; avoid an all-purpose app store. Put reusable context providers in `src/providers/<name>-provider.tsx` when needed and compose them at the appropriate route layout scope. Keep validation schemas/types beside their owning form/domain; move genuinely shared schemas to `src/lib/validation/<domain>.ts`. Use the architecture skill's naming rules and do not create empty folders in advance.

## Persistence and session lifecycle

Read [Storage and security](storage-and-security.md) for backend selection, Zustand adapters, encryption, and secret storage.

- Separate ordinary preferences/drafts from credentials. Follow the established secure credential storage on native; do not place tokens in ordinary persisted stores, URLs, logs, or public environment variables. Web needs its own appropriate auth/storage contract.
- Persist an allowlisted, serializable subset. Exclude loading flags, transient errors, functions, and disposable query results. Scope user-specific keys by account and define expiry/retention for drafts where needed.
- Version the persisted schema and migrate or safely reset incompatible data. Handle missing/corrupt data, unavailable storage, and write failures without trapping the app on splash forever.
- Represent hydration explicitly as loading/ready/error when it affects UI or auth. Avoid redirects or saving defaults over stored values before hydration finishes.
- Reset user-owned stores and persisted data on logout/account switch in coordination with query cleanup. Preserve only intentionally device-wide preferences. Prevent pending writes or rehydration from restoring the old account.

## Forms

Use simple local state for simple forms. For complex forms, reuse the existing form library; evaluate a library only when field arrays, validation, dirty tracking, or subscriptions justify it. If using React Hook Form or a schema library, read its installed version's docs and use native-compatible control adapters rather than DOM-specific examples.

- Shared form controls own labels, required/disabled/error display, accessibility, and focus behavior; field rules and submit orchestration belong to the form/domain.
- Define validation once per domain where reusable. Keep client and server error handling distinct; the backend remains authoritative. Do not scatter matching regex/rules across screens.
- Handle dirty/touched state deliberately, show actionable field errors, and focus the first invalid field where supported. Choose validation timing appropriate to the field.
- Never overwrite dirty inputs whenever background query data refetches. Reset on an explicit record change, discard, or successful save according to the workflow.
- Prevent duplicate submissions, preserve input on failure, and clear it only after confirmed success. Provide discard protection for substantial unsaved work when navigation would lose it.
- Treat dates, time zones, decimal amounts, and optional/empty values explicitly at the API boundary. Do not silently convert invalid input into valid-looking defaults.

## Verification

For behavioral changes, cover relevant transitions: conflicting actions, derived state, stale async responses, reset/account switch, hydration failure, schema migration, form validation, failed save/retry, and preservation of dirty values during background refresh. Prefer observable outcomes over snapshots of internal store implementation.

## References

- [React state structure](https://react.dev/learn/choosing-the-state-structure)
- [React effects and derived state](https://react.dev/learn/you-might-not-need-an-effect)
- Read official documentation for the actual installed store/form library before choosing its APIs.
