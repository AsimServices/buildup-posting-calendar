# Show Up — 90-Day Posting Calendar

React 19 and Next.js 16 with Radix UI dialogs and Lucide icons. Vinext powers the local preview; Next.js produces the static production export. All personal state is stored in localStorage; no application account, database, or API is required.

## Run

Install with `npm install`, then run `npm run dev`. The development server prints its local URL. `npm run build` generates the static export.

## Challenge

October 6, 2026–January 3, 2027, inclusive. The initial 55-post plan is Instagram Reels on Tuesdays, LinkedIn text posts on Wednesdays, Instagram carousels on Fridays, LinkedIn carousels on Sundays, plus LinkedIn posts on October 12, November 9, and December 7. Other days are rest days. Upcoming dates can be edited in the schedule dialog.

Karachi midnight controls unlocking, independent of the device's timezone. The oldest unanswered scheduled day must be answered first. Missed days are never inferred. Posted = +1; missed = −1; rest = 0. Existing answers can be corrected without accumulating duplicate points. The clock refreshes every 15 seconds and on window focus.

Storage key: `show-up-90-v1`. Browser data does not sync across devices or origins. Invalid storage is preserved and mutations pause with a visible warning. There is no reset button that could accidentally delete history.

## Verification

`node --test tests/schedule.test.mjs` exercises the challenge dates, score, locks, timezone and storage validation. `node node_modules/typescript/bin/tsc --noEmit` checks types. The optional browser check uses Playwright supplied through `PLAYWRIGHT_MODULES` and installed Microsoft Edge. Run with the development server running: `node tests/browser-check.mjs`.

The page offers an optional read-only WebMCP calendar tool when the browser implements `document.modelContext`; ordinary browser use does not depend on it. Native WebMCP validation was unavailable in the test browser.
