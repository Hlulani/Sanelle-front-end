# Recipe-content update — 10 October 2026

Applied backend Flyway V21 to the local working database. All 166 seeded recipes now return versioned recipe-content metadata through the authenticated API. Directions were rewritten for 62 older recipes and corrected for 35 newer recipes; 69 existing methods were retained.

Prepare displays numbered database directions, the recipe name, expandable ingredient prerequisites, relevant cooking checks with clickable sources, and recipe notes. Cooking times are editorial estimates. The sources support technique and handling guidance; the complete recipes have not been kitchen-tested, and the UI says so. Recorded preparation times are legacy metadata, not verified total elapsed times; already-cooked ingredients and chilling can add time.

The migration preserves IDs, ingredients, dietary tags and preparation metadata. It skips a recipe if its original ingredients or instructions have been edited. Existing saved plans remain linked by ID. Renamed pancake and smoothie recipes keep their deliberate photo matches through title aliases.

## Validation

- Disposable PostgreSQL: fresh installation updates all 166; upgrade preserves deliberately altered directions and ingredient amounts, IDs and other meal attributes, with contiguous ordered instructions.
- Authenticated backend integration: JSON provenance and revised cod directions reach the real recipe API.
- Backend report totals after the suite and corrected API-test rerun: 153 tests, no outstanding failures/errors/skips.
- Both Chromium and iPhone/WebKit: recipe instructions exactly match the API; fish, ground beef, cooked-rice soup, turkey chili, lentils and overnight oats expose the correct prerequisites and checks. Both renamed recipes load their photographs.
- Both browsers: saved-day cooking, preparation persistence, empty-day recovery and Today cooking navigation passed.
- iPhone: all 12 Nourish journey tests passed, covering durations, shopping edits, swaps, strict requirements and no-compatible-meal recovery.
- Lint, formatting, production compilation, local-photo validation and both repositories' diff checks passed. Compilation retains the existing Stencil/Tesseract dependency warnings.

`*-catalog-audit.json` contains public recipe data only, exported from the actual running API. Browser accounts are disposable and are removed by the fixture teardown. `*-cod-checks.png` shows the serving checks. The adjacent `../recipe-instructions-2026-10-10/*-cooking.png` captures the numbered cod method.

The complete before/after content and source map are in the backend's `docs/recipes/recipe-content-v1.json`; method/provenance limitations are in `docs/recipes/README.md`.
