# AGENT & WORKSPACE RULES — ODIN REPORTERS APP

## Mandatory Rules for All AI Assistants & Agents

1. **Pre-Change Skill & Lockfile Check:**
   - Before writing or editing any code, consult `skills-lock.json` and the corresponding skill in `.agents/skills/<skill-name>/SKILL.md`.
   - `skills-lock.json` is the authoritative source for all locked skill versions and hashes. Do not modify or diverge from the locked skills without updating `skills-lock.json`.
   - For Odin application architecture, component structure, forms, data fetching, or state, read `.agents/skills/odin-component-architecture/SKILL.md`.

2. **Core Constraints:**
   - **Expo SDK 57:** Target Expo SDK 57 (`~57.0.24`), React 19, React Native 0.86, Tailwind CSS v4, Uniwind.
   - **Package Installations:** Always use `npx expo install <package-name>`. Never use raw `npm install`, `yarn add`, or `pnpm add`.
   - **Native UI:** Prefer `@expo/ui` native controls (SwiftUI / Jetpack Compose) for bottom sheets, sliders, pickers, and menus. Consult `.agents/skills/expo-ui/SKILL.md`.
   - **Routing:** Use Expo Router in `src/app/`. Consult `.agents/skills/expo-router/SKILL.md`.
   - **Component Architecture:** Reuse existing controls before creating new ones. Follow kebab-case naming, clean boundaries, and central styling.

3. **Verification:**
   - Run `npx expo-doctor@latest` on native/dependency updates.
   - Ensure `yarn lint` and `yarn format:check` succeed.
