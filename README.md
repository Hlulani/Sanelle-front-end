# Sanelle

A mobile-first meal planning app built with **Ionic + Angular + Capacitor**, focused on fibroid-friendly, anti-inflammatory nutrition. It generates personalised meal plans, builds grocery lists from them, and keeps you on track with challenges and meal reminders.

> App ID: `com.hlulani.sanelle` · Angular 20 · Ionic 8 · Capacitor 8

The backend API lives in [sanelle-back-end](https://github.com/Hlulani/sanelle-back-end).

## Features

- **Onboarding** — pick nutrition focuses (anti-inflammatory, iron support, fibroid-friendly, fiber-forward, etc.), eating/fasting style, and plan duration.
- **My Plan** — generate a multi-day meal plan, choose a start date, swap individual recipes, and track meals as you go.
- **Challenges** — join built-in challenges, create your own, and invite friends with a join code.
- **Groceries** — ingredients from the active plan aggregated into a checkable shopping list, grouped by category.
- **Meal details** — full recipe view with ingredient scaling, instructions, and nutrition scores (anti-inflammatory, iron support, fiber).
- **Account** — profile and meal reminder notifications.
- **Auth** — email/username/password registration and login, JWT access + refresh tokens, silent refresh via an HTTP interceptor, and route guards for auth and onboarding.

## Tech Stack

- **Framework:** Angular 20 (standalone components, no NgModules)
- **UI Library:** Ionic 8 (`@ionic/angular/standalone`)
- **Mobile Runtime:** Capacitor 8 (Android & iOS native shells; Preferences, Local Notifications, Haptics, Share)
- **Language:** TypeScript 5.9
- **State/Data:** RxJS, Angular signals, and small services (`PlanStoreService`, `MealProgressService`) shared across tabs
- **HTTP:** Angular `HttpClient` with a functional interceptor for auth headers and silent token refresh
- **Testing:** Karma + Jasmine
- **Linting:** ESLint (`@angular-eslint`, `@typescript-eslint`)

## Project Structure

```
src/
├── app/
│   ├── app.component.ts        # Root component, restores session on boot
│   ├── app.routes.ts           # Top-level routing (auth, tabs, meal-details, onboarding)
│   ├── auth/
│   │   ├── auth-shell.page.ts          # Shell hosting login/register
│   │   └── components/
│   │       ├── login/, register/       # Login/register form components
│   │       └── onboarding/             # Post-signup preference onboarding
│   ├── core/
│   │   ├── auth/                       # Auth service, guard, and interceptor
│   │   ├── models/                     # Meal & plan response models
│   │   └── services/
│   │       ├── api.service.ts               # Backend API calls
│   │       ├── meal.service.ts              # Meal list/detail fetching
│   │       ├── meal-plans.service.ts        # Meal plan generation
│   │       ├── plan-store.service.ts        # Shares the active plan across tabs
│   │       ├── meal-progress.service.ts     # Tracks eaten meals
│   │       ├── challenges.service.ts        # Built-in challenges
│   │       ├── custom-challenges.service.ts # User-created challenges + invite codes
│   │       ├── focus-preferences.service.ts # Persisted onboarding focuses
│   │       ├── notification.service.ts      # Local meal reminders
│   │       └── *.util.ts                    # Challenge progress, ingredient scaling
│   ├── pages/meal-details/     # Recipe detail page
│   ├── shared/components/      # Reusable UI (initial-avatar)
│   ├── tabs/                   # Tab bar shell
│   ├── tab2/                   # My Plan
│   ├── tab3/                   # Groceries
│   └── account/                # Account
├── environments/                # environment.ts / environment.prod.ts (API base URLs)
├── theme/                       # Ionic theme variables
└── global.scss                  # Global styles
```

## Prerequisites

- Node.js and npm
- [Ionic CLI](https://ionicframework.com/docs/cli) (optional but recommended): `npm install -g @ionic/cli`
- For native builds: Android Studio (Android) and/or Xcode (iOS)

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app in the browser (dev server on `http://localhost:4200`):

```bash
npm start
# or
ionic serve
```

By default the app talks to the [sanelle-back-end](https://github.com/Hlulani/sanelle-back-end) API at `http://localhost:8080/api/v1` (see `src/environments/environment.ts`). Update `apiBaseUrl` / `hostBaseUrl` to point at your backend as needed.

## Building

```bash
npm run build            # production build, output to www/
npm run watch            # development build with file watching
```

Before shipping a production build, update `src/environments/environment.prod.ts` with your real API domain — it currently contains placeholder values (`YOUR-PROD-DOMAIN`).

## Testing & Linting

```bash
npm test                 # run unit tests (Karma/Jasmine)
npm run lint             # run ESLint
```

## Running on Mobile (Capacitor)

This repo includes `android/` and `ios/` native projects. After building the web assets:

```bash
npm run build
npx cap sync
npx cap open android      # opens Android Studio
npx cap open ios          # opens Xcode (requires macOS + Xcode)
```

### App icon & splash screen

Source images live in `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732). The current versions are placeholders — swap them for real branded assets, then regenerate the native icon sets:

```bash
npx capacitor-assets generate --ios --android
```

### Running on the iOS Simulator

Requires a Mac with Xcode installed (full Xcode, not just the Command Line Tools — check with `xcodebuild -version`).

1. Build the web app and sync it into the native project:
   ```bash
   npm run build
   npx cap sync ios
   ```
2. Open the project in Xcode:
   ```bash
   npx cap open ios
   # or: open ios/App/App.xcodeproj
   ```
   This project uses Swift Package Manager for its Capacitor plugins, so open `App.xcodeproj` directly — there is no `.xcworkspace` / CocoaPods step.
3. In Xcode's toolbar, choose a simulator (e.g. "iPhone 17") next to the scheme selector, then press **⌘R** to build and launch.

Re-run step 1 and then ⌘R again after any frontend change to pick up the latest web assets. Debug builds point at `environment.ts` (`http://localhost:8080` by default), so run your backend locally if you want to exercise login/register against real data.

### Stopping the Simulator

From Xcode: press the **⏹ Stop** button (or **⌘.**) to end the running app, then just quit the Simulator app (**⌘Q**) if you're done with it — closing it normally never corrupts state.

From the command line, if the app or simulator was launched via `xcrun simctl` (e.g. by a script):

```bash
xcrun simctl terminate "iPhone 17" com.hlulani.sanelle   # stop the app
xcrun simctl shutdown "iPhone 17"                         # shut down that simulator device
osascript -e 'quit app "Simulator"'                       # quit the Simulator app itself
```

`xcrun simctl shutdown all` shuts down every booted simulator at once if you're not sure which device is running.

### Running on the Android Emulator

Requires Android Studio (bundles the SDK, an emulator, and the AVD manager) — install via `brew install --cask android-studio` or from [developer.android.com](https://developer.android.com/studio). On first launch, its setup wizard will prompt to install the SDK, platform, and a system image if you don't already have one.

1. Build the web app and sync it into the native project:
   ```bash
   npm run build
   npx cap sync android
   ```
2. Open the project in Android Studio:
   ```bash
   npx cap open android
   ```
3. Create a virtual device if you don't have one yet: **Device Manager** (right-hand sidebar) → **+** → pick a device definition (e.g. Pixel 8) and a system image → Finish.
4. Choose that device in the toolbar dropdown, then press the ▶ **Run** button (or **⌃R**) to build and launch.

Re-run step 1 and then ▶ Run again after any frontend change. Debug builds point at `environment.ts` (`http://localhost:8080` by default) — note the emulator can't reach your Mac's `localhost` directly; use `http://10.0.2.2:8080` instead when testing against a locally-run backend.

### Stopping the Emulator

From Android Studio: press the ⏹ **Stop** button next to Run to end the app, then close the emulator window (or **⌘Q** it) when you're done — this is safe and won't corrupt the virtual device.

From the command line, if the emulator/app was launched via scripts (`emulator`/`adb`):

```bash
adb uninstall com.hlulani.sanelle   # optional: remove the installed app
adb emu kill                        # shut down the running emulator
```

## Authentication Flow

1. Unauthenticated users are redirected to `/auth` (login/register).
2. On successful login/register, access + refresh tokens are stored via Capacitor Preferences.
3. `authGuard` protects `tabs`, `meal-details`, and `onboarding` routes — it checks for a valid token and redirects new users to onboarding until it's completed.
4. `authInterceptor` attaches the bearer token to outgoing requests and, on a `401`/`403`, transparently attempts a token refresh before retrying the original request; if refresh fails, the user is logged out and redirected to `/auth`.

## Notes

- API base URLs are environment-specific — see `src/environments/`.
