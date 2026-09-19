# Performance work

Use for slow startup, janky scrolling/animation, excessive renders, large bundles, memory growth, or slow API/data flows. Read `../../vercel-react-native-skills/SKILL.md` and only its relevant rule files. Use the animation/data-fetching skills for those domains. Their generic suggestions are candidates, not a mandate to change libraries or blanket-memoize code.

For hangs, crashes, startup/resume, or reload behavior, also read [Reliability and lifecycle](reliability-and-lifecycle.md).

## Measure a specific problem

Choose a reproducible flow and relevant metric: startup-to-interactive time, input latency, JS/UI frame time, render commit duration/count, memory after repeated navigation, request p50/p95, transferred bytes, or database query time. Agree on an improvement target based on the observed problem rather than inventing universal budgets.

Record baseline conditions: device/platform, build mode, dataset size, network, and cold/warm cache. Use representative release/profile builds for final timing; development instrumentation can distort performance. A simulator can help locate a problem but does not establish low-end device performance. Repeat comparable runs and report variation; do not infer an improvement from code appearance or one lucky run.

Use available React/Hermes and native CPU/memory profilers for the suspected layer. If Argent profiling skills/tools are available, follow their setup/workflow for a real optimization task; they are optional tooling, not a project dependency. If measurement is unavailable, label static findings as hypotheses and report the limit.

Fix the largest measured bottleneck, then replay the same flow. Keep an optimization only if the result and tradeoffs support it. Check correctness, accessibility, memory, battery/network use, and neighboring flows. Keep architectural changes isolated enough to attribute results.

## Select the relevant area

- **React renders:** find the expensive component and the state/prop/context update causing it. Narrow subscriptions and move state closer to consumers. Remove redundant derived state/effect loops. Use memoization or stable identities only when they address a measured cost or a consumer's identity contract. Check React Compiler configuration before adding redundant memoization; do not change compiler settings casually.
- **Lists:** use an existing FlatList/FlashList for large or unbounded data; avoid full arrays rendered inside ScrollView and same-axis nested unbounded lists. Use stable entity keys, bounded pages, lightweight rows, and appropriately sized media. Do not switch list libraries without evidence. Use item-layout shortcuts only when dimensions are actually predictable and compatible with dynamic text.
- **Images/media:** request display-sized thumbnails, avoid decoding full-resolution assets in feed rows, and use existing expo-image/cache facilities. Bound prefetching and release players/listeners/resources. Do not put large media blobs into JS state or serialize them into key-value stores.
- **Animation/gestures:** use native controls first and the existing animation system. Avoid per-frame React state updates or JS-thread round trips. Profile layout-heavy animations; prefer cheaper transform/opacity approaches where they achieve the same design. Preserve reduced-motion and interaction behavior.
- **Startup:** measure imports, asset/font initialization, auth/storage hydration, and first data dependencies. Keep only essential startup work blocking first use, defer optional work, and avoid sequential independent requests. Do not bypass required auth hydration or create a blank/incomplete screen merely to lower a timing metric.
- **Network/query:** remove duplicate requests and unnecessary waterfalls; use bounded parallelism, correct query keys/stale times, pagination, cancellation, and targeted invalidation. Debounce searches when appropriate without delaying unrelated interactions. Avoid aggressive background polling or prefetching that increases battery/data use.
- **Storage/CPU:** profile large JSON parse/stringify, synchronous storage loops, filtering/sorting, and database scans. Move appropriate work to indexed database/server operations or supported background/native facilities when justified. Do not assume wrapping CPU-heavy JS in an async function moves it off the JS thread.
- **Memory/lifecycle:** check timers, subscriptions, listeners, cached media, retained closures, and repeated mount/unmount behavior. A smaller rerender count does not prove a memory fix. Bound caches and clean up owned resources without breaking reuse.
- **Backend:** measure request/DB/upstream latency separately. Address N+1 queries, missing relevant indexes, overfetching, connection reuse supported by the runtime, bounded concurrency, and safe caching. Load-test only authorized local/staging environments with bounded traffic, never production by default.

## Evidence at completion

Report the scenario, baseline and after values with units, run/build/device conditions, change made, and relevant regression checks. If the result is flat or regresses, say so and reconsider the change. Do not describe passing lint/types or removing inline objects as proof of a runtime speedup.

## Official reference

- [React Native performance overview](https://reactnative.dev/docs/performance)
