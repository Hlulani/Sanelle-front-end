# Actual Figma prototype: welcome, account entry and onboarding

[Open the side-by-side gallery](index.html). The original React prototype in `/Users/hbaloyi/Downloads/project.zip` matches the user's supplied welcome screenshot. The generated atlas used in the previous review differs from it. The earlier atlas-based claim of a completed Figma match was incorrect and is superseded.

The reference screenshots come from independently executing the supplied React code, not from the Angular implementation. Original source and a runnable build are retained in `docs/design/figma-make-source-2026-10-08/`. [Source hashes](source-hashes.csv) identify the prototype, exact fonts and photograph. The authoritative reference instructions are in `docs/design/CURRENT_HANDOFF.md`.

Welcome, account entry and onboarding now use the prototype's burgundy background, cream cards, typography, photograph, copy, spacing and controls. The invented onboarding avatar, bottom tabs, tiny atlas typography and state titles have been removed.

The user's explicit corrected journey supersedes the prototype's outdated numbering and combined appointment/summary screen: five numbered steps, an optional date and explicit no-date path, then a separate “Ready to start” summary reviewing priorities, diagnosis and appointment. Reference renders apply only these documented corrections: progress labels, accurate device-storage wording replacing the browser-demo statement, and moving the embedded appointment summary into the separate final screen. The separate final summary is checked for behaviour and recorded values; it has no original prototype artboard.

The working app retains real authentication, email verification, password recovery and encrypted account records. The prototype's fake-login note and pretend verification are omitted. Validation, loading and recovery states use the prototype shell with real-server messages. Registration terms open the existing notice with the source's visual treatment.

All five symptom choices and five food-context choices are selectable and persisted. These preferences do not manufacture clinical check-ins or dietary exclusions. The demo opens priorities with the original sample values. Optional diagnosis fields save independently, with the source's explicit cm suffix. Blank fields remain unrecorded. Revisiting setup preserves existing report provenance, unknown units and multidimensional measurements instead of silently reinterpreting them.

## Verification

- **64 end-to-end tests passed** against the real local backend, on Chromium and iPhone WebKit. [Machine-readable results](results.json).
- **107 unit tests passed**; production build, lint and formatting passed. The build used the local backend origin for validation; nothing was deployed.
- **28 independent full-screen comparisons:** four entry reference screens and ten onboarding empty/selected states, in both browsers. Measured component boundaries must agree within 0.1 CSS px.
- Pixel comparisons use a colour threshold of 0.01 and allow zero differing pixels, except the iPhone login arrow. WebKit/Ionic rasterises 25 pixels at one arrow corner differently; only that screen permits 25 pixels, while independently checking the arrow's position, dimensions, path, stroke width and cap/join. No layout difference is permitted.
- Welcome was also compared directly with the running original prototype in desktop Chromium at the supplied 400 × 874 viewport: **zero differing pixels**.
- Behaviour checks cover registration/verification, login/recovery, reset/reuse rejection, demo setup, optional fields, independent diagnosis values, back navigation, no-date continuation, context after reload, existing report sources/units, completing setup and width overflow at 320/390/768 px.
- The wider suite checks reports, symptoms, appointments, evidence and meals for regressions. It does not establish visual reproduction of those other journeys.

Repeat entry checks with `npm run e2e -- onboarding.spec.ts auth.spec.ts`. The reference fixture serves the independently compiled original prototype with exact local font/photo bytes, without Figma or image/font network requests.

`screenshots/` contains actual app captures; `reference-viewports/` contains prototype renders. The separate summary has only an app capture. Copies and a happy-path collection are saved in the Sanelle presentation folder.
