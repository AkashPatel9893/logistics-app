# GEMINI & ANTIGRAVITY INSTRUCTIONS — ODIN REPORTERS APP

@AGENTS.md

> **CRITICAL DIRECTIVE FOR GEMINI & ANTIGRAVITY:**
> Before proposing any changes, generating any code, or editing any file in this repository, you **MUST** follow the pre-change protocol defined in [AGENTS.md](file:///Users/akash/Desktop/Logistics-app/AGENTS.md) and respect `skills-lock.json`.

---

## Pre-Change Requirements for Gemini / Antigravity

1. **Check Skills & Lockfile (`skills-lock.json`) First:**
   - Locate the applicable domain skill in `.agents/skills/<skill-name>/SKILL.md`.
   - Read the skill in full before taking action.
   - Verify against `skills-lock.json` — all external skills are locked dependencies. Do not tamper with, delete, or introduce unverified skills into `.agents/skills/`.
   - For Odin application components, screens, hooks, or state, read `.agents/skills/odin-component-architecture/SKILL.md`.

2. **Strict Project Constraints (Expo SDK 57):**
   - **Expo SDK 57** (`~57.0.24`), React 19 (`19.2.3`), React Native 0.86 (`0.86.3`), Tailwind CSS v4 (`^4.3.3`) with Uniwind (`^1.12.0`).
   - Never use outdated Expo or legacy React Native patterns. Consult Expo SDK 57 docs: `https://docs.expo.dev/versions/v57.0.0/`.
   - **Package Installations:** Always use `npx expo install <package-name>`, NEVER raw `npm install`, `yarn add`, or `pnpm add`.
   - **Native UI Controls:** Always consult `.agents/skills/expo-ui/SKILL.md`. Use `@expo/ui` native components (SwiftUI / Jetpack Compose) for bottom sheets, pickers, sliders, switches, and menus.
   - **Navigation:** Expo Router (`src/app/`). Consult `.agents/skills/expo-router/SKILL.md`.
   - **Architecture:** Follow `.agents/skills/odin-component-architecture/SKILL.md`. Check for existing components before creating new ones.

3. **Post-Change Verification:**
   - Run `npx expo-doctor@latest` if native dependencies or configurations were modified.
   - Verify that changes pass linting (`yarn lint`) and formatting (`yarn format:check`).
