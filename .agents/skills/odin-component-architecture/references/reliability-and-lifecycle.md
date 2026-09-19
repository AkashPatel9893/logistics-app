# Reliability, startup, and reload behavior

Use when preventing or investigating ANRs, crashes, hangs, memory terminations, slow launches, resume failures, or development reload problems. Read [Performance](performance.md) for measurement and [State and forms](state-and-forms.md) for hydration/reset rules. This is engineering guidance, not evidence that the app is crash-free.

## Classify the symptom first

| Symptom | Evidence to collect |
| --- | --- |
| JavaScript exception/render failure | Symbolicated JS stack, route/action, release and update identifier, safe breadcrumbs. |
| Native crash | OS/native crash report with matching symbols and binary/build identifiers. |
| Android ANR | ANR trace/exit reason, main-thread stack and blocking dependencies, device/OS conditions. |
| Frozen interaction/jank | JS and native thread profiles; a stalled JS thread is not automatically an Android ANR. |
| iOS hang/watchdog termination | OS termination reason and main-thread/lifecycle trace; do not label it an Android ANR. |
| Low-memory/OOM/process eviction | Memory/OS exit evidence and resource history; absence of a JS exception does not mean a clean exit. |
| Blank screen/stuck splash | Startup milestone timing, unresolved initialization, hydration and asset errors. |

Capture a reproducible sequence and identify the affected build, runtime/update, platform, device, and cold/warm state. Do not hide exceptions, disable warnings, or auto-reload indefinitely to make a failure disappear.

## ANRs and hangs

Keep native main-thread work short: avoid blocking I/O, synchronous network calls, large computation, lock contention, and waiting on other threads. Inspect the actual trace before changing JS code; locks, native modules, SDK initialization, and OS callbacks may be responsible. Android timeout rules vary by component/OS, so consult current platform docs rather than treating one timeout as universal.

For JS stalls, investigate large serialization, synchronous storage loops, expensive renders, and unbounded work. An async function does not move CPU work off-thread. Use supported background/native processing or bounded work when warranted, with cancellation and backpressure. Do not suppress ANR detection or extend timeouts as the fix.

When writing native modules, load the Expo module skill and use the correct dispatch/thread contract. Avoid blocking lifecycle callbacks or introducing synchronous cross-thread waits. For diagnosis, use Android traces/Perfetto/StrictMode or iOS Instruments/OS diagnostics as appropriate; do not leave invasive development instrumentation in production.

## Crash prevention and recovery

- Handle expected request, storage, permissions, parsing, and media failures explicitly, preserving user work. Do not convert a failed write into apparent success.
- Use route/feature error boundaries for render errors with bounded retry/reset behavior. They do not catch every async/event-handler error, native crash, ANR, or memory termination.
- Clean up owned timers/listeners/subscriptions/media resources. Make initialization and teardown safe across repeated mount/unmount, resume, and development refresh. Avoid callbacks targeting disposed native resources.
- Validate external/persisted data at boundaries, including partially migrated state; do not paper over invalid data with non-null assertions.
- Test native dependency/config changes in a compatible new binary. JS changes cannot repair a missing native module in an old runtime.
- Bound images, attachments, caches, and queued work to prevent runaway memory use. Recover from OS process death without requiring an unmount callback or shutdown handler to save critical state.

## Cold, warm, and hot starts

A cold start creates the app process. Warm/hot starts reuse different amounts of process/activity state; Android distinguishes them explicitly. Record the platform/tool definition in measurements. Foreground resume, JS reload, and Fast Refresh are separate test scenarios and must not stand in for a cold launch.

Measure native startup, JS load/evaluation, provider initialization, required storage/auth hydration, first rendered frame, and first usable interaction separately where tooling permits. Compare release/profile builds on representative devices with controlled data/cache/network conditions. Report distributions or repeated timings, not a single best run. First install and process-cold launch with existing data can have different behavior.

Keep the critical startup path small. Defer optional analytics/prefetch/heavy initialization and parallelize independent work with bounded concurrency. Required auth/security hydration must still complete before protected routing. Use a usable loading/offline/error shell rather than holding the splash for unbounded network activity. Initialize auth, storage, listeners, and clients once per intended lifecycle scope.

Follow SDK 57 splash-screen docs: control prevention/hiding at the documented lifecycle points, and hide only when renderable content or a safe error/retry screen is ready. Handle initialization failures; never leave an unresolved promise holding the splash forever. Do not mark interactive while controls remain blocked just to improve the metric. Validate splash/startup in a release build because development/Expo Go behavior can differ.

## Resume and process restoration

Handle background → foreground, device lock/unlock, interrupted permission/auth flows, and OS process death. Revalidate session/freshness through existing managers instead of starting duplicate listeners or request storms on every resume. Cancel or reconcile stale work and keep account-switch guards.

Persist valuable drafts at meaningful edit checkpoints with bounded/debounced writes; do not rely on a final background/unmount callback. Do not assume timers, uploads, recording, or JS tasks keep running after suspension. Load the relevant background-task/media skill/docs only when implementing such a requirement. Restore navigation from validated identifiers and recheck permissions/auth; do not replay a payment/submission automatically merely because a screen was restored.

## Fast Refresh and full reload (development)

Fast Refresh is a development feature that may retain component state; it is not production hot start or OTA delivery. A full JS reload recreates the JS runtime; a process restart additionally exercises native initialization.

Keep React component exports separate from non-component values where mixed exports disrupt refresh boundaries. Effects must clean up and tolerate reruns; do not depend on an empty dependency array running exactly once across edits/Strict Mode. Avoid module-scope registrations that accumulate listeners or interceptors after edits. Preserve necessary stable clients using their established lifecycle pattern, not ad hoc global flags that hide duplicate setup bugs.

After changing initialization, persisted schemas, providers, or native configuration, verify with a full reload and a fresh process launch; Fast Refresh can hide bugs through retained state. Native module/config changes require the appropriate rebuild and cannot be verified through refresh alone. Clear Metro caches only for evidence of stale bundler state, not as a substitute for diagnosing runtime failures.

## Observability and release health

Reuse configured reporting tools. Keep startup/navigation metrics, JS errors, native crashes, ANRs, and OS memory exits distinct, and confirm what the chosen SDK actually captures on each platform. If adding/querying EAS Observe, read `../../eas-observe/SKILL.md` and its current docs; do not assume a startup metrics integration also provides native crash/ANR coverage. Adding a reporting vendor is separate implementation work, not required by this guide.

For release reporting, preserve matching JS source maps and native symbols (including applicable Android mappings/iOS dSYMs). Associate reports with app/build/runtime/update identifiers and verify symbolication in a safe test build. Redact secrets and reporter/source information; follow the storage/security reference's privacy rules.

Define crash-free sessions and crash-free users with the reporting tool's actual denominator, time window, adoption/sample size, and platform coverage. Track Android user-perceived ANRs separately. Zero reports with missing telemetry or little usage is not proof of zero crashes. Set evidence-based release targets and consult current store thresholds rather than hardcoding them here.

For OTA rollout/recovery load `../../eas-update/SKILL.md` and `../../eas-update-insights/SKILL.md`; preserve runtime compatibility and old-client/storage-schema compatibility. For native releases use `../../eas-app-stores/SKILL.md`. A rollback must not assume it can undo native changes or irreversible data migrations. Monitoring guidance does not authorize an automatic deployment/rollback or scheduled monitor.

## Verification matrix

Select cases relevant to the change:

- Fresh install, cold launch with existing data, warm/hot launch, background resume, and OS process recreation.
- Valid/expired/missing session, slow/offline network, unavailable secure storage, failed/corrupt hydration, and large datasets.
- Repeated navigation and media use, permission denial/revocation, low-memory conditions, and interrupted upload/save.
- Fast Refresh and full JS reload for development correctness; release builds for production behavior.
- Compatible update/migration and recovery path when release/update logic changes.

Record platforms/builds checked, measured startup values, reproduced failure/fix evidence, and remaining gaps. Add targeted regression tests for a real bug. Never promise 100% crash-free operation or claim production reliability based only on lint, type checks, or one emulator run.

## Official references

- [Android ANRs](https://developer.android.com/topic/performance/vitals/anr)
- [Android startup states and timing](https://developer.android.com/topic/performance/vitals/launch-time)
- [React Native Fast Refresh](https://reactnative.dev/docs/fast-refresh)
- [Expo SDK 57 splash screen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/)
