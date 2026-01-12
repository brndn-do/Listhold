# Listhold

An event management and sign-up platform built with Next.js + Supabase.

## Features

#### Implemented

- **User Authentication**
  - Google OAuth sign-in

- **Event Management**
  - Create events with custom or auto-generated slugs
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

#### Planned Features

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

## Documentation

For design and implementation details see:

- [docs/SCENARIO.md](docs/SCENARIO.md) — Usage scenario and user journeys.
- [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md) — Database schema.
- [docs/ROUTING_SCHEMA.md](docs/ROUTING_SCHEMA.md) — App Router layout.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Zod
- **Backend:** Supabase
- **Hosting:** Vercel, Supabase
- **Email:** SendGrid
- **Tooling:** Git, npm, Supabase CLI, ESLint, Prettier, Jest, React Testing Library

## Getting Started

#### Prerequisites

- Node.js v20 or higher
- Docker Desktop (for local Supabase)

#### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/brndn-do/listhold.git
    cd listhold
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

#### Environment Variables

This project uses environment variables for configuration. First, run the following command:

```bash
cp .env.example .env.local # .env will be ignored by git
```

Then, fill in the variables from your local Supabase configuration and Google OAuth credentials from your Google Cloud Project.

#### Running the Project

1. Start Supabase:

```bash
npx supabase start
```

2.  Start the NextJS development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or another port if 3000 is in use).

#### Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Lints the code using ESLint.
- `npm run format`: Formats the code using Prettier.
- `npm run test`: Runs tests using Jest.
- `npm run deploy:next`: Executes the automated release script `./deploy-next.sh` for pushing changes to `origin main`, triggering the build and deployment of our NextJS project on Vercel.
- `npm run types`: Automatically generates types based on your local Supabase's Postgres schema and writes it to `supabaseTypes.ts`.

## Contributing

Please email dobrandon05@gmail.com if you are interested in contributing.

## License

This project is licensed under the [MIT License](/LICENSE).
