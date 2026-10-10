# Current design reference

The visual reference is the actual Figma Make prototype in `/Users/hbaloyi/Downloads/project.zip`. Its welcome screen matches the user's screenshot supplied on 8 October 2026. The original React source, CSS, archive hash, and an independently runnable build are retained in `figma-make-source-2026-10-08/`.

**Do not use the generated atlas as the visual reference.** Its typography, spacing, colours, content and entry layout differ from the live prototype. The previous `onboarding-design-match-2026-10-08` validation compared against that incorrect visual reference; it does not establish a match with Figma. Preserve those files as history only.

Use the prototype's `src/App.tsx` and `src/index.css` for layout, typography, imagery, components and copy. Use the user's explicit corrected journey, complete state map and inventory for behaviour. The corrected documents are retained in `corrected-handoff-2026-10-08/`.

The user's explicit onboarding correction supersedes the prototype's outdated numbering and combined appointment/summary screen:

1. Name — Step 1 of 5.
2. Priorities — Step 2 of 5.
3. Diagnosis — Step 3 of 5; optional number and largest size. The prototype explicitly displays cm beside its size input.
4. Everyday context — Step 4 of 5.
5. Appointment — Step 5 of 5; optional date and an explicit no-date path.
6. Separate summary — “Ready to start”, no numbered progress, reviewing priorities, recorded diagnosis and appointment.

Keep real authentication, verification, reset and encrypted account records. The prototype's fake-login behaviour, pretend verification and statements that it is a browser-only demo must not be copied into the functioning app. Use its visual components for real loading, validation and recovery states.

The current entry/onboarding comparison uses the independently rendered React prototype. The tests document the user's explicit journey corrections and the replacement of inaccurate demo wording. See `docs/validation/figma-prototype-entry-2026-10-08/` for screenshots, measurements and results. The remaining journeys now use the exported Today, Food/MealPlanner, Health, Visit, ReportScan/ReportReview, QuestionSuggestion, SymptomSheet and evidence components. See `docs/validation/figma-prototype-journeys-2026-10-08/README.md` for source comparisons, functional verification, the complete inventory audit and explicit limits. Inventory-only states reuse exported components; they are not claimed as independently supplied pixel reference screens.

The latest second-pass verification is [journey-double-check-2026-10-10](../validation/journey-double-check-2026-10-10/README.md). It restores the report-review sheet and editable recipe shopping section, checks dismissal destinations and reported-result units, and extends the inventory-state regression coverage. Use its results and gallery for the current implementation; retain earlier reports as history.
