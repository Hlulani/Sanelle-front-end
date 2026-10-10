# Database-backed recipes and cooking instructions

Audited 10 October 2026 against the running local app and backend with disposable accounts. The authenticated GET /api/v1/meals response contained 166 recipes. All 166 had non-empty instruction text. The JSON audit files contain recipe data only.

Source chain: Angular MealService GET /api/v1/meals and /api/v1/meals/:id → Spring Boot MealController → MealServiceImpl → MealRepository → JPA Meal entity. Meals, ingredients and ordered instructions are persisted in meals, meal_ingredients and meal_instructions. The backend is configured for PostgreSQL with Flyway migrations. RecipeCatalog caches the API response; it does not fabricate recipe names, ingredients or cooking directions. Meal images can come from the frontend photo catalogue when the database imageUrl is absent or fails.

The original Prepare view rendered saved instructions as unnumbered text because the global Figma stylesheet resets list markers. Opening a recipe scrolled to its introductory content. Prepare now has an explicit How to cook heading and readable numbered steps with spacing, and opening a saved meal on Prepare scrolls straight to those steps. Preparation time is labelled as recorded preparation time, rather than implying a separate cooking duration. An empty instruction list displays an explicit not-recorded state.

Recipe-content limitation: instruction presence does not establish completeness or recipe validation. For example, Baked Cod with Lemon and Greens has three short database directions: bake the fish, sauté spinach and serve. The record gives no oven temperature or baking duration in those directions. No temperatures, durations or extra cooking steps were invented or added to the database during this fix. The recipe catalogue still needs a content-quality pass for reliable cooking detail.

Verification: 8 real-backend browser checks passed across Chromium and iPhone WebKit. The instruction audit compares all displayed steps of the example recipe with the API response exactly, verifies decimal numbering, and checks that the heading and first step appear in the initial viewport. Cooking/navigation regressions cover the saved day, plan servings, preparation persistence, undo, cached recipe re-entry and shopping navigation. Angular lint, whitespace check and production compilation passed. The build was not deployed.

Files:

- iphone-catalog-audit.json and chromium-catalog-audit.json: live API counts and example recipe.
- iphone-cooking.png and chromium-cooking.png: actual numbered cooking steps, using a fictional test account.
