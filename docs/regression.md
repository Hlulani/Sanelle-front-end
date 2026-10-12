# Regression

Run a regression check after every change, before committing or pushing. Pick the tier by what changed.

| What changed | Run | Takes |
|---|---|---|
| Logic, data, routes, storage, sign-in, the API, AI, food rules, or anything shared across screens | `npm run regression` | ~10 min |
| **Small UI change only**: styles or wording on one screen, no logic | `npm run regression:ui -- e2e/<spec for that screen>.ts` | ~2 min |
| After every deploy (Netlify or Render) | `npm run regression:live` | ~1 min |
| Unsure | `npm run regression` | |

`regression` stops at the first failure. A change isn't done while any step fails: fix it, or, if the change is intended (for example a deliberate design change), update the test and say why in the commit.

**What each tier runs**

- **Full**: lint, formatting, unit tests, every end-to-end journey on an Android-size Chrome and an iPhone-size Safari (real app, real API, a throwaway account per test), the back-end tests (Testcontainers Postgres; needs Docker) and the Sanelle AI workflow tests. Set `SANELLE_BACKEND_DIR` if the back end isn't at `../sanelle-back-end`.
- **UI**: lint, formatting, unit tests, every Figma design comparison, the small-phone and wide-screen layout check, and the specs you pass for the screen you changed.
- **Live**: the judges' path on https://sanelle.netlify.app, on a laptop and on iPhone Safari: the API and Sanelle AI are up, Open as Thandi works, a check-in shows on Today, her note matches published research, the AI buttons are offered, and report reading and Food open. It writes only to a throwaway browser. `SANELLE_LIVE_AI=1` also makes one real AI request (uses API credit).

CI runs lint, formatting, unit tests, the end-to-end journeys and the back-end tests on every push, but run the tier locally first: CI only reports after the push has reached the live site.

## Journeys and the tests that cover them

Spec files are in `e2e/`. Back-end tests are in `sanelle-back-end/src/test`.

| # | Journey | Covered by |
|---|---|---|
| 1 | **Reviewers' page**: guide, Open as Thandi, Show me (laptop frame and phone) | `phone-page`, `live-smoke` |
| 2 | **Create an account**: register, terms, verify email, sign in | `auth` (AUTH-01–03); back end `AuthControllerTest`, `AccountJourneyTest` |
| 3 | **Return to an account**: wrong password, unverified email, reset password, duplicate-login guard | `auth` (AUTH-04, AUTH-05), `inventory` (AUTH-04L), `resilience` |
| 4 | **Onboarding**: name, priorities, known details, food and symptom context, appointment date, review and edit, skip everything, temporary Thandi preview | `onboarding`, `auth` |
| 5 | **Today, first visit**: one next step from her priorities, "Also on your list", ends once she records something | `onboarding`, `figma-journeys` (TOD-01) |
| 6 | **Today, returning**: next step, recent activity, saved appointment priority, planned meal | `inventory` (TOD-02A), `cook-planned-meal`, `figma-journeys` (TOD-02E) |
| 7 | **Read a report**: photos or PDF, page order, retake, quality warnings, on-device text recognition, compare wording, check and save | `diagnosis`, `inventory` (RPT-02), `figma-journeys` (RPT-01) |
| 8 | **Enter or resume report details**: manual entry, unfinished details, sample report | `diagnosis` (RPT-03), `onboarding` |
| 9 | **Saved reports**: history, unknown vs absent fields, correct details, choose the current report | `diagnosis`, `figma-journeys` (review sheet) |
| 10 | **A report gap becomes a question** | `diagnosis`, `inventory` (HLT-02F/02C), `figma-journeys` (HLT-03) |
| 11 | **Symptom check-in and history**: symptoms, bleeding, effect on her day, note, missing days, edits | `summary` (SYM-01–04), `inventory` (SYM-03R), `figma-journeys` (SYM-01I, SYM-02E) |
| 12 | **Suggestions from her check-ins**: questions with counts, her words matched to research, add a question | `insights` |
| 13 | **Sanelle AI**: consent, AI questions and matches, AI visit draft, unsupported content dropped, hidden without a key | `ai-drafts`; back end `InsightsServiceTest`, `AiInsightsApiTest`, `RenderWorkflowLanguageModelTest`; `workflow/` tests; `live-smoke` |
| 14 | **Clinical results**: exact value, unit, date; inline edit | `summary` |
| 15 | **Learn and evidence**: published summaries by topic, sources and limits, unpublished blocked, back to where she came from | `learn`, `insights` |
| 16 | **Internal evidence catalogue** (editors only) | `learn` (EVC-01–02) |
| 17 | **Find and cook a recipe**: search, servings, favourites, instructions, cooking checks, "I made this" | `nourish` (FOOD-01), `recipe-instructions`, `recipe-content-audit`, `cook-planned-meal`; back end `RecipeContentApiTest` |
| 18 | **Plan meals**: requirements, strict allergies, 3 days to a month, save, reopen | `nourish` (FOOD-03, FOOD-01AA), `saved-food-plan`; back end `MealPlanServiceImplTest`, allergen and diet tests |
| 19 | **Swap or leave a meal open** | `nourish` (FOOD-03A–03C, 03V/03N) |
| 20 | **Groceries**: shopping list, weeks, tick, add, persist | `nourish` (FOOD-03G), `cook-planned-meal` |
| 21 | **Appointment**: date, concern, questions, report details, results, symptom summary, copy | `summary` (APT-01–03D), `figma-journeys` (APT-01E) |
| 22 | **After the visit**: answer, agreed next step, unresolved and carried forward | `summary` |
| 23 | **Back up and restore** health records | `resilience` |
| 24 | **Account**: name, priorities, separate records per account, sign out, delete | `onboarding`, `resilience` |
| 25 | **Resilience and layout**: failed loads retry, small and wide screens, startup recovery | `resilience`, `preview-startup`, `saved-food-plan` |

Not covered automatically: the native camera and reminders on a real device, and the Render Workflow running on Render (its code is unit-tested; `/api/v1/ai/status` reports which pipeline the last draft used).
