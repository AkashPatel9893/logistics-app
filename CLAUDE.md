# CLAUDE INSTRUCTIONS — ODIN REPORTERS APP

@AGENTS.md

> **CRITICAL DIRECTIVE FOR CLAUDE:**
> Before proposing any changes, generating code, or editing any file in this project:
>
> 1. Consult the Skill Map in [AGENTS.md](file:///Users/akash/Desktop/Logistics-app/AGENTS.md) and read the corresponding domain skill in `.claude/skills/<skill-name>/SKILL.md` (or `.agents/skills/<skill-name>/SKILL.md`).
> 2. Respect `skills-lock.json`: all domain skills are locked dependencies tracked with SHA-256 hashes. Do not alter or corrupt `skills-lock.json`.
> 3. For Odin component and app architecture, read `.claude/skills/odin-component-architecture/SKILL.md`.
> 4. Strictly follow Expo SDK 57 constraints: install packages ONLY via `npx expo install`, use `@expo/ui` native components first, and adhere to Expo Router and Odin architecture rules.
> 5. Verify your changes pass `yarn lint` and `npx expo-doctor@latest` (for dependencies).
