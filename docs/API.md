# Supabase Functions API

Documentation for Deno Edge Functions.

---

## 1. Create Organization
**Endpoint:** `POST /create_organization`

Creates a new organization owned by the authenticated user.

### Headers
| Key | Value |
| :--- | :--- |
| `Authorization` | `Bearer <user_token>` |
| `Content-Type` | `application/json` |

### Body
```json
{
  "name": "Archery Club",
  "slug": "archery-club", // Optional (3-36 chars)
  "description": "We are a co-ed sports club open to all" // Optional
}
```

### Responses
- **201 Created**:
  ```json
  { "success": true, "slug": "archery-club" }
  ```
- **400 Bad Request**: Invalid JSON body or validation failure.
- **401 Unauthorized**: Missing or invalid Authorization header.
- **409 Conflict**: Slug already exists.
- **500 Internal Server Error**: Unexpected server error.

---

## 2. Create Event
**Endpoint:** `POST /create_event`

Creates an event, optionally linked to an organization.

### Headers
| Key | Value |
| :--- | :--- |
| `Authorization` | `Bearer <user_token>` |
| `Content-Type` | `application/json` |

### Body
```json
{
  "name": "Friday Practice",
  "slug": "friday-practice", // Optional
  "orgSlug": "archery-club", // Optional
  "location": "Blomquist Gym",
  "capacity": 20,
  "start": "2026-01-20T08:00:00Z",
  "end": "2026-01-20T10:00:00Z",
  "description": "Regular practice.",
  "prompts": [
    {
       "displayOrder": 1,
       "promptType": "yes/no",
       "promptText": "Have you signed the waiver?",
       "isRequired": true,
       "isPrivate": true
    }
  ]
}
```

### Responses
- **201 Created**:
  ```json
  { "success": true, "slug": "morning-practice" }
  ```
- **400 Bad Request**: Invalid JSON body, validation error, or invalid date range.
- **401 Unauthorized**: Missing or invalid Authorization header.
- **409 Conflict**: Event slug is already taken or reserved.
- **500 Internal Server Error**: Unexpected server error.

---

## 3. Add User To Event
**Endpoint:** `POST /add_user_to_event`

Signs up a user (or themselves) for an event. Handles waitlisting automatically.

### Logic
- **Authorization:** Authenticated user must be the `userId` in the body OR the event owner.
- **Waitlist:** Automatic if capacity is full.

### Body
```json
{
  "userId": "uuid-here",
  "eventId": "uuid-here",
  "answers": {
    "prompt-uuid": true,
    "prompt-uuid-2": false,
  }
}
```

### Responses
- **201 Created**:
  ```json
  { "success": true, "signupId": "uuid", "status": "confirmed" } // or "waitlisted"
  ```
- **400 Bad Request**: Invalid JSON body.
- **401 Unauthorized**: Missing or invalid Authorization header.
- **403 Forbidden**: User is not authorized to sign up this target user.
- **404 Not Found**: Event not found.
- **500 Internal Server Error**: Database issues.

---

## 4. Remove User From Event
**Endpoint:** `POST /remove_user_from_event`

Cancels a signup.  
**Critical:** Triggers the auto-promotion logic if a spot opens up.

### Logic
1. Removes the `userId` from the event.
2. If the user was `confirmed` and the event is full, promotes the top waitlisted user.
3. Sends an email notification to the promoted user.

### Body
```json
{
  "userId": "uuid-here",
  "eventId": "uuid-here"
}
```

### Responses
- **200 OK**:
  ```json
  { "success": true }
  ```
- **400 Bad Request**: Invalid JSON body.
- **401 Unauthorized**: Missing or invalid Authorization header.
- **403 Forbidden**: User is not authorized to remove this target user.
- **404 Not Found**: Event not found or Database error (e.g. signup doesn't exist).
- **500 Internal Server Error**: Unexpected server error.
