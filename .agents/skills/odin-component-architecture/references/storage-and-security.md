# Storage selection and application security

Read for storage, credentials, persisted stores/caches, offline reports, attachments, or security-sensitive changes. Apply with [state and forms](state-and-forms.md) and [API conventions](api-and-server-state.md). Inspect existing dependencies and platform targets before choosing a backend. Install only for a concrete feature, using `npx expo install`, and verify installed-version APIs and native build requirements.

## Choose by data, not one library for everything

| Data/requirement | Preferred starting point | Boundary |
| --- | --- | --- |
| Small non-sensitive settings, onboarding flags | Existing key-value backend; AsyncStorage is a simple asynchronous option if none exists. | AsyncStorage is unencrypted; do not store credentials or confidential report content. |
| Frequent small key-value reads/writes with a demonstrated need | MMKV if its native integration is acceptable. | Synchronous access is not a reason to perform large serialization on the UI thread. Encryption is optional, not enabled by default. |
| Small native credentials/secrets | Expo SecureStore. | Use the platform-backed secret store, not an ordinary Zustand persist adapter; handle reads/writes failing or keys becoming unavailable. |
| Structured offline reports, queries, relations, transactions | Expo SQLite. | Default SQLite is not an encrypted vault; sensitive datasets need an explicit encryption/key-management design. |
| Images, audio, video, large attachments | App-private file storage plus metadata in the appropriate store/database. | Avoid base64 media blobs in key-value stores; define cleanup, backups, sharing, and encryption where required. |
| Disposable remote cache | Query cache in memory by default. | Persist only an approved subset when offline/restart behavior actually needs it. |

Do not install both AsyncStorage and MMKV for the same preferences. Keep an existing supported backend unless a migration has a real benefit. A package being fast or native does not establish confidentiality. Treat reporter drafts, identities, locations, and source attachments as potentially sensitive before persisting them.

## App-owned storage boundaries

Create only needed files under `src/lib/storage/`: for example `preferences-storage.ts`, `secure-storage.ts`, or `draft-repository.ts`. Keep backend imports, key definitions, serialization, validation, migrations, and error mapping there; screens and UI components consume domain functions/hooks. Do not funnel secrets through a generic preferences adapter or silently fall back from secure to plaintext storage.

Keep account-scoped data separate from device preferences. Namespace/version keys without putting private content in key names. Store the smallest allowlisted fields. Prefer transactions for related database writes; asynchronous key-value read/modify/write sequences are not automatically atomic. Serialize competing writes where correctness requires it.

Validate persisted data after decoding. Define migration, corruption, quota/write failure, and recovery behavior. Do not discard unsynced user work silently. During migrations, verify destination writes before retiring the old copy; prevent interruption from leaving an unrecoverable partial migration. Do not keep two active sources of truth.

## Backend details

### AsyncStorage and Zustand persistence

Use AsyncStorage for non-sensitive serialized values and treat read/write errors explicitly. Batch operations where appropriate, but do not assume cross-key transactional guarantees. Do not persist the entire global store.

For Zustand persist (when adopted), use its installed-version storage adapter contract, an allowlist such as partialize, schema version/migration, and explicit hydration handling. An async backend hydrates differently from a synchronous MMKV adapter; SecureStore/key setup can still make startup asynchronous. Never write defaults over unread saved data. Apply account resets and late-write guards from the state reference.

### MMKV

Check the installed major version: V4 uses Nitro Modules and differs from older constructor examples. Verify required native dependencies, development-build workflow, platform support, and web behavior. Do not assume installing a JS package adds native capabilities to Expo Go.

Reuse an initialized instance per intended scope. If encryption is required, generate a strong random key with a platform cryptographic API, keep it in SecureStore, and load it before opening the encrypted store. Never copy documentation's example passwords, hardcode keys, or store the key beside the encrypted data. Define key loss, rotation, logout, backup/restore, and recovery policies; encrypted MMKV is not a substitute for the platform credential store. Do not assume its web fallback offers native encryption guarantees.

### SecureStore

Use for small secrets required by the auth/session design; avoid storing passwords when a token-based flow suffices. Keep short-lived tokens in memory when the contract permits, and persist only what is necessary. Handle unavailable/invalidated entries and require reauthentication rather than bypassing protection.

Check SDK 57 options and platform behavior: biometric-gated entries can become inaccessible after biometric changes; enabling authentication affects background access and user prompts. iOS Keychain values can survive reinstall, while Android storage/backup behavior differs. Do not rely on uninstall as logout or guaranteed erasure; follow SecureStore's backup configuration guidance. Keep logout deletion explicit and handle deletion failures.

### SQLite and files

Use parameterized queries/prepared statements for values, transactions for related mutations, and versioned migrations. Do not concatenate user input into SQL. Choose asynchronous APIs for substantial work, and release statements/resources. Inspect query patterns before adding indexes.

When database encryption is required, evaluate Expo SQLite's SQLCipher support and target/build constraints; do not claim default SQLite encrypts records. Manage its key separately from the database. Encryption of the database does not cover external attachments or temporary files. Use app-private locations and a maintained encryption implementation for sensitive files when required; do not invent a cipher. Avoid logging signed media URLs or exposing private paths/content through uncontrolled sharing.

## Security at application boundaries

- Keep backend credentials, signing keys, and privileged API secrets on the server. Values in the client bundle, including EXPO_PUBLIC variables, are public. Restrict deliberately public service keys at the provider.
- Enforce HTTPS for production API traffic and preserve certificate validation. Never ship development TLS bypasses. Certificate pinning is a separate requirement needing a rotation/recovery plan, not a default added blindly.
- Backend authorization must enforce user/tenant/resource access on every protected operation. Hidden controls, route guards, local role flags, biometrics, and encrypted storage do not authorize server access.
- Follow the auth provider's native flow; for OAuth use the system-browser flow with PKCE and state/nonce checks as appropriate. Validate callback routes and allowed redirects. Never trust arbitrary deep-link parameters as authentication or permissions.
- For web auth, use the backend's secure session design; prefer HttpOnly/Secure cookies when supported, with appropriate SameSite and CSRF protection. Do not substitute localStorage for native secure credential storage.
- Validate untrusted input at API, deep-link, storage, and upload boundaries. Restrict URL schemes/origins for external content and WebViews where used. Do not render untrusted HTML/scripts without an appropriate sanitizer and content policy.
- Redact tokens, cookies, passwords, personal/source details, and confidential payloads from logs, analytics, breadcrumbs, crash reports, and notifications. Do not add external telemetry just to satisfy this guide.
- Define account-specific retention and deletion across credentials, stores, query persistence, databases, attachments, and pending writes. Coordinate local logout with backend session revocation where supported. Be explicit about failed cleanup; never promise forensic erasure from a simple delete.
- Minimize permissions and cached sensitive data. Consider screen-capture/app-switcher protection only for flows that require it, with platform limitations documented. Storage encryption protects data at rest; it does not make a compromised running device trusted.

## Verification when implementing

Test the relevant paths: cold-start hydration, invalid/corrupt data, migration interruption, failed writes, key unavailability, account switching, failed logout cleanup, late writes after logout, and restart recovery. Verify native secure storage/biometric and backup behavior on the applicable device/build; mocks cannot establish encryption or OS guarantees. Check release logs for leakage and ensure no plaintext fallback exists. Do not claim the app is security-audited because these guidance files exist.

## Official references

- [Expo SDK 57 AsyncStorage](https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/)
- [MMKV maintained repository and versioned guidance](https://github.com/margelo/react-native-mmkv)
- [Expo SDK 57 SecureStore](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/)
- [Expo SDK 57 SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [React Native security guide](https://reactnative.dev/docs/security)
