# Demo recording

Records one happy-path Sanelle journey with Thandi, a fictional demo user, as a portrait phone video (390 × 844, iPhone 13 preset in WebKit, touch on). Development tooling only; nothing here is part of the app build.

```bash
npm run demo:record
```

Output: `demo/recordings/sanelle-demo-thandi.webm` (about 1 min 50 s, no audio).

## Before you run it

- The backend is running on `http://localhost:8080` with its database (`docker compose up db`, then `./mvnw spring-boot:run` in `sanelle-back-end`).
- The app is served by `ng serve` on port 4200. If nothing is running there, the command starts it. The development build is required because the food topics are still drafts.
- First time only: `npx playwright install webkit`.

## What it does

Setup, outside the video: signs Thandi in through the API, or registers her if her account doesn't exist yet. Each run starts in a fresh browser, so she has no health records or meal plan on the device.

The recorded journey:

1. Signs in as Thandi.
2. Records her diagnosis. The uterine cavity stays unknown, and its suggested question is saved.
3. Opens "Should I cut out dairy?", its evidence for "Getting fibroids", one study and the sources.
4. Previews a 7-day plan, swaps the first meal, saves the plan and opens groceries.
5. Opens her appointment summary.

Any failed step stops the run. The saved recording is replaced only after the full journey succeeds. A failed run leaves its partial video and error details in `demo/.output/`.

Thandi's details and demo answers are in `thandi.ts`. The meals come from the real backend, so the recipes in the plan can differ between runs.
