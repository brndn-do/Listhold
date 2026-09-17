# Listhold v2 — Product Spec for a Full Rewrite

**Status:** Draft for review
**Author:** Generated from an audit of `main` @ `0f58bd2`
**Audience:** Project owner / future contributors

---

## 1. Summary

Listhold v1 works. It does the hard part of its category — a live, correctly-ordered roster with an automated waitlist — and it does it with real concurrency discipline in the database. The demo flows in the README are genuine.

What v1 does not have is a **model of the things it manages**. There is no event lifecycle (no draft, no cancel, no close), no organization membership (only a single `owner_id`), no organizer controls (no edit, no remove attendee, no manual reorder), and no notification system beyond one fire-and-forget email. The gaps are not features that were skipped; they are features the current schema and trust boundary cannot express. Three examples:

- **The public event page cannot legally read its own event.** RLS on `events` grants read access only to the owner (`20260111231405_create_events.sql:60`), so `getEventBySlug` renders public pages with the **service-role key** (`src/lib/supabaseAdmin.ts`). Public visibility is implemented by bypassing authorization rather than by expressing it.
- **The dashboard cannot be built.** `EventsView` and `MembershipsView` are one-line stubs returning `"Your Events"`. They are stubs because a signed-in user cannot read the events they signed up for — only events they own. "My events" is unexpressible under the current policies.
- **Auto-promotion is a property of one code path, not of the data.** A seat only refills when someone cancels through `remove_user_from_event`. Raise a capacity, remove an attendee as an organizer, or delete a row directly, and the waitlist silently stalls.

This spec proposes a rewrite that keeps v1's two genuinely good decisions — **transactional seat allocation in Postgres** and **fractional `position` ordering** — and rebuilds everything around them: a real domain model, RLS as the single source of truth, one consolidated write path, a notification ledger, and a CI pipeline that actually gates the things that break.

---

## 2. Where Listhold is today

### 2.1 What works and should survive the rewrite

| Asset | Why it is worth keeping |
| :--- | :--- |
| Seat allocation under `SELECT capacity ... FOR UPDATE` | `add_user_to_event` / `remove_user_from_event` serialize all seat changes per event on the event row. This is a correct, simple solution to the overfill race. Keep the pattern. |
| Fractional `position` (`numeric(20,10)`, gaps of 100000) | Added in `20260216002422`. Enables manual reorder and insert-between without renumbering. Keep, and finally build the UI it was designed for. |
| Per-answer RLS on `answers` | Three-way policy (own answer / public prompt / event owner) is the right shape for a mixed-privacy questionnaire. Port it forward. |
| Realtime + polling fallback with debounced disconnect UI | `subscribeToList` degrades gracefully instead of lying about freshness. Genuinely good. Keep the UX contract. |
| Advisory-lock position assignment | `assign_signup_position` serializes appends per event to avoid duplicate `max+step`. Keep. |
| Docs discipline | `API.md`, `DB_SCHEMA.md`, `ROUTING_SCHEMA.md`, `SCENARIO.md` already exist and are accurate. Maintain this as a hard requirement, not a nicety. |

### 2.2 Structural findings that motivate a rewrite

Grouped by root cause, not severity. File references are to `main` @ `0f58bd2`.

#### A. The trust boundary is in the wrong place

1. **Public reads run as service role.** `getEventBySlug` and `getOrgBySlug` use `supabaseAdmin`. The Next.js server runtime therefore holds a key that bypasses all RLS in order to render anonymous pages. Blast radius is the whole database.
2. **`organizations` has RLS enabled and zero policies**, plus `REVOKE ALL ... FROM PUBLIC`. No client role can read an organization at all. Org pages work only because of finding A.1.
3. **`prompts` is world-readable** (`USING(true)`, `GRANT SELECT TO anon, authenticated`). Anyone can enumerate every question on every event, including unpublished ones.
4. **`signups` is world-readable.** Given an `event_id`, anyone can read the full roster, statuses and positions of any event. There is no per-event roster-privacy setting.
5. **Any authenticated user can create an event under any organization.** `create_event` resolves `orgSlug` → `organization_id` and inserts with `owner_id: callerId` (`supabase/functions/create_event/index.ts:86-104`) without ever checking that the caller owns or belongs to that organization. This is an authorization bug, currently unreachable from the UI only because the org flow is not linked.
6. **`Access-Control-Allow-Origin: '*'`** on every Edge Function (`_shared/cors.ts`).
7. **No server-side auth.** There is no `middleware.ts`. Sessions live in `localStorage` via `createBrowserClient`, so `/events/new`, `/dashboard` and `/profile` are client-gated only. Not a security hole (writes are checked server-side), but it forces every private page to be a client component and blocks SSR personalization.

#### B. The data model is missing its core nouns

8. **No event lifecycle.** No `status`, no `cancelled_at`, no `deleted_at`, no signup open/close window. Events are live from the instant they are created, forever. Signups for an event that ended last month still succeed.
9. **No organization membership.** `organizations.owner_id` is a single user. `SCENARIO.md` step 1 ("invites other executives to join as admins") and step 5 ("organizations they are involved in — owner, admin, member") are both unimplementable.
10. **No event mutation at all.** There is no `update_event`, `delete_event`, `cancel_event`, `remove_attendee`, or `reorder_signup` — not as an Edge Function, not as an RPC, not as UI. Once created, an event is immutable. An organizer who typos a capacity must create a new event and re-share the link.
11. **`capacity` is `NOT NULL CHECK (1..300)`**, yet both SQL functions carry a full `v_capacity IS NULL` "unlimited" branch. Dead code that reads as a supported feature.
12. **Question types are `yes/no` and `notice` only.** `SCENARIO.md` asks for free text and a waiver checkbox. `answers.answer` is `jsonb` and could hold anything; the type enum is the constraint.
13. **`notice` acknowledgements are never persisted.** `SignupWizard.handleNext` explicitly skips storing an answer when `type === 'notice'` (`SignupWizard.tsx:29`). The UI requires the user to tick "Click to continue" for a liability waiver, and then records nothing. An organizer cannot demonstrate that anyone acknowledged anything.

#### C. Correctness and consistency defects

14. **Phantom seats.** `event_list_view` is an `INNER JOIN` on `profiles` (`20260216010000...sql:23`). Profile rows are created **client-side** by `AuthProvider` after sign-in; there is no `handle_new_user` trigger on `auth.users`. A user whose profile write failed can still sign up (the Edge Function uses service role and only needs `auth.users`), but they will be invisible on the roster while holding a confirmed seat. `SpotsCounter` derives "spots left" from `confirmedList.length`, so it will advertise a seat that does not exist.
15. **Event times have no timezone.** `EventForm` builds ``new Date(`${startDate}T${startTime}`)`` (`EventForm.tsx:189`) — parsed in the **organizer's browser timezone** — then `.toISOString()`. The event's own timezone is never stored. An organizer who creates a 8:15 PM practice while travelling creates it at the wrong instant, and every attendee sees the time shifted to their own device. For an events product this is a primary-function bug.
16. **Promotion is path-dependent.** Only `remove_user_from_event` promotes. Nothing promotes on capacity increase, organizer-initiated removal, or any out-of-band change. There is no reconciliation function to repair a stalled waitlist.
17. **`create_event` is not atomic.** It inserts the event, then the prompts, and on prompt failure issues a compensating `DELETE` (`create_event/index.ts`). A crash between the two leaves an event with a partial questionnaire.
18. **Email is best-effort and unrecorded.** The promotion email is fired through `EdgeRuntime.waitUntil`, failures are `console.error`-only, and there is no record that a notification was attempted. No retry, no idempotency key, no delivery visibility. A promoted user can silently never learn they got in.
19. **No unsubscribe.** The email footer asserts "Your email has not been added to any marketing lists" in lieu of a preference centre or unsubscribe link.
20. **Validation logic is triplicated.** The slug regex `^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*[a-z0-9]$` appears in the `events` DDL, the `organizations` DDL, `create_event`, and `create_organization`; `EventForm` re-implements the same rule as four separate zod `.refine()` calls with different bounds (`>= 4` chars client-side vs `>= 3` server-side). Field limits are similarly restated in three layers.
21. **`ServiceError('reserved')` is unreachable as designed.** `create_event` maps Postgres `23514` (check violation — i.e. a malformed slug) to "slug is reserved". There is no reserved-word list anywhere in the schema.

#### D. Product surface is incomplete

22. **Dashboard is a stub** (`EventsView.tsx`, `MembershipsView.tsx` — both return `<p>Your Events</p>`), and blocked by finding A/B above.
23. **Organizations are shipped but disconnected.** `ROUTING_SCHEMA.md` marks `/organizations` "not in use currently". `DB_SCHEMA.md` marks the table "For future use".
24. **No organizer console.** No attendee management, no CSV export, no check-in, no activity log (`SCENARIO.md` "Management & Ongoing Operations" is entirely unbuilt).
25. **Photo upload is accepted and discarded.** Both `create_event` and `create_organization` validate a base64 `photo`/`avatar` field and never use it. `photo_url` / `avatar_url` columns exist; `[storage]` is `enabled = false` in `config.toml`.
26. **Google OAuth only**, with `[auth.email] enable_signup = false`. Anyone without a Google account cannot attend an event.
27. **Landing page is a headline.** No explanation, no sign-up path, no discovery.

#### E. Operations and quality gates

28. **CI never typechecks or builds.** `pipeline-develop.yml` / `pipeline-main.yml` run `npm run lint` and `npm test` only. `tsc --noEmit` and `next build` are absent from the gate; a type error reaches the deploy job before anything catches it.
29. **CI does not apply migrations or deploy Edge Functions.** Both are manual. The schema, the functions and the deployed app can drift from each other silently — and the app is deployed automatically while the schema it depends on is not.
30. **CI env vars are stale.** Workflows set `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the code reads `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`src/lib/supabase.ts`).
31. **Four unit tests exist**, all in `avatarUtils.test.ts`. There are zero tests for the concurrency-critical SQL functions (whose correctness argument lives only in code comments), zero for the Edge Functions, zero RLS policy tests, and no E2E coverage of the five flows the README advertises as gifs. `jest-axe` is installed and unused.
32. **`promote.sh` targets a `develop` branch** that does not exist in the repository.

### 2.3 Why rewrite rather than refactor

An incremental path exists for any single finding above. The case for a rewrite is that the findings **share four root causes**, and fixing any one of them is a breaking change to everything above it:

1. **RLS expresses ownership, not visibility.** Fixing this means rewriting every policy, deleting the service-role read path, and changing how every page fetches data.
2. **There is no membership or lifecycle model.** Adding either changes the primary key story for authorization (`owner_id` → role lookup) and therefore every policy again.
3. **Write paths are duplicated across three layers** (Edge Function zod, Postgres CHECK constraints, client zod) with no shared contract. Consolidating is a rewrite of all four Edge Functions and every form.
4. **Client-only sessions** force the entire authenticated surface to be client components. Moving to cookie-based SSR sessions rewrites the component tree.

Doing these four in sequence on a live codebase means four consecutive breaking migrations of the same policies and the same components. Doing them together, once, against a schema designed for the target state, is less total work and leaves one coherent artifact. The v1 database can be migrated forward in place (§10) — the *code* is what gets rewritten.

---

## 3. Product definition

### 3.1 Positioning

> Listhold is the fastest way for a small organization to run a capacity-limited, recurring event — where the roster is public, the waitlist is fair, and nobody has to ask "am I in?"

The competitive wedge is not features; it is **the live, ordered, trustworthy roster**. Eventbrite, Partiful and Google Forms all fail the recurring-club-practice case: no real waitlist fairness, no live position, no per-event questionnaire that respects privacy. v1 already wins on that axis. v2's job is to stop losing on everything around it.

### 3.2 Users and jobs to be done

**Organizer (primary — "Brandon")** — runs a club, 2–8 recurring events a month, 10–300 attendees each.
- Publish a capacity-limited event in under 60 seconds and share one link.
- Trust the list: the order is fair, the count is right, no-shows are visible.
- Fix mistakes: change capacity, move the time, cancel, remove a specific person.
- Answer "who's coming and what did they tell me?" without exporting anything.
- Delegate to co-organizers without handing over an account.

**Attendee (primary — "Alice")** — a member who wants a spot.
- See instantly whether there is a spot and take it in one tap.
- Know exactly where they stand on a waitlist, and be told the moment that changes.
- Leave without guilt or a support request.
- Answer the same three questions once, not every week.

**Waitlisted attendee (secondary — "Ben")** — same as Alice, plus:
- Be told promptly and reliably when a seat opens, with time to act.
- Not lose a seat to someone who joined the waitlist after them.

**Non-users in v2:** ticket buyers (no payments), conference organizers (no multi-track/sessions), public event discovery at internet scale (no search/browse marketplace).

### 3.3 Product principles

1. **The roster is the product.** Anything that makes the roster less trustworthy — stale counts, invisible attendees, unclear position — is a P0 defect, not a polish item.
2. **Fairness is mechanical and visible.** Waitlist order is explicit, stored, auditable, and shown to the person waiting. Any organizer override is logged.
3. **Authorization lives in the database.** One place. If RLS cannot express a visibility rule, the rule is wrong — not RLS.
4. **Every state change is a recorded event.** Promotions, removals, reorders, cancellations and notifications all leave a durable row. "It probably sent" is not an acceptable answer.
5. **Zero-setup for attendees.** No app, no account creation ceremony, no required fields beyond a name.
6. **Degrade honestly.** When realtime is down, say so (v1 already does this — hold the line).

---

## 4. Scope

### 4.1 v2.0 — must ship (parity + the gaps that block parity)

| # | Capability | Why it is in v2.0 |
| :--- | :--- | :--- |
| S1 | Cookie-based SSR auth; Google + email magic link | Unblocks the whole authenticated surface (findings 7, 26) |
| S2 | RLS-only data access; service role removed from page rendering | Root cause A (findings 1–4) |
| S3 | Event lifecycle: draft → published → closed/cancelled, with signup window | Root cause B (finding 8) |
| S4 | Event edit + cancel + delete | Finding 10 — the single most-requested missing capability |
| S5 | Organizations with roles (owner/admin/member) + invitations | Findings 5, 9, 23 |
| S6 | Waitlist engine: promotion on *any* seat release + reconciliation | Finding 16 |
| S7 | Organizer roster console: remove, reorder, view private answers, CSV export | Finding 24 |
| S8 | Question types: yes/no, single-select, short text, acknowledgement (persisted) | Findings 12, 13 |
| S9 | Notification ledger + idempotent delivery + preferences + unsubscribe | Findings 18, 19 |
| S10 | Event timezone stored and displayed correctly | Finding 15 |
| S11 | Working attendee dashboard (my events, my waitlists, my orgs) | Finding 22 |
| S12 | Profile provisioning in-database; roster cannot lose an attendee | Finding 14 |
| S13 | Shared contract package (zod + generated DB types) used by client, server, and tests | Finding 20 |
| S14 | CI gates: typecheck, build, unit, SQL, RLS-matrix, E2E; automated migrations + function deploys | Findings 28–31 |
| S15 | Accessibility: WCAG 2.1 AA on all core flows, keyboard + focus-trapped dialogs | Finding 31 |

### 4.2 v2.1 — next

- **Timed waitlist offers** (`SCENARIO.md` step 4): `offered` state, expiry window, accept/decline, auto-cascade to next person. Requires a scheduler (`pg_cron`).
- **Recurring events / series**: create Friday+Saturday practice in one action; per-occurrence rosters.
- **Cross-event restrictions**: "one practice per member per week" (`SCENARIO.md` Management).
- **Check-in + attendance history**: mark who showed; no-show tracking feeds future prioritization.
- **Image upload** for event banners and org logos (finding 25; needs Storage enabled).
- **Organization home as a discovery surface** with member-visible upcoming events.
- **Saved answers**: reuse last event's answers for recurring questionnaires.

### 4.3 Explicitly out of scope

Payments and ticketing · native mobile apps · SMS · calendar write-back (ICS download only) · public event search/marketplace · multi-track agendas · custom domains · white-labelling · analytics dashboards beyond basic counts · i18n (English only; the architecture must not preclude it).

---

## 5. Functional requirements

Numbered `FR-<domain>-<n>` for traceability into tickets and tests.

### 5.1 Identity and profiles

- **FR-ID-1** A user signs in with Google OAuth or an emailed magic link. Both produce the same account when the verified email matches.
- **FR-ID-2** A `profiles` row is created by a database trigger on `auth.users` insert, seeded from OAuth metadata. No client code is load-bearing for profile existence. *(Closes finding 14.)*
- **FR-ID-3** A profile has `display_name` (required, 1–100), `avatar_url` (optional), `timezone` (IANA, defaulted from the browser on first sign-in, editable).
- **FR-ID-4** The profile-completion prompt appears at most once per session and never on `/profile` or an auth callback. It must be dismissible and must not block signup.
- **FR-ID-5** A user can delete their account. Deletion anonymizes historical roster entries (`display_name` → "Deleted user", `avatar_url` → null) rather than removing them, preserving event history and ordering integrity. Their answers are hard-deleted.

### 5.2 Organizations and membership

- **FR-ORG-1** Any authenticated user can create an organization with a name (1–50) and an optional slug (3–36, URL-safe) and description (≤1000). A missing slug is generated from the name with a numeric suffix on collision — never a raw UUID.
- **FR-ORG-2** Membership is a row in `organization_members` with role `owner | admin | member`. The creator becomes `owner`. Exactly one owner must exist at all times; ownership is transferable.
- **FR-ORG-3** Role capabilities:
  | Action | owner | admin | member |
  | :--- | :-: | :-: | :-: |
  | Edit org profile | ✓ | ✓ | |
  | Invite / remove members | ✓ | ✓ (not owner/admin) | |
  | Create events under org | ✓ | ✓ | |
  | Edit / cancel any org event | ✓ | ✓ | |
  | Manage any org event roster | ✓ | ✓ | |
  | See member-only events | ✓ | ✓ | ✓ |
  | Transfer ownership / delete org | ✓ | | |
- **FR-ORG-4** Invitations are by email, expire in 14 days, and are accepted by an authenticated user whose verified email matches. Pending invitations are visible to admins.
- **FR-ORG-5** An event may only be attached to an organization the caller is an `owner` or `admin` of. This is enforced in the database, not the API layer. *(Closes finding 5.)*
- **FR-ORG-6** An organization page lists upcoming published events, member count, and — for members — member-only events.

### 5.3 Events

- **FR-EV-1** An event has: name (1–50), description (≤2000), location (1–200), `timezone` (IANA, required), `starts_at`, optional `ends_at` (> `starts_at`), capacity (1–1000), `waitlist_enabled`, `roster_visibility`, `promotion_mode`, optional `signup_opens_at` / `signup_closes_at`, optional banner, optional organization.
- **FR-EV-2** Lifecycle is `draft → published → closed`, plus terminal `cancelled`, plus soft `deleted_at`.
  - `draft`: visible only to organizers. Shareable preview link. No signups.
  - `published`: visible per `roster_visibility`. Signups allowed inside the signup window.
  - `closed`: signups rejected; roster remains readable. Reached automatically at `signup_closes_at`, or at `ends_at` if unset, or manually.
  - `cancelled`: all confirmed and waitlisted registrants notified; roster frozen and readable; page shows a cancellation banner.
- **FR-EV-3** Capacity is editable after publication. **Increasing** capacity immediately promotes from the waitlist in order until full (FR-WL-3). **Decreasing** capacity below the confirmed count is allowed only with explicit confirmation and never auto-removes anyone; the event enters an over-subscribed state, surfaced to the organizer, and no new confirmations occur until the count falls below capacity.
- **FR-EV-4** Changing `starts_at`, `ends_at`, `location` or `timezone` on a published event notifies all confirmed and waitlisted registrants.
- **FR-EV-5** Times are stored as `timestamptz` **plus** the event's IANA timezone. All times render in the event's timezone by default, with a secondary local-time rendering when the viewer's timezone differs. Event creation interprets wall-clock input in the selected event timezone, never the organizer's device timezone. *(Closes finding 15.)*
- **FR-EV-6** `roster_visibility` ∈ `public | attendees | organizers`, default `public`. It governs who can read the roster and the spot count. *(Closes finding 4.)*
- **FR-EV-7** Slugs: user-supplied (3–36, URL-safe, unique, case-normalized) or generated from the name. A reserved-word list (`new`, `api`, `auth`, `admin`, `dashboard`, `events`, `organizations`, `profile`, `login`, `logout`, `settings`, `static`, `_next`) is enforced by a database constraint, making the existing "reserved" error path real. *(Closes finding 21.)*
- **FR-EV-8** Deleting an event soft-deletes it, frees the slug after 30 days, and notifies registrants. Hard delete is an admin-only operation.
- **FR-EV-9** An event page exposes an `.ics` download and OG/Twitter metadata (title, description, banner, spots remaining at build time).

### 5.4 Questionnaires

- **FR-Q-1** Question types:
  | Type | Input | Answer shape | Notes |
  | :--- | :--- | :--- | :--- |
  | `yes_no` | radio | `boolean` | v1 parity |
  | `acknowledgement` | checkbox | `{ acknowledged: true, at: timestamptz }` | **Must persist.** Advances only when ticked. *(Closes finding 13.)* |
  | `short_text` | text input | `string` (≤500) | `SCENARIO.md` "Anything you want to share?" |
  | `single_select` | radio group | `string` (one of `options`) | Options defined per question |
- **FR-Q-2** A question has `position`, `label` (1–300), optional `help_text`, `required`, and `visibility` ∈ `public | organizers`.
- **FR-Q-3** Questions are editable while the event is a `draft`. After publication: labels and help text may be corrected; types, options and `required` are frozen; new questions may be appended but are not required of anyone who already signed up. Existing answers are never silently invalidated.
- **FR-Q-4** Answer visibility: the answering user always sees their own; organizers of the event (and org admins) see all; everyone else sees only answers to `visibility = public` questions. *(Ports v1's `answers` policy.)*
- **FR-Q-5** The signup wizard must persist partial progress locally, support Back without losing answers, be fully keyboard-navigable, trap focus, and close on `Escape`.

### 5.5 Signups and the waitlist engine

This is the correctness core. Every requirement here needs a test.

- **FR-WL-1 (No overfill)** The count of `confirmed` registrations for an event never exceeds its capacity, under any number of concurrent requests. Enforced by serializing all seat transitions for an event on the event row (`SELECT ... FOR UPDATE`), as v1 does. *(Keeps v1's design; adds the missing test.)*
- **FR-WL-2 (Deterministic order)** Every registration has a unique `position` within its event (`numeric`, gapped). Waitlist promotion order is strictly ascending `position`. Order is never derived from `created_at`. *(Keeps v1's design.)*
- **FR-WL-3 (Promotion is a property of the data)** Whenever the confirmed count for an event drops below capacity — self-withdrawal, organizer removal, capacity increase, offer decline, offer expiry — the top of the waitlist is promoted, repeatedly, until the event is full or the waitlist is empty. This is implemented in **exactly one** database routine invoked by all seat-releasing paths, not duplicated per caller. *(Closes finding 16.)*
- **FR-WL-4 (Reconciliation)** `reconcile_event(event_id)` recomputes the correct confirmed/waitlisted split from capacity and `position`, promoting as needed, and is idempotent. It is callable by organizers, runs after any capacity change, and runs on a schedule as a safety net.
- **FR-WL-5 (Rejoin)** A user who withdraws and rejoins goes to the **back** of the order and answers the questionnaire again. Their prior answers are deleted. *(Keeps v1's behaviour, now explicit.)*
- **FR-WL-6 (Visible position)** A waitlisted user always sees their position ("#3 on the waitlist"), updated in realtime.
- **FR-WL-7 (Signup window)** Signups are rejected when the event is `draft`, `closed`, `cancelled`, deleted, before `signup_opens_at`, after `signup_closes_at`, or (absent an explicit window) after `ends_at`. *(Closes finding 8.)*
- **FR-WL-8 (Idempotency)** Repeated signup requests for an existing non-withdrawn registration return the current state without side effects. Repeated withdrawals are no-ops. *(Keeps v1's behaviour.)*
- **FR-WL-9 (Organizer actions)** An organizer may: add a user by email, remove a registrant (with an optional reason, notified), move a registrant to a specific position, promote out of order (logged as an override), and move someone between the confirmed list and the waitlist.
- **FR-WL-10 (Rate limiting)** Per-user signup/withdraw actions are rate-limited server-side (e.g. 10 state changes per event per hour) with a clear error. v1 relies on a client-side cooldown only.
- **FR-WL-11 (Roster completeness)** A registration is visible on the roster regardless of profile state. The roster query must not be able to drop a seat-holder. *(Closes finding 14 — no inner join to `profiles` on the read path.)*
- **FR-WL-12 (Promotion mode)** Per event, `promotion_mode` ∈ `auto` (v2.0 default, v1 behaviour: promoted straight to confirmed) | `offer` (v2.1: timed offer the user must accept).

### 5.6 Notifications

- **FR-NT-1** Every notification is a row in `notifications` with a **unique `dedupe_key`**, written inside the same transaction as the state change that caused it. Delivery is a separate, retrying worker. A state change can never occur without its notification being durably queued, and a notification can never be sent twice. *(Closes finding 18.)*
- **FR-NT-2** v2.0 notification kinds: `waitlist_promoted`, `registration_confirmed`, `event_cancelled`, `event_time_changed`, `event_location_changed`, `removed_by_organizer`, `event_reminder` (24h before, confirmed only), `org_invitation`.
- **FR-NT-3** Users have per-kind email preferences. Transactional notifications about a seat they hold (`waitlist_promoted`, `event_cancelled`, `removed_by_organizer`) are not opt-out-able; reminders and digests are.
- **FR-NT-4** Every email carries a one-click unsubscribe link (list-unsubscribe header + landing page) for opt-out-able kinds. *(Closes finding 19.)*
- **FR-NT-5** Delivery outcomes (sent, bounced, failed, attempts) are recorded. An organizer can see whether a promoted attendee was actually reached.
- **FR-NT-6** In-app notification centre showing recent changes to the user's registrations — the "recent activity" surface `SCENARIO.md` step 5 asks for.
- **FR-NT-7** Emails render correctly as plain text and in dark mode, and pass a link-rot check in CI (all URLs absolute and derived from one configured base URL).

### 5.7 Attendee dashboard

- **FR-DB-1** `/dashboard` shows, for the signed-in user: upcoming confirmed events, upcoming waitlisted events (with position), organizations by role, and recent activity. *(Closes finding 22.)*
- **FR-DB-2** Past events are a separate, paginated section.
- **FR-DB-3** The dashboard is server-rendered with the user's session. It must not require a service-role read.
- **FR-DB-4** Empty states link to the relevant creation or discovery action.

### 5.8 Organizer console

- **FR-OC-1** `/events/[slug]/manage` — roster table (name, status, position, joined, all answers), inline actions from FR-WL-9, live via the same realtime channel as the public page.
- **FR-OC-2** CSV export of the roster including private answers, with a header row and a generation timestamp.
- **FR-OC-3** Per-event activity log: who did what, when, to whom — promotions (automatic and manual), removals, reorders, capacity changes, lifecycle transitions. Append-only, readable by organizers. *(`SCENARIO.md` "Admins can view an event's activity log".)*
- **FR-OC-4** Event settings editor covering every field in FR-EV-1 with the mutation rules from FR-EV-3/4 and FR-Q-3.
- **FR-OC-5** `/events` organizer index: my events and my orgs' events, grouped upcoming / past / drafts.

### 5.9 Public and marketing surface

- **FR-PUB-1** Landing page explaining the product, with a primary "Create an event" CTA and one screenshot of a live roster. *(Closes finding 27.)*
- **FR-PUB-2** Event page is fast and shareable: server-rendered event details, client-hydrated live roster, correct OG tags, copy-link and native share.
- **FR-PUB-3** `robots.txt` and a sitemap covering published, public events only.
- **FR-PUB-4** Legal pages: privacy policy and terms, both reachable from the footer.

---

## 6. Domain and data model

Target schema. Changes from v1 are marked **[new]**, **[changed]**, **[removed]**.

```
profiles
  id                uuid PK → auth.users(id) ON DELETE CASCADE
  display_name      text NOT NULL CHECK (1..100)        [changed: NOT NULL]
  avatar_url        text CHECK (<=500)
  timezone          text NOT NULL DEFAULT 'UTC'          [new]
  profile_completed_at timestamptz
  created_at        timestamptz NOT NULL DEFAULT now()   [new]
  -- [new] trigger on auth.users AFTER INSERT creates this row

organizations
  id, slug (unique, URL-safe, 3..36), name (1..50), description (<=1000),
  avatar_url, created_at,
  deleted_at        timestamptz                          [new]
  -- [removed] owner_id → replaced by organization_members

organization_members                                     [new]
  org_id      uuid FK organizations ON DELETE CASCADE
  user_id     uuid FK auth.users ON DELETE CASCADE
  role        org_role_enum ('owner','admin','member')
  joined_at   timestamptz NOT NULL DEFAULT now()
  PRIMARY KEY (org_id, user_id)
  -- partial unique index guarantees exactly one 'owner' per org

organization_invitations                                 [new]
  id, org_id, email (citext), role, invited_by,
  token (unique), created_at, expires_at, accepted_at, accepted_by

events
  id, slug (unique, URL-safe, reserved-word constraint [new]),
  organization_id   uuid FK organizations
  created_by        uuid FK auth.users                   [changed: renamed from owner_id]
  name (1..50), description (<=2000) [changed: 1000→2000], location (1..200),
  timezone          text NOT NULL                        [new]
  starts_at, ends_at,
  capacity          integer NOT NULL CHECK (1..1000)     [changed: 300→1000, NULL branch dropped]
  status            event_status_enum
                    ('draft','published','closed','cancelled')  [new]
  published_at, closed_at, cancelled_at, cancellation_reason     [new]
  signup_opens_at, signup_closes_at                      [new]
  waitlist_enabled  boolean NOT NULL DEFAULT true        [new]
  roster_visibility roster_visibility_enum
                    ('public','attendees','organizers')  [new]
  promotion_mode    promotion_mode_enum ('auto','offer') [new]
  banner_url, created_at,
  updated_at        timestamptz NOT NULL DEFAULT now()   [new]
  deleted_at        timestamptz                          [new]

event_questions                          [changed: renamed from prompts]
  id, event_id, position (>0),
  kind        question_kind_enum
              ('yes_no','acknowledgement','short_text','single_select') [changed]
  label (1..300),
  help_text   text CHECK (<=500)                         [new]
  required    boolean NOT NULL DEFAULT true
  visibility  answer_visibility_enum ('public','organizers') [changed: from is_private]
  options     jsonb                                      [new] (single_select only)
  created_at
  UNIQUE (event_id, position) DEFERRABLE  [changed: deferrable, so reordering works]

registrations                            [changed: renamed from signups]
  id, user_id, event_id,
  state       registration_state_enum
              ('confirmed','waitlisted','offered','declined','withdrawn','removed') [changed]
  position    numeric(20,10) NOT NULL CHECK (> 0)        (kept from v1)
  joined_at   timestamptz NOT NULL DEFAULT now()         [changed: renamed from created_at]
  state_changed_at timestamptz NOT NULL DEFAULT now()    [changed: renamed from last_updated]
  removed_by  uuid FK auth.users                         [new]
  removal_reason text                                    [new]
  UNIQUE (user_id, event_id)
  UNIQUE (event_id, position)
  -- partial index on (event_id, position) WHERE state = 'waitlisted' for promotion
  -- partial index on (event_id) WHERE state = 'confirmed' for the capacity count

registration_answers                     [changed: renamed from answers]
  id, registration_id, question_id, value jsonb NOT NULL, created_at,
  updated_at                                             [new]
  UNIQUE (registration_id, question_id)

waitlist_offers                                          [new, v2.1]
  id, registration_id, offered_at, expires_at, responded_at,
  outcome offer_outcome_enum ('accepted','declined','expired')

notifications                                            [new]
  id, user_id, kind, event_id, registration_id,
  dedupe_key text UNIQUE NOT NULL,
  payload jsonb, created_at,
  sent_at, failed_at, attempts int NOT NULL DEFAULT 0, last_error text

notification_preferences                                 [new]
  user_id, kind, email_enabled boolean, PRIMARY KEY (user_id, kind)

event_activity                                           [new]
  id, event_id, actor_id (null = system), action, target_registration_id,
  metadata jsonb, created_at    -- append-only; no UPDATE/DELETE grants
```

### 6.1 Authorization model

One helper set, used by every policy, so authorization is stated once:

```sql
is_org_manager(org_id)   -- caller is owner|admin of org
is_event_manager(event_id) -- caller is events.created_by, or is_org_manager(events.organization_id)
is_event_registrant(event_id) -- caller has a non-terminal registration
can_view_event(event_id)   -- published & not deleted, OR is_event_manager
can_view_roster(event_id)  -- per roster_visibility + the above
```

Policy summary (the table that replaces findings 1–4):

| Table | SELECT | INSERT / UPDATE / DELETE |
| :--- | :--- | :--- |
| `profiles` | public (name + avatar only, via a view) | self |
| `organizations` | published orgs: public; deleted: managers | `is_org_manager` |
| `organization_members` | members of the same org | `is_org_manager` (with owner rules) |
| `events` | `can_view_event` | `is_event_manager` via RPC only |
| `event_questions` | `can_view_event` | `is_event_manager` via RPC only |
| `registrations` | `can_view_roster`, plus always own | RPC only (no direct writes) |
| `registration_answers` | own, OR `visibility='public'` + `can_view_roster`, OR `is_event_manager` | RPC only |
| `notifications` | own | system only |
| `event_activity` | `is_event_manager` | system only (append) |

**The service-role key is never used to render a page.** It is used only by the notification worker, scheduled jobs, and explicit admin tooling. *(Closes findings 1–4.)*

### 6.2 Write path

All mutations go through `SECURITY DEFINER` Postgres functions that perform their own authorization check as their first statement. Direct table writes are revoked from `anon` and `authenticated`.

```
create_event(payload jsonb)                 -- atomic: event + questions in one tx (closes finding 17)
update_event(event_id, patch jsonb)         -- enforces FR-EV-3/4 mutation rules
publish_event / close_event / cancel_event / delete_event
reorder_event_questions(event_id, ordered_ids uuid[])
register_for_event(event_id, user_id, answers jsonb)   -- v1's add_user_to_event, extended
withdraw_registration(event_id, user_id)               -- v1's remove_user_from_event, extended
organizer_remove_registrant(registration_id, reason)
move_registration(registration_id, after_registration_id)
set_event_capacity(event_id, capacity)      -- then calls promote_from_waitlist
promote_from_waitlist(event_id)             -- THE single promotion routine (FR-WL-3)
reconcile_event(event_id)                   -- idempotent repair (FR-WL-4)
create_organization / update_organization / invite_member / accept_invitation /
  set_member_role / remove_member / transfer_ownership
```

Every one of these that changes a seat or a lifecycle state also writes `event_activity` and, where FR-NT-2 applies, a `notifications` row — in the same transaction.

---

## 7. Architecture

### 7.1 Stack decisions

| Layer | Choice | Rationale / change from v1 |
| :--- | :--- | :--- |
| Frontend | Next.js (App Router), React, TypeScript, Tailwind | Unchanged. v1's structure is sound. |
| Session | `@supabase/ssr` with **cookie** storage + `middleware.ts` | **Changed.** Enables server components and server-side guards; removes the `localStorage` scraping in `signOut`. *(Closes finding 7.)* |
| Reads | Server Components with the user's session; RLS enforced | **Changed.** No `supabaseAdmin` on the render path. |
| Writes | Next.js Route Handlers → Postgres RPCs | **Changed.** Collapses the four Edge Functions into the app repo: one language, one type source, one deploy, testable in the same suite. |
| Edge Functions | Retained **only** for the notification worker and scheduled jobs | Network egress and cron do belong outside the request path. |
| Realtime | `postgres_changes` on `registrations`, filtered per event | Kept, with a narrower payload (§7.2). |
| Email | SMTP2GO behind a `NotificationTransport` interface | Kept, but pluggable and behind the ledger. |
| Storage | Supabase Storage, enabled | **Changed** — `[storage] enabled = false` today, which is why photo upload is dead code. |
| Scheduler | `pg_cron` (reminders, offer expiry, reconciliation sweep) | **New.** |
| Contracts | `src/contracts/` — zod schemas + generated DB types, imported by client, server and tests | **New.** *(Closes finding 20.)* |
| Observability | Structured JSON logs + Sentry (client + server) + a `/healthz` that checks DB and migration version | **New.** |

### 7.2 Realtime redesign

v1 re-fetches the **entire roster** on every write to the event, throttled to 500 ms (`subscribeToList` → `refreshList` → `fetchList`). With *N* viewers and *W* writes, that is *N×W* full roster reads. At capacity 300 with a burst of signups it is wasteful, and it will not scale to capacity 1000.

v2:
1. Realtime `postgres_changes` delivers the changed row.
2. The client applies the delta to local state optimistically.
3. A **cursor-based reconciliation** fetch (`WHERE state_changed_at > :cursor`) runs on a throttle to repair any missed message, instead of a full snapshot.
4. A full snapshot is fetched only on mount, on reconnect, and if the cursor fetch reports a version mismatch.
5. Polling fallback and the debounced "you are disconnected" UX from v1 are preserved verbatim — that behaviour is good.

### 7.3 Repository layout

```
/src
  /app                    routes (grouped: (public) / (auth) / (manage))
  /components             presentational, no data fetching
  /features               vertical slices: events, registrations, orgs, notifications
  /contracts              zod schemas + generated DB types  ← single source of truth
  /server                 route handlers, RPC wrappers, server-only helpers
  /lib                    supabase clients (browser / server / service), logging
/supabase
  /migrations             forward-only SQL
  /functions              notification-worker, scheduled-jobs only
  /tests                  pgTAP: RPC behaviour, RLS matrix, concurrency
/e2e                      Playwright specs mirroring the README gifs
/docs                     API.md, DB_SCHEMA.md, ROUTING_SCHEMA.md, SCENARIO.md, this file
```

---

## 8. Non-functional requirements

### 8.1 Correctness (the bar that matters most)

- **NFR-C-1** Zero overfill under concurrency. Verified by a test that fires ≥50 simultaneous registrations at a capacity-10 event and asserts exactly 10 confirmed, 40 waitlisted, contiguous ordering, no duplicate positions.
- **NFR-C-2** Every seat-releasing path promotes. Verified by a matrix test over {self-withdraw, organizer-remove, capacity-increase, offer-decline, offer-expiry} × {waitlist empty, waitlist non-empty}.
- **NFR-C-3** `reconcile_event` is idempotent: running it twice on any state produces the same result and no notifications the second time.
- **NFR-C-4** No registration can be invisible on the roster while holding a seat (FR-WL-11), verified with a seat-holder whose profile row is missing.
- **NFR-C-5** Timezone correctness: an event created as "8:15 PM America/Chicago" is stored, re-read, edited, and rendered as 8:15 PM Chicago regardless of server or client timezone. CI runs the suite under at least two `TZ` values.

### 8.2 Performance

- Event page TTFB p95 < 400 ms; LCP p95 < 2.0 s on 4G.
- Roster snapshot (300 confirmed + 100 waitlisted, with answers) p95 < 200 ms.
- Realtime roster update visible p95 < 1 s from commit.
- Registration RPC p95 < 300 ms at 20 concurrent writers on one event.
- Event page remains cacheable; capacity and roster are client-hydrated so ISR staleness never shows a wrong count. (v1's `force-static` + `revalidate = 60` can serve a 60-second-stale capacity.)

### 8.3 Accessibility

- WCAG 2.1 AA on: landing, event page, signup wizard, dashboard, event creation, organizer console.
- Every dialog: `role="dialog"`, `aria-modal`, focus trap, focus restoration, `Escape` to close. v1's `SignupWizard` has the role but no focus management, and the leave-confirmation overlay has no role at all.
- The confirmed/waitlist tabs use a real `role="tablist"` with arrow-key navigation (v1 uses unlabelled buttons).
- Roster updates announce via a polite live region.
- `jest-axe` assertions on every page-level component — the dependency is already installed and unused.
- Full keyboard path through the signup wizard; visible focus rings; no colour-only status encoding.

### 8.4 Privacy and data protection

- Answer visibility per FR-Q-4, enforced in RLS and verified by the RLS matrix test.
- `roster_visibility` defaults to `public` (v1's de facto behaviour) but is per-event configurable, and the choice is shown to the user *before* they answer questions.
- Terminal registrations (`withdrawn`, `removed`) are **not** publicly readable — only the registrant and event managers see them. v1 exposes every row including withdrawals.
- Retention: answers for `withdrawn` registrations are deleted after 90 days; `event_activity` is retained 2 years; `notifications` payloads are pruned after 180 days.
- Account deletion per FR-ID-5. Data export (own profile, registrations, answers) as JSON.
- Secrets: the service-role key is present only in the notification worker and scheduled-job runtimes, never in the web runtime.
- CORS restricted to the configured app origins, not `*`. *(Closes finding 6.)*

### 8.5 Reliability and operations

- Notification delivery: at-least-once with dedupe, ≥3 retries with backoff, dead-letter visibility after exhaustion.
- A failed notification never rolls back the state change that caused it, and never disappears.
- `/healthz` reports DB reachability and the applied migration version; a mismatch between the app's expected schema version and the DB's is a deploy-blocking failure. *(Directly addresses finding 29.)*
- Structured logs with a request id; no PII in logs (v1 logs a raw caller id at `create_event/index.ts:84`).
- Error budget: 99.9% availability for the event page read path.

---

## 9. Testing strategy

v1 has 4 tests and no coverage of anything that can lose someone's seat. v2's suite is specified as a deliverable, not a follow-up.

| Layer | Tool | Must cover |
| :--- | :--- | :--- |
| Database logic | pgTAP (`supabase test db`) | Every RPC's happy path + every authorization rejection; NFR-C-1 concurrency; NFR-C-2 promotion matrix; NFR-C-3 idempotency; position uniqueness and ordering invariants |
| RLS | pgTAP matrix | For each table × each role (anon, registrant, other authenticated, org member, org admin, event manager) × each verb: expected allow/deny. Generated from the §6.1 table so the doc and the test cannot drift |
| Unit | Jest/Vitest | Pure logic: time formatting (incl. DST and multi-day), slug generation and normalization, position arithmetic, answer serialization, notification dedupe keys |
| Contracts | Jest | Every zod schema in `/contracts` round-trips against the generated DB types; a schema/DDL mismatch fails CI |
| Component | React Testing Library + `jest-axe` | Signup wizard (keyboard, Back, partial persistence, acknowledgement gating), roster list, spots counter, disconnected states, all dialogs |
| E2E | Playwright | The five README gifs as executable specs: create event · sign up · live roster across two browser contexts · join waitlist when full · auto-promotion with notification row asserted. Plus: edit capacity → promotion; cancel event → notifications; organizer removes attendee |
| Accessibility | Playwright + axe | Page-level scan of all six core surfaces |

**Definition of done for any seat-affecting change:** a pgTAP test that fails before the change and passes after.

### 9.1 CI/CD pipeline

Gates, in order, on every pull request:

1. `npm ci`
2. `npm run lint`
3. **`tsc --noEmit`** ← absent from v1's pipeline
4. **`next build`** ← absent from v1's pipeline
5. `npm test` (unit + component + contracts)
6. **`supabase db reset && supabase test db`** (pgTAP: RPCs, RLS matrix, concurrency) ← absent
7. **`npm run e2e`** against a preview deployment with a seeded ephemeral database ← absent
8. Migration lint: forward-only, no edits to applied migrations, filename ordering

On merge to the release branch:

9. **`supabase db push`** (migrations) — **before** the app deploy, gated on 1–8
10. **`supabase functions deploy`** (worker + scheduled jobs)
11. `vercel deploy --prod`
12. Post-deploy smoke: `/healthz` migration-version match, one synthetic signup/withdraw against a canary event

Items 9–10 are the fix for finding 29: today the app deploys automatically while the schema it depends on is applied by hand. Also fix the stale `NEXT_PUBLIC_SUPABASE_ANON_KEY` in both workflow files (finding 30), and either create the `develop` branch `promote.sh` expects or retire the script (finding 32).

---

## 10. Migration and cutover

`listhold.com` is live. Event and organization links have been shared into club mailing lists, so **slugs are permanent public identifiers** and must not change.

### 10.1 Strategy: migrate the database in place, rewrite the application

Do **not** create a new Supabase project. Staying on the existing project preserves `auth.users` (so every user keeps their account and their signups) and keeps existing links valid. The rewrite is of the application layer; the schema evolves forward through ordinary migrations using expand → migrate → contract.

### 10.2 Table-by-table plan

| v1 | v2 | Approach |
| :--- | :--- | :--- |
| `profiles` | `profiles` | Add `timezone`, `created_at`. Backfill `display_name` where null from `auth.users` metadata, else `'Member'`. Add the `auth.users` trigger and backfill any missing rows — **this also repairs existing phantom seats (finding 14)**. |
| `organizations.owner_id` | `organization_members` | Insert one `owner` row per existing organization, then drop `owner_id`. |
| `events` | `events` | Add new columns. Backfill `status = 'published'` (v1 has no drafts), `created_by = owner_id`, `roster_visibility = 'public'`, `waitlist_enabled = true`, `promotion_mode = 'auto'`, `updated_at = created_at`. **`timezone` requires a decision — see §12 Q1.** |
| `prompts` | `event_questions` | Rename; map `prompt_type 'yes/no' → 'yes_no'`, `'notice' → 'acknowledgement'`; `is_private → visibility`; `display_order → position`. |
| `signups` | `registrations` | Rename; `status → state` (`'confirmed'`/`'waitlisted'`/`'withdrawn'` map 1:1); `created_at → joined_at`; `last_updated → state_changed_at`. `position` carries over unchanged — **v1's fractional positions are already correct**. |
| `answers` | `registration_answers` | Rename; `answer → value`. Existing `boolean` values are valid `yes_no` answers. Acknowledgements have no historical data (finding 13) — leave null and do not retrofit. |
| `event_list_view` | *(replaced)* | Drop. Replaced by a `LEFT JOIN`-based roster view that cannot drop a seat-holder (FR-WL-11). |
| — | `notifications`, `notification_preferences`, `event_activity`, `organization_invitations`, `waitlist_offers` | New, empty. Seed `notification_preferences` with defaults for all existing users. |

### 10.3 Post-migration data repair

Run once, after migration, before cutover:

1. `reconcile_event` on every future event — repairs any waitlist stalled by finding 16.
2. Assert every `confirmed` count ≤ capacity; report any over-subscribed event to the owner rather than auto-removing anyone.
3. Assert every registration has a profile row and appears in the new roster view.
4. Assert position uniqueness per event.
5. Snapshot every event's roster before and after; **diff must be empty** except for repairs from steps 1–3, each individually reviewed.

### 10.4 Cutover

1. Build v2 against a **restored copy** of production data. Run §10.3 there and review the diff.
2. Ship the migrations to production behind the v1 app — the expand phase is backward-compatible, so v1 keeps running.
3. Deploy v2 to a preview domain; run the full E2E suite against production-shaped data.
4. Announce a 15-minute maintenance window to organizers with upcoming events.
5. Point production at v2. Keep v1's deployment warm for one-click rollback for 72 hours (the contract phase — dropping `owner_id` etc. — waits until after that window).
6. Run the contract migrations.

**Rollback:** while the expand phase is still in place, v1 continues to work against the v2 schema. This is the reason for the expand/contract split and the 72-hour delay.

---

## 11. Milestones

Sequenced so that each milestone is independently reviewable and the risky correctness work lands early, with its tests.

| M | Milestone | Contents | Exit criteria |
| :--- | :--- | :--- | :--- |
| **M0** | Foundations | Repo layout, `/contracts`, cookie sessions + middleware, CI with all gates (§9.1) incl. pgTAP and Playwright harnesses, Sentry, `/healthz` | CI red on a deliberately broken type, a broken migration, and a failing RLS assertion |
| **M1** | Schema + authorization | Full §6 schema as forward migrations, helper functions, all RLS policies, the generated RLS matrix test, `auth.users` trigger | RLS matrix green; **service role removed from all read paths**; §10.3 repair script runs clean on a prod copy |
| **M2** | Waitlist engine | All seat RPCs, the single `promote_from_waitlist`, `reconcile_event`, `event_activity` writes | NFR-C-1/2/3 tests green; concurrency test at 50 writers |
| **M3** | Event lifecycle + organizer console | Create/edit/publish/close/cancel/delete, question editor, roster console, reorder, CSV, activity log | An organizer can run a full event start to finish without touching the database |
| **M4** | Attendee experience | Event page, signup wizard (all four question kinds), realtime v2, dashboard, profile | E2E specs for all five README gifs green; axe clean on six surfaces |
| **M5** | Organizations | Membership, roles, invitations, org home, member-only events | FR-ORG-3 capability matrix green; finding 5 authz gap has a regression test |
| **M6** | Notifications | Ledger, worker, retries, preferences, unsubscribe, reminders, in-app centre | Promotion email delivery observable end-to-end; dedupe verified under duplicate triggers |
| **M7** | Cutover | §10.4 | Production on v2; roster diff empty; rollback rehearsed at least once |

M2 before M3/M4 is deliberate: the seat engine is the part where a bug costs a real person a real spot, and it is the part with zero test coverage today.

---

## 12. Open questions

These need the owner's decision; several block migration work.

- **Q1 — Event timezone backfill (blocks M1).** Existing events have no timezone. Options: (a) backfill all to a single default — `America/Chicago` is the likely answer given the Northwestern Archery Club scenario; (b) infer per event from the creator's profile once profiles carry a timezone; (c) ask organizers to confirm on first v2 login. **Recommendation: (a) with a one-time organizer confirmation banner on each future event.** Getting this wrong silently moves real events.
- **Q2 — Roster visibility default.** v1 is effectively fully public. Keep `public` as the default (no behaviour change for existing events), or default new events to `attendees`? **Recommendation: keep `public` for migrated events; default new events to `public` with the setting surfaced prominently at creation.**
- **Q3 — Offer flow timing.** `SCENARIO.md` specifies a timed accept/decline offer. It needs a scheduler, a new state, and a notably more complex UI. Ship in v2.0 or v2.1? **Recommendation: v2.1.** `promotion_mode` exists in the v2.0 schema so no migration is needed later.
- **Q4 — Auth providers.** Add email magic link in v2.0 (widens the addressable audience; `[auth.email] enable_signup = false` today), or stay Google-only? **Recommendation: add magic link** — a Google account is a hard gate on attendance.
- **Q5 — Capacity ceiling.** v1 caps at 300. Raise to 1000, or keep 300? This drives realtime and roster-rendering budgets (virtualized list needed above ~500).
- **Q6 — Withdrawn-row visibility.** v1 exposes withdrawals publicly via `signups`. v2 proposes hiding them. Do organizers need to see who left, and should attendees? **Recommendation: managers only, via the activity log.**
- **Q7 — Organizations as a launch feature.** Orgs are half-built and unlinked. Full membership in v2.0 (M5) is meaningful scope. Alternative: ship v2.0 with events only and orgs in v2.1. **Recommendation: keep M5 in v2.0** — it is the single biggest thing `SCENARIO.md` promises and cannot be retrofitted cheaply once event authorization ships without it.
- **Q8 — Branch strategy.** `promote.sh` and both workflows assume a `develop` branch that does not exist. Adopt `develop` → `main`, or move to trunk-based with preview deploys per PR? **Recommendation: trunk-based**; retire `promote.sh`.
- **Q9 — Email deliverability.** Staying on SMTP2GO? v2 needs SPF/DKIM/DMARC configured, a dedicated sending subdomain, and bounce webhooks for FR-NT-5.
- **Q10 — Data retention.** Are the §8.4 windows (90 days for withdrawn answers, 2 years for activity) acceptable?

---

## 13. Success metrics

Measured against v1 as baseline.

**Correctness (must be perfect, not merely better)**
- Overfill incidents: **0**
- Stalled waitlists — an event with an open seat and a non-empty waitlist for >60 s: **0**
- Phantom seats — seat-holders absent from the roster: **0**
- Promotion notifications successfully delivered: **>99%**, and 100% *observable* (finding 18 means the current rate is unknown)

**Product**
- Organizer can create a published event in **<60 s** median
- Events edited after publication: **>30%** in the first month — a capability that currently does not exist, so any usage proves latent demand
- Events created under an organization: **>50%** (currently 0%)
- Dashboard weekly-active share of signed-in users: **>40%** (currently 0%)
- Repeat organizers — created an event in two consecutive months: **>60%**

**Quality**
- pgTAP coverage of all seat-affecting RPCs: **100%**
- RLS matrix assertions: **100%** of the §6.1 table
- Lighthouse a11y on all six core surfaces: **≥95**
- Event page LCP p95: **<2.0 s** on 4G
- Realtime update latency p95: **<1 s**

---

## Appendix A — Findings index

Quick map from the §2.2 findings to the requirement that closes each one.

| # | Finding | Closed by |
| :-: | :--- | :--- |
| 1 | Public reads use service role | S2, §6.1, FR-EV-6 |
| 2 | `organizations` has no RLS policies | S2, §6.1 |
| 3 | `prompts` world-readable | §6.1 (`can_view_event`) |
| 4 | `signups` world-readable | FR-EV-6, §6.1 |
| 5 | Any user can create events under any org | FR-ORG-5 |
| 6 | `CORS: *` | §8.4 |
| 7 | No server-side auth / no middleware | S1, §7.1 |
| 8 | No event lifecycle | FR-EV-2, FR-WL-7 |
| 9 | No org membership | FR-ORG-2, FR-ORG-3 |
| 10 | No event mutation | FR-EV-3, FR-EV-4, FR-OC-4 |
| 11 | Dead "unlimited capacity" branch | §6 (`capacity NOT NULL`) |
| 12 | Only two question types | FR-Q-1 |
| 13 | `notice` acknowledgements not persisted | FR-Q-1 |
| 14 | Phantom seats (inner join to `profiles`) | FR-ID-2, FR-WL-11, NFR-C-4 |
| 15 | No event timezone | FR-EV-5, NFR-C-5 |
| 16 | Promotion only on app cancel | FR-WL-3, FR-WL-4, NFR-C-2 |
| 17 | `create_event` not atomic | §6.2 `create_event` |
| 18 | Email unrecorded and best-effort | FR-NT-1, FR-NT-5 |
| 19 | No unsubscribe | FR-NT-4 |
| 20 | Validation triplicated | S13, §7.1 contracts |
| 21 | `reserved` slug error unreachable | FR-EV-7 |
| 22 | Dashboard stubs | FR-DB-1 |
| 23 | Organizations disconnected | FR-ORG-6, M5 |
| 24 | No organizer console | FR-OC-1…5 |
| 25 | Photo upload discarded | v2.1, §7.1 Storage |
| 26 | Google-only auth | FR-ID-1, Q4 |
| 27 | Landing page is a headline | FR-PUB-1 |
| 28 | CI never typechecks or builds | §9.1 steps 3–4 |
| 29 | CI does not apply migrations | §9.1 steps 9–10, §8.5 `/healthz` |
| 30 | Stale CI env var | §9.1 |
| 31 | 4 tests, none on the seat engine | §9 |
| 32 | `promote.sh` targets a missing branch | Q8 |
