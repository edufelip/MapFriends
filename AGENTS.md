# Repository Guidelines

## Project Structure & Module Organization
- `App.tsx` is the app entry point (fonts, status bar, providers).
- `src/` contains feature code:
  - `src/screens/` for UI screens (e.g., `src/screens/Auth/`).
  - `src/app/` for navigation and routes.
  - `src/services/` for shared services (auth, types, mocks).
  - `src/localization/` for string catalogs (`strings.ts`).
- `assets/` holds images and fonts (e.g., `assets/auth/`, `assets/fonts/`).
- Platform folders `android/` and `ios/` are managed by Expo.

## Build, Test, and Development Commands
Use npm scripts from `package.json`:
- `npm run start` запускает Expo dev server.
- `npm run android` / `npm run ios` запускают app on emulator/device.
- `npm run web` запускает web build with Expo.

There are no test scripts configured yet.

## Coding Style & Naming Conventions
- Language: TypeScript/React Native.
- Indentation: 2 spaces.
- Filenames: `PascalCase` for screens/components (e.g., `LoginScreen.tsx`).
- Hooks/use*: `camelCase` (e.g., `useAuth`).
- Keep UI strings in `src/localization/strings.ts` (English `en-US` and Portuguese `pt-BR`).

## Testing Guidelines
No automated test framework is configured. If you add tests, document:
- The framework (e.g., Jest).
- Naming convention (e.g., `*.test.tsx`).
- How to run them.

## Commit & Pull Request Guidelines
Commits use a typed prefix format:
`type: summary` (e.g., `feature: refresh auth screens with localization`).
Common types: `feature`, `fix`, `refactor`, `build`, `chore`, `docs`, `test`, `perf`, `ci`.

PRs should include:
- Short description of changes.
- Screenshots for UI changes (light/dark if applicable).
- Notes about breaking changes or migrations.

## Configuration Tips
- `app.json` controls Expo configuration (including `userInterfaceStyle`).
- Fonts must be bundled under `assets/fonts/` and loaded in `App.tsx`.
