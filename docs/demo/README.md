# Sanelle demo videos

Two silent phone videos (390 × 844), recorded from the actual Angular app and local Spring backend with fictional data:

- `health-journey.mp4`: Today → import a fictional report image with real Tesseract OCR → check/save extracted measurements → turn missing location into a question → symptom check-in → appointment brief → record a fictional clinician response and agreed next step.
- `food-journey.mp4`: food preferences → preview/save a seven-day vegetarian plan → open a recipe → mark it made → shopping list → add/tick an item and verify it survives reload.

Original recordings are `.webm`. Matching `.vtt` files contain optional chapter captions; `*-chapters.json` files contain approximate timing for narration/editing. The videos have no audio. They show browser behavior, not physical-device camera or native notifications.

## Record again

```sh
npm run demo:record
```

Playwright starts/reuses the backend at port 8080 and frontend at port 4200. The backend defaults to the sibling `../sanelle-back-end`; set `SANELLE_BACKEND_DIR` if needed. An existing backend must have `MAIL_OUTBOX_ENABLED=true`. Install Playwright Chromium if missing (`npx playwright install chromium`). Each flow creates and verifies a throwaway account, completes login/onboarding off-camera, then records real UI interactions and deletes its account. Health data is entered only through the app; API responses are not mocked. The revised flows use actual navigation controls, 6.5-second reading pauses, slower typing and smooth scrolling. Only successful recordings replace the named video files.

## Export MP4 and captions

With FFmpeg available:

```sh
npm run demo:export
```

Or specify its executable:

```sh
SANELLE_FFMPEG=/path/to/ffmpeg npm run demo:export
```

The exporter creates H.264 MP4 files with browser-friendly playback settings and chapter captions. Re-export after every recording; `demo:record` updates the WebM originals only. Test results and failure traces are in `e2e/.output/demo-results`; the report is in `e2e/.output/demo-report`.

Content shown is a fictional demonstration, including the clinician response. Recording does not constitute clinical review of the app's draft health content.

Full task inventory and AI implementation verification: [journeys.md](journeys.md).

## Deployed Sanelle AI recordings

The production phone-frame AI demo and separate feature clips are documented in [deployed-ai/README.md](deployed-ai/README.md). Use `npm run demo:ai:record` with the judge credentials in environment variables, then `npm run demo:ai:export`. These exercise real AI responses on the deployment.
