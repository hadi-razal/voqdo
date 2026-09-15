# VOQDO

A local journal built with Expo Router and React Native. Write entries, correct suggested tags and moods, search your journal, and explore 7-day, 30-day, or all-time insights.

## Run

```sh
npm install
npm run dev
```

Press `i` in the Expo terminal to open the iPhone simulator. Expo Go supports the typed journal; it does not include the custom speech-recognition module. The voice screen offers a writing fallback.

For native speech recognition, build the iOS app with Xcode and CocoaPods installed:

```sh
npm run ios
```

If Metro is already running, use `npm run ios -- --no-bundler`. Speech requires microphone/speech permissions and device support for on-device English recognition. Verify transcription on a physical iPhone; simulator speech services may be unavailable.

## Journal features

- Writing drafts are retained locally when leaving the editor.
- Review and correct titles, text, tags, and mood before saving.
- Edit saved entries without changing their original date or creating duplicates.
- Saving waits for storage to succeed; failed saves retain the review draft.
- Tap a daily prompt to bring it into the editor.
- Edit your name and export your journal as Markdown text through the system share sheet in Profile.
- Privacy and Terms screens explain local storage, optional AI, and that Pro is a preview.
- Insights offer 7-day, 30-day, and all-time views; mood chips open search.

Entries and preferences use device-local AsyncStorage. Default keyword suggestions are deterministic and local; optional AI suggestions use OpenRouter only when requested. Export only shares content after you choose a destination in the system share sheet. Nightly notifications, purchases, and cloud backup are not implemented; their screens explicitly show this status.

## Checks

```sh
npm run typecheck
npm run lint
npm test
```

Regression tests cover storage migration, malformed journal protection, invalid preferences, corrected moods, voice source preservation, and deliberately empty category lists.

## Optional small-model AI

Review has a **Generate AI suggestions** button. It sends only the current entry text to OpenRouter and the selected provider when tapped. The server uses `google/gemma-3-4b-it` (4B parameters), with 250 output tokens, a 6,000-character input limit, a 20-second upstream timeout, and no automatic retries or model upgrades. Provider prices are capped at $0.05/M input and $0.10/M output. Current catalog prices when configured: $0.05/M input and $0.10/M output; prices and availability may change. Provider data-collection routing is set to `deny`.

Keep `OPENROUTER_API_KEY` in `.env.local` (ignored by Git), never in an `EXPO_PUBLIC_` variable. `npm run dev` starts both Metro and the AI service. If Metro is already running, start only `npm run ai:server`.

The AI service binds to `127.0.0.1:8787` for local iPhone Simulator development. It accepts at most 10 requests per minute and one in flight. It does not store or log journal text. Invalid AI responses leave the existing draft unchanged. AI-generated metadata is saved only when you save the entry.

For a physical device or distributed app, deploy an authenticated HTTPS backend with per-user quotas and set `EXPO_PUBLIC_ANALYSIS_URL` to its URL. The loopback development service is intentionally not a public deployment. Expo Go and the native app share the same AI endpoint but keep separate local journals.


## Daily ritual and pricing

Home and Profile open **Your daily ritual**: daily check-ins, 20 XP for each distinct saved journal day, a new level every 100 XP, six milestone badges, and a configurable weekly goal of 3, 5, or 7 days. A completed first check-in shows a reward message after storage succeeds. Extra entries and edits do not award more XP. Missed days do not deduct XP; progress is derived from saved entry dates, so deleting the last entry for a day removes that day's contribution. Existing journals count automatically.

The planned Pro subscription is **USD $4.99/month**, defined in `src/lib/pricing.ts`. App Store billing, scheduled reminders, and Pro features remain unimplemented previews. Habit features are available without Pro.

## Guided journeys and reflection room

- Three guided journeys (gratitude, growth, self-care), each with three prompts. Steps count only in order on separate local calendar days after saving; breaks do not reset progress. Completing a journey earns its displayed badge. Existing daily XP rules continue to apply.
- A visual garden unlocks Seed, Sprout, Bloom, and Grove at 1, 3, 7, and 14 saved journaling days.
- Reflection room offers selected-entry recaps, a small next step, or an answer to a question about selected entries. Choose 1–5 entries explicitly, or select up to five recent-week entries, then tap Generate. The complete selection is capped at 6,000 characters; content is never silently truncated.
- AI observations link back to selected source entries. Source IDs are validated, but generated interpretations still need human review. Responses use the same Gemma 3 4B and price caps, with a 650-token response limit and a 25-second upstream timeout.
- Save a reflection locally, reopen it later, or write a new entry from its question. Erasing the journal clears saved reflections, and deleting a source entry removes saved reflections using it. Generated reflections are not themselves journal entries and do not award XP.
