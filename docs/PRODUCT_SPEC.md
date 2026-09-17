# Listhold — Product Specification

**Status:** Draft for review
**Scope:** Greenfield. This document assumes no existing product, code, or data.
**Deliberately stack-agnostic:** it describes what the product must do and why, not how to build it. Every requirement here should be satisfiable by more than one technical design.

---

## 1. What Listhold is

> **Listhold is the fastest way to run an event with a limited number of spots — where the list is public, the waitlist is fair, and nobody has to ask "am I in?"**

Someone with something to organize creates an event, sets how many people fit, and shares one link. Anyone with the link sees the live list of who is coming and how many spots are left. They tap once to take a spot. When the event fills, the next person joins a waitlist and can see exactly where they stand. When someone drops out, the next person in line gets the spot automatically and is told.

That is the whole product. Everything else in this document exists to make those four sentences reliably true.

### 1.1 The one-sentence test

If a user cannot answer **"am I in, or how far away am I?"** in under three seconds of landing on an event page, the product has failed at its core job — regardless of what else it does well.

---

## 2. The problem

Small groups run capacity-limited events constantly: a club practice with 20 lanes, a study room that seats 12, a pickup game with 18 spots, a workshop with 30 seats, a dinner for 10. The organizing work is always the same three questions:

1. **Who's coming?**
2. **Are we full?**
3. **Who's next if someone drops?**

Today people answer these with tools that were built for something else:

| Tool | How it fails this job |
| :--- | :--- |
| **Group chat thread** ("reply +1") | No capacity enforcement, no order anyone trusts, the count is a manual tally that is always wrong, and the thread scrolls away. Someone has to count by hand and announce it. |
| **Shared spreadsheet** | No access control — anyone can delete a row, including someone else's. No notifications. No mobile experience. Order is whoever typed fastest, and edits are invisible. |
| **Google Forms** | Accepts unlimited submissions past capacity. No live list. No waitlist. No way for a respondent to withdraw. Organizer learns they are over-subscribed after the fact. |
| **Eventbrite / ticketing platforms** | Built for paid, one-off, public events. Heavy setup, payment scaffolding, account friction for attendees, and a waitlist that is a marketing list rather than an ordered queue. |
| **Partiful / invite apps** | Built for parties: RSVP yes/no/maybe, no hard capacity, no ordered waitlist, no per-attendee questions. |

The unmet need is narrow and real: **a hard capacity, a trustworthy queue behind it, and a live public list — with no setup cost and no account ceremony for the person just trying to get a spot.**

### 2.1 What "trustworthy" means here

Trust is the actual product surface. A waitlist people do not believe in is worse than no waitlist, because they stop checking and start messaging the organizer directly — which is the work the product was supposed to eliminate. Concretely, trustworthy means:

- The order is **explicit and visible**. A waitlisted person sees "#3", not "we'll let you know."
- The order is **stable**. Position does not change except by rules the user can predict.
- The count is **never wrong**. The number of open spots shown matches the number of spots actually obtainable, always.
- Overrides are **recorded**. If an organizer moves someone up, that happened on the record, not invisibly.

---

## 3. Who it is for

### 3.1 Primary persona — the Organizer

**"Brandon", club president.** Runs a university archery club. Books two practices a week, 20 lanes each, 60 members on the mailing list who show up unpredictably. He is not an event professional; organizing is a volunteer job he does between classes on his phone.

**What he needs:**
- Publish an event and get a shareable link in under a minute, on a phone.
- Never manually count anyone.
- Ask two or three questions at signup ("Are you new? Have you signed the waiver?") and see the answers next to each name.
- Fix his own mistakes — wrong capacity, wrong time — without recreating the event and re-sharing the link.
- Remove a specific person (a no-show, a duplicate, someone who is not eligible) without anyone else's spot shifting unfairly.
- Hand roster duties to two other officers without sharing his password.

**What he does not need:** payments, ticket tiers, marketing, analytics, a branded landing page.

**What makes him churn:** having to answer "am I on the list?" messages anyway. If the product does not eliminate that, it has bought him nothing.

### 3.2 Primary persona — the Attendee

**"Alice", member.** Sees a link in the group chat on her phone, between classes. She wants a spot at Friday practice. She has never heard of Listhold and will not create an account to find out what it is.

**What she needs:**
- Understand in one glance whether there is a spot.
- Take it in one tap with the least possible identity friction.
- See her own name on the list afterward, as confirmation she can trust.
- Change her mind and withdraw without messaging anyone or feeling like she has caused a problem.
- Not be asked the same three questions from scratch every single week.

**What makes her churn:** a sign-in wall before she can even see whether the event is full. She will close the tab.

### 3.3 Secondary persona — the Waitlisted Attendee

**"Ben", member who was 30 seconds too late.** Same as Alice, plus:

- Know his exact position, not just that he is "on the waitlist."
- Be told **promptly and reliably** when he gets in — this is the single highest-stakes notification in the product.
- Trust that someone who joined the waitlist after him cannot get in ahead of him.
- Know, eventually, that he did *not* get in, so he can make other plans. Silence is a bad outcome.

### 3.4 Secondary persona — the Event Admin

**"Dana", club officer.** Brandon added her to help run the roster. She can do almost everything Brandon can on that specific event, but she does not own it and cannot delete it or remove Brandon.

### 3.5 Explicit non-users

Specifying who this is *not* for keeps the product from being pulled apart:

- **Ticket sellers.** No payments, ever, in this spec. Money changes the legal, refund, and support surface entirely.
- **Conference organizers.** No multi-session agendas, tracks, speakers, or badges.
- **Large-scale public event discovery.** There is no marketplace, no search, no browse. Events are found by link.
- **Companies needing SSO, audit compliance, or admin hierarchies.** Single-owner events with manually added admins is the ceiling.
- **Anyone who wants approval-based signups** (organizer vetting each request before it counts). First-come-first-served is the model; see §14 Q3.

---

## 4. Product principles

These are decision rules. When a feature request conflicts with one of them, the principle wins.

1. **The list is the product.** Anything that makes the list less trustworthy — a stale count, a hidden attendee, an ambiguous position — is a launch-blocking defect, not a polish item.
2. **Fairness is mechanical and visible.** Queue order is explicit, stored, and shown to the person waiting. Any human override is recorded and attributable.
3. **The attendee path is nearly frictionless.** Viewing an event requires nothing. Taking a spot requires the minimum identity we can accept. Every additional field is a measurable loss of attendees.
4. **The organizer is not a data-entry clerk.** The system counts, orders, promotes, and notifies. Humans decide; software bookkeeps.
5. **Mistakes are recoverable.** Every organizer action — wrong capacity, wrong time, wrong person removed — has an obvious path back. Nothing is permanent except deliberate deletion.
6. **Degrade honestly.** When the system cannot show live data, it says so plainly rather than showing stale data as if it were current. A visible "reconnecting" state is better than a confident lie.
7. **One link is the whole distribution model.** No app install, no discovery surface, no account required to look. If it cannot be done with a shared URL, it is out of scope.
8. **Silence is a failure state.** If a user's status changed and we did not tell them, the feature did not work — regardless of what the database says.

---

## 5. Core concepts

The product's vocabulary. These terms are used precisely throughout and should be the terms in the interface.

| Term | Definition |
| :--- | :--- |
| **Event** | A single thing happening at one time and place with a limited number of spots. Standalone — an event is never part of a series or a group. |
| **Owner** | The one user who created the event. Exactly one per event. Has every capability including deletion. Transferable. |
| **Admin** | A user the owner manually added to help run one specific event. Per-event only — being an admin on one event grants nothing on any other. |
| **Organizer** | Collective term for the owner and admins of an event, used when a capability applies to both. |
| **Capacity** | The maximum number of people who can hold a confirmed spot. |
| **Registration** | One person's relationship to one event. Has a state and a position. A person has at most one registration per event, ever — rejoining reuses it. |
| **Confirmed** | A registration state: this person has a spot. |
| **Waitlisted** | A registration state: this person does not have a spot but is in line for one. |
| **Withdrawn** | A registration state: this person left voluntarily. |
| **Removed** | A registration state: an organizer took this person off the event. |
| **Roster** | The confirmed list and the waitlist together — the public face of the event. |
| **Position** | Each registration's place in the event's single ordered queue. Determines promotion order. Never reused, never ambiguous. |
| **Question** | Something the organizer asks at signup. Belongs to one event. |
| **Answer** | One person's response to one question. |
| **Signup window** | The optional period during which joining is allowed. |

### 5.1 The single-queue model

There is **one ordered queue per event**, not two lists. Position is assigned on joining and does not change on promotion.

```
capacity = 3

position:  1      2      3      4      5      6
state:  confirmed confirmed confirmed waitlisted waitlisted waitlisted
        └────── confirmed list ──────┘└────────── waitlist ──────────┘
                                          #1      #2      #3
```

The displayed split is a **consequence** of capacity and position, not independently stored state. When position 2 withdraws, position 4 becomes confirmed — it is the lowest-positioned waitlisted registration. No renumbering occurs.

This matters because it makes fairness a property of the data rather than of a code path: any reason a spot opens produces the same, predictable promotion, and "who is next" is always answerable by looking at the list.

---

## 6. User stories

### 6.1 Format

```
US-nn  As a <persona>, I want <capability>, so that <outcome>.
       Acceptance:
         - Given <context>, when <action>, then <observable result>.
```

Acceptance criteria are given in full for the stories where the detail is load-bearing. `[P0]` = required for launch, `[P1]` = next, `[P2]` = later.

### 6.2 Epic A — Arriving and taking a spot

**US-01 [P0]** As someone who received a link, I want to see the event and whether there is space **without signing in**, so that I can decide whether it is worth my time.
> **Acceptance:**
> - Given I am not signed in, when I open an event link, then I see the name, date, time, location, description, spots remaining, and the roster (subject to §11 visibility) with no sign-in prompt blocking the content.
> - Given the event is full, then the page says so prominently and tells me a waitlist exists before I attempt to join.
> - Given I am not signed in, then the primary action reads "Sign in to join" and nothing else on the page is gated.

**US-02 [P0]** As an attendee, I want to take a spot in as few steps as possible, so that I do not lose the spot while signing up.
> **Acceptance:**
> - Given an event with no questions and I am signed in, when I tap Join, then I hold a confirmed spot with no further screens.
> - Given the event has questions, when I tap Join, then I answer them and my spot is taken on submission — and my answers are not lost if I navigate back mid-flow.
> - Given two people tap Join for one remaining spot at the same moment, then exactly one is confirmed and the other is waitlisted. Neither sees an error, and the confirmed count never exceeds capacity. *(This is the product's hardest guarantee; see §9.1.)*

**US-03 [P0]** As an attendee, I want to see my own name on the list after joining, so that I trust it worked.
> **Acceptance:** Given I just joined, then my entry is visually distinguished as mine, and my position and status are stated in words, not only by list order.

**US-04 [P0]** As an attendee, I want to leave an event I joined, so that I can free the spot without messaging the organizer.
> **Acceptance:**
> - Given I hold a spot, when I choose to leave and confirm, then my spot is released and the next waitlisted person is promoted immediately.
> - Given I am waitlisted, when I leave, then I am removed from the queue and everyone behind me sees their position improve.
> - Leaving requires one confirmation step, and the confirmation states what will happen ("Your spot will be given to the next person on the waitlist").

**US-05 [P0]** As an attendee, I want the list to update while I am watching it, so that I do not have to refresh to see the truth.
> **Acceptance:**
> - Given someone else joins or leaves while I have the page open, then my view reflects it within a few seconds without a manual refresh.
> - Given live updating is unavailable, then the page tells me it is reconnecting and continues to work; it never presents stale data as current. *(Principle 6.)*

**US-06 [P0]** As an attendee, I want to rejoin an event I previously left, so that a change of plans is not permanent.
> **Acceptance:** Given I previously withdrew, when I rejoin, then I go to the **back** of the queue — not to my old position — and I answer the questions again.

**US-07 [P1]** As a returning attendee, I want my previous answers offered as defaults, so that I am not retyping the same three answers every week.

**US-08 [P1]** As an attendee, I want to add the event to my calendar, so that I do not forget it.

### 6.3 Epic B — Waiting fairly

**US-09 [P0]** As a waitlisted attendee, I want to see my exact position, so that I can judge my odds and make other plans.
> **Acceptance:** Given I am waitlisted, then my position is shown as a number ("You're #3 on the waitlist"), updates live as people ahead of me leave, and is never described only as "on the waitlist."

**US-10 [P0]** As a waitlisted attendee, I want to be told immediately and reliably when I get a spot, so that I can actually attend.
> **Acceptance:**
> - Given a spot opens and I am first in line, then I am confirmed and notified without any organizer action.
> - Given the notification cannot be delivered on the first attempt, then it is retried, and the failure is visible to the organizer rather than silent. *(Principle 8.)*
> - I am never notified twice for the same promotion.

**US-11 [P0]** As a waitlisted attendee, I want confidence that people who joined after me cannot get in ahead of me, so that I do not have to keep checking.
> **Acceptance:** Given I am at waitlist position #2, then no one who joined the queue after me can be confirmed before me — unless an organizer explicitly overrides the order, in which case that override is recorded (§6.6).

**US-12 [P1]** As a waitlisted attendee, I want to know when I definitively did not get in, so that I stop waiting.
> **Acceptance:** Given the event closes or starts while I am still waitlisted, then I am notified that I did not get a spot.

**US-13 [P1]** As a waitlisted attendee offered a spot shortly before the event, I want a chance to accept or decline rather than being silently confirmed, so that I am not marked as a no-show for a spot I never saw.
> *This is the "timed offer" model — see §9.5. P1 because it adds real complexity and the simple model is correct for most events.*

### 6.4 Epic C — Creating an event

**US-14 [P0]** As an organizer, I want to create and publish an event in under a minute on my phone, so that organizing does not become a chore.
> **Acceptance:**
> - Required fields are only: name, date and time, location, and capacity. Everything else is optional.
> - Given I complete the required fields, when I publish, then I immediately get a shareable link.
> - The form preserves my input if I background the app or lose connection.

**US-15 [P0]** As an organizer, I want to save an event as a draft, so that I can set it up before I am ready to share it.
> **Acceptance:** Given an event is a draft, then only organizers can open it, no one can join it, and I can preview exactly what attendees will see.

**US-16 [P0]** As an organizer, I want a readable link I can paste into a group chat, so that people trust it and can recognize it later.
> **Acceptance:** Given I do not choose a link, then one is generated from the event name (not a random string of characters). Given I choose one, then it is validated for availability and format before I publish.

**US-17 [P0]** As an organizer, I want to set my event's time in the event's own time zone, so that the time is correct for everyone regardless of where I am when I create it.
> **Acceptance:**
> - Given I create an event, then I select its time zone, defaulted sensibly but always visible and changeable.
> - Given a viewer is in a different time zone, then they see the event's local time as primary and their own local time as secondary.
> - Given I create the event while travelling, then the event time does not shift.

**US-18 [P1]** As an organizer, I want to add a banner image, so that the event page looks like it belongs to my group.

**US-19 [P1]** As an organizer, I want to control when signups open and close, so that I can announce an event before opening it and stop signups the night before.

### 6.5 Epic D — Asking questions at signup

**US-20 [P0]** As an organizer, I want to ask a few questions at signup, so that I have what I need before people arrive.
> **Acceptance:** Given I add questions, then each has a type (§10), a required flag, and a visibility setting, and they are asked in the order I set.

**US-21 [P0]** As an organizer, I want an attendee's agreement to a notice recorded, so that I can demonstrate they acknowledged it.
> **Acceptance:** Given a question is an acknowledgement (e.g. "I understand I must sign a liability waiver"), then the attendee cannot complete signup without affirmatively agreeing, and the agreement is **stored with a timestamp** — not merely enforced in the interface.

**US-22 [P0]** As an organizer, I want some answers private and some public, so that I can ask a sensitive question without publishing it.
> **Acceptance:**
> - Given a question is organizer-only, then only organizers and the answering attendee can see the answer.
> - Given a question is public, then anyone who can see the roster can see the answer.
> - Given I am answering, then I am told which of the two applies **before** I answer.

**US-23 [P0]** As an attendee, I want to see the answers I gave, so that I can check what I told the organizer.

**US-24 [P1]** As an organizer, I want to correct a question's wording after publishing without invalidating existing answers, so that a typo is not permanent.
> **Acceptance:** Given the event is published, then I can edit a question's wording and help text, but not its type or whether it is required; and I can append new questions, which are not retroactively required of people who already signed up.

### 6.6 Epic E — Running the roster

**US-25 [P0]** As an organizer, I want one screen showing everyone with their status, position, and answers, so that I can run the event without exporting anything.

**US-26 [P0]** As an organizer, I want to remove a specific person, so that I can handle duplicates, no-shows, and people who should not be on the list.
> **Acceptance:**
> - Given I remove a confirmed person, then their spot is released, the next waitlisted person is promoted automatically, and the removed person is notified.
> - Given I remove someone, then I may optionally give a reason, which is included in their notification.
> - Removal is recorded with who did it and when.

**US-27 [P0]** As an organizer, I want to fix a capacity I set wrong, so that I do not have to recreate the event and re-share the link.
> **Acceptance:**
> - Given I increase capacity, then waitlisted people are promoted in order, immediately, until the event is full or the waitlist is empty, each notified.
> - Given I decrease capacity below the number of confirmed people, then **nobody is automatically removed**. I am warned clearly, the event is flagged as over-subscribed to me, and no new confirmations occur until the confirmed count falls below capacity. *(Principle 5: the system never takes someone's spot away on its own.)*

**US-28 [P1]** As an organizer, I want to move someone's position manually, so that I can honour a commitment I made outside the app.
> **Acceptance:** Given I move someone, then the change takes effect immediately, everyone affected sees their new position, and the override is recorded as an organizer action attributable to me. *(Principle 2 — the escape hatch exists but is never invisible.)*

**US-29 [P1]** As an organizer, I want to add someone to the list myself, so that I can sign up the person who texted me instead of using the link.

**US-30 [P1]** As an organizer, I want to export the roster, so that I can use it with the tools I already have (sign-in sheets, mailing lists).

**US-31 [P1]** As an organizer, I want to see the history of what happened to this event's list, so that I can explain a decision or spot a problem.
> **Acceptance:** Every promotion (automatic and manual), removal, reorder, capacity change, and lifecycle change is listed with actor and timestamp. *This history must be **recorded from launch** even if the screen that displays it ships later — history cannot be backfilled.*

**US-32 [P2]** As an organizer, I want to mark who actually showed up, so that I know my real attendance rate.

### 6.7 Epic F — Event admins

**US-33 [P0]** As an owner, I want to add specific people as admins of my event, so that others can help run the roster without my credentials.
> **Acceptance:**
> - Given I am the owner, then I can add an admin by email address, and remove any admin at any time.
> - Given the person I invite does not have an account, then the invitation is pending and takes effect when they sign in with that email.
> - Given someone becomes an admin, then they are notified and the event appears in their own event list.
> - Admin status applies to **this event only**.

**US-34 [P0]** As an owner, I want admins to be able to run the roster but not destroy the event, so that delegating is low-risk.
> **Acceptance:** Per the capability matrix in §8.2 — admins manage the roster and event details; only the owner can delete the event, transfer ownership, or manage the admin list.

**US-35 [P0]** As an admin, I want it to be clear which events I help run versus which are mine, so that I do not act beyond my remit.

**US-36 [P1]** As an owner, I want to hand my event to someone else, so that leaving the group does not orphan it.
> **Acceptance:** Given I transfer ownership to an admin, then they become owner, I become an admin, and both of us are notified.

### 6.8 Epic G — Changing and ending an event

**US-37 [P0]** As an organizer, I want to change the time or location of a published event and have everyone told, so that I do not have to chase people individually.
> **Acceptance:** Given I change the date, time, time zone, or location of a published event, then every confirmed and waitlisted person is notified of what changed, with both the old and new values.

**US-38 [P0]** As an organizer, I want to cancel an event, so that people do not turn up to nothing.
> **Acceptance:** Given I cancel, then everyone confirmed and waitlisted is notified, the page clearly shows it is cancelled, the roster is frozen but still readable, and nobody can join.

**US-39 [P0]** As an organizer, I want signups to stop on their own, so that someone cannot join an event that already happened.
> **Acceptance:** Given the event's end time (or its signup close time, if set) has passed, then joining is refused with a clear explanation, and the roster remains readable as a record.

**US-40 [P1]** As an organizer, I want to delete an event entirely, so that a mistake or a test does not clutter my list.
> **Acceptance:** Deletion is confirmed explicitly, notifies anyone registered, and is recoverable for a grace period before becoming permanent.

### 6.9 Epic H — My events

**US-41 [P0]** As an attendee, I want one place showing what I am signed up for, so that I do not have to hunt for links.
> **Acceptance:** Given I am signed in, then I see my upcoming confirmed events, my upcoming waitlisted events **with my current position**, and my past events, each linking to the event.

**US-42 [P0]** As an organizer, I want one place showing events I run, so that I can get to the roster quickly.
> **Acceptance:** Drafts, upcoming, and past are distinguished, and events I own are distinguished from events I admin.

**US-43 [P1]** As a user, I want to see recent changes affecting me, so that I learn about a promotion even if I missed the email.

### 6.10 Epic I — Identity and account

**US-44 [P0]** As a new attendee, I want to sign in with the least possible effort, so that the sign-in step does not cost me the spot.
> **Acceptance:**
> - At least two sign-in methods, one of which requires no existing account with any particular provider (e.g. an emailed sign-in link).
> - Given I sign in from an event page, then I am returned to that event page in the state I left it, with my intended action still pending.
> - No password is required to create an account.

**US-45 [P0]** As an attendee, I want my name and picture shown on lists, so that others recognize me and I recognize myself.
> **Acceptance:** Given I sign in, then a display name is established with no required form to fill; I am shown what will appear publicly and given a one-tap chance to change it. This prompt is skippable and never blocks joining an event.

**US-46 [P1]** As a user, I want to control which emails I get, so that I am not driven to unsubscribe from everything.
> **Acceptance:** Per §12 — notifications about a spot I hold are not opt-out-able; reminders and digests are.

**US-47 [P1]** As a user, I want to delete my account, so that I can leave.
> **Acceptance:** Given I delete my account, then my answers are deleted and my historical roster entries are anonymized rather than removed — so past events' counts and ordering stay intact.

---

## 7. A full scenario

The atomic stories above are the testable units. This is what they add up to.

**Tuesday, 9:40pm.** Brandon opens Listhold on his phone between problem sets. He creates "Friday Night Practice", Friday 8:15–9:45pm, Central Time, Blomquist Gym, 20 spots. He adds three questions: *Are you new to archery?* (yes/no, organizer-only), *Anything we should know?* (short text, organizer-only), and *I understand I must sign a liability waiver before shooting.* (acknowledgement). He adds Dana as an admin so she can run the list if he is busy. He publishes and pastes `listhold.com/friday-night-practice` into the club's group chat.

**Wednesday, 8:02am.** Alice sees the link on the bus. She taps it. Without signing in she can see: Friday 8:15pm, Blomquist Gym, **20 spots left**, and an empty list. She taps "Sign in to join", gets a sign-in link by email, and lands back on the same page. She answers the three questions — noting the waiver, and typing "I have my own bow" — and submits. She is **#1, confirmed**. Her name is on the list, highlighted as hers. Total elapsed time: under a minute.

**Wednesday through Thursday.** Nineteen more people join. Brandon never counts anyone. He checks the roster once and sees that four people answered "new to archery" — so he arranges an extra coach.

**Thursday, 6:15pm.** Ben taps the link. The page says **Event is full — join the waitlist**. He joins, answers the same questions, and sees **"You're #1 on the waitlist."** He does not message Brandon, because he does not need to.

**Thursday, 9:30pm.** Alice's plans change. She opens the event and taps Leave. The confirmation tells her her spot will go to the next person on the waitlist. She confirms.

Within a second: Ben's registration becomes **confirmed**. Anyone with the page open sees Alice's name disappear and Ben's move into the confirmed list. Ben gets an email — *"A spot opened up for Friday Night Practice and you're on the list."* He had not even been looking at the page.

**Friday, 7:50pm.** Dana opens the roster on the way to the gym. Nineteen confirmed, one waitlisted, everyone's waiver acknowledgement recorded. One name is a duplicate of someone who signed up twice under two emails; she removes it, which promotes the last waitlisted person, who is notified. She does not need Brandon for any of this.

**Friday, 9:45pm.** The event's end time passes. Signups close automatically. The roster stays readable as a record of who was there.

**Nobody asked anybody "am I on the list?" all week.** That is the product working.

---

## 8. Roles and permissions

### 8.1 Roles

| Role | Scope | How it is obtained |
| :--- | :--- | :--- |
| **Anonymous visitor** | One event, read-only | Has the link |
| **Attendee** | Their own registration | Signed in and joined |
| **Admin** | One specific event | Manually added by that event's owner |
| **Owner** | One specific event | Created it, or received it by transfer |

There is no account-level or global role. Every capability is scoped to a single event. A user is simultaneously an owner of some events, an admin of others, and an attendee of others.

### 8.2 Capability matrix

| Capability | Visitor | Attendee | Admin | Owner |
| :--- | :-: | :-: | :-: | :-: |
| View event details | ◐ | ◐ | ✓ | ✓ |
| View roster | ◐ | ◐ | ✓ | ✓ |
| View public answers | ◐ | ◐ | ✓ | ✓ |
| View own answers | | ✓ | ✓ | ✓ |
| View all answers incl. private | | | ✓ | ✓ |
| Join / leave | | ✓ | ✓ | ✓ |
| Edit event details | | | ✓ | ✓ |
| Change capacity | | | ✓ | ✓ |
| Add / edit questions | | | ✓ | ✓ |
| Remove a registrant | | | ✓ | ✓ |
| Reorder positions | | | ✓ | ✓ |
| Add a registrant manually | | | ✓ | ✓ |
| Publish / close / cancel event | | | ✓ | ✓ |
| Export roster | | | ✓ | ✓ |
| View event history | | | ✓ | ✓ |
| **Add / remove admins** | | | | ✓ |
| **Transfer ownership** | | | | ✓ |
| **Delete event** | | | | ✓ |

◐ = subject to the event's roster visibility setting (§11) and publication state.

**Notes.**
- Owners and admins may hold a registration like anyone else; being an organizer does not reserve a spot.
- An admin cannot add or remove other admins. Delegation is one level deep, deliberately — it keeps the trust model explainable.
- Removing an admin does not affect their registration if they have one.
- Every event has exactly one owner at all times.

---

## 9. Capacity and queue rules

This section is normative. It is the part of the product where a defect costs a real person a real spot, and every rule here should map to an automated test.

### 9.1 The invariants

| # | Invariant | Consequence if violated |
| :-- | :--- | :--- |
| **I1** | The number of confirmed registrations never exceeds capacity — under any number of simultaneous requests. | Two people believe they have the last spot. The organizer discovers it at the door. |
| **I2** | Every registration has a unique, stable position within its event. | "Who's next" has no answer; two people both think they are #1. |
| **I3** | Promotion is always to the lowest-positioned waitlisted registration. | The queue is not a queue; joining early buys nothing. |
| **I4** | Whenever the confirmed count is below capacity and the waitlist is non-empty, promotion happens — repeatedly, until full or empty. | Open spots sit unfilled while people wait for them. |
| **I5** | The spots-remaining figure shown to users always equals the number of spots actually obtainable. | Users are invited to take spots that do not exist, or not offered spots that do. |
| **I6** | Every person holding a spot appears on the roster. | A phantom seat: the list disagrees with reality and the count is wrong. |
| **I7** | Repeating an action does not repeat its effect. | Double-tapping creates duplicates or duplicate notifications. |

**I4 deserves emphasis.** Promotion must be a consequence of the event's *state*, not of one particular user action. Every one of these must promote identically:

- an attendee withdraws
- an organizer removes someone
- capacity is increased
- an offered spot is declined or expires (§9.5)
- any correction or repair performed on the data

If promotion is implemented per-action rather than once centrally, some of these paths will be missed and the waitlist will silently stall. This is the single most important structural requirement in the document.

Additionally, the system must be able to **verify and repair** its own queue: given an event, recompute the correct confirmed/waitlisted split from capacity and position, promote anyone owed a spot, and do nothing if everything is already correct. This must be safe to run repeatedly and must not re-notify anyone whose state does not actually change.

### 9.2 Joining

| Condition | Result |
| :--- | :--- |
| Spots available, signup window open | Confirmed |
| Full, waitlist enabled | Waitlisted, at the back |
| Full, waitlist disabled | Refused: "This event is full" |
| Already confirmed or waitlisted | No change; current status shown (I7) |
| Previously withdrawn or removed | New position at the back; questions asked again; prior answers discarded |
| Event is a draft | Refused — not joinable |
| Event is cancelled | Refused, with the cancellation shown |
| Signup window not yet open | Refused, with the opening time |
| Signup window closed, or event ended | Refused: "Signups have closed" |
| Required question unanswered | Refused at the form; never a partial registration |

### 9.3 Leaving and removal

| Action | Effect |
| :--- | :--- |
| Confirmed person leaves | State → withdrawn; spot released; promotion runs (I4) |
| Waitlisted person leaves | State → withdrawn; everyone behind them advances |
| Organizer removes a confirmed person | State → removed; spot released; promotion runs; person notified with optional reason |
| Organizer removes a waitlisted person | State → removed; person notified |
| Already withdrawn or removed | No effect, no notification (I7) |

### 9.4 Capacity changes

**Increase.** Promote in position order, immediately, until full or the waitlist is empty. Notify each promoted person.

**Decrease below the confirmed count.** Never remove anyone automatically. Require explicit confirmation showing the numbers ("You have 18 confirmed; setting capacity to 15 will leave the event over-subscribed"). Surface the over-subscribed state to organizers persistently. Block new confirmations until the confirmed count falls below capacity. The organizer resolves it by removing specific people, or by putting capacity back.

*Rationale: silently ejecting the last three people who joined would be the single most trust-destroying thing the product could do. Principle 5 outranks tidiness.*

### 9.5 Promotion behaviour — automatic vs. offered

Two models, set per event.

**Automatic (default, P0).** A spot opens, the next person is confirmed and told. Simple, immediate, and correct for low-stakes events where attendance is casual — if the promoted person cannot come, they withdraw and the queue moves again.

**Timed offer (P1, opt-in).** A spot opens, the next person is *offered* it with a deadline. They accept or decline. On decline or expiry, the offer cascades to the next person. Suited to events where a no-show is costly and a spot given to someone who never saw the email is a wasted spot.

The offer model adds: an additional registration state, a scheduled expiry mechanism, cascade-on-expiry logic, and a more complicated thing to explain to attendees. That complexity is not justified for launch, but the automatic model must not be built in a way that precludes it — promotion behaviour should be a per-event setting from the start, even if only one value is available initially.

---

## 10. Questions and answers

### 10.1 Question types

| Type | What the attendee does | Why it exists |
| :--- | :--- | :--- |
| **Yes / No** | Picks one | "Are you new to the club?" — the most common case |
| **Acknowledgement** | Must check a box to proceed | Waivers, rules, safety notices. **The agreement is recorded with a timestamp** — enforcing it only in the interface is useless to an organizer who later needs to show it happened (US-21) |
| **Short text** | Types a line | "Anything we should know?" — the open-ended escape hatch |
| **Choice** | Picks one of the organizer's options | "Which lane group?", "Beginner / Intermediate / Advanced" |

Every question has: order, wording, optional help text, required flag, and visibility (public or organizer-only).

**Not in scope:** multi-select, file upload, numeric, date, conditional branching, per-attendee custom questions. The signup flow must stay under thirty seconds; a form builder is a different product.

### 10.2 Behaviour

- Questions are asked in order, one screen at a time on mobile, with visible progress.
- Progress survives navigating back, and answers are not lost.
- A required question blocks submission until answered; an optional one can be explicitly cleared after being answered.
- Before answering, the attendee is told whether each answer will be public or organizer-only (US-22).
- Editable freely while the event is a draft. After publishing: wording and help text may be corrected; type and required flag are frozen; new questions may be appended but are not retroactively required (US-24).
- Withdrawing discards answers; rejoining asks again (§9.2).

### 10.3 Answer visibility

| Viewer | Sees |
| :--- | :--- |
| The attendee who answered | All of their own answers, always |
| Organizers of that event | All answers from everyone |
| Anyone who can view the roster | Only answers to questions marked public |

---

## 11. Visibility and privacy

### 11.1 Event visibility

Follows the event's state: **draft** — organizers only, plus a shareable preview link; **published** — per roster visibility below; **closed** — same as published, but not joinable; **cancelled** — same as published, prominently marked; **deleted** — nobody.

### 11.2 Roster visibility

Per-event setting, chosen at creation:

| Setting | Who sees the roster and the count |
| :--- | :--- |
| **Public** (default) | Anyone with the link |
| **Attendees only** | Organizers and anyone with a registration on this event |
| **Organizers only** | Organizers only; others see just the spots-remaining count |

The default is public because a visible list is the product's main trust mechanism — seeing who else is coming is *why* people believe the page. But some events (a support group, a medical clinic, a private dinner) cannot have a public attendee list, and for them the alternative must exist rather than being a reason not to use the product.

The attendee must be shown the applicable setting **before** they answer questions or join.

### 11.3 Other privacy rules

- Withdrawn and removed registrations are **not** publicly visible. Only the person themselves and organizers can see them. The public roster shows who is coming, not who changed their mind.
- Only display name and picture are ever published. Email addresses are never shown to other attendees — including to organizers on the roster, unless the organizer added that person by email themselves.
- Answers are deleted when a registration is withdrawn, after a retention period.
- Event history (§6.6 US-31) is retained for the organizer but is never public.
- Users can export their own data and delete their account (US-47), with historical roster entries anonymized rather than deleted so past events remain coherent.

---

## 12. Notifications

Notifications are how the product keeps its promise that a user never has to wonder. A missed one is a product failure, not an infrastructure detail (Principle 8).

### 12.1 Requirements

- **Never lost.** If a state change happened, its notification is queued durably as part of that change. A delivery failure is retried and, when finally unsuccessful, made visible to the organizer — not logged and forgotten.
- **Never duplicated.** Each notification is sent at most once, however many times the triggering path is retried.
- **Observable.** An organizer can see whether the person they promoted was actually reached. "The system said it sent it" is not sufficient.
- **Honest.** No notification about a state change that did not occur.

### 12.2 Catalogue

| Notification | Trigger | Recipient | Priority | Opt-out |
| :--- | :--- | :--- | :-: | :-: |
| **You're in — a spot opened** | Promoted from waitlist | Promoted attendee | P0 | No |
| **Event cancelled** | Organizer cancels | All confirmed + waitlisted | P0 | No |
| **Event details changed** | Time, date, time zone, or location changed | All confirmed + waitlisted | P0 | No |
| **You were removed** | Organizer removes someone | Removed person | P0 | No |
| **You're an admin** | Owner adds an admin | New admin | P0 | No |
| **Signup confirmed** | Join → confirmed | Joiner | P1 | Yes |
| **You're on the waitlist** | Join → waitlisted, with position | Joiner | P1 | Yes |
| **Event reminder** | 24h before start | Confirmed attendees | P1 | Yes |
| **You didn't get a spot** | Event closes with them still waitlisted | Waitlisted attendees | P1 | Yes |
| **Ownership transferred** | Owner transfers | Both parties | P1 | No |
| **Spot offered — respond by…** | Offer issued (§9.5) | Offered attendee | P1 | No |
| **New signups summary** | Daily while signups are open | Organizers | P2 | Yes, default off |

**The rule dividing the column:** notifications about a spot you hold or an event you are attending are consequential and cannot be turned off. Everything else can. A user who mutes reminders must still be told their event was cancelled.

### 12.3 Delivery

- Email at launch, since it is the only channel that requires nothing of the recipient.
- Every message states what happened, which event, what the recipient's status now is, and links straight to the event.
- Every opt-out-able message carries a working one-click unsubscribe. A claim in the footer that the address is not on a marketing list is not a substitute for an unsubscribe link.
- Messages must be legible as plain text and in dark mode.
- Additional channels (push, SMS) are out of scope but the notification model should not assume a single channel.

---

## 13. Quality bar

Expressed as product requirements, not implementation targets.

### 13.1 Correctness — the non-negotiables

Every invariant in §9.1 holds always. Specifically verified:

- Many people attempting to take the last spot simultaneously results in exactly one confirmation, with the rest correctly queued and no errors shown.
- Every path that frees a spot promotes from the waitlist — verified for each path independently, not just the common one.
- The repair operation (§9.1) is safe to run at any time and re-notifies nobody.
- No one holding a spot can be missing from the roster.
- Event times survive creation, editing, and viewing across time zones and daylight-saving boundaries without shifting.

### 13.2 Speed

The product's credibility rests on a page that loads fast on a phone on mobile data, since that is where every attendee meets it.

- Event page usable in **under 2 seconds** on a typical mobile connection.
- Live roster updates visible within **about a second** of the change.
- Joining feels instantaneous: immediate feedback, and never leaving the user unsure whether it worked.
- Roster remains responsive at the largest supported capacity.

### 13.3 Accessibility

Non-optional, on every core flow (event page, signup, creation, roster management, dashboard):

- Fully operable by keyboard, including the signup flow and every dialog.
- Screen-reader usable: roster changes announced, status conveyed in text rather than by colour or position alone.
- Meets WCAG 2.1 AA for contrast, focus visibility, and target size.
- Dialogs trap focus, restore it on close, and close on Escape.
- The list works at phone width without horizontal scrolling.

### 13.4 Reliability

- The event page keeps working when live updates are unavailable, and says so (Principle 6).
- A notification failure never rolls back the state change that caused it, and never disappears.
- A partially completed organizer action leaves no half-created event.
- Rate limits prevent one user from spamming state changes, with a comprehensible message rather than a silent failure.

### 13.5 Scale assumptions

Sized for the real use case, and stated so design decisions can be checked against them:

- Capacity per event: up to ~1,000, typically 10–50.
- Waitlist: can exceed capacity; unbounded in principle.
- Simultaneous viewers of one event page: hundreds at signup-opening moments.
- Events per organizer: a handful per month.
- No expectation of viral, internet-scale traffic to a single event.

---

## 14. Out of scope

Recorded so they can be declined quickly and consistently.

**Permanently out (would change the product):** payments, ticketing, refunds · approval-based signups where the organizer vets each request · multi-session or multi-track agendas · public event discovery, search, or browse · organizations, teams, groups, or shared accounts of any kind · recurring events and series · native mobile apps.

**Out for now (plausible later):** SMS and push · calendar write-back (a downloadable calendar file is in scope) · guest-and-plus-ones · attendee messaging · check-in and attendance history *(P2)* · waitlist priority rules beyond first-come-first-served · custom domains and branding · non-English languages — though nothing should be designed in a way that makes translation impossible.

---

## 15. Open questions

Decisions needed before or during build. Recommendations given; all are the product owner's call.

**Q1 — How do repeat attendees find the next event?**
Because the product has no concept of a group, there is no home page listing a club's events, so every event depends on the owner re-sharing a fresh link. For a club running two practices a week to the same sixty people, this is the most likely source of friction. Options: (a) accept it — link-sharing only, consistent with Principle 7; (b) give each owner a public page listing their published events, so one durable link can be shared once; (c) let attendees follow an owner and be notified of new events.
> **Recommendation: (b) as P1.** It solves the actual problem with one read-only page and no new concepts — no membership, no roles, no groups. (c) is a notification product and a larger commitment.

**Q2 — Default roster visibility.**
Public makes the product immediately legible and is its main trust mechanism; it also means attendee names are on a URL anyone can forward.
> **Recommendation: public by default,** with the setting presented clearly at creation and shown to attendees before they join.

**Q3 — Is first-come-first-served always right?**
Some organizers will want to approve signups, or prioritize by membership or attendance history. This is a real need but a different product shape: it breaks the "tap once and you're in" promise and introduces a pending state.
> **Recommendation: out of scope for launch.** Revisit only if organizers consistently ask. The manual reorder (US-28) plus manual add (US-29) cover most of the underlying need.

**Q4 — Should the timed-offer model ship at launch?**
See §9.5. It is materially more complex and only matters when no-shows are costly.
> **Recommendation: no — P1.** But make promotion behaviour a per-event setting from day one so adding it later is not a migration.

**Q5 — What identity is the minimum?**
Sign-in friction is the single biggest measurable loss of attendees. The most aggressive option is letting someone claim a spot with just a name and email, upgrading to a real account later.
> **Recommendation: require a real sign-in, but make it passwordless** (email link plus one social provider). A claimed-by-name spot cannot be reliably withdrawn by its owner, cannot be notified with confidence, and makes the roster impersonatable — which attacks the trust the product is built on. Revisit if measured drop-off at sign-in is severe.

**Q6 — Maximum capacity.**
Drives roster rendering and live-update design. Above a few hundred, the list needs different treatment.
> **Recommendation: 1,000,** which is far above the expected use and still lets the list render as a list.

**Q7 — Does the organizer see attendee email addresses?**
Useful for contacting a no-show; a meaningful privacy exposure to a person the attendee may not know.
> **Recommendation: no.** Organizers contact attendees through the product. Reconsider if organizers report it as blocking.

**Q8 — How long is deleted-event recovery, and what happens to the link?**
> **Recommendation: 30 days recoverable, link held for that period,** so a mis-click is fixable and a shared link does not immediately resolve to someone else's event.

**Q9 — Withdrawn-answer retention.**
Answers are deleted when someone withdraws — but organizers may legitimately need the waiver acknowledgement of someone who withdrew and rejoined.
> **Recommendation: retain acknowledgements, discard other answers.** Needs confirmation.

---

## 16. Success metrics

### 16.1 Product must-haves (any failure is a P0 bug, not a metric miss)

| Metric | Target |
| :--- | :--- |
| Events where confirmed count exceeded capacity | **0** |
| Events with an open spot and a waiting person for more than a minute | **0** |
| People holding a spot but missing from the roster | **0** |
| Promotion notifications delivered | **>99%**, and **100% observable** |

### 16.2 Does the product do its job?

| Metric | Why it is the right measure |
| :--- | :--- |
| Median time from starting to publishing an event | Tests Principle 3 and US-14. Target: **under 60 seconds.** |
| Share of events that fill to capacity | If events do not fill, capacity and waitlists are not the user's problem and we have the wrong product. |
| Share of full events with at least one waitlist signup | Direct evidence the waitlist is used rather than tolerated. |
| Waitlist conversion — waitlisted people who end up confirmed | The waitlist's reason to exist. A low number means promotion is not working or not reaching people. |
| Self-service withdrawal rate | Every self-withdrawal is an organizer message that did not have to be sent. This is the clearest proxy for the product's core value. |
| Repeat organizers — published an event in two consecutive months | The retention number that matters. Organizers bring all the attendees. |
| Attendee drop-off at the sign-in step | The largest known leak in the funnel (Q5). |
| Events where capacity or time was edited after publishing | Evidence Principle 5 is being used, and that organizers trust the product enough to fix things in it rather than starting over. |

### 16.3 Anti-metrics — things that should stay near zero

- Organizers manually reordering positions frequently → the fairness model does not match their real needs (revisit Q3).
- Attendees joining and immediately leaving → the page is misleading about availability.
- Support contacts asking "am I on the list?" → the product's entire premise is not landing.
