# Routing Schema

---

### Home

- **`/`**
  - **Description:** Landing page with a brief introduction to Rosterize and a link to create an organization.

### Organization Routes

- **`/organizations/new`**
  - **Description:** Form for creating a new organization.
  - **Authentication:** Required to create.

- **`/organizations/[organizationId]`**
  - **Description:** Home page for an organization.
  - **Authentication:** Not required for viewing

- **`/organizations/[organizationId]/events/new`**
  - **Description:** Form for creating a new event within an organization. Only accessible to the organization owner.
  - **Authentication:** Required to create.

### Event Routes

- **`/events/[eventId]`**
  - **Description:** The main event page displaying event details, real-time signup list, and waitlist. Users can sign up, answer custom prompts, and leave the event from this page.
  - **Authentication:** Not required for viewing; required for signing up/leaving

---
