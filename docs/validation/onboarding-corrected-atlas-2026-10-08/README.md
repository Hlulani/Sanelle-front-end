> Historical review. Superseded by [the full-screen onboarding design comparison](../onboarding-design-match-2026-10-08/index.html).

# Corrected onboarding review — 8 October 2026

Open [the comparison gallery](index.html). Every one of the 12 onboarding states has its corrected supplied artboard, an independently rendered reference viewport and a screenshot of the working app. [Coverage CSV](coverage.csv) maps the files to the complete screen inventory.

## Current reference

This pass uses the user's corrected `handoff.zip`, not the earlier onboarding exports. The source documents are retained in `docs/design/corrected-handoff-2026-10-08/`; [source hashes](source-hashes.csv) identify the supplied ZIP, atlas, journey map, inventory and supporting documents. The corrected exhaustive PDF was checked at 112 pages: an index and 111 artboards. The original corrected onboarding PNGs are retained unmodified in `reference/`.

Controls and behaviour follow the complete journey map and inventory, as explicitly requested by the user. The corrected atlas supplies the visual structure and screen copy. The old repeated priority controls were an atlas-generation error; there is no remaining ambiguity about the correct onboarding controls.

## Implemented flow

1. **Name:** first-name input; optional Thandi demo preview; clear demo restores the original form values.
2. **Priorities:** diagnosis, food, symptoms and appointment preparation; multiple selections; none required.
3. **Diagnosis:** independent optional count and largest recorded size; an explicit mm/cm unit; blanks remain not recorded. The supplied “Details to look for later” panel does not infer those findings.
4. **Everyday context:** the supplied four symptom choices and two food-planning cards. Quick meals and Ingredient swaps are saved as practical food preferences and appear in meal requirements after reload. They are not strict exclusions or medical recommendations.
5. **Appointment:** optional date; Finish setup keeps a date; “I don't have a date” explicitly removes a previously entered date and continues to the summary. Clear the date also remains available for editing within the step.

The separate **Ready to start** summary has no numbered progress label. It reviews the chosen priorities, recorded diagnosis and appointment state before Open Sanelle enters first-use Today. It shows missing diagnosis values explicitly rather than manufacturing a number or size. Back keeps the previous inputs available to edit.

The corrected Thandi demo uses the supplied 2 fibroids and 4.1 cm size, Diagnosis/Food priorities and context choices. It does not invent an appointment date. Previewing the demo writes nothing until the user continues; clearing it restores the pre-preview values.

## Visual verification and functional differences

The inner viewport of the supplied phone frame is 370×824 CSS pixels. The app uses the reference's 68px header, 20px body padding, 175px photo crop, compact text, ruled choices, square buttons, 85px food cards and 61px footer. All name states now use the supplied reading photo; later steps use the notebook photo. The image files match the corrected handoff byte for byte; see [asset-hashes.csv](asset-hashes.csv).

The PDF embeds DejaVu Sans regular/bold, confirmed with `pdffonts`. The bundled onboarding font matches those rendered artboards. Font licence text is retained in `src/assets/fonts/atlas/LICENSE`. The remote fonts named in the HTML are disabled during independent reference rendering, and the embedded PDF font is applied instead. Only the export's phone bezel, notch and outer annotations are removed.

Each of the 12 states compares the reference and app header, photo, eyebrow, heading, lead copy and footer bounds in Chromium and iPhone WebKit. The primary button is also compared on steps 1–5. The priority test additionally compares the choice row. Differences must be less than 2 CSS pixels; the measurements are saved in `measurements/`. These comparisons are against the supplied atlas, not screenshots generated from a previous version of the app.

The implementation has real inputs in place of the atlas's static value boxes, including a separate size unit selector and a native date picker. Food cards display their selected state. Back, clear-demo/date and logout controls implement the journey's alternate paths. The summary also displays the recorded largest size; the static summary artboard only shows the sample count, so its primary-action geometry is not asserted against that abbreviated example. Dynamic names, dates and selections can differ from the static examples. These differences are visible in the gallery; this is not a pixel-equality claim across all content.

The browser flows cover empty and selected states, skipping optional fields, demo preview/clear/continue, units, saved food preferences after reload, an entered date, removing that date through the explicit no-date path, summary review, Back and completion. Temporary real backend accounts are created and cleaned up. The shared fixture checks uncaught browser and Angular runtime errors.

Physical-device keyboard and safe-area behavior are not covered by these browser checks. Screenshots use synthetic test/demo data.

## Final results

- Complete browser regression suite: **62/62 passed** across Chromium and iPhone WebKit.
- Frontend unit suite: **107/107 passed**.
- Angular lint, formatting of changed implementation/test files and `git diff --check`: passed.
- Optimized build with the local API origin: passed.
- All 24 per-state measurement files passed their bounds checks; the compared boxes had a maximum difference of **0 CSS pixels** in this run. This describes the specified geometry comparisons, not raster equality of every control or dynamic value.
- Gallery links and image counts checked: 12 supplied artboards, 12 rendered reference viewports, 12 app-state captures and 2 extra controls captures.

An earlier broader regression run again encountered an intermittent iPhone grocery-submit interaction using mouse input. That phone test now submits the real form with `tap()`, matching the configured touch viewport. Ten consecutive targeted runs and the final complete regression suite passed. The earlier failure and final logs are retained in `logs/`; no claim is made about physical-device Safari from this browser-only check.
