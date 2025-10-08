### Authentication

- `/login`
  - **Description:** A dedicated page to prompt users to sign in, likely redirecting to the Google authentication provider. This is a cleaner user experience than a pop-up on the main page.
- `/api/auth/[...nextauth]`
  - **Description:** Standard NextAuth.js route for handling callbacks, session management, and sign-out logic, especially for restricting access to specific email domains.

### Core App Routes

- `/` or `/events`
  - **Description:** The main dashboard. It displays a list of all upcoming events. For a logged-in user, it could highlight events they've signed up for or are waitlisted on. This corresponds to "Users can view a list of available events."
  - **File:** `src/app/events/page.tsx`

- `/events/[eventId]`
  - **Description:** The detailed view for a single event. This is the most important page, where users will sign up, leave an event, or join a waitlist. It will display the event details, the real-time roster of attendees, and the waitlist.
  - **File:** `src/app/events/[eventId]/page.tsx`

- `/events/[eventId]/confirm`
  - **Description:** A special route for users coming from a waitlist notification email. This page would handle the logic to confirm their spot. It should be protected and require a unique, time-sensitive token in the URL query parameters to prevent misuse.
  - **File:** `src/app/events/[eventId]/confirm/page.tsx`

### User-Specific Routes

- `/profile` or `/my-signups`
  - **Description:** A user's personal page where they can see a history of all events they have signed up for or attended.
  - **File:** `src/app/profile/page.tsx`

### Admin/Organization Routes

While V1 of the plan states event creation is done in the database, future versions will need an admin UI. This structure prepares for that.

- `/manage` or `/admin`
  - **Description:** A dashboard for organization administrators to see all the events they manage.
  - **File:** `src/app/manage/page.tsx`

- `/manage/events/new`
  - **Description:** A form for creating a new event, including setting rules, capacity, and custom questions.
  - **File:** `src/app/manage/events/new/page.tsx`

- `/manage/events/[eventId]/edit`
  - **Description:** A page for editing an existing event's details and rules.
  - **File:** `src/app/manage/events/[eventId]/edit/page.tsx`
