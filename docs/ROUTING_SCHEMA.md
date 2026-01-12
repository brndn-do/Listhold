# Routing Schema

Next.js App Router structure.

## Structure

- **`/`**: Landing page (Public).
- **`/auth/callback`**: OAuth redirect handler.
- **`/dashboard`**: **(WIP)** User's personal dashboard (Private - Requires Auth).
- **`/events`**:
    - **`/new`**: Event creation page (Private - Requires Auth).
    - **`/[eventSlug]`**: Dynamic public event page.
        - Uses `[eventSlug]` to fetch event data by its unique slug.
- **`/organizations` (not in use currently)**:
    - **`/new`**: Organization creation wizard (Private - Requires Auth).
    - **`/[orgSlug]`**: Dynamic public organization page.
        - Uses `[orgSlug]` to fetch org data.