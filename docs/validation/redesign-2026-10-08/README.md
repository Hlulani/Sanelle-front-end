# Sanelle redesign verification — 8 October 2026

This rework continues the existing Claude implementation. The reference is the supplied `Sanelle/handoff` package: its nine journeys, 37 screen IDs, design tokens, navigation, semantic states and supplied assets. The handoff contains a visual design specification and journey diagrams; the screenshots in `Sanelle/review` represent the older app and were not used as the new visual target.

Open [the screenshot gallery](gallery.html) to inspect each implemented screen. [Screen coverage](screen-coverage.csv) connects every handoff ID to its route, automated scenario and screenshot. Screenshots use synthetic test accounts and records, never the owner's health data. They show the browser viewport, with selected scrolling for features further down a page; they are not a capture of every possible state.

## What changed

- Completed the partially implemented Food journey: requirements, recipe search, serving adjustment, favourites, multi-day plans, open days, prepared state, weekly shopping and the three-stage swap flow.
- Completed the separate internal evidence catalog, including search, filters, metadata, sources, uncertainty, version, usage and history. Access checks the server's current account roles; unpublished explanations are excluded from patient views.
- Connected report details and explicitly saved questions to appointment preparation. Checked transcription, missing information and unreviewed extraction remain distinct. Clarified the fibroid count and size labels.
- Connected optional check-ins and exact clinical results to personal history, a 30-day summary and appointment preparation. Counts use answered-field denominators and preserve missing days as unknown.
- Completed account/settings interactions, checked encrypted health backup restoration, prevented meal drafts from surviving a change of account, and retained earlier question events after answering or carrying a question forward.
- Corrected runtime and visual defects found during verification: email-confirmation screen initialization, onboarding navigation, plan reload state, camera file limits, shopping counts, primary-link contrast and calendar dates.

The UI follows the supplied white-first surfaces, berry actions, Fredoka headings, Nunito Sans body type, compact control radii, semantic state colours and four patient destinations: Today, Food, My health and Appointment. The internal catalog is outside patient navigation.

## Journey verification

| Handoff journey | Exercised behavior | Automated scenarios |
|---|---|---|
| 1. Account registration and return | Registration validation, terms, actual email verification, wrong credentials, unverified email recovery, private reset response, password change and token reuse rejection | `e2e/auth.spec.ts`, `e2e/resilience.spec.ts` |
| 2. Minimal onboarding | All five steps, optional entries, persisted completion and return login | `e2e/auth.spec.ts`; auth unit tests |
| 3. Today | First intent, returning state, unfinished-report resumption, saved check-in and recorded activity | `e2e/auth.spec.ts`, `e2e/diagnosis.spec.ts`, `e2e/summary.spec.ts` |
| 4. Report capture and checking | Manual entry; real PDF text extraction; real image OCR; capture-page add, reorder, retake and remove; source wording, units and page warning; checked versus finish-later behavior | `e2e/diagnosis.spec.ts`; report-reader/input unit tests |
| 5. Missing detail to doctor question | Editable missing-location suggestion, explicit save, dismissal without creation, persistence, answer/unresolved/carry-forward history | `e2e/diagnosis.spec.ts`, `e2e/summary.spec.ts` |
| 6. Check-ins and personal statistics | Optional answers, explicit zero/none versus unknown, edits without duplicated days, 30-day coverage, per-field denominators, exact clinical result in appointment summary | `e2e/summary.spec.ts`; summary/statistics unit tests |
| 7. Practical food planning | Requirements and allergy exclusion, recipe image, servings, favourite; 3/7/14/30-day plans; actual calendar dates; reload; weekly lists including week five; add/already-have; prepared state; ranked replacement, plan-wide swap review and open day | `e2e/nourish.spec.ts`; meal-plan unit tests |
| 8. Appointment and follow-up | Editable concern, saved questions, own-word answer, next step and date, unresolved state, carry-forward and expandable earlier history | `e2e/summary.spec.ts`; summary/backup unit tests |
| 9. Evidence governance | Real patient role denial; editor UI search, empty recovery and filters; complete entry metadata/history; unpublished patient-output block | `e2e/learn.spec.ts`; evidence-service and server-role guard unit tests |

Additional resilience scenarios verify account separation, encrypted backup preview/confirmation/restoration, a recoverable meal API failure, and the four tabs at 320px and 768px without horizontal overflow. Food logic tests cover ranking, strict eligibility, ingredient conflicts, open weekdays, batch quantities across grocery-week boundaries, all swap scopes and retained shopping edits.

## Verification results

Final command results are recorded in [results.json](results.json). The checks comprise frontend unit tests, two-browser journey tests, backend tests, lint, an optimized local build, photo coverage, research-library consistency and screen-ID coverage. The backend results come from 16 Maven Surefire reports in the existing backend checkout; this rework did not change backend source code.

| Check | Final result |
|---|---|
| Frontend unit tests | 107 passed, 0 failed |
| Browser journeys | 52 passed: 26 Android Chrome and 26 iPhone WebKit scenarios |
| Browser runtime checks | No uncaught browser errors or Angular runtime-code errors during those scenarios |
| Backend tests | 150 passed, 0 failures/errors/skips across 16 suites |
| Lint and optimized local build | Passed |
| Handoff screen coverage | 37 of 37 screenshots, plus four supplemental states |
| Handoff asset trace | All 13 assets present; supplied photo copies resized for display |
| Recipe photo coverage | 166 recipes covered by 93 valid local photos |
| Research consistency | 44 claims and 25 field-purpose mappings checked; no independent scientific validation |

Visual inspection after navigation settled also checked primary-action contrast, report labels, the calendar's actual dates, statistics denominators and representative account, onboarding, appointment, evidence and food states. Screenshots are captured after outgoing Ionic pages finish their transition to avoid images containing two overlapping screens.

Run from the frontend:

```sh
npm run test:ci
npm run lint
SANELLE_API_ORIGIN=http://localhost:8080 npm run build
npm run e2e
npm run check:meal-photos
python3 docs/research/scripts/verify-research-library.py
git diff --check
```

Run `./mvnw -q test` from `Sanelle/sanelle-back-end` for backend tests. Browser tests use the local backend and PostgreSQL, register isolated test accounts and delete them afterwards. The configured Playwright projects are Android Chrome and iPhone WebKit at 390 × 844 CSS pixels. The tests reuse the local development servers if they are already running.

The optimized build targets `localhost:8080` and is a development verification artifact, not a release configuration. Existing Tesseract/CommonJS and Stencil dynamic-import build warnings remain; the build must still succeed. No deployment or commit was performed.

## Research provenance and remaining limits

- The existing research library was used, not re-researched in this implementation pass. Its ledger contains 78 publications with mixed reading depths; it is not all fibroid literature. The verifier checks internal links, IDs and mappings, not independent scientific correctness. Retained source files are absent from this checkout, so their recorded hashes were not reverified here.
- Four field-purpose map rows, F17/F18/F19/F24, were updated to refer to the redesigned food profile, meal-plan store and clinical-result page. Reading-depth records and research findings were not rewritten. The research verifier retains its historical 6 October cutoff; these implementation references are dated 8 October.
- Patient-visible evidence summaries are configured as published prototype content. Independent clinical review is pending. A displayed publication status or research-summary date is not a clinician's approval. The internal catalog is a versioned, read-only review view; accountable publication changes remain a controlled source change rather than an implemented editorial backend.
- The editor-catalog browser scenario uses a role fixture for `/auth/me`. Normal-patient denial uses the real backend. Backend permission tests and frontend guard tests cover the server role check; the browser run does not establish real editor account provisioning.
- Verification/reset emails are consumed from the backend's development outbox. Actual external email delivery was not tested.
- Camera behavior and OCR were exercised using browser file input and synthetic report images. Physical iPhone/Android camera hardware, native secure storage, native notifications and native sharing require device validation.
- Health, profile and meal-plan records remain encrypted account-scoped data on this device. Health backup restoration is covered; cloud synchronization and a consented research enrollment/data pipeline are not implemented by this redesign. Personal statistics do not constitute a research dataset or establish causation.
- This verification covers the specified journeys and selected failure states. It does not establish clinical effectiveness, formal accessibility certification, exhaustive device coverage or every possible input combination.

Photo coverage confirms all 166 current recipes have a valid mapping to the 93-photo library. Some recipes share a matching photo; coverage does not mean 166 unique photos. See [meal photo credits](../../design/image-credits.md) and [handoff asset credits](../../design/handoff-assets-2026-10-08.csv).
