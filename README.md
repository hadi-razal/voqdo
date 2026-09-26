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
- Privacy and Terms screens explain the account, backup, trial, optional AI and billing.
- Insights offer 7-day, 30-day, and all-time views; mood chips open search.
- Search lives under the Journal tab; the tab bar is Home, Journal, Garden and Insights, with a centre button to speak or write.

Entries are saved on the device first (AsyncStorage), so the app works offline, and are backed up and synced through Supabase while the account has access (see **Production backend** below). Default keyword suggestions are deterministic and local; AI suggestions run only when requested. Export only shares content after you choose a destination in the system share sheet. Nightly reminder notifications are not implemented yet.

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


## Sprout, the daily ritual and pricing

**Sprout** is drawn in code (`src/components/Sprout.tsx`), not shipped as images: it blinks, breathes, hops when tapped, and combines 11 faces, 5 arm poses and 12 props. It grows through five stages as you journal — **Seed → Sprout (1 day) → Bud (5) → Bloom (14) → Grove (30)** — and never shrinks. After two or more days away it gets sleepy and says it missed you; it never guilt-trips. Motion is skipped when the system asks for reduced motion.

- **Celebration screen** after each new page: XP, streak, quests, stars, shields, badges, and an evolution moment when Sprout reaches a new stage. Everything is derived by comparing the journal with and without that entry.
- **Leaf shields**: earn one every 7 journaling days (hold up to 2). A shield is spent automatically to bridge a missed day, so one busy evening doesn't erase a long streak.
- **Daily quests**: "check in" plus two quests that rotate by date (80+ words, a voice entry, a Gratitude page, two pages, a named feeling, a journey step). Completing all three earns Sprout a star.
- **Mood quick-start** on Home opens the editor with a prompt for that feeling and pre-selects the mood.
- **Mood garden** on the Garden tab: each journaled day this month grows a flower in that day's most common mood.
- **A page from the past** on Home resurfaces an entry from a week, month or year ago.
- 20 XP for each distinct saved journal day, a new level every 100 XP, six milestone badges, and a weekly goal of 3, 5 or 7 days (chosen during onboarding). Extra entries and edits do not award more XP. Existing journals count automatically.

All of this is derived from saved entries (`src/lib/habits.ts`, `pet.ts`, `quests.ts`), so there is no extra state to store, migrate or lose.

**VOQDO is a paid app.** Every account gets a **3-day free trial** (started server-side when the account is created), then **VOQDO Pro at USD $4.99/month** (`src/lib/pricing.ts`), billed by **Dodo Payments**. After the trial, the app shows a paywall; people can still read, export and delete their journal. Pro status lives in the database and is written only by Edge Functions — a device can no longer unlock itself.

## Guided journeys and reflection room

- Three guided journeys (gratitude, growth, self-care), each with three prompts. Steps count only in order on separate local calendar days after saving; breaks do not reset progress. Completing a journey earns its displayed badge. Existing daily XP rules continue to apply.
- A visual garden unlocks Seed, Sprout, Bloom, and Grove at 1, 3, 7, and 14 saved journaling days.
- Reflection room offers selected-entry recaps, a small next step, or an answer to a question about selected entries. Choose 1–5 entries explicitly, or select up to five recent-week entries, then tap Generate. The complete selection is capped at 6,000 characters; content is never silently truncated.
- AI observations link back to selected source entries. Source IDs are validated, but generated interpretations still need human review. Responses use the same Gemma 3 4B and price caps, with a 650-token response limit and a 25-second upstream timeout.
- Save a reflection locally, reopen it later, or write a new entry from its question. Erasing the journal clears saved reflections, and deleting a source entry removes saved reflections using it. Generated reflections are not themselves journal entries and do not award XP.

## Production backend (Supabase)

Everything server-side lives in `supabase/` and is covered by `npm test`:

| Piece | What it does |
| --- | --- |
| `migrations/…_voqdo_init.sql` | `profiles` (trial clock), `subscriptions`, synced `entries` and `reflections` (last-writer-wins, scrubbed tombstones), `ai_usage` quotas, `webhook_events`. Row-level security on every table: people only ever see their own rows, can't touch their trial or Pro status, and can't write after the trial — but can always read and delete. |
| `functions/ai` | AI suggestions and reflections. Requires a signed-in account with access; per-user limits (analyze 6/min · 40/day, reflect 3/min · 15/day). |
| `functions/billing` | Dodo checkout (tagged with the user id), payment confirmation (a purchase only ever unlocks the account that made it), and the customer portal link. |
| `functions/dodo-webhook` | Verifies Standard Webhooks signatures, applies subscription events in order, idempotent, retried on failure. |
| `functions/delete-account` | Permanently deletes the account and every row it owns (App Store requirement). |

`tests/database.test.cjs` runs the real migration on PGlite (Postgres in WASM) and checks every policy as each role; `tests/edge-functions.test.cjs` exercises every handler path.

### Deploy

1. **Authenticate** — either the Supabase MCP server in `.mcp.json` (run `/mcp` in an interactive `claude` terminal, pick **supabase → Authenticate**), or the CLI: `brew install supabase/tap/supabase && supabase login && supabase link --project-ref knmgvpoyzzysakpmwjbm`.
2. **Database** — `supabase db push`.
3. **Auth settings** — `supabase config push` (enables anonymous sign-ins, rate limits and the 6-digit code email templates in `supabase/templates`). Or in the dashboard: Authentication → Sign In / Providers → allow anonymous sign-ins, and put `{{ .Token }}` in the Magic Link and Change Email templates.
4. **Secrets** — `supabase secrets set OPENROUTER_API_KEY=… DODO_PAYMENTS_API_KEY=… DODO_PAYMENTS_MODE=test DODO_PRODUCT_ID=… DODO_PAYMENTS_WEBHOOK_KEY=…`.
5. **Functions** — `supabase functions deploy` (the webhook deploys with `verify_jwt = false` from `config.toml`).
6. **Dodo webhook** — in the Dodo dashboard, add `https://knmgvpoyzzysakpmwjbm.supabase.co/functions/v1/dodo-webhook` for `subscription.*` and `payment.succeeded`, and use its signing secret as `DODO_PAYMENTS_WEBHOOK_KEY`.
7. **App** — set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (publishable key) in `.env.local` / EAS environment variables. Without them the app runs fully on-device, unlocked, for development.

### Before launch

- **App Store rules:** Apple generally requires In-App Purchase for digital subscriptions unlocked inside an iOS app; external checkout (Dodo) is only allowed in some regions and under specific rules. Confirm this for the markets you ship to, or add StoreKit alongside Dodo.
- **Trial abuse:** guest accounts are per install, so reinstalling starts a new trial. Supabase's anonymous sign-in rate limit is set to 30/hour per IP; consider enabling CAPTCHA (Authentication → Attack Protection) and storing the session in the iOS Keychain (`expo-secure-store`, requires a native rebuild) so it survives reinstalls.
- **Email delivery:** Supabase's built-in mailer sends only a few emails per hour and is meant for testing. Add custom SMTP (Authentication → Emails → SMTP, e.g. Resend or Postmark) before launch so sign-in codes arrive reliably.
- Switch `DODO_PAYMENTS_MODE` to `live` with a live key, and run the Supabase security and performance advisors after deploying.

