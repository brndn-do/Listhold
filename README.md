# Rosterize

A full-stack, serverless event management platform built with Next.js, Firebase, and TypeScript.

Rosterize allows organizations to create and manage events, while attendees can discover, sign up for, and track events they are participating in.

## Features

*   **User Authentication:** Secure sign-up and sign-in using Firebase Authentication.
*   **Organization Management:** 
    *   Create, edit, and view organizations.
    *   Assign roles (Owner, Admin) for collaborative management.
    *   Customizable, URL-safe organization IDs.
*   **Event Management:** 
    *   Create, edit, and view events.
    *   Define event capacity, location, start/end times, and optional custom IDs.
    *   Implement client-side and server-side validation for all inputs using Zod.
    *   Support for public and private events.
    *   Recurring event capabilities (future enhancement).
*   **Rosters & Waitlists:** 
    *   View public attendee lists (display names and avatars).
    *   Admin-only detailed rosters with contact information and signup timestamps.
    *   Waitlist management for full events.
*   **Interactive Prompts:** 
    *   Create custom prompts for events (e.g., 'Are you new to archery?', 'Dietary restrictions?').
    *   Support for different prompt types: 'Notice', 'Yes/No'.
    *   Control prompt visibility (public vs. private). 
    *   Handle prompt answers during signup, with the ability for attendees to edit their answers later.
*   **User Profiles:** 
    *   View a personal dashboard showing organizations and events the user is involved in.
*   **Deployment Automation:**
    *   Automated release script (`npm run release`) for deploying to production and managing Git branches.
    *   Firebase CLI integration for environment management (`prod`, `dev`).

## Tech Stack

*   **Frontend:** Next.js, React, TypeScript, Tailwind CSS, Zod, `react-firebase-hooks`.
*   **Backend:** Firebase Cloud Firestore, Firebase Cloud Functions (Node.js), Firebase Authentication.
*   **Hosting:** Vercel.
*   **Tooling:** Git, npm, ESLint, Prettier, Jest.

## Getting Started

### Prerequisites

*   Node.js v20 or higher
*   npm
*   Firebase CLI (`npm install -g firebase-tools`)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/brndn-do/rosterize.git
    cd rosterize
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Firebase Setup

*   Enable **Authentication**, **Firestore**, and **Cloud Functions** for your Firebase project(s).
*   Configure your Firebase CLI to use the correct project(s) (e.g. for `dev` and `prod` environments). You can use `firebase use <project_id>` to switch contexts.
*   Deploy Firebase functions and database rules using `firebase deploy`.

### Environment Variables

This project uses environment variables for configuration. First, run the following command:

```bash
cp .env.example .env # .env will be ignored by git
```
`.env` will look like this:

```dotenv
# Client SDK configuration
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=""

# Recaptcha for app check
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=""

# Admin credentials for server side, paste single-line JSON
FIREBASE_SERVICE_ACCOUNT=''
```
Then, copy and paste the values of your Firebase project's Client SDK configuration, the reCAPTCHA site key for your project's app check, and your service account credentials.

Next, we need to set up an environment variable in `functions/`. Run:

```bash
cp functions/.env.example functions/.env
```
Open `functions/.env`:
```dotenv
# e.g. "rosterize.com"
APP_DOMAIN=""
```

Then, configure your app's domain.

### Running the Project

1.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000` (or another port if 3000 is in use).

## Scripts

This project includes several useful npm scripts:

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Lints the code using ESLint.
*   `npm run format`: Formats the code using Prettier.
*   `npm run test`: Runs tests using Jest.
*   `npm run release`: Executes the automated release script (`./release.sh`) for deploying to production and managing Git branches.

## Contributing

Please email dobrandon05@gmail.com if you are interested in contributing.

## License

This project is licensed under the MIT License.