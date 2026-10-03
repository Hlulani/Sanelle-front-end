# Sanelle build log

This log separates what Sanelle could already do before the hackathon from what was built during it, so the submission describes the implementation accurately. It covers both repositories: `Sanelle-front-end` and `sanelle-back-end`.

## 1. Pre-existing functionality

Built before the event in the earlier meal-planner project, then moved into these repositories on 3 October 2026. The import commits (backend `483fb4b` to `79ebcf2`, frontend `cd05c89` to `70e68d6`) contain this code.

- Email, username and password accounts with JWT access and refresh tokens
- Onboarding: nutrition focus, eating style, extra focuses
- Meal plan generation (7, 14 or 30 days), recipe details, meal swaps
- Grocery list built from the plan, serving scaling, cooked-meal tracking
- Built-in and custom challenges with invite codes
- Daily meal reminders
- 166 seeded recipes with ingredients, instructions and swap notes
- Ionic + Angular app with Capacitor iOS and Android projects; Spring Boot + PostgreSQL API

## 2. Repository setup and maintenance (3 October 2026, before the refinement brief)

| Commit | Repo | Change |
|---|---|---|
| `dd5cc5f` | backend | Fixed migrations V7 and V15 to V17 so they apply to an empty database |
| `18e8360` | backend | V18: arrow character in swap notes |
| `59113ea` | frontend | Dependency updates for npm audit (Angular 20.3, Capacitor 8.5) |
| `b2c492d` | frontend | Removed gradients, plainer copy, fixed plan-duration selection |

> To confirm: whether this section counts as event work depends on when the hackathon started.

## 3. Event work: refinement brief

### Visual slice (Welcome, Today, Food Clarity)

| Area | Status | Notes |
|---|---|---|
| Brand tokens and fonts (berry palette, Fredoka + Nunito Sans) | Built | `src/theme/sanelle.scss`, fonts bundled locally (SIL OFL) |
| Welcome screen | Built | New entry point at `/welcome` |
| Today tab | Built | Today's meals come from the real plan. Appointment and diagnosis are **demo records**, labelled in the UI |
| Food Clarity screen | Built | `/learn/dairy`. Draft topic, three studies, outcomes kept separate. Excluded from production builds |
| Evidence model | Built | `src/app/learn/evidence.model.ts` |
| Diagnosis model (completeness separate from source) | Model only | `src/app/my-health/diagnosis.model.ts`. Nothing is stored yet |
| Dairy ingredient matcher | Built, tested | Used for related meals only, not allergy safety |
| Contrast, touch-target and text-scaling checks | Done | `docs/design/contrast.md` |

### Not built yet

Recording a diagnosis, saving questions (the button on Today is demo-only and nothing is stored), allergy exclusions, the appointment summary, symptom records, report upload, and reworking meal selection without the /5 scores.
