# Phone-preview startup recovery — 10 October 2026

The reported screenshot shows the splash in the reviewer phone frame. A fresh local browser opened normally. A deliberately stalled refresh request with a fictional expired access token reproduced the same frozen splash: the route guard awaited a request without a deadline, so the first route never rendered. This establishes a reproducible startup fault; the exact state of the reporting browser has not been inspected.

## Fix

Session refresh has a 15-second deadline. Temporary network/server failures retain session credentials and local records. A 30-second retry delay keeps the same failed restoration from immediately blocking the sign-in screen; explicit sign-in resets that delay. Server rejection (400/401/403) still ends an invalid session. Concurrent startup and route checks share one request.

The splash stays until successful navigation. Initial navigation or bootstrap failures expose recovery instead of removing the splash onto an empty page. An independent inline recovery control becomes visible after 15 seconds if the app bundle never loads, and Reload Sanelle retries without clearing storage.

The local preview serves the production build, supports `/phone` and `/phone/`, disables cached HTML, and returns 404 for missing assets instead of HTML with a JavaScript filename. The working preview on port 4300 was restarted with this server. The production build used the local API, preserving existing output chunks during rebuilding. No external site was deployed.

## Actual sign-in through the phone frame

The original preview checks reached the sign-in form but did not submit it. The authenticated cooking checks used the development server instead. A subsequent real login through the optimized preview exposed another defect: the backend rejected the preview's browser origin, returning HTTP 403 `Invalid CORS request` to the sign-in preflight. This is a confirmed preview connection fault; it does not establish that CORS caused the pictured splash.

The backend development defaults now explicitly allow localhost and 127.0.0.1 on ports 4300 and 4301, along with the existing development and Capacitor origins. Unknown websites remain rejected. A deployed `CORS_ALLOWED_ORIGINS` override still replaces that development list. The local backend was restarted with the corrected configuration. Both live port-4300 sign-in preflights now return HTTP 200 with the exact requesting origin.

## Verification

- 121 Angular unit tests passed, including stalled refresh cancellation, later retry, concurrent restoration, unavailable-server preservation and rejected sessions.
- Ten production phone-frame browser tests passed on the running port-4300 preview across Chromium and WebKit: actual backend sign-in and database cooking instructions, welcome/sign-in form, timed-out saved-session restoration, failed-script recovery and reload, and missing assets.
- Two backend integration tests passed: the explicit preview origins can preflight sign-in and authenticated recipes; an unapproved website remains rejected.
- All 14 real-backend account and cooking journey checks passed across Chromium and iPhone/WebKit, including verification, onboarding, password reset, saved-day cooking and database instructions.
- Lint, formatting and production compilation passed.

`reproduced-stalled-session-before.png` is a reproduction using fictional tokens, not a capture of the user's session. `*-phone-welcome.png` shows the working frame. `*-signed-in.png` and `*-database-recipe.png` show a verified throwaway Thandi account reaching Today and the actual database recipe. `*-recovery.png` shows the intentionally failed-script state. These test accounts are deleted after use; the identified account left by the earlier failed test was also removed. No real patient records were used or deleted.

## Running these checks

Build with the intended API, then run `npm run preview`. To avoid replacing chunks still used by open local preview tabs during a verification rebuild, use `SANELLE_API_ORIGIN=http://localhost:8080 npm run build -- --delete-output-path=false`.

`npm run e2e:preview` starts a separate static server on port 4301 and tests the optimized app in its actual iframe. The usual development-server journey suite excludes these preview-specific tests.

To verify the currently running port-4300 preview, use `SANELLE_PREVIEW_PORT=4300 npm run e2e:preview`. The real sign-in check needs the local backend and its development mail outbox. The URL of the reporting browser has not been supplied, so these local results do not confirm the state of a separately hosted instance.
