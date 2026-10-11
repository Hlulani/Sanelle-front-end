# Current Sanelle journey inventory

Checked against the routes and screen implementations in this checkout. These are user tasks rather than a list of every URL. The route file groups the app into nine broad journeys; the task inventory below separates their useful demo branches.

| # | Journey | Steps and branches | Entry |
|---|---|---|---|
| 1 | Create an account | Welcome → register and accept terms → check email → verify email → sign in | `/welcome`, `/register` |
| 2 | Return to an account | Log in; request password reset and set a new password; log out | `/login`, `/reset-password`, `/account` |
| 3 | Onboarding | Enter name → choose priorities → optionally record known diagnosis details → choose symptom/food context → optionally set appointment date → finish setup → open Sanelle; optional Thandi sample-data preview | `/onboarding` |
| 4 | Today | Choose scan, food, symptom or appointment intent; see the next action, recorded activity, planned meal and pending follow-up | `/tabs/today` |
| 5 | Capture a report | Take photos or choose photos/PDF → inspect pages/quality → read text → compare source wording and measurements → edit/check selected details → save | `/health/report/new`, `/health/report/capture`, `/health/report/check` |
| 6 | Enter or resume report details | Enter details manually; save unfinished details; return later to check and save; preview the fictional sample report | `/health/report/new`, `/health/report/check` |
| 7 | Understand and manage saved reports | Open report history → open saved report → inspect recorded and unknown fields → see wording/source limitations → correct details; choose which checked report to use for the next visit; add another report | `/health/reports`, `/health/report/:id/saved`, `/health/details` |
| 8 | Turn a report gap into a question | Select an unknown field → review/edit the suggested question → add to appointment; cancel without saving | `/health/question/:key` |
| 9 | Symptom check-in and history | Choose symptoms → describe bleeding and daily impact → add a note → save → inspect history, coverage and observations → edit check-in | `/health/check-in/:date`, `/health/symptoms` |
| 10 | Questions drafted from records | Inspect suggestions based on check-ins → review before adding; when configured, consent to Claude drafting → inspect/edit AI suggestions → retain the rules-based fallback | My health, symptoms view |
| 11 | Record a clinical result | Enter exact result name/value/unit/date → save → inspect/edit recorded results and include them in appointment preparation | `/health/results`, My health |
| 12 | Explore evidence and food claims | Open a research explanation → inspect study populations, limitations and source links → save/edit an appointment question; only published catalogue entries appear | `/learn`, `/learn/:id`, `/food/claims` |
| 13 | Find and cook a recipe | Search ingredient/meal and filter time → open recipe → inspect ingredients, servings and instructions → favourite/save → mark a planned meal made | `/food/find`, `/food/recipe/:id` |
| 14 | Plan meals | Review diet/allergies/intolerances/preferences/household → preview plan → choose 3 days, week, fortnight or month → adjust meals/start date → save → reopen saved plan | `/food/requirements`, `/food/plan`, `/tabs/food` |
| 15 | Swap or leave a meal open | Select a planned day → choose alternatives → review scope and shopping changes → confirm or undo; leave a day open and choose later | `/food/swap/:date`, `/food/plan` |
| 16 | Manage groceries | Open the plan's shopping list → choose week when applicable → tick items already at home → add/remove items → reopen saved edits | `/food/plan?view=shopping` |
| 17 | Prepare for an appointment | Set optional date and main concern → add questions → inspect checked report details, exact results and recorded symptom summary → copy editable summary | `/tabs/appointment` |
| 18 | Draft an appointment concern | Draft from recorded check-ins; optionally consent to configured Claude drafting → review/edit → save concern | Appointment concern editor |
| 19 | Record outcomes and follow-up | Record clinician answer and agreed next step/date → save; mark a question unresolved → carry it forward with history → complete/reopen a next step; optional native reminder on the separate next-step screen | `/tabs/appointment`, `/appointment/answer/:id`, `/appointment/next-step` |
| 20 | Back up and restore health records | Choose passphrase → export encrypted backup; choose backup → unlock → review → explicitly replace device records | `/health/backup` |
| 21 | Account and reminders | Change help priorities → toggle daily reminders (native capability) → log out or delete account | `/account` |
| 22 | Internal evidence catalogue | Authorized evidence editor opens catalogue → filters/browses entries → inspects appraisal, linked sources and review history → returns to patient app | `/internal/evidence`, `/internal/evidence/:id` |

## AI feature clarification

The user supplied the deployed demo at https://sanelle.netlify.app/phone and clarified the distinction:

- Sanelle AI suggestions and the appointment concern draft use real Anthropic-powered responses from recorded check-ins and notes, with explicit consent and review before Add/Save.
- Report reading is real on-device text recognition, using Tesseract for report images and PDF.js for text PDFs. Report files are not uploaded.
- Learn contains published research summaries supporting the permitted matches; it is not itself generated by AI.

The dedicated deployed recording script (`e2e/demo-ai-deployed.spec.ts`) follows these five features and verifies the live AI calls. The earlier local health/food videos are general journey demonstrations rather than demonstrations of the live AI features.

## Demo pacing

The two recorded journeys follow real app controls after the initial page load, with 6.5-second reading pauses, visible individual actions, slow narrative typing and smooth scrolling. They cover the primary health → appointment chain and food → plan → cooking → shopping chain. They do not claim to cover every branch above, native camera behavior, or native notifications.
