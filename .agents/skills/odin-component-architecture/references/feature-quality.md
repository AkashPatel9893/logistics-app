# Feature completion and adjacent concerns

Use when implementing or reviewing an app feature. Apply only the concerns the feature touches; this is not a requirement to add infrastructure, packages, telemetry, or unrelated refactors.

## Existing skill routing

- UI behavior, readable text, platform conventions, keyboard/safe-area layout: `../../expo-native-ui/SKILL.md` and `../../expo-ui/SKILL.md`.
- Theme consistency: `../../expo-design-system/SKILL.md` and the project's existing tokens.
- Navigation/deep links: `../../expo-router/SKILL.md`.
- Animation, gestures, reduced-motion behavior: `../../expo-animation/SKILL.md`.
- Lists/render performance: `../../vercel-react-native-skills/SKILL.md`; measure a reported bottleneck before optimizing.
- API/cache/offline: `api-and-server-state.md` and `../../expo-data-fetching/SKILL.md`.
- State, persistence, forms: `state-and-forms.md`.
- Native dependency/config changes: Expo overview and the appropriate SDK/module skill. Verify compatibility and whether a native rebuild is required.

For server endpoint work, also read [API authoring](api-authoring.md). For performance diagnosis or optimization, read [Performance](performance.md). For persisted data or security-sensitive work, read [Storage and security](storage-and-security.md).

For crashes, ANRs, startup, resume, or refresh behavior, read [Reliability and lifecycle](reliability-and-lifecycle.md).

## Boundaries and recovery

Validate route parameters, persisted values, and external payloads where used. Use typed contracts and narrow unknown values rather than hiding errors with any or unchecked assertions. Keep secrets/server-only code out of the client bundle; route guards improve UX but backend authorization still protects data.

Use an appropriate route/feature error boundary for render failures with a useful recovery action. Handle event-handler and asynchronous request failures explicitly; a render boundary will not catch all of them. Do not silently swallow errors or introduce global toasts for every failed background request. Reuse existing logging, redact sensitive data, and add an external monitoring service only as part of a concrete requirement.

## Native lifecycle, permissions, and media

For camera, microphone, photos, location, or notifications, request permission in the relevant user flow. Handle granted, denied, restricted/limited where applicable, and return-from-settings states. Clean up listeners, subscriptions, timers, and active media work. Follow the installed SDK's platform requirements.

For report attachments/uploads, when implemented: define allowed types/size limits, progress, cancellation, failure/retry, temporary-file cleanup, and whether work survives backgrounding. Avoid reading large media entirely into JS memory or assuming an upload continues after the app is suspended. Keep offline drafts distinct from successfully submitted reports.

## Accessible and adaptable UI

Check screen-reader labels/roles/states, focus order, touch targets, dynamic text, contrast, keyboard avoidance, and safe areas for affected controls. Do not communicate errors/status solely by color. Verify relevant light/dark and platform layouts. Reuse existing localized strings/formatters; if localization is supported, avoid sentence fragments that cannot be translated and check long/RTL content. Do not add an internationalization library without a requirement.

## Dependencies and verification

Reuse installed capabilities before adding packages. Check maintained official docs and installed versions, Expo/native compatibility, and actual platform support. Avoid implementing a custom cache, form framework, or navigation layer when an adopted library already owns it.

For code changes run relevant existing checks (package.json currently provides `lint:strict`; TypeScript can run with `npx tsc --noEmit`). Check formatting on touched files rather than reformatting unrelated files. Test reusable business logic and meaningful regressions; use focused interaction/device checks for navigation, forms, permissions, and platform-specific changes. Check failure states as well as success. Do not add brittle tests that merely match implementation wording or snapshots.

Before finishing, report changed behavior, checks actually run, and any unverified platform or blocked check. Never claim device validation from TypeScript/lint alone. Documentation-only updates require metadata/link/diff checks, not an app build.
