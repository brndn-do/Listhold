# Rosterize

A full-stack, serverless event management platform built with Next.js, Firebase, and TypeScript.

Rosterize allows organizations to create and manage events, while attendees can discover, sign up for, and track events they are participating in.

## Current Features

### Implemented

- **User Authentication**
  - Google OAuth sign-in via Firebase Authentication

- **Organization Management**
  - Create organizations with customizable, URL-safe IDs (or auto-generated)
  - View organization details and owner information
  - Owner can create an event under the organization

- **Event Management**
  - Create events with custom or auto-generated IDs
  - Define event capacity, location, start/end times, and optional descriptions
  - Real-time tracking of available spots

- **Real-time Rosters & Waitlists**
  - Users can see a live roster of signups and waitlisted people, and their respective spots, for each event.
  - Automatic waitlist when events reach capacity
  - Automatic promotion: When a spot opens, the next person on the waitlist (if any) is instantly moved to the main list
  - Email notifications sent to promoted users

- **Interactive Prompts**
  - Sequential signup flow with custom prompts
  - Two prompt types supported: `'yes/no'` (boolean questions) and `'notice'` (acknowledgment)
  - Public visibility control: users can see others' answers to public prompts
  - Prompt answers stored and displayed with signups

- **Signup/Leave Flow**
  - Join event (main list if space available, otherwise waitlist)
  - Answer custom prompts during signup
  - Leave event or waitlist at any time
  - View your own signup status with visual highlighting

### Planned Features

- **Advanced Organization Management**
  - Invite and manage multiple admins per organization
  - Organization logos, websites, and contact information
  - Public/private organization visibility settings

- **Enhanced Event Features**
  - Edit and delete events
  - Cross-event signup restrictions (prevent users from signing up for overlapping events)
  - Configurable waitlist response time windows (day vs. night notifications)
  - Domain-based access restrictions per event (e.g., `@northwestern.edu` only)
  - Recurring events
  - Public/private event visibility

- **Extended Prompt System**
  - Additional prompt types: free-text, single-select, multi-select
  - Prompt validation with required correct answers
  - Custom error messages for validation failures
  - Ability to edit prompt answers after signup

- **User Dashboard**
  - Personal profile page showing all events signed up for
  - Event history and attendance tracking

- **Admin Features**
  - Detailed roster view with contact information and all prompt answers
  - Export signup data
  - Waitlist status tracking (pending, notified timestamps)

- **Enhanced Waitlist**
  - Manual confirmation flow for promoted users
  - Time-limited responses with automatic re-queuing

- **Real-time Presence**
  - Show who else is currently viewing an event page (Google Docs-style)

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Zod, `react-firebase-hooks`
- **Backend:** Firebase (Firestore, Cloud Functions v2, Authentication, App Check)
- **Hosting:** Vercel (frontend), Firebase (Cloud Functions)
- **Email:** Firebase Extensions (Trigger Email from Firestore)
- **Tooling:** Git, npm, ESLint, Prettier, Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js v20 or higher
- npm
- Firebase CLI (`npm install -g firebase-tools`)

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

- Enable **Authentication**, **Firestore**, and **Cloud Functions** for your Firebase project(s).
- Configure your Firebase CLI to use the correct project(s) (e.g. for `dev` and `prod` environments). You can use `firebase use <project_id>` to switch contexts.
- Deploy Firebase functions and database rules using `firebase deploy`.

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

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the code using ESLint.
- `npm run format`: Formats the code using Prettier.
- `npm run test`: Runs tests using Jest.
- `npm run release`: Executes the automated release script (`./release.sh`) for deploying to production and managing Git branches.

## Contributing

Please email dobrandon05@gmail.com if you are interested in contributing.

## License

This project is licensed under the MIT License.
