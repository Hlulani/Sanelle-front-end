# Real Sanelle AI demo recordings

Recorded on the deployed app at https://sanelle.netlify.app/phone using its judge account in a fresh browser. The account is not deleted or reset. Check-ins, questions and saved concerns are fictional demonstration data entered through the UI and held in the recording browser. AI responses are real, not mocked; wording can vary.

- `sanelle-full-journeys-under-5-min.mp4`: all six journeys in one normal-speed edit, including setup and research; repetitive typing and idle periods are cut. Optional chapter captions use the matching `.vtt` file.
- `00-check-in-setup.mp4`: today's and yesterday's fictional check-ins.
- `01-ai-suggestions.mp4`: rules-based starting state → consent → real AI questions/counts → edit/add → exact note excerpt and matched explanation.
- `02-ai-visit-draft.mp4`: chosen appointment question → real first-person AI concern → review/edit/save.
- `03-report-reading.mp4`: supplied fictional sample scan → actual on-device OCR → compare measurements → confirm/save.
- `04-research-library.mp4`: published summaries, short answer, population, limits and sources.
- `05-safety-talking-points.mp4`: generated closing slide, clearly labelled as talking points rather than live rejection evidence.
- `sanelle-ai-main-demo.mp4`: suggestions → visit draft → report reading; followed by a generated safety talking-points slide. Setup and the extra library tour are separate clips.

All clips keep the actual phone bezel. The untrimmed 1280 × 1040 recording is `full-recording.webm`; exported clips crop away the surrounding page and login instructions. Each feature has optional WebVTT chapter captions. Videos are silent with deliberate reading pauses and slow interactions.

## Re-record

Set `SANELLE_DEMO_EMAIL` and `SANELLE_DEMO_PASSWORD` in your shell, then run:

```sh
npm run demo:ai:record
SANELLE_FFMPEG=/path/to/ffmpeg npm run demo:ai:export
```

Use the judge credentials provided for the deployment. Credentials are not embedded in the recording script. Set `SANELLE_DEMO_REPORT` to override the sample scan path. No local app or backend server is needed.

The app has no previous-day picker in its history screen; the previous check-in is entered through its supported date route inside the same phone iframe during the setup clip. Feature recordings use the actual navigation controls without reloading, so consent carries from suggestions to the visit draft.

## Closing narration: safety checks

Use these as talking points rather than claiming the happy-path video proves each rejection case:

1. Unsupported diagnoses/causes, numbers, note quotations and unpublished references are filtered before drafts are offered.
2. When nothing passes, the app keeps the existing text and rules-based fallback.
3. Nothing is saved unless the person chooses **Add** or **Save**.

The recording verifies that real AI requests succeed, each contains two check-ins and omits the account email, and that edited questions/concerns are shown after explicit Add/Save. It does not deliberately manufacture an unsafe response or simulate a failed AI response.

## Re-export the complete short demo

```sh
SANELLE_FFMPEG=/path/to/ffmpeg node scripts/export-full-demo.mjs
```

This reuses the original live recording and preserves the longer individual clips. The edit decision list and chapter times are in `full-journeys-edit.json`.
