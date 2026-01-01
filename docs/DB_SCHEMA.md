# Firestore Database Schema

This document outlines the database schema for Listhold, designed for Firestore.

> **Note:** This schema includes both **implemented features** and **planned future functionality**. Fields and features marked as "Not yet implemented" are part of the roadmap. See `src/types.ts` for the current implementation state.

---

## Core Collections

### 1. `users`

This collection stores information about each user who has authenticated with the platform.

- **Collection:** `users`
- **Document ID:** `uid` (from Firebase Authentication)
- **Fields:**
  - `displayName`: `string | null` (e.g., "Alice") - From Google account.
  - `email`: `string | null` (e.g., "alice@northwestern.edu") - Verified from the token.
  - `photoURL`: `string | null` (e.g., "http://...") - From Google account.
  - `lastLogin`: `timestamp` - When the user last signed in.

### 2. `organizations`

Represents an organization that hosts events.

- **Collection:** `organizations`
- **Document ID:** A unique slug (e.g., `northwestern-archery-club`)
- **Fields:**
  - `name`: `string` (e.g., "Northwestern Archery Club")
  - `description?`: `string` (optional)
  - `ownerId`: `string` - The user ID of the owner
  - `createdAt`: `timestamp` - When the organization was created
  - `contactEmail?`: `string` - **Not yet implemented**
  - `logoURL?`: `string` - **Not yet implemented** - A URL to the organization's logo
  - `websiteURL?`: `string` - **Not yet implemented** - A URL to the organization's website
  - `visibility?`: `string` - **Not yet implemented** - public or private
  - `admins?`: `map` of `uid`s - **Not yet implemented** - Map of users who can manage the organization and its events.

### 3. `events`

This is the central collection for all events created on the platform.

- **Collection:** `events`
- **Document ID:** Auto-generated unique ID or custom slug.
- **Fields:**
  - `name`: `string` (e.g., "Friday Practice 8:15 PM")
  - `description?`: `string` (optional) - Description of event.
  - `organizationId`: `string` - A reference to the document ID in the `organizations` collection.
  - `organizationName`: `string` - The organization's name (denormalized).
  - `createdAt`: `timestamp` - When the event was created.
  - `creatorId`: `string` - The user ID of the event creator.
  - `location`: `string` - The location of the event.
  - `start`: `timestamp` - The start time of the event.
  - `end?`: `timestamp` (optional) - The end time of the event.
  - `capacity`: `number` - Maximum number of attendees.
  - `signupsCount`: `number` - The current number of signups.
  - `rules?`: `map` - **Not yet implemented** - A map to hold various event-specific rules.
    - `crossEventRestriction`: `boolean` - **Not yet implemented** - If true, users can only sign up for one event at a time within this organization.
    - `waitlistResponseTime`: `map` - **Not yet implemented** - Time in seconds users have to respond to a waitlist notification.
      - `day`: `number` (e.g., 3600 for 1 hour)
      - `night`: `number` (e.g., 43200 for 12 hours)

## Sub-collections

### 4. `prompts` (Sub-collection of `events`)

A subcollection containing the custom prompts (a question or notice) for a specific event. These are displayed to the user in order during the sign-up flow.

- **Path:** `events/{eventId}/prompts`
- **Document ID:** Auto-generated unique ID.
- **Fields:**
  - `order`: `number` - The sequence in which the prompt is displayed (e.g., 1, 2, 3...).
  - `text`: `string` - The main text of the prompt or question.
  - `type`: `string` - Defines how the prompt is rendered and validated.
    - `yes/no`: A boolean question.
    - `notice`: Informational text requiring user acknowledgment (e.g., "I understand").
    - `text`: **Not yet implemented** - A free-form text input.
    - `select`: **Not yet implemented** - A single-choice dropdown from `options`.
    - `checkbox`: **Not yet implemented** - Multiple choices from `options`.
  - `visibility?`: `'public' | 'private'` (optional) - For non-notice prompts, `'public'` allows answers to this prompt to be displayed publicly on the event page.
  - `options?`: `array` of `string`s - **Not yet implemented** - A list of choices for `select` or `checkbox` type prompts.
  - `validation?`: `map` - **Not yet implemented** - Defines rules for validating user input for questions.
    - `valid`: `boolean | string | string[] | string[][]` - The expected correct answer(s).
      - `boolean`: For `yes/no` questions (e.g., `true`).
      - `string`: For `select` questions (e.g., `"Option A"`) or exact text matches.
      - `string[]`: For `checkbox` questions, a single combination of selected options that is correct (e.g., `["Option A", "Option B"]`).
      - `string[][]`: For `checkbox` questions, multiple combinations of selected options that are correct (e.g., `[["Option A", "Option B"], ["Option B", "Option C"]]`).
    - `errorMessage?`: `string` - A custom message displayed to the user if validation fails.

### 5. `signups` (Sub-collection of `events`)

Stores the roster of confirmed attendees for an event.

- **Path:** `events/{eventId}/signups`
- **Document ID:** `uid` (The user ID of the attendee)
- **Fields:**
  - `displayName`: `string` - The display name of the user **(denormalized)**.
  - `photoURL`: `string | null` - The photo URL of the user **(denormalized)**.
  - `email`: `string` - The email of the user **(denormalized)**.
  - `signupTime`: `timestamp` - When the user signed up.
  - `answers`: `map` - Stores user's responses to prompts, where keys are `promptId`s and values are the user's answers.
    - Currently supports `boolean | null` values (for `yes/no` and `notice` type prompts)
    - **Example:** `{ "promptId1": true, "promptId2": null }`

### 6. `waitlist` (Sub-collection of `events`)

Stores the queue of users waiting for a spot.

- **Path:** `events/{eventId}/waitlist`
- **Document ID:** `uid` (The user ID of the waitlisted person)
- **Fields:**
  - `displayName`: `string` - The display name of the user **(denormalized)**.
  - `photoURL`: `string | null` - The photo URL of the user **(denormalized)**.
  - `email`: `string` - The email of the user **(denormalized)**.
  - `signupTime`: `timestamp` - When the user joined the waitlist (used to determine position in queue, FIFO).
  - `answers`: `map` - Stores user's responses to prompts, where keys are `promptId`s and values are the user's answers.
    - Currently supports `boolean | null` values (for `yes/no` and `notice` type prompts)
    - **Example:** `{ "promptId1": true, "promptId2": null }`
  - `status`: `string` - **Not yet implemented** - The user's current waitlist status (e.g., "pending", "notified").
  - `notifiedAt`: `timestamp` - **Not yet implemented** - Set when a notification is sent, to track response time limits.

### 7. `memberships` (Sub-collection of `users`)

Stores all organizations the user is involved in. **Not yet implemented**.

- **Path:** `/users/{userId}/memberships`
- **Document ID:** The organization ID.
- **Fields:**
  - `organizationName`: `string` - The name of the organization **(denormalized)**.
  - `logoURL?`: `string` - A URL to the organization's logo **(denormalized)**.
  - `role`: `string` - e.g. "owner", "admin", "member"

### 8. `eventRecords` (Sub-collection of `users`)

Stores the events the user has interacted with. **Not yet implemented**.

- **Path:** `/users/{userId}/eventRecords`
- **Document ID:** The event ID.
- **Fields:**
  - `name`: `string` - The name of the event **(denormalized)**.
  - `organizationName`: `string` - The name of the organization **(denormalized)**.
  - `location`: `string` - The location of the event **(denormalized)**.
  - `start`: `timestamp` - The start time of the event **(denormalized)**.
  - `end?`: `timestamp` (optional) - The end time of the event **(denormalized)**.
  - `status`: `string` - e.g. "joined", "waitlisted".
  - `lastUpdate`: `timestamp` - The latest timestamp where the user's status changed (i.e. time they joined the list/waitlist, or the time they were promoted).

---
