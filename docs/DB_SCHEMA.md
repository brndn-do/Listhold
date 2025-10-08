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

Represents a club or group that hosts events. This allows for future expansion where multiple clubs can use the platform.

- **Collection:** `organizations`
- **Document ID:** A unique slug (e.g., `northwestern-archery-club`)
- **Fields:**
  - `name`: `string` (e.g., "Northwestern Archery Club")
  - `admins`: `array` of `uid`s - List of users who can manage the organization and its events.

### 3. `events`

This is the central collection for all events created on the platform.

- **Collection:** `events`
- **Document ID:** Auto-generated unique ID.
- **Fields:**
  - `name`: `string` (e.g., "Friday Practice 8:15 PM")
  - `organizationId`: `string` - A reference to the document ID in the `organizations` collection.
  - `start`: `timestamp` - The start time of the event.
  - `end`: `timestamp` - The end time of the event.
  - `capacity`: `number` - Maximum number of attendees.
  - `rules`: `map` - A map to hold various event-specific rules.
    - `crossEventRestriction`: `boolean` - If true, users can only sign up for one event at a time within this organization.
    - `waitlistResponseTime`: `map` - Time in seconds users have to respond to a waitlist notification.
      - `day`: `number` (e.g., 3600 for 1 hour)
      - `night`: `number` (e.g., 43200 for 12 hours)
  - `customQuestions`: `array` - An array of question objects.
    - **Object Structure:**
      - `questionId`: `string` (e.g., "q1_new_member")
      - `text`: `string` (e.g., "Are you new to our club?")
      - `type`: `string` (e.g., "boolean", "text")

---

## Sub-collections for Real-time Data

To ensure scalability and real-time updates, sign-up and waitlist data are stored in sub-collections within each event document.

### 4. `signups` (Sub-collection of `events`)

Stores the roster of confirmed attendees for an event.

- **Path:** `events/{eventId}/signups`
- **Document ID:** `uid` (The user ID of the attendee)
- **Fields:**
  - `signupTime`: `timestamp` - When the user signed up.
  - `answers`: `map` - Stores answers to custom questions.
    - **Example:** `{ "q1_new_member": true }`

### 5. `waitlist` (Sub-collection of `events`)

Stores the queue of users waiting for a spot.

- **Path:** `events/{eventId}/waitlist`
- **Document ID:** `uid` (The user ID of the waitlisted person)
- **Fields:**
  - `joinTime`: `timestamp` - Used to determine the user's position in the queue (first-in, first-out).
  - `status`: `string` - The user's current waitlist status (e.g., "pending", "notified").
  - `notifiedAt`: `timestamp` - (Optional) Set when a notification is sent, to track response time limits.
  - `answers`: `map` - Pre-collects answers to custom questions so they don't have to be asked again if a spot opens up.

---

## Rationale

- **Scalability:** Keeping `signups` and `waitlist` as sub-collections prevents the main `event` documents from becoming bloated and hitting Firestore document size limits.
- **Real-time Functionality:** This structure is ideal for live updates. A client application can listen directly to the `signups` and `waitlist` sub-collections of a specific event and update the UI in real-time as documents are added or removed.
- **Query Efficiency:** Queries are straightforward. Getting an event roster is a collection read, not a complex array filter. For example, to get the waitlist ordered by time: `db.collection('events').doc(eventId).collection('waitlist').orderBy('joinTime').get()`.
- **Security:** Firestore Security Rules can be applied granularly. For example, we can write a rule that only allows a user to create a document in a `signups` sub-collection if the collection size is less than the `spotLimit` in the parent event document.
