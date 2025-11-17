# Firestore Database Schema Proposal

This document outlines a proposed database schema for the sign-up platform, designed for Firestore and based on the requirements from `PROJECT_PLAN.md` and `scenario.md`.

---

## Core Collections

### 1. `users`

This collection stores information about each user who has authenticated with the platform.

- **Collection:** `users`
- **Document ID:** `uid` (from Firebase Authentication)
- **Fields:**
  - `name`: `string` (e.g., "Alice") - From Google account.
  - `email`: `string` (e.g., "alice@northwestern.edu") - Verified from the token.
  - `photoURL`: `string` (e.g., "http://...") - From Google account.

### 2. `organizations`

Represents an organization that hosts events.

- **Collection:** `organizations`
- **Document ID:** A unique slug (e.g., `northwestern-archery-club`)
- **Fields:**
  - `name`: `string` (e.g., "Northwestern Archery Club")
  - `description`: `string`
  - `ownerId`: `string` the user id of the owner
  - `contactEmail?`: `string`
  - `logoURL?`: `string` - A URL to the organization's logo
  - `websiteURL?`: `string` - A URL to the organization's website
  - `visibility?`: `string` - public or private
  - `admins`: `map` of `uid`s - Map of users who can manage the organization and its events.

### 3. `events`

This is the central collection for all events created on the platform.

- **Collection:** `events`
- **Document ID:** Auto-generated unique ID.
- **Fields:**
  - `name`: `string` (e.g., "Friday Practice 8:15 PM")
  - `description?`: - Description of event.
  - `organizationId`: `string` - A reference to the document ID in the `organizations` collection.
  - `location`: `string` - The location of the event.
  - `start`: `timestamp` - The start time of the event.
  - `end`: `timestamp` - The end time of the event.
  - `capacity`: `number` - Maximum number of attendees.
  - `signupsCount`: `number` - The current number of signups.
  - `rules?`: `map` - A map to hold various event-specific rules.
    - `crossEventRestriction`: `boolean` - If true, users can only sign up for one event at a time within this organization.
    - `waitlistResponseTime`: `map` - Time in seconds users have to respond to a waitlist notification.
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
    - `text`: A free-form text input.
    - `select`: A single-choice dropdown from `options`.
    - `checkbox`: Multiple choices from `options`.
    - `notice`: Informational text requiring user acknowledgment (e.g., "I understand").
  - `options?`: `array` of `string`s - [Optional] A list of choices for `select` or `checkbox` type prompts.
  - `validation?`: `map` - [Optional] Defines rules for validating user input for questions.
    - `valid`: `boolean | string | string[] | string[][]` - The expected correct answer(s).
      - `boolean`: For `yes/no` questions (e.g., `true`).
      - `string`: For `select` questions (e.g., `"Option A"`) or exact text matches.
      - `string[]`: For `checkbox` questions, a single combination of selected options that is correct (e.g., `["Option A", "Option B"]`).
      - `string[][]`: For `checkbox` questions, multiple combinations of selected options that are correct (e.g., `[["Option A", "Option B"], ["Option B", "Option C"]]`).
    - `errorMessage?`: `string` - [Optional] A custom message displayed to the user if validation fails.

### 5. `signups` (Sub-collection of `events`)

Stores the roster of confirmed attendees for an event.

- **Path:** `events/{eventId}/signups`
- **Document ID:** `uid` (The user ID of the attendee)
- **Fields:**
  - `displayName`: `string` - The display name of the user **at the time of signup.**
  - `photoURL`: `string` - The photo URL of the user **at the time of signup.**
  - `signupTime`: `timestamp` - When the user signed up.
  - `answers?`: `map` - Stores user's responses to prompts, where keys are `promptId`s and values are the user's answers.
    - **Example:** `{ "q1_new_member": true, "q2_tshirt_size": "M" }`

### 6. `waitlist` (Sub-collection of `events`)

Stores the queue of users waiting for a spot.

- **Path:** `events/{eventId}/waitlist`
- **Document ID:** `uid` (The user ID of the waitlisted person)
- **Fields:**
  - `joinTime`: `timestamp` - Used to determine the user's position in the queue (first-in, first-out).
  - `status`: `string` - The user's current waitlist status (e.g., "pending", "notified").
  - `notifiedAt`: `timestamp` - (Optional) Set when a notification is sent, to track response time limits.
  - `answers?`: `map` - Stores user's responses to prompts, where keys are `promptId`s and values are the user's answers.
    - **Example:** `{ "q1_new_member": true, "q2_tshirt_size": "M" }`

---

## Rationale

- **Scalability:** Keeping `signups` and `waitlist` as sub-collections prevents the main `event` documents from becoming bloated.
- **Real-time Functionality:** This structure is ideal for live updates. A client application can listen directly to the `signups` and `waitlist` sub-collections of a specific event and update the UI in real-time as documents are added or removed.
- **Query Efficiency:** Queries are straightforward. Getting an event roster is a collection read, not a complex array filter. For example, to get the waitlist ordered by time: `db.collection('events').doc(eventId).collection('waitlist').orderBy('joinTime').get()`.
- **Security:** Firestore Security Rules can be applied granularly. For example, we can write a rule that only allows a user to create a document in a `signups` sub-collection if the collection size is less than the `spotLimit` in the parent event document.