# AGENTS & AI INSTRUCTIONS — ODIN REPORTERS APP

> **MANDATORY FOR ALL AI AGENTS, IDES, AND APIS:**
> This project contains specialized domain skills in `.agents/skills/` governed by `skills-lock.json`.
> Any AI assistant, IDE (Claude, Cursor, Windsurf, Copilot, Cline, Roo Code, etc.), or API (OpenAI, Anthropic, Gemini, Antigravity, etc.) **MUST** consult and follow the corresponding skill file (`.agents/skills/<skill-name>/SKILL.md`) and verify against `skills-lock.json` before answering, planning, or writing any code.

---

## 0. Mandatory Pre-Change Protocol & Lockfile Rules

Before proposing, generating, or applying ANY code changes, every AI assistant and IDE MUST execute this checklist:

1. **Step 1: Consult Skill Map & Load Relevant Skill**
   - Check the **Skill Map & Routing Catalog** below to identify which skill applies to your task.
   - Read `.agents/skills/<skill-name>/SKILL.md` (or `.claude/skills/<skill-name>/SKILL.md`) in its entirety before writing any code.
   - For Odin application components, hooks, API, and state, always load `.agents/skills/odin-component-architecture/SKILL.md`.

2. **Step 2: Respect `skills-lock.json` (Skill Integrity)**
   - `skills-lock.json` is the authoritative lockfile tracking all external domain skills, their upstream GitHub sources, paths, and cryptographic SHA-256 hashes (`computedHash`).
   - **NEVER** tamper with, manually alter, or corrupt `skills-lock.json`.
   - **NEVER** modify upstream vendor skills directly in `.agents/skills/` or `.claude/skills/` without updating `skills-lock.json`.
   - Ensure that `.agents/skills/` and `.claude/skills/` remain synchronized and match the locked versions.

3. **Step 3: Strictly Adhere to Project Constraints**
   - Verify that your proposed solution adheres to the 10 Critical Project Constraints below (Expo SDK 57, `@expo/ui` native components, `npx expo install` only, Expo Router, etc.).

4. **Step 4: Post-Change Verification**
   - If dependencies or native configurations change, run `npx expo-doctor@latest`.
   - Ensure code passes styling and lint rules (`yarn lint`, `yarn format:check`).

---

## 1. Critical Project Constraints & Rules

1. **Expo Version:**
   - This project uses **Expo SDK 57** (`~57.0.23`), React 19, React Native 0.86, and Tailwind CSS v4 / Uniwind.
   - **Expo has changed drastically in SDK 56 & 57.** Never rely on outdated React Native or legacy Expo habits.
   - **Read the exact versioned documentation:** [https://docs.expo.dev/versions/v57.0.0/](https://docs.expo.dev/versions/v57.0.0/) before writing code.
2. **Package Installations:**
   - Always install packages using `npx expo install <package-name>`, **never** raw `npm install`, `yarn add`, or `pnpm add`. This ensures compatibility with Expo SDK 57.
3. **Native UI Components:**
   - Whenever you need a UI component (list rows, bottom sheets, pickers, sliders, menus, buttons, segmented controls, toggles), **consult `.agents/skills/expo-ui/SKILL.md` first**.
   - Prefer `@expo/ui` native equivalents over community libraries (`@gorhom/bottom-sheet`, etc.).
   - Exception: `@expo/ui` `List` renders native grouped settings rows, **not** a virtualized list; use `FlatList` / `FlashList` for large datasets.
4. **Navigation & Structure:**
   - This project uses Expo Router (`src/app/`). Consult `.agents/skills/expo-router/SKILL.md`; use `.agents/skills/expo-project-structure/SKILL.md` for new-project layout guidance.
5. **Reusable Components & Existing-App Architecture:**
   - Before adding or editing screens, components, hooks, or shared logic, read [`.agents/skills/odin-component-architecture/SKILL.md`](.agents/skills/odin-component-architecture/SKILL.md).
   - Search for an existing component before creating one. Screens compose app-owned UI controls; create or extend the shared control first, then use it. Centralize its styling, states, and accessibility so future changes happen in one place.
   - Follow that skill's file placement, kebab-case naming, import boundaries, and deduplication rules. Keep basic layout primitives and framework navigation APIs direct where appropriate.
   - These project-specific component rules take precedence over generic skill advice to wait for two consumers or avoid native-control adapters. Keep existing paths and scope refactors to the requested work.

6. **API Client, Interceptors & Server State:**
   - For API/authentication/caching work, read [API and server-state conventions](.agents/skills/odin-component-architecture/references/api-and-server-state.md) alongside `.agents/skills/expo-data-fetching/SKILL.md`.
   - Use one shared request pipeline for base URL, headers, auth, parsing, errors, and cancellation. Screens consume endpoint/query hooks rather than raw fetch/Axios calls.
   - Follow the installed library's official version-specific practices for caching, query keys, mutations, retries, native lifecycle, and account isolation. These project rules refine the generic fetching examples; do not add libraries without a concrete need.

7. **State, Forms & Feature Quality:**
   - For state/stores, providers, persistence, or forms, read [State ownership and forms](.agents/skills/odin-component-architecture/references/state-and-forms.md). Use local state first, keep server data in its query cache, and introduce shared stores only for genuinely shared client state.
   - For feature implementation/review, read [Feature completion guidance](.agents/skills/odin-component-architecture/references/feature-quality.md) for applicable error recovery, permissions, media lifecycle, accessibility, and verification rules.
   - Reuse installed libraries and consult their version-specific documentation. These rules do not require speculative packages, folders, or unrelated refactors.

8. **Storage & Security:**
   - For storage, credentials, persisted state/cache, offline files, or security-sensitive work, read [Storage and security](.agents/skills/odin-component-architecture/references/storage-and-security.md).
   - Choose AsyncStorage/MMKV for appropriate non-sensitive key-value data, SecureStore for small native secrets, and SQLite/files for structured or large offline data. Encryption and key management must be explicit for sensitive data; never silently fall back to plaintext.
   - Centralize storage adapters and follow account isolation, migration, recovery, retention, and cleanup rules. Enforce backend authorization and avoid secrets in client bundles/logs. Do not install every storage library preemptively.

9. **API Authoring & Performance:**
   - For server endpoints/contracts, read [API authoring](.agents/skills/odin-component-architecture/references/api-authoring.md); use `eas-hosting` and `expo-router` when writing Expo API routes. Keep validation, verified authentication, resource authorization, and server-only logic explicit.
   - For optimization, read [Performance](.agents/skills/odin-component-architecture/references/performance.md) alongside relevant React Native domain skills. Measure a reproducible baseline, fix the bottleneck, and remeasure; do not claim speedups from static cleanup alone.
   - These project-specific rules refine generic examples: placeholder authentication is not production auth, and performance suggestions do not require blanket memoization or library replacement.

10. **Reliability, Startup & Reloads:**
    - For ANRs, crashes, hangs, cold/warm/hot launches, resume/process restoration, or Fast Refresh, read [Reliability and lifecycle](.agents/skills/odin-component-architecture/references/reliability-and-lifecycle.md).
    - Diagnose JS/native/OS failures with the appropriate evidence. Verify startup and lifecycle in representative builds; Fast Refresh is not a production startup test.
    - Track crash/ANR and startup metrics with defined coverage and denominators. Never claim crash-free reliability from missing reports, documentation, or static checks alone.

---

## 2. Skill Map & Routing Catalog

Before generating code or executing tasks, find the relevant skill in `.agents/skills/` and read its `SKILL.md`:

### Building the App

| Skill                             | Path                                                                                                         | Description & When to Load                                                                                                                                           |
| :-------------------------------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`expo-overview`**               | [`.agents/skills/expo-overview/SKILL.md`](.agents/skills/expo-overview/SKILL.md)                             | **Entry point and router** for any Expo/EAS task. Start here if the task is broad or unspecified.                                                                    |
| **`expo-router`**                 | [`.agents/skills/expo-router/SKILL.md`](.agents/skills/expo-router/SKILL.md)                                 | Navigation: file-based routing, stacks, tabs, modals, sheet presentation, links, headers.                                                                            |
| **`expo-ui`**                     | [`.agents/skills/expo-ui/SKILL.md`](.agents/skills/expo-ui/SKILL.md)                                         | Native UI components via `@expo/ui` (real SwiftUI / Jetpack Compose): BottomSheet, Picker, Slider, Switch, Menu, FieldGroup.                                         |
| **`expo-native-ui`**              | [`.agents/skills/expo-native-ui/SKILL.md`](.agents/skills/expo-native-ui/SKILL.md)                           | Apple HIG / Material styling, SF Symbols, semantic colors, native controls.                                                                                          |
| **`expo-design-system`**          | [`.agents/skills/expo-design-system/SKILL.md`](.agents/skills/expo-design-system/SKILL.md)                   | Design tokens (color, spacing, typography), theme consistency, eliminating AI-slop / generic styling.                                                                |
| **`expo-animation`**              | [`.agents/skills/expo-animation/SKILL.md`](.agents/skills/expo-animation/SKILL.md)                           | Motion & gestures: Reanimated 4 worklets, Gesture Handler, screen transitions, press feedback, haptics.                                                              |
| **`expo-data-fetching`**          | [`.agents/skills/expo-data-fetching/SKILL.md`](.agents/skills/expo-data-fetching/SKILL.md)                   | Network requests, React Query / SWR, caching, offline support, route loaders.                                                                                        |
| **`expo-project-structure`**      | [`.agents/skills/expo-project-structure/SKILL.md`](.agents/skills/expo-project-structure/SKILL.md)           | Folder layout & organization rules.                                                                                                                                  |
| **`expo-dom`**                    | [`.agents/skills/expo-dom/SKILL.md`](.agents/skills/expo-dom/SKILL.md)                                       | Running web code or web libraries inside native using Expo DOM components.                                                                                           |
| **`expo-web-to-native`**          | [`.agents/skills/expo-web-to-native/SKILL.md`](.agents/skills/expo-web-to-native/SKILL.md)                   | Migrating web React code to native iOS / Android.                                                                                                                    |
| **`vercel-react-native-skills`**  | [`.agents/skills/vercel-react-native-skills/SKILL.md`](.agents/skills/vercel-react-native-skills/SKILL.md)   | Mobile performance best practices, list optimization, native APIs.                                                                                                   |
| **`odin-component-architecture`** | [`.agents/skills/odin-component-architecture/SKILL.md`](.agents/skills/odin-component-architecture/SKILL.md) | Shared components, naming, file placement, API clients, state/stores, forms, storage/security, API authoring, performance, reliability/startup, and feature quality. |

### Shipping & Operating

| Skill                     | Path                                                                                         | Description & When to Load                                                          |
| :------------------------ | :------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| **`eas-app-stores`**      | [`.agents/skills/eas-app-stores/SKILL.md`](.agents/skills/eas-app-stores/SKILL.md)           | Building and submitting iOS/Android apps, TestFlight, app versions, store metadata. |
| **`eas-hosting`**         | [`.agents/skills/eas-hosting/SKILL.md`](.agents/skills/eas-hosting/SKILL.md)                 | Deploying web bundles to EAS Hosting; authoring Expo Router API routes (`+api.ts`). |
| **`eas-workflows`**       | [`.agents/skills/eas-workflows/SKILL.md`](.agents/skills/eas-workflows/SKILL.md)             | EAS workflow YAML files and CI/CD pipelines.                                        |
| **`eas-update`**          | [`.agents/skills/eas-update/SKILL.md`](.agents/skills/eas-update/SKILL.md)                   | Over-the-air (OTA) updates, publishing, channels, branches, runtime versions.       |
| **`eas-update-insights`** | [`.agents/skills/eas-update-insights/SKILL.md`](.agents/skills/eas-update-insights/SKILL.md) | OTA update health, crash rates, adoption metrics.                                   |
| **`eas-observe`**         | [`.agents/skills/eas-observe/SKILL.md`](.agents/skills/eas-observe/SKILL.md)                 | EAS Observe: startup metrics, cold/warm launch, TTI, error reporting.               |
| **`eas-simulator`**       | [`.agents/skills/eas-simulator/SKILL.md`](.agents/skills/eas-simulator/SKILL.md)             | Running & driving apps on EAS cloud remote simulators.                              |
| **`expo-dev-client`**     | [`.agents/skills/expo-dev-client/SKILL.md`](.agents/skills/expo-dev-client/SKILL.md)         | Custom development client builds and distribution.                                  |

### Native Extensions & Maintenance

| Skill                     | Path                                                                                         | Description & When to Load                                                 |
| :------------------------ | :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **`expo-module`**         | [`.agents/skills/expo-module/SKILL.md`](.agents/skills/expo-module/SKILL.md)                 | Creating native modules and views (Swift / Kotlin) using Expo Modules API. |
| **`expo-migrate-module`** | [`.agents/skills/expo-migrate-module/SKILL.md`](.agents/skills/expo-migrate-module/SKILL.md) | Migrating Swift modules from definition DSL to v2 macro API.               |
| **`expo-brownfield`**     | [`.agents/skills/expo-brownfield/SKILL.md`](.agents/skills/expo-brownfield/SKILL.md)         | Embedding Expo / React Native screens in native iOS/Android apps.          |
| **`expo-app-clip`**       | [`.agents/skills/expo-app-clip/SKILL.md`](.agents/skills/expo-app-clip/SKILL.md)             | Adding iOS App Clip targets.                                               |
| **`expo-upgrade`**        | [`.agents/skills/expo-upgrade/SKILL.md`](.agents/skills/expo-upgrade/SKILL.md)               | Upgrading Expo SDK and resolving dependency conflicts.                     |
| **`expo-examples`**       | [`.agents/skills/expo-examples/SKILL.md`](.agents/skills/expo-examples/SKILL.md)             | Official canonical Expo example integrations.                              |
| **`expo-skill-eval`**     | [`.agents/skills/expo-skill-eval/SKILL.md`](.agents/skills/expo-skill-eval/SKILL.md)         | Testing and evaluating skill outputs.                                      |
| **`expo-skill-feedback`** | [`.agents/skills/expo-skill-feedback/SKILL.md`](.agents/skills/expo-skill-feedback/SKILL.md) | Reporting feedback on skills.                                              |

---

## 3. How Different Tools / IDEs / APIs Follow These Skills

- **Claude Code:** Automatically configured via `CLAUDE.md` and `.claude/skills/`.
- **Cursor IDE:** Configured via `.cursorrules` and `.cursor/rules/expo-skills.mdc`.
- **Windsurf IDE:** Configured via `.windsurfrules`.
- **GitHub Copilot:** Configured via `.github/copilot-instructions.md`.
- **Cline / Roo Code:** Configured via `.clinerules`.
- **Gemini / Antigravity:** Configured via `GEMINI.md` and `AGENTS.md`.
- **External AI / API Calls:** Whenever invoking an LLM API (OpenAI, Anthropic, Gemini, Mistral, etc.) for code generation in this repository, inject `AGENTS.md` and the relevant `.agents/skills/<skill>/SKILL.md` content into the system prompt.
