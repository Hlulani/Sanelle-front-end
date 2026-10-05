# Sanelle

Sanelle helps women understand their fibroid diagnosis, make informed food choices and feel prepared for appointments.

It's a mobile-first app built with **Ionic + Angular + Capacitor**. The API lives in [sanelle-back-end](https://github.com/Hlulani/sanelle-back-end).

> App ID: `com.hlulani.sanelle` · Angular 20 · Ionic 8 · Capacitor 8

Sanelle doesn't diagnose or replace a doctor. It helps someone record what they know, see what's missing, check food claims against research, and bring clear questions to their appointment.

## What it does

The app has four tabs: **Today**, **My health**, **Nourish** and **Learn**.

### Getting started
- **Onboarding:** one optional question, "What would you like help with?", with three choices (diagnosis, food, appointment). Any number can be picked. The answer decides what Today shows first and can be changed in Account.
- **Today:** one main action, led by that choice, with the other areas one tap away. Nothing empty or invented shows on a first visit.

### Understand your diagnosis (My health)
- **Recording:** five questions (number, largest size, location, uterine cavity, FIGO type), one at a time. "I don't know" is a real answer and becomes a suggested appointment question. **Finish later** keeps what's typed, and **Carry on** picks up where she stopped.
- **Three states for every finding:** recorded, explicitly absent, or **Not recorded**. Unknown is never shown as "no".
- **Sources:** every value keeps where it came from (report, appointment or own note), plus the report's own wording and date.
- **Capture first:** Today offers the report reader before the manual form. Take a photo or choose one PDF (up to 10 pages) or up to 10 photos. PDF.js reads text PDFs; Tesseract reads photos and scanned pages on the device using bundled English language assets. The file is never uploaded or retained. Conservative text matching suggests explicit findings; the person checks, edits and selects details before saving. Missing information stays unknown and replacements require selection. Each suggestion can open the original page with source highlights. Confirmed details go into My health and the appointment summary with their source wording and an optional shared report date.
- **Report history:** each import has a name, optional report date and its own findings. Choose the current report explicitly. Missing fields stay unknown instead of borrowing details from a different scan. Earlier reports and revisions remain available. Original files are shown during review, then released; they are not retained in history.
- **Clear manual fields:** labels explain the expected information, size requires an explicit unit, and source/date carry through the guided entry flow. Optional source wording stays available without requiring it for every detail.

### Navigate food advice (Learn and Nourish)
- **Published resources:** production Learn links directly to NHS patient information about fibroids, heavy periods and the Eatwell Guide, with attribution and optional questions to save. These external resources are separate from Sanelle-authored topics.
- **Food questions (development drafts until reviewed):** each answer starts short, then shows evidence separately for getting fibroids, growth, bleeding, pain and fertility. Every study opens with its population and limitations. "No studies found" is never presented as "no effect".
- **Read something else?:** any other claim becomes a question for the appointment.
- **Meal plans:** start with 7 days by default. Choose the schedule and start date, then diet, prep time, allergies and foods she does not eat, then review those choices. Preview the meals and swap recipes before choosing **Use this plan**. The previous plan stays saved until then. Day/week views, preparation times, one-meal swaps with retry, and undo make the saved plan easier to use. Allergy and diet rules still come from the existing API. Food exclusions are displayed as saved only after encrypted device storage succeeds.
- **Easy meals for today:** meals ready in 15 minutes or less that match her saved preferences.
- **Groceries:** for the next 3 days, a week or the whole plan, shown by aisle or by meal. Ingredients used in several meals say "for N meals"; free-text amounts are listed, never added up.

### Prepare for care
- **Your next visit:** My health brings preparation together: what matters most to you, unanswered questions, symptom history and a summary to bring. Today previews questions and links directly to this preparation. A date is optional.
- **Check-ins (optional):** first choose only the areas to remember: bleeding, pain 0–10, pressure or bloating, tiredness, impact, or notes and treatment changes. The form opens just those fields. A saved history entry can become an editable question for the next visit; it is never added automatically. After saving, Today confirms it and offers at most two useful next steps, chosen by explicit rules.
- **Symptom history:** only recorded check-ins, with coverage stated once ("2 check-ins recorded in the last 14 days"). Observations need at least two check-ins and always use the check-in count as the denominator. Days without a check-in are unknown, never symptom-free.
- **Questions:** her own, ones suggested from missing details, and starter questions. Each can be edited, reordered and answered afterwards.
- **Appointment summary:** the main concern, first three unanswered questions and symptom observations come before supporting report details. Select individual questions/check-ins and the last 14, 30 or 90 days. Earlier answers and visit notes are excluded initially; include only the ones you want to bring. It works without an appointment date and is ready to share or print.
- **After your visit:** keep dated notes about what was discussed, next steps agreed with your clinician and follow-up to remember. Saved visits remain editable; you choose which visits appear in your summary. Answers stay in your question list for reference and unanswered questions remain ready for next time. An agreed step can be opened in **My next steps**, dated, completed/reopened, exported to a calendar, or given an optional device reminder in the native app. Pending steps also appear on Today. Sanelle does not generate treatment decisions.

## How health information is handled

- **Health records stay on the device.** Diagnosis details, questions, check-ins and allergies are encrypted (AES-256-GCM) and stored per account on the phone or in the browser, not on the server. The key is held in the iOS Keychain or Android Keystore, or as a non-extractable key in the browser. A different browser, or cleared site data, starts empty.
- **Portable backup:** My health and Account link to an encrypted health backup. A separate passphrase of at least 12 characters protects the file with PBKDF2-SHA-256 and AES-256-GCM. Unlock and review before explicitly replacing the signed-in account's device records. The file includes findings/history, questions/answers, check-ins, visits, next steps and summary choices; original report files and meal plans are excluded. Imported device reminders remain off. There is no passphrase recovery.
- **Counts are plain code.** Coverage, frequencies and ranges are calculated by tested functions (`src/app/my-health/checkins.ts`, `summary.ts`). Nothing is generated by AI, and nothing suggests a cause.
- **Health content is labelled until reviewed.** The diagnosis explanations and food topics (dairy, soy, red meat, green tea) were researched against published papers but haven't been reviewed by a clinician or dietitian. They're labelled "Draft · not reviewed" and left out of production builds (`topics.drafts.prod.ts` replaces the drafts). Some sources were checked from the abstract only, and each one says so.
- **Symptom explanations appear only once reviewed.** The rule that matches check-ins to explanations exists (`symptom-topics.ts`), but no topic has been reviewed yet, so none is shown.
- **No urgent-symptom advice.** That needs its own clinically reviewed approach.

## Tech stack

- **Framework:** Angular 20, standalone components and signals
- **UI:** Ionic 8, with Sanelle's own theme (`src/theme/sanelle.scss`)
- **Type:** Fredoka for page titles and the wordmark, Nunito Sans for everything else (bundled locally)
- **Native:** Capacitor 8 (Preferences, Secure Storage, Local Notifications, Filesystem, Share, Haptics)
- **Testing:** Karma and Jasmine. **Linting:** ESLint (`@angular-eslint`)

## Project structure

```
src/app/
├── welcome/            # First screen for signed-out visitors
├── auth/               # Log in, register, onboarding
├── today/              # Today: lead action, check-in confirmation and next steps
├── my-health/          # Diagnosis recording, questions, check-ins, summary
│   ├── record/         #   The five diagnosis questions
│   ├── report/         #   On-device PDF/photo reading and original-page review
│   ├── reports/        #   Dated history and current report selection
│   ├── steps/          #   Agreed steps, completion, calendar and native reminders
│   ├── backup/         #   Passphrase-protected export and explicit restoration
│   ├── visit/          #   Dated notes and agreed next steps after appointments
│   ├── symptoms/       #   Check-in form and history
│   ├── summary-page/   #   Appointment summary
│   ├── checkins.ts     #   Counts and observations (no generated text)
│   └── summary.ts      #   Builds the summary from the record
├── learn/              # Food questions and evidence topics
├── tab2/               # Nourish: plan settings and the meal plan
├── tab3/               # Groceries
├── nourish/            # Easy meals for today
├── pages/meal-details/ # Recipe view and cook mode
├── account/            # Profile, help choices, reminders, log out
└── core/               # Auth, API services, encrypted storage, preferences
```

## Running it locally

**Requirements:** Node.js 22 LTS (Angular 20 needs 20.19+, 22.12+ or 24) with npm 10. You also need [sanelle-back-end](https://github.com/Hlulani/sanelle-back-end) running on port 8080; its README covers that, and it needs JDK 17+ and Docker.

```bash
npm ci
npm start          # http://localhost:4200
```

Open http://localhost:4200 in Chrome, set DevTools to an iPhone size, and create an account with any email address; there's no email verification.

**Backend address:** `src/environments/environment.ts` points to `http://localhost:8080` (`apiBaseUrl` and `hostBaseUrl`). If the backend runs elsewhere, change both values, and add the app's address to the backend's `CORS_ALLOWED_ORIGINS`.

### A quick walkthrough

1. **Diagnosis:** My health → **Read a photo or PDF of my report**. Choose an English report, compare suggestions with the original, select the details to save and confirm. Alternatively choose **Record my diagnosis** on Today: enter `2`, then `4.1` with the report's unit, then **I don't know** for location. The question it suggests is added to your list.
2. **Check-in:** My health → **Check in today**. Choose Tiredness and Impact, record only what matters today, then save. Open Symptoms and turn an entry into an editable appointment question.
3. **Learn:** open an attributed NHS resource, or save its starter question. Development builds also show clearly labelled draft evidence topics.
4. **Meals:** Nourish → choose your week → set food exclusions → **Preview my meals** → Swap → **Use this plan**. Try Day/Week and **Groceries** → **By meal**. Challenges are optional and collapsed initially.
5. **Summary:** My health → **Review what I’ll bring**, choose the questions/check-ins to include, then share or print.
6. **Follow-through and backup:** save a dated step from your visit notes; complete or reopen it on My next steps. Export a backup, then unlock and review it before restoring.

## Scripts

```bash
npm start          # dev server on :4200
npm run build      # production build to www/ (no draft content)
npm run watch      # development build with file watching
npm test           # unit tests (Karma/Jasmine)
npm run e2e        # end-to-end tests (Playwright)
npm run lint       # ESLint
```

### End-to-end tests

`e2e/` drives the real app against the real backend on an iPhone-sized WebKit browser: accounts, recording a diagnosis, Learn, meal planning and cooking, groceries and the appointment summary. Each test registers its own throwaway account and deletes it afterwards.

```bash
npx playwright install webkit   # first time only
npm run e2e                     # report: e2e/.output/report
```

It reuses the dev server on :4200 and the backend on :8080 if they're running, and otherwise starts them. The backend is expected next to this repo (`../sanelle-back-end`); set `SANELLE_BACKEND_DIR` if it lives elsewhere, and start its database first (`docker compose up -d db`).

Before a production build, set the real API domain in `src/environments/environment.prod.ts`; it still contains placeholders (`YOUR-PROD-DOMAIN`).

## Running on a phone (Capacitor)

The repo includes `ios/` and `android/` projects. After any frontend change:

```bash
npm run build
npx cap sync
npx cap open ios        # Xcode (macOS)
npx cap open android    # Android Studio
```

- **iOS Simulator:** needs full Xcode (`xcodebuild -version`). Open `ios/App/App.xcodeproj` directly; plugins use Swift Package Manager, so there's no workspace or CocoaPods step. Pick a simulator and press ⌘R. Debug builds call `http://localhost:8080`, which the simulator can reach.
- **Android Emulator:** create a device in Android Studio's Device Manager and press Run. The emulator can't reach your computer's `localhost`; use `http://10.0.2.2:8080` in `environment.ts` when testing against a local backend.
- **Meal and next-step reminders** work in the native builds. Browser users can download next-step calendar files. Next-step reminders use generic notification text and are cleared on logout.
- **Save/share files:** Filesystem and Share are registered in both native projects. iOS includes the required file timestamp and UserDefaults privacy manifest. Physical-device verification remains necessary.

### App icon and splash screen

The source images are `resources/icon.png` (1024×1024) and `resources/splash.png` (2732×2732). Both are placeholders. Replace them, then run:

```bash
npx capacitor-assets generate --ios --android
```

## Sign-in and onboarding

- **Tokens:** login and registration store access and refresh tokens with Capacitor Preferences. `authInterceptor` adds the bearer token and, on a `401`/`403`, refreshes it once before retrying.
- **Guard:** `authGuard` protects the app's routes and sends anyone who hasn't finished onboarding there first.
- **Per account:** onboarding, help choices and diet are tracked per account, so one person's choices never carry over to the next account on the same device.
- **Signed-in users** skip Welcome and the sign-up forms. Onboarding shows who is signed in and offers Log out.

## Known limitations

- **Unreviewed health content.** Everything listed under "How health information is handled" stays labelled as a draft until a named reviewer signs it off.
- **Report reading:** English only, with conservative matching of explicit statements. OCR can misread text and many report formats will need manual entry. It does not infer a diagnosis, translate reports or interpret measurements. Desktop Chrome capture has been checked; camera behavior and memory use still need testing on physical iOS/Android devices.
- **Placeholder photos.** 33 of 166 recipes have one, from Unsplash and Pexels (see `docs/design/image-credits.md`). The rest show a designed tile.
- **Carried-over recipe text.** Some recipe text from an earlier version (such as the "Why it helps" section) still needs reviewing against Sanelle's evidence rules.
- **Challenges** come from an earlier meal-planning version and are optional, collapsed until opened.
- **Allergy filtering** works from ingredient names and isn't a guarantee of allergen safety. Always check labels.

Implementation details and validation: [2026-10-04 improvements](docs/product-improvements-2026-10-04.md).
