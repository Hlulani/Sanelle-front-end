# Sanelle journey verification — 10 October 2026

This second pass checks the working Angular app against the supplied Figma Make React source and the corrected 111-state inventory. The generated atlas is not the visual reference. Earlier work and its validation reports are preserved.

## Corrections made in this pass

- **Check saved details** now opens the exported report-review sheet. Its five rows use the actual saved values, wording and units. Saving requires explicit transcription confirmation; closing does not create a report. The empty sheet is compared with the independently running React source, and a populated report is checked through save, reload and appointment use.
- The flexible recipe now includes the exported **Shopping for this meal** section, with checkboxes, removal and adding an item. Changes persist in encrypted account-specific food records. **Save this meal and shopping list** carries those edits into the new plan's first grocery week. The weekly planner keeps its separate shopping section.
- Evidence and suggested-question sheets preserve their originating health, report or food screen. Dismissal returns to the corresponding app destination, including the selected report, rather than relying on unrelated browser history. Embedded report details load their actual records.
- Inline clinical-result editing preserves the reported unit, name and source. A saved `102 g/L` result can be edited to `103 g/L` without relabelling it as `g/dL`; the appointment summary preserves the same value and unit.
- The food evidence sheet includes the source's **A practical take** paragraph, held in the published catalog entry with a version and history record. The catalog continues to state that independent clinical review is pending.

## Verification and artifacts

[Open the screenshot gallery](gallery.html). [Inspect the complete state audit](journey-state-audit.csv). [Read the machine-readable results](results.json).

- **108 browser checks pass:** 54 cases on both Chrome and iPhone WebKit, using the real backend and throwaway accounts. Runtime Angular errors fail the suite. These cover auth/recovery, corrected onboarding, Today priorities, reports and on-device reading, diagnosis questions, symptom observations/statistics, clinical results, recipes, all four planner durations, swaps, grocery editing, appointment outcomes/history/copying, evidence gates, account isolation and encrypted health backup restoration. See [browser log](logs/browser.log).
- **117 unit tests pass**, covering records, encryption, backup decoding, question/task association, optional observations, statistic denominators, meal ranking, strict requirements, dates, grocery aggregation and batch leftovers across week boundaries. See [unit log](logs/unit.log).
- **46 independent source viewport comparisons pass:** 14 entry/onboarding states and nine remaining-journey states on each browser. Geometry is checked within 0.1 CSS pixels, with zero pixel differences at the configured colour threshold except the documented 25-pixel iPhone login-arrow raster tolerance. Food introduction and planner-duration controls have additional geometry checks; real recipe contents do not have a complete source viewport comparison. See [comparison manifest](source-comparisons.json).
- All **111 inventory states** have been reviewed. The audit identifies **110 states with explicit browser assertions**, which are grouped into journey tests rather than 110 standalone screenshot tests. The withdrawn-entry state is handled separately: the real catalog contains no withdrawn entry, so the suite checks the withdrawn filter's empty state and does not fabricate a research record. An assertion of a state does not establish a pixel comparison for that state.
- Production build, lint, formatting and whitespace checks pass. Build output retains the existing Ionic empty-glob and Tesseract CommonJS optimization warnings. See `logs/build.log`, `logs/lint.log` and `logs/format.log`.
- The gallery includes **66 actual app captures**, plus the labelled independent source comparisons and the corrected separate setup summary. [Screenshot manifest](screenshots.json) records hashes. Presentation copies are saved under `sanelle/presentation/journey-double-check-2026-10-10/`.

This pass specifically adds assertions for loading controls, appointment priority, empty activity, glare/blur/crop warnings and recovery, unknown FIGO/cavity questions, research disclosures, ingredient review, empty swap recovery, week-specific shopping persistence and published affected-feature metadata. Previous testing of these individual states was incomplete.

## Reference precedence and limits

Visuals come from the original `App.tsx`, `index.css`, fonts, SVG paths and assets in [retained Figma source](../../design/figma-make-source-2026-10-08/). Behaviour comes from the [corrected journey map](../../design/corrected-handoff-2026-10-08/SANELLE_COMPLETE_JOURNEY_MAP.md), [screen inventory](../../design/corrected-handoff-2026-10-08/SANELLE_COMPLETE_SCREEN_INVENTORY.csv) and the user's explicit instructions.

The source comparisons retain the documented adapters: missing findings remain unknown; real auth and truthful on-device report privacy replace demo wording; the user-corrected five-step setup, separate summary, default three-day planner and save-to-Today behaviour take precedence; the user-requested appointment concern/date section remains; internal developer links are removed from patient references. Actual reports, recipes, dates, sources and publication states replace illustrative prototype data. [Original photo provenance](source-assets.json) is retained.

The supplied React prototype does not contain a dedicated visual for every inventory-only state. Requirements, search, swap scope/grocery changes, expanded capture controls, account/backup and dedicated result forms reuse its existing components. Their functional checks do not prove a separate original artboard match. This report does **not** claim all 111 states are independently pixel-identical.

Photo warnings are on-device heuristics checked with a synthetic image that triggers all three warnings; their accuracy has not been clinically or photographically validated. File-input tests do not test physical camera hardware. Copying checks inspect the summary payload using a clipboard stub, not a system permission prompt. iPhone checks run WebKit emulation, not a physical device. Medical content retains the catalog's review status; this engineering pass is not independent clinical validation.

## Repeat the checks

```sh
npm run e2e
npm run test:ci
npm run lint
npm run format:check
SANELLE_API_ORIGIN=http://localhost:8080 npm run build
git diff --check
```

Nothing was committed or deployed.
