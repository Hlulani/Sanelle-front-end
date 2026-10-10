# Remaining journeys — actual Figma Make source

8 October 2026. This work ports the supplied React components and CSS to the existing Angular app. Visual comparisons run the supplied React build independently; they do not generate their reference images from Angular or from the incorrect generated atlas.

## References and precedence

- Visuals: [original App.tsx](../../design/figma-make-source-2026-10-08/src/App.tsx) and [original index.css](../../design/figma-make-source-2026-10-08/src/index.css).
- Behaviour: [complete journey map](../../design/corrected-handoff-2026-10-08/SANELLE_COMPLETE_JOURNEY_MAP.md), [111-screen inventory](../../design/corrected-handoff-2026-10-08/SANELLE_COMPLETE_SCREEN_INVENTORY.csv), and the user's explicit corrections.
- [Entry and onboarding verification](../figma-prototype-entry-2026-10-08/README.md) remains a separate report.
- Original photo URLs and local file hashes: [source-assets.json](source-assets.json). Real recipe pictures continue to use the existing meal-photo catalog and fallback.

## Implemented journeys

| Journey | Source component | Behaviour retained and checked |
| --- | --- | --- |
| Today | `Today`, `AppShell` | First-use choice, returning priorities, unfinished report, recent symptoms, saved plan and real activity links. Missing diagnosis details remain unknown. |
| Reports | `ReportScan`, `ReportReview` | Camera/photo/PDF/manual entry, real on-device reading, page reorder/retake/remove, exact wording and units, correction, explicit transcription confirmation, unfinished save/resume. |
| My health | `Health`, `QuestionSuggestion` | Real report library, recorded and missing details, editable report fields, editable suggested question, deliberate save/dismiss and destination at the next doctor's visit. |
| Symptoms | `Health`, `SymptomSheet` | Optional observations, separate bleeding category and daily impact, same-day editing, history, sparse coverage, field-specific denominators, clinical results and appointment use. |
| Food | `Food`, `MealPlanner` | Source introduction, three food paths, pictured flexible recipes, servings, preferences and strict requirements, 3/7/14/30-day calendars, open days, preparation status, swaps and undo, grocery changes, weekly shopping and saved-plan return. |
| Appointment | `Visit` | Confirmed diagnosis only, actual symptom summary, user concern/date, manual and suggested questions, clinician answer, atomic answer/next-step save, unresolved/carry-forward history and editable summary copy. |
| Evidence | `ClaimSheet`, `EvidenceCatalog` | Published explanations, actual populations/outcomes/sources/limits/reviewer/version, internal role gate, search/filter recovery, published/in-review/draft separation and affected features. |
| Account utilities | Exported shell and paper/form components | Existing logout, account isolation, encrypted backup preview/replace/restore and account controls. |

The implementation uses the source typography, colours, spacing, navigation, SVG paths, photography and layout classes. Ionic's cached page transitions were disabled to match the prototype's immediate navigation. Routed sheets retain the actual screen behind them and trap keyboard focus.

## Verification

- Production build, lint and formatting pass. [Machine-readable results](results.json) and `logs/` retain the checks.
- **117 unit tests pass**, including encrypted backup round trips for new symptom selections and daily impact, task/question association, atomic answer/next-step writes, observation denominators, saved-plan changes and account isolation.
- **84 browser tests pass:** 42 tests run on both Chrome and iPhone WebKit. After the final report-count headline correction, all eight report journeys pass again. The saved original wording remains unchanged. Logs: `logs/browser.log` and `logs/report-regression.log`.
- Eight remaining-journey viewports are compared against independently rendered source viewports on both browsers: first-use Today, empty returning Today, empty diagnosis, empty appointment, report source picker, empty symptom history, selected symptom/impact sheet and suggested-question sheet. These comparisons allow zero differing pixels at the configured colour threshold, with geometry checked within 0.1 CSS pixels. They incorporate only the explicit adapters documented below.
- Food introduction, path controls, planner heading and duration-control geometry are checked against the source. This is not a full pixel comparison of food content: the app has real eligible recipes rather than the prototype's three mock meals.
- Functional journeys additionally cover real registration/verification/reset, manual/PDF/photo reading, unchecked-report exclusion and resumption, persisted question/answer/history, four plan durations, shopping, swap/undo, strict requirements, empty recovery, published gates, account separation, backup restoration, and overflow at 320/768 CSS pixels. Test accounts are created and removed by the suite.
- Browser copying tests inspect the exact summary payload using a clipboard stub; they do not test a system clipboard permission prompt. Photo tests supply image files; they do not test physical camera hardware.

[Open the screenshot gallery](gallery.html). [Inspect the 111-row state audit](journey-state-audit.csv). The audit distinguishes assertions of individual states from checks of their journey family. It does **not** claim 111 separately tested, pixel-identical artboards.

## Explicit source adaptations and limits

1. **Unknown means unknown.** A blank user has five missing fields, not the prototype's prefilled count/size and three missing fields. Viewport references change only the corresponding missing-count text and appointment missing-field text.
2. **Real records replace illustrative data.** Actual names, dates, reports, units, recipes, results, source metadata and activity replace mock values. No clinical findings, withdrawn evidence entries or treatment recommendations were added to populate a design.
3. **Corrected behaviour takes precedence.** The initial planner is three days and saving returns to Today, as the journey map specifies. The actual source defaults to seven days. The user's separate appointment-date and main-concern controls remain in a collapsed paper section; that section is explicitly added to the empty appointment comparison.
4. **Truthful privacy and confirmation.** Report capture states explain on-device reading and the fact that original files are not retained. Confirmation checks transcription, not a medical interpretation. The report picker comparison substitutes that privacy text for the demo wording.
5. **No made-up screens for inventory-only states.** Requirements, recipe search, swap scope/grocery differences, account/backup, dedicated clinical-result forms and expanded capture controls have no dedicated equivalent in the supplied `App.tsx`. They use its existing paper sections, form fields, chips and buttons while retaining the inventory's controls. They have functional tests, not invented visual reference screenshots.
6. **Evidence uses the real catalog.** Patient explanations remain gated by publication state. The catalog has no withdrawn record; its withdrawn filter has a tested empty state, and the renderer retains withdrawal audit handling. Prototype publication counts, demo citations and any claim of completed independent clinical review are not copied. Research corpus totals in the snapshot come from the retained research README.
7. **Patient navigation respects real roles.** The prototype's developer-only Compare/Catalog links are removed from patient viewport references. Internal catalog access remains restricted by the existing role guard; browser tests explicitly stub that role only in throwaway test accounts.
8. **Quality warnings are heuristics.** Existing glare, blur and crop warnings are retained. This run does not include a dedicated visual fixture for each warning or an automated screenshot for every clinical-result/editor state. See the state audit for exact coverage.

Presentation captures are actual browser screenshots. Test fixture reports and throwaway account information are used; source comparison images are labelled separately. Previous atlas-based screenshots remain historical and are not included in this gallery.

## Repeat verification

```sh
npm run e2e
npm run test:ci
npm run lint
npm run format:check
SANELLE_API_ORIGIN=http://localhost:8080 npm run build
```

The backend and frontend development servers are reused when already running. Nothing was committed or deployed.
