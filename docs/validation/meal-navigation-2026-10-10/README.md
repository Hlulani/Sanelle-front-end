# Meal navigation and separate shopping view

Validated 10 October 2026 against the working Angular app and real local Spring Boot backend. Browser fixtures use disposable example.test accounts and fictional user data; accounts are deleted after testing.

## Findings and changes

Today previously displayed a fixed example meal and opened the general Food page. It now shows today’s actual saved meal, its image and plan servings, and opens that recipe directly on Prepare. An open day offers a meal-selection action; a day outside the saved plan offers recipe discovery.

Saved plan cards now open their own cooking steps when their picture/title is tapped. Each card also has an explicit Cook this meal link and a separate Change meal control. Draft cards still select days for planning. Preparation completion belongs to the specific saved day, survives reload, and can be undone. Returning from the recipe restores that day. Reopening an Ionic-cached recipe restores the intended stage, even if the user previously switched to Plan. The return-to-plan link is available in both stages.

The previous planner displayed a read-only grocery list, a full recipe and a second editable list on one long page. Meal plan and Shopping list are now separate task views within the app, sharing the same plan. The shopping view excludes planner, recipe and food-introduction content. It shows the selected week’s dates, plan servings, ingredient quantities, remaining/already-have counts, checkboxes, removal/restoration and custom items with optional quantities. Week selection and grocery edits survive reload. Unknown quantities and incomplete recipe coverage are labelled explicitly. Navigation waits until a new plan has finished building; stale day-scroll requests cannot move the shopping view away from the top.

Existing Figma typography, colours, recipe components, planner calendar and duration controls are retained. The added task-navigation row shifts the planner vertically; the source-comparison test explicitly checks retained component widths/heights and all duration controls.

## Verification

- 6 cooking/navigation browser checks passed: three scenarios in Chromium and iPhone WebKit, both 390 × 844 viewports.
- 12 existing food journeys passed on iPhone: recipes, favourites, recipe-to-plan grocery transfer, all four durations, preparation persistence, swaps/undo, open days, strict requirements, incompatibility recovery and per-week grocery isolation.
- 1 Figma source component comparison passed on iPhone.
- All 18 existing food unit tests passed.
- Angular lint, formatting, git diff whitespace check and final production-mode build passed. Build targets the local test API and was not deployed. Existing Stencil/Tesseract dependency warnings remain.

Commands:

```sh
npx playwright test --config e2e/playwright.config.ts e2e/cook-planned-meal.spec.ts
npx playwright test --config e2e/playwright.config.ts e2e/nourish.spec.ts e2e/figma-journeys.spec.ts --project iphone --grep 'FOOD|Recipe shopping|Strict allergies|Food landing'
npm run test:ci -- --include='src/app/food/**/*.spec.ts'
npm run lint
SANELLE_API_ORIGIN=http://localhost:8080 NG_BUILD_MAX_WORKERS=2 npm run build
```

## Visual checks

Unannotated screenshots of the working app:

- [iPhone meal cards](iphone-meal-cards.png)
- [iPhone shopping list](iphone-shopping.png)
- [Chromium meal cards](chromium-meal-cards.png)
- [Chromium shopping list](chromium-shopping.png)

The historical presentation asset pack was not regenerated. Its capture script has been adjusted to open the new shopping view on future captures.
