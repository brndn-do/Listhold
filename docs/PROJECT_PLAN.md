# Project Plan: Sign-Up Platform

This document outlines a tiered development plan for the sign-up platform, starting with a core MVP and progressively adding more complex features.

## Technology Stack for Prototyping

- **Framework:** Next.js
- **Authentication:** Firebase Authentication (with Google provider and domain restriction)
- **Database:** Firestore (for real-time data)
- **Backend Logic:** Cloud Functions for Firebase (especially for the waitlist system)
- **Styling:** Tailwind CSS

---

## Version 1.0: The Core MVP

The goal of this version is to get the fundamental sign-up and sign-off functionality working perfectly.

### Features:

- **Live Roster:**
  - The list of attendees for an event is displayed in real-time.
  - When one user signs up, the list updates for everyone viewing the page without a refresh.
- **Event Creation (by developer/admin):**
  - Events are initially created directly in the Firestore database (not through a UI).
  - Each event will have a `name`, `date`, and `spotLimit`.
  - Each event will have their documentid as part of the URL
- **Sign-Up Flow:**
  - Users can sign up for an event that has open spots.
  - Users can easily remove themselves from an event they signed up for.
  - ~~Users can view a list of available events.~~
- **User Authentication:**
  - Users can sign up and log in with their Google Account.
  - Restrict sign-ups to `@u.northwestern.edu` and `@northwestern.edu` email domains.~~

---

## Version 1.1: The Waitlist System

This version tackles the most complex and valuable feature from the scenario: the automated waitlist.

### Features:

- **Join Waitlist:**
  - If an event is full, users see an option to "Join Waitlist".
- **Automated Promotion:**
  - When a spot opens up, a Cloud Function is automatically triggered.
  - The function sends an email notification to the first person on the waitlist.
- **Confirm/Decline Spot:**
  - The user has a limited time to confirm or decline the spot via a link in the email.
  - If they decline or the time expires, the function offers the spot to the next person on the waitlist.

---

## Version 1.2: Advanced Features & Polish

This version adds the remaining high-value features from the scenario.

### Features:

- **Custom Sign-Up Questions:**
  - An organizer can define custom questions for an event (e.g., "Are you new to archery?").
  - Users are prompted to answer these questions during the sign-up process.
- **Cross-Event Restrictions:**
  - Implement the logic to prevent a user from signing up for more than one event at a time (if the organizer enables this rule).
- **Real-time Presence:**
  - Add an indicator to show users who else is currently viewing the same event page (similar to Google Docs).

---

## Future Versions (Post-Prototype)

- **Admin/Org Management:**
  - UI for organizers to create and manage their own events.
  - Ability to invite other users to be administrators for an organization.
  - Granular permissions for co-organizers.
- **Full SaaS Migration:**
  - Plan and execute the potential migration from Firebase to a custom backend with a PostgreSQL database to support more complex queries and ensure long-term flexibility.
