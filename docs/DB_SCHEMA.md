# Database Schema

The PostgreSQL schema, including tables, views, enums, and Row Level Security (RLS) policies.

## 1. Tables

### `public.profiles`

Stores public information about users. Automatically linked to `auth.users`.

| Column         | Type   | Constraints                | Description                        |
| :------------- | :----- | :------------------------- | :--------------------------------- |
| `id`           | `uuid` | PK, FK -> `auth.users(id)` | Matches the user's Auth ID.        |
| `display_name` | `text` | Max 100 chars              | The user's public name.            |
| `avatar_url`   | `text` | Max 500 chars              | URL to the user's profile picture. |

**RLS Policies:**

- Read: enabled for everyone.
- Insert/Update: Users can only modify their own profile.

---

### `public.organizations`

Represents a group or club that can host events. **For future use**.

| Column              | Type          | Constraints                     | Description                            |
| :------------------ | :------------ | :------------------------------ | :------------------------------------- |
| `id`                | `uuid`        | PK, Default `gen_random_uuid()` | Unique ID.                             |
| `slug`              | `text`        | Unique, URL-safe                | URL identifier (e.g., `archery-club`). |
| `owner_id`          | `uuid`        | FK -> `auth.users(id)`          | The user who owns the organization.    |
| `organization_name` | `text`        | Max 50 chars                    | Display name.                          |
| `description`       | `text`        | Max 1000 chars                  | Optional description.                  |
| `avatar_url`        | `text`        | Max 500 chars                   | Logo URL.                              |
| `created_at`        | `timestamptz` | Default `NOW()`                 | Creation timestamp.                    |

---

### `public.events`

The core entity representing a scheduled meetup or activity.

| Column            | Type          | Constraints                      | Description                               |
| :---------------- | :------------ | :------------------------------- | :---------------------------------------- |
| `id`              | `uuid`        | PK, Default `gen_random_uuid()`  | Unique ID.                                |
| `slug`            | `text`        | Unique, URL-safe                 | URL identifier (e.g., `friday-practice`). |
| `owner_id`        | `uuid`        | FK -> `auth.users(id)`           | The creator/owner of the event.           |
| `organization_id` | `uuid`        | FK -> `public.organizations(id)` | Optional link to an organization.         |
| `event_name`      | `text`        | Max 50 chars                     | Title of the event.                       |
| `location`        | `text`        | Max 200 chars                    | Physical or virtual location.             |
| `capacity`        | `integer`     | 1 - 300                          | Max confirmed attendees.                  |
| `description`     | `text`        | Max 1000 chars                   | Optional details.                         |
| `start_time`      | `timestamptz` | Not Null                         | When the event begins.                    |
| `end_time`        | `timestamptz` | > start_time                     | When the event ends.                      |
| `photo_url`       | `text`        | Max 500 chars                    | Event banner image.                       |

**RLS Policies:**

- Read: Users can only read events that they are the owner of.

---

### `public.prompts`

Custom questions configured by the event organizer for signups.

| Column          | Type      | Constraints                     | Description                            |
| :-------------- | :-------- | :------------------------------ | :------------------------------------- |
| `id`            | `uuid`    | PK, Default `gen_random_uuid()` | Unique ID.                             |
| `event_id`      | `uuid`    | FK -> `public.events(id)`       | The event this prompt belongs to.      |
| `display_order` | `integer` | > 0                             | Order in the signup form.              |
| `prompt_type`   | `enum`    | `yes/no`, `notice`              | The input type.                        |
| `prompt_text`   | `text`    | Max 300 chars                   | The question text.                     |
| `is_required`   | `boolean` | Default `true`                  | If the user must answer.               |
| `is_private`    | `boolean` | Default `true`                  | If true, answer is hidden from public. |

**Uniqueness:** (`event_id`, `display_order`)

---

### `public.signups`

Records a user's registration for an event.

| Column         | Type          | Constraints                            | Description         |
| :------------- | :------------ | :------------------------------------- | :------------------ |
| `id`           | `uuid`        | PK, Default `gen_random_uuid()`        | Unique ID.          |
| `user_id`      | `uuid`        | FK -> `auth.users(id)`                 | The attendee.       |
| `event_id`     | `uuid`        | FK -> `public.events(id)`              | The event.          |
| `status`       | `enum`        | `confirmed`, `waitlisted`, `withdrawn` | Current state.      |
| `last_updated` | `timestamptz` | Default `now()`                        | Last status change. |
| `created_at`   | `timestamptz` | Default `now()`                        | Signup time.        |

**Uniqueness:** (`user_id`, `event_id`) - One signup per user per event.

**RLS Policies:**

- Read: Enabled for everyone.

---

### `public.answers`

Stores user responses to customized prompts.

| Column       | Type          | Constraints                     | Description                  |
| :----------- | :------------ | :------------------------------ | :--------------------------- |
| `id`         | `uuid`        | PK, Default `gen_random_uuid()` | Unique ID.                   |
| `signup_id`  | `uuid`        | FK -> `public.signups(id)`      | The associated signup.       |
| `prompt_id`  | `uuid`        | FK -> `public.prompts(id)`      | The question being answered. |
| `answer`     | `jsonb`       | Not Null                        | The answer value.            |
| `created_at` | `timestamptz` | Default `now()`                 | Timestamp.                   |

**Uniqueness:** (`signup_id`, `prompt_id`)

**RLS Policies:**

- Read:
  - User can see their own answers.
  - Everyone can see answers to prompts where `is_private = false`.
  - Event owners can see all answers for their events.

## 2. Views

### `public.event_list_view`

A helper view optimized for fetching the roster for an event page. It joins `signups` with `profiles` and aggregates `answers` into a single JSON object.

**Columns:**

- `signup_id`
- `user_id`
- `event_id`
- `status`
- `last_updated`
- `created_at`
- `display_name` (from `profiles`)
- `avatar_url` (from `profiles`)
- `answers` (JSONB object: `{ propmt_id: answer_value }`)

## 3. Enums

### `prompt_type_enum`

- `yes/no`
- `notice`

### `signup_status_enum`

- `confirmed`
- `waitlisted`
- `withdrawn`

## 4. Functions & Triggers

- **`normalize_event_slug` / `normalize_org_slug`**: Automatically lowercases slugs on insert/update.
- **`set_last_updated`**: Updates the `last_updated` timestamp on `signups` when the row changes.
