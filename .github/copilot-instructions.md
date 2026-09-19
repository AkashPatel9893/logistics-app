# GITHUB COPILOT INSTRUCTIONS — ODIN REPORTERS APP

## Critical Instructions for Copilot

When proposing code, autocompleting, or generating PRs/chat responses in this repository:

1. **Mandatory Skills & `skills-lock.json` Adherence:**
   - Refer to [AGENTS.md](file:///Users/akash/Desktop/Logistics-app/AGENTS.md) and the domain skills located in `.agents/skills/<skill-name>/SKILL.md`.
   - Respect `skills-lock.json`: all installed domain skills are locked dependencies tracked with cryptographic hashes. Do not propose changes that corrupt or alter locked skill directories or `skills-lock.json`.
   - Follow `.agents/skills/odin-component-architecture/SKILL.md` for all app-specific component, hook, state, and API authoring.

2. **Expo SDK 57 Rules:**
   - Target **Expo SDK 57** (`~57.0.24`), React 19 (`19.2.3`), React Native 0.86 (`0.86.3`), Tailwind CSS v4 (`^4.3.3`) with Uniwind (`^1.12.0`).
   - **Never** recommend `npm install`, `yarn add`, or `pnpm add` — ALWAYS use `npx expo install <package-name>`.
   - Prefer `@expo/ui` native components (SwiftUI / Jetpack Compose) for bottom sheets, pickers, sliders, and menus.
   - Use Expo Router file-based routing (`src/app/`).
   - Check for existing UI controls before creating new ones.

3. **Verification:**
   - Ensure proposed code passes ESLint (`yarn lint`) and formatting checks.
   - Run `npx expo-doctor@latest` when native dependencies are modified.
