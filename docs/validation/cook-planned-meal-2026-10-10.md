# Cooking a meal from a saved plan

Navigation was subsequently improved after user feedback. See [meal navigation and separate shopping view](meal-navigation-2026-10-10/README.md) for current behaviour and validation.

Fixed 10 October 2026. Selecting a planned day previously left its actions below the calendar, and the embedded recipe always used the first suggested meal. Opening a recipe also started on Plan instead of showing cooking steps, with no preparation-completion control there.

The selected day now brings its editor into view with **Cook this meal**. This opens the matching recipe directly on **Prepare**, using the plan’s servings. **Mark prep done** saves preparation for that specific saved day; **Back to my meal plan** restores the selection and relevant grocery week. An open day has no recipe/cooking action. Draft plans can show instructions but require saving before recording preparation.

The recipe preview follows the selected day. Route parameters update when the recipe page is reused, and obsolete asynchronous loads cannot replace a newer selected recipe. Existing Figma components, recipe content, colours and typography are retained.

Validation:

- Four real-backend browser checks passed: two scenarios in Chromium and iPhone WebKit, using disposable accounts and the actual recipe catalog.
- The cooking scenario checks a non-default planned meal, visible cooking entry/steps, plan servings, preparation persisted after reload, correct day on return, no completion mark on another day, another recipe through the reused route, and undoing preparation.
- The open-day scenario checks there is no stale recipe or cooking action.
- All 18 existing food unit tests passed.
- Angular lint and production-mode compilation passed. Build used the local test API origin and was not deployed; existing Stencil/Tesseract dependency warnings remain.

Commands:

```sh
npx playwright test --config e2e/playwright.config.ts e2e/cook-planned-meal.spec.ts
npm run test:ci -- --include='src/app/food/**/*.spec.ts'
npx ng lint
SANELLE_API_ORIGIN=http://localhost:8080 NG_BUILD_MAX_WORKERS=2 npm run build
```
