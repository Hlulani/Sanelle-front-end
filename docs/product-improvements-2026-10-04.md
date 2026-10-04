# Sanelle: making entries useful

Implemented on 4 October 2026, preserving the berry/apricot palette, rounded cards, Fredoka/Nunito Sans typography and four existing tabs.

## What each entry becomes

| Entry | Where it lives | What the user gets from it |
| --- | --- | --- |
| Checked report details | Encrypted report history, with a selected current report | Supporting details for the next visit, without mixing missing fields with another scan |
| A question | The ordered question list | Selected questions in the appointment summary, with answers retained for later reference |
| An optional check-in | Dated symptom history | Counts over selected recorded entries, notes for the visit, or an editable question drafted from one entry |
| Notes after a visit | Dated visit history | Reference for later visits and a shortcut to turn an agreed step into a trackable task |
| An agreed next step | My next steps and Today | A date, completion/reopening, calendar export and optional native reminder |
| Meal preferences | Saved food choices and plan criteria | A reviewed set of recipes, day/week views, swaps and the grocery list |

## Reports

- Today offers photo/PDF capture before manual entry when starting diagnosis recording.
- Suggestions are checked against original page images. Source highlights help locate the wording. The viewer supports keyboard dismissal and focus handling through Ionic's modal.
- The reader works locally with bundled PDF/OCR workers and English language data. Nothing is uploaded. Numbers, units and ambiguous/replacement statements remain subject to explicit review.
- Each import stores its own name, date and findings. Making a report current is explicit. Missing fields remain unknown; older findings are not silently carried into a new scan.
- Manual edits preserve the previous report revision. Existing manual details are archived when the first report is added.
- Original files/page previews are temporary and released after saving or leaving. Report history stores confirmed findings and wording, not the original PDF/photo.

## Preparation and follow-through

- The summary leads with the main concern, the first three unanswered questions and symptom observations. Supporting report details come afterwards.
- Users can include or exclude individual questions and check-ins. Earlier answers and visits are excluded initially and can be selected explicitly.
- Excluding a check-in excludes its symptoms, notes and treatment changes together. Selection changes are serialized so rapid exclusions remain saved. Counts disclose when only selected entries are included and never treat missing days as symptom-free.
- The check-in form opens only the fields the user chooses. History can draft a factual question that remains editable and unsaved until the user adds it.
- Next steps support due dates, completion/reopening, editing/removal and all-day calendar files. The native app requests notification permission only when a reminder is chosen. Notification text is generic; health task wording is not placed on the lock screen. Logout clears these reminders without cancelling meal reminders.

## Backup and recovery

- My health and Account explain that records are local and link to backup/restore.
- A separate passphrase of at least 12 characters encrypts the backup with PBKDF2-SHA-256 (210,000 iterations, random salt) and AES-256-GCM (random IV).
- Import validates the file and health-record schema, then shows counts before the user explicitly confirms replacing the signed-in account's records. Wrong passphrases and damaged files cannot restore anything. An account change invalidates the restore preview.
- Reports/findings, questions/answers, check-ins, visits, tasks and summary choices are included. Original files, meal plans, login credentials and device encryption keys are excluded. Imported reminders remain off.
- Browser exports download files. Native exports use the save/share sheet through Filesystem and Share; both native projects register Filesystem, and iOS includes its privacy manifest.
- There is no automatic cloud sync or backup-passphrase recovery.

## Nourish

- Seven days is the default. Setup is split into schedule/start date, food choices, then a review.
- Generating produces a preview. The saved plan changes only after **Use this plan** succeeds in device storage. Preview recipes cannot mark saved meals as cooked.
- Chosen start dates are applied across every generated day and retained with the criteria used to make the plan.
- Day/week views, preparation times, short weekly date strips and previous/next controls make the plan easier to scan.
- Swaps affect one dated meal slot. Repeated recipes on other days and in other meal types remain unchanged. Failed alternative requests have retry; saving/swapping an existing plan offers undo.
- Grocery lists are linked from the saved plan. Preview users are told to save first. An ended plan remains readable and offers a new-plan action.
- Food exclusions publish only after encrypted storage accepts them. Rapid edits are serialized; failures leave the prior saved exclusions intact and show a retry message.
- Existing cooking challenges remain available under an optional collapsed section and load only when opened.
- Narrow layouts were checked at 320 and 390 pixels. New cards use normal spacing rather than the header-overlap margin used by Sanelle's first card.

## Learn

Production now offers attributed links to published patient information, with optional starter questions:

- [NHS: fibroids](https://www.nhs.uk/conditions/fibroids/)
- [NHS: heavy periods](https://www.nhs.uk/conditions/heavy-periods/)
- [NHS: Eatwell Guide](https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/)

These link to the publisher's own pages. Sanelle's draft evidence topics remain excluded from production until their review requirements are met; external links do not represent a clinical review of Sanelle's content.

## Verification and remaining limits

The unit suite covers encrypted backups, invalid/tampered imports, report isolation/history, selected-summary privacy and ordering, rapid exclusions, durable food choices, dated meal swaps/start dates and reminder scheduling races. Production browser checks use fictional reports and mocked API responses; they do not create or alter real backend accounts or health data.

Completed checks:

- **172 Karma/Jasmine tests passed** in headless Chrome; ESLint and the production build passed.
- Production browser journeys passed for capture-first entry, original-page highlights, separate report history/current selection, selective check-ins, editable question drafts and dated tasks with completion/reopening and calendar-file export.
- An actual encrypted backup download was restored in a fresh browser context. Wrong-passphrase rejection, confirmation gating and restored reports/tasks passed.
- Nourish passed setup, preview isolation, chosen start dates, swap failure/retry, one-slot swaps, undo, discarding a second preview while retaining the saved plan, week view, reload, groceries and 320/390-pixel overflow checks.
- Text PDF, PNG photo and scanned PDF reading passed in the production build using bundled assets, including confirmation, source/units/date preservation and reload. Keyboard dismissal of the original viewer passed. Manual entry also passed unit validation and date carry-over.
- `npx cap sync` passed for Android and iOS. Both the iOS privacy manifest and project file passed `plutil -lint`.

The production build still reports the existing Stencil dynamic-import warning and Tesseract CommonJS optimization warnings. There are no component-style budget warnings. The production OCR import was explicitly tested because development and production expose that package differently.

Physical iOS/Android camera capture, memory use, file sharing, calendar opening and notification delivery still require device testing. Native plugin registration and manifest validation are not a substitute for those checks. Backend meal generation/filtering continues to use the existing API contract. Production API URLs remain deployment configuration. OCR is English-only and may require manual entry for unfamiliar or unclear reports.

## Follow-up: clearer visit wording and direct concern entry

Today now says that saved questions are ready for the next doctor's visit. The summary's former “What matters most to me” section is labelled “My main concern for this visit,” with plain examples in the entry field. Add/Edit opens and focuses an editor directly inside the summary. Save updates the saved concern and closes the editor; Cancel discards the draft. Sharing/printing waits until the user saves or cancels, and a failed save keeps the draft available to retry.

The updated suite passed **175 tests**, lint and the production build. A production browser check passed Add/focus, save/reload, prefilled editing, cancellation, removal and the 320-pixel layout.

## Follow-up: editable missing summary details

Each item under “Not recorded yet” is now a separate labelled link to its entry form. “Save to my summary” saves the detail and returns to the updated summary; Cancel and Skip return without saving the draft. Details saved as unknown remain in the missing list. When adding a detail to the current report, its existing report date is prefilled. Printed and shared summaries retain a plain list of missing details.

The updated suite passed **177 tests**, lint and the production build. Production browser checks passed adding/reloading a location, recording an unaffected uterine cavity, leaving FIGO unknown and then adding it, cancelling a draft, skipping, the 320-pixel layout and the print view. Unit checks cover returning only after a successful save, retaining a failed draft for retry and updating the return destination on a cached form.

## Follow-up: photos across the meal catalogue

All 166 seeded recipes now have deliberate local photo matches. The catalogue retains 33 existing photos and adds 60 online photos, including a neutral fallback for future recipes. Similar recipe variants share representative photos; four recipes use labelled ingredient photos. Sources, licences and match differences are in [meal photo credits](design/image-credits.md). Recipe pages show attribution for the image actually loaded, including after a failed backend image recovers to a local photo.

Today, day/week plans, meal swaps, quick meals, related meals and recipe details now share image handling. Backend images are honoured, missing/broken links recover to the local match, and supported relative paths resolve correctly. Long swap names and their photo share the first row, with the action below, so the text stays readable at 320 pixels.

`npm run check:meal-photos` verifies all matches against the backend migrations when available, JPEG assets and source/licence metadata. All 93 images decoded in the production browser. The updated suite passed **182 tests**, lint and the production build. Production browser checks passed images on day/week plans, swaps, Today, quick meals and recipe pages, image recovery, attribution, ingredient labels and the 320-pixel layout. Browser checks use fictional data and mocked API responses.
