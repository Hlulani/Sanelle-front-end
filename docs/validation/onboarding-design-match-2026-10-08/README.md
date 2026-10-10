> **Superseded: this review used the wrong visual reference.** See [SUPERSEDED.md](SUPERSEDED.md) and [the actual prototype comparison](../figma-prototype-entry-2026-10-08/index.html).

# Onboarding design comparison — 8 October 2026

Open [the comparison gallery](index.html). It contains all 12 onboarding states, original supplied artboards, independently rendered handoff viewports and working-app captures on Chromium and iPhone WebKit.

## Source of truth

The user's corrected `handoff.zip` and its complete journey map/inventory are authoritative. Current source documents are in `docs/design/corrected-handoff-2026-10-08/`. Original artboards are copied unmodified into `reference/`; [source hashes](source-hashes.csv) identify the input documents and photographs. Earlier onboarding reviews are historical and superseded by this pass.

## Corrections

- Removed the extra Back, Log out, Clear date and separately labelled Clear demo buttons. Browser/device Back retains backwards navigation; the existing Preview Thandi demo button toggles the preview and restores the original unsaved values when deselected.
- Restored a single full-width largest-size input. Values and units are retained exactly as written; a bare number never acquires an assumed mm/cm unit. Existing records with separately stored units still load correctly.
- Restored the neutral food-card presentation from both everyday-context artboards; selections retain accessible pressed state and persist to food planning.
- Matched the appointment value box, including “No date added” and “24 October 2026”, with a real native date input and picker underneath. The no-date action clears any previous date.
- Matched the three summary rows and action placement. Numbered progress ends at step 5; the summary reads Ready to start. Recorded count is shown on the diagnosis row, as supplied. A size-only record displays its recorded value there; unknown details remain Not recorded.
- Matched the supplied PDF/PNG font, field text colours, native input alignment, images, spacing and square controls. Font rendering changes are scoped to onboarding.
- Fixed asynchronous loading under OnPush change detection so previously saved diagnosis fields display when reopening onboarding. No additional visible screen elements were introduced.

## Verification

`e2e/onboarding.spec.ts` renders each expected screen from the corrected atlas HTML, independently from app templates. It removes only export framing and uses the DejaVu Sans fonts embedded in the supplied PDF/PNGs. It uses the atlas's sample data and freezes the browser date at 8 October 2026 for the supplied 24 October appointment example.

Every state checks the exact action inventory, text and absence of an extra unit selector, plus header/photo/eyebrow/title/lead/footer/primary-action bounds within 0.1 CSS pixels. All 12 states receive a full-screen raster comparison against the supplied design, rather than an app-generated baseline.

Chromium compares CSS-pixel captures (370 × 824) with zero differing pixels at a 0.01 colour threshold. This avoids device-pixel rounding from the Pixel 7 profile's fractional DPR. WebKit compares native 3× captures with zero differing pixels at the standard 0.2 photo threshold, then separately compares every UI pixel outside the photo at the stricter 0.01 threshold. JPEG resampling differs between WebKit's static atlas and Ionic's scrolling layer; the photo's asset URL, intrinsic dimensions, crop position, fit and rectangle are independently checked. Complete, unmasked captures are retained in the gallery. These are browser design comparisons, not claims of byte identity across arbitrary devices.

Functional coverage includes the name requirement, all empty/selected states, optional skips, preview/clear/continue demo paths, independent optional diagnosis fields after reload, clearing a previously entered value, absence of inferred units, all priorities on a narrow phone, saved food preferences, dated/no-date paths, browser Back from the summary, and completed setup after reload. Browser tests use temporary real backend accounts and delete them afterwards; uncaught browser/Angular runtime errors fail the tests.

## Results

- [Complete browser regression suite](logs/browser-final.log): **62/62 passed** across Chromium and iPhone WebKit, with no retries.
- [Frontend unit suite](logs/unit.log): **107/107 passed**.
- [Angular lint](logs/lint.log), [format checks](logs/format.log) and `git diff --check`: passed.
- [Optimized local-backend build](logs/build.log): passed. Existing OCR dependency CommonJS optimization warnings remain.
- All 24 state measurement files: **0 CSS pixels maximum geometry difference** for the compared boxes.
- All 12 states passed full-screen comparisons on both browsers under the documented thresholds, and iPhone's separate strict interface comparisons passed.
- Both photographs are byte-identical to their assets inside the supplied ZIP.
- Gallery links checked: no missing files; 12 supplied artboards and 24 working-app state screenshots.

The first full regression run recorded an intermittent WebKit request cancellation in a food test that immediately reloaded another URL after submitting preferences. Three repeated targeted checks passed. The food tests now await the completed setup navigation and follow the actual Food → Find a meal links, avoiding the interrupted request. A subsequent run caught an overly exact test locator for that link's accessible name, which also contains its description; that locator was corrected. No food production UI was changed in this pass. Earlier failure logs are retained alongside the final 62/62 passing run.

Physical-device keyboards and safe-area behaviour were not exercised by these mobile browser checks. This review covers onboarding; other app journeys still need their own design-reproduction passes.
