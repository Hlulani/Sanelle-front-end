# Saved meal plans on Food — 10 October 2026

## Finding and change

The supplied complete journey map originally defined Save → TOD-02M for the three-day, weekly, two-week and monthly planners (`SANELLE_COMPLETE_JOURNEY_MAP.md`, rows FOOD-03D/W/T/M). The user explicitly changed that requirement: saving should keep them in Food, with cooking and shopping available. Food's landing screen also previously rendered only ranked recipe suggestions and had no view of the saved plan.

Saving now persists the draft in place. The URL, selected day and planner remain unchanged. The Save button is replaced by an accessible confirmation: **Meal plan saved. Choose a meal to cook, or open your shopping list.** A resized or newly generated draft offers Save again. Cooking controls, day editing and the separate shopping view remain available. Today reads the same saved record whenever the user chooses to open it; saving does not navigate there.

Food now shows **My saved meal plan** before suggestions. It reads the existing account's persisted `MealPlanStore`, rather than the editor's replacement draft. The section reuses the planner's existing heading, meal count, calendar cards, images, preparation marks and Cook controls. Dates, household servings, open days and leftover labels come from the saved record. Plans longer than one week have the existing week controls; the current week opens when the plan covers today, otherwise the first week opens.

Each Cook action opens the saved recipe ID with its actual plan date and `stage=cook`. Preparation therefore applies to the selected day. An open day opens the planner for that date and offers no cooking action. **Open meal plan** opens the editor; **Open shopping list** opens the separate shopping view for the selected week.

The saved plan remains visible if fetching recipe suggestions fails. An unsaved duration change does not replace it. Account changes load the appropriate account record, and the overview is restored after signing back into its owner. No new storage format, backend behavior or medical claims were introduced.

## Verification

- All 36 selected food journey checks passed across Chromium and iPhone/WebKit on the development app, including all four durations, saved-plan access, cooking, preparation, shopping, swaps and requirements. The swap checks were rerun after correcting their ambiguous status locator to distinguish the new saved confirmation from the existing swap notice.
- The same six checks passed against the optimized production build on the running local preview, port 4300, with the actual backend.
- Two additional checks passed inside the actual reviewer phone iframe, in Chromium and WebKit: real sign-in, Save stays in the planner with visible confirmation, deliberate navigation to Food, Cook, and comparison of the displayed cooking instructions with the database API response.
- Production build, lint, formatting and diff checks passed.

The updated checks cover Save → stay in the planner → Cook directly, deliberate navigation to the Food overview, the correct meal/date, persistent preparation, open-day editing, shopping navigation, future monthly plans and Week 5, household servings, an unsaved replacement, an intentionally unavailable suggestions endpoint, and switching between accounts. The Today cooking check explicitly taps Today and verifies the same saved meal is available there. Accounts are fictional, created for each test and deleted after use. Only the intentional suggestions outage is mocked.

`chromium-food-saved-plan.png` and `iphone-food-saved-plan.png` capture the actual working Food screen with fictional saved meals and an open day. `*-phone-saved-plan.png` captures it inside the reviewer phone frame using a throwaway Thandi account. No patient information is included.

## Reproduce

Run the local backend with its development mail outbox, then:

```sh
npx playwright test --config e2e/playwright.config.ts e2e/saved-food-plan.spec.ts e2e/cook-planned-meal.spec.ts
SANELLE_API_ORIGIN=http://localhost:8080 NG_BUILD_MAX_WORKERS=2 npm run build -- --delete-output-path=false
npm run preview
SANELLE_APP_URL=http://127.0.0.1:4300 npx playwright test --config e2e/playwright.config.ts e2e/saved-food-plan.spec.ts
```

The build refreshes the local preview without deleting older chunks still used by open tabs. No external hosted deployment was performed.
