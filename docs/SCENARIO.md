# Usage Scenario: Northwestern Archery Club

This document describes a detailed usage scenario for Listhold. **Not all features described has been implemented yet.**

### Personas

- **Brandon (The Organizer):** President of the Northwestern Archery Club. He needs to create an organization, publish events, and manage attendance.
- **Alice (The Participant):** An user who signs up for an event.
- **Ben (The Waitlisted Participant):** A user who joins a waitlist and accepts an offer when a spot opens.

---

### The Organizer's Journey: Organization and Event Setup

1. **Create Organization:** Brandon signs up and creates the "Northwestern Archery Club" organization in order to created events under his organization. He configures basic organization details (name, logo) and invites other executives to join as admins.

2. **Organization Home:** Brandon views the organization home page, which lists upcoming events, a brief roster summary, and links to manage settings and members.

3. **Publish Events:** From the organization home, Brandon creates two archery practices:
   - Friday, 8:15 PM - 9:45 PM
   - Saturday, 7:15 PM - 8:45 PM

   He adds event details, sets a capacity, enables a waitlist, and adds a short questionnaire:
   - Are you new to archery? (yes/no)
   - Are you new to our club? (yes/no)
   - Anything you want to share? (optional text)
   - I understand I must sign a liability waiver to participate. (check)

4. **Share & Discover:** Brandon posts the organization home link and the event share links in the club's' email list. Members can discover events by visiting the organization home or by following a direct event link.

---

### The Participant's Journey: Discover, Sign Up, and Dashboard

1. **Discover Events:** Alice discovers the Friday practice by visiting the Northwestern Archery Club home page. She can also open the event directly via a shared link.

2. **Quick Sign-Up:** Alice clicks the event, answers the required questions, and signs up. The live roster updates in real time and displays her name and profile picture, and her order on the list.

3. **Join Waitlist:** Ben visits the same page, but after the event fills. He joins the waitlist by answering the same questions as Alice. The waitlist position is visible on the event page and updates real-time.

4. **Cancel & Offer Flow:** Alice later cancels her spot. The system creates an offer for the next waitlisted person. Ben receives a notification offering the slot and can accept or decline. If Ben accepts, his status becomes confirmed and his dashboard updates; if he declines, the next person is offered the slot. He has a limited time to accept based on the time of day and the event configuration that Brandon sets.

5. **User Dashboard:** When Alice or Ben opens their dashboard, they see the organizations they are involved in (e.g. owner, admin, member), upcoming confirmed events, and waitlisted events. Changes (promotions, expirations) that happened while they were away are surfaced as recent activity.

---

### Management & Ongoing Operations

- Brandon can adjust event restrictions (e.g. change capacity for event, restrict sign-ups to one archery practice per user at a time, lift restrictions, etc.)
- Admins can view an event's activity log, manually promote users, manually shift the order, etc.
