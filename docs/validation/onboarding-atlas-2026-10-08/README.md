# Onboarding atlas review — 8 October 2026

Open [the side-by-side gallery](index.html). It contains all 12 supplied onboarding artboards, actual app screenshots, and additional captures of the context and summary controls after scrolling. [Coverage CSV](coverage.csv) maps each stable screen ID to its reference and implementation capture.

## Reference and scope

This pass corrects onboarding against `handoff/SANELLE_COMPLETE_SCREEN_ATLAS.html`, its PDF and PNG exports, and the complete journey map. The package README explicitly supersedes the earlier 37-screen atlas with the complete 111-screen atlas. This is an onboarding correction; it does not claim that the other 99 artboards have been reproduced.

The app now uses the supplied header, avatar, photo selection/crop, white background, colours, compact typography, 20px gutters, square buttons, ruled choice rows and bottom bar. The export's phone bezel, notch and explanatory panels are excluded from the app viewport. The intended viewport inside its 390×844 phone frame is 370×824 CSS pixels.

The PDF embeds DejaVu Sans regular/bold, confirmed with `pdffonts`. Its HTML names Fredoka/Nunito Sans instead. Onboarding uses bundled DejaVu Sans to match the actual rendered artboards. The fonts come from [the official DejaVu 2.37 release](https://github.com/dejavu-fonts/dejavu-fonts/releases/tag/version_2_37); the [licence](https://dejavu-fonts.github.io/License.html) is included at `src/assets/fonts/atlas/LICENSE`. Other features retain their existing typography.

## Conflicts in the supplied reference

The atlas's onboarding generator draws the same four priority choices on every onboarding screen. That includes name, diagnosis, context, appointment and setup-summary screens. It also draws two selected priorities in empty states and produces `Step E of 5`, `Step D of 5` and `Step 6 of 5` labels from screen IDs. These conflict with the journey map and screen purposes.

The implementation follows the journey's real inputs within the supplied visual system:

- Name entry, demo preview, and clearing the demo back to the user's original values.
- Optional multiple priorities, genuinely empty when none are selected.
- Independent optional count and largest-size fields, with explicit mm/cm units.
- Optional symptom interests and practical food needs.
- Optional appointment date with a clear-date action.
- A setup summary before entering Today, with a Back action to revise the previous step.

Back, logout, demo/clear, finish and open-app controls are functional journey controls absent from the repeated placeholder drawing. The current step number is valid, and the summary says “Setup complete”. The comparison gallery deliberately shows these differences; this is not a claim that every pixel or control on all 12 screens is identical to the placeholder artboards.

## Verification

Final checks passed on 8 October 2026:

- Complete browser suite: **62/62** across Chromium and iPhone WebKit, including all onboarding state and layout checks.
- Frontend unit suite: **107/107**.
- Angular lint and `git diff --check`: passed.
- Optimized build: passed with `SANELLE_API_ORIGIN=http://localhost:8080`; this build is for local verification.
- Gallery: all image links checked; 12 original artboards, 12 app-state screenshots and 2 additional scrolling captures.
- Onboarding photography: exact handoff files restored and verified byte for byte; see [asset-hashes.csv](asset-hashes.csv).

Logs are saved in `logs/`. An earlier browser run had one intermittent iPhone grocery-add failure. Its five consecutive targeted reruns and the final complete 62-test run passed. The unsuccessful run is retained alongside those results; this observation is not represented as a diagnosed or fixed application defect.

The onboarding browser flows cover all 12 IDs in Chromium and iPhone WebKit. They exercise empty/selected states, disabled blank-name continuation, skipped optional inputs, demo preview and clearing, completing the demo, independent diagnosis fields and units, context choices, date entry/removal, setup review, Back, saved values and reload after completion. Real temporary backend accounts are created and cleaned up; runtime Angular errors are checked by the shared fixture.

The priority layout is compared against an independently rendered copy of the supplied atlas, rather than a baseline generated from the app. The embedded PDF font is supplied, and only export framing is removed. Bounds of the header, photo, eyebrow, heading, first choice, primary button and footer must differ by less than 2 CSS pixels in each browser. The app also checks the shared shell at 370px and 320px widths without horizontal overflow. This geometry check does not establish pixel equality across every screen.

| Element | Reference measurement |
| --- | --- |
| Header | 68px high; 26px / 17px / 10px padding |
| Body | 20px padding |
| Photo | 175px high; `object-fit: cover`; 13px vertical margins |
| Heading | 1.65rem; line-height 1; 7px top / 9px bottom margins |
| Choices | 11px / 2px padding; 16px circle; 1px bottom rule |
| Primary action | 12px padding; 13px top margin; square corners |
| Footer | 61px high |

Browser screenshots show synthetic test/demo data. Physical-device keyboard, notch insets and native camera behavior are outside this onboarding browser review.

The original references are retained unmodified in `reference/`; hashes of the handoff source documents are in [source-hashes.csv](source-hashes.csv). Photography credits remain in `docs/design/handoff-assets-2026-10-08.csv` and the supplied handoff asset manifest.
