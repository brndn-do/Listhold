# Usage Scenario: The Northwestern Archery Club

This document outlines a detailed usage scenario for a sign-up platform tailored for university clubs. It follows the journey of an event organizer and several participants.

---

### **Personas**

- **Brandon (The Organizer):** President of the Northwestern Archery Club. He needs to create and manage sign-ups for weekly practices, control access, and track attendance.
- **Alice (The Participant):** An active club member who wants to sign up for a practice slot.
- **Ben (The Waitlisted Participant):** Another club member who attempts to sign up after an event is already full.

---

### **The Organizer's Journey: Setting Up the Event**

1.  **Event Creation:** Brandon, the club president, needs to release sign-ups for two upcoming practices:
    - Friday, 8:15 PM - 9:45 PM
    - Saturday, 7:15 PM - 8:45 PM

2.  **Setting Rules & Restrictions:** He logs into the platform and creates two new events. For each event, he configures the following rules:
    - **Capacity:** A cap of 20 spots for each practice.
    - **Waitlist & Time Limits:** An automated waitlist is enabled. He configures a dynamic time limit for responses: a 12-hour window for notifications sent overnight (9 PM - 9 AM) and a 1-hour window for notifications sent during the day. This gives sleeping members a fair chance to respond.
    - **Access Control:** Only users with a `@u.northwestern.edu` or `@northwestern.edu` email can sign up.
    - **Sign-up Limitation:** To manage initial demand, he sets a rule that each member can only sign up for **one** of the two practices for now.
    - **Custom Questions:** He adds a few questions that will be prompted on sign-up:
      - _Are you new to Archery?_
      - _Are you new to our club?_
      - _Have you signed the club's physical liability waiver?_

3.  **Admin Collaboration:** Brandon invites the other executive members of his club to the platform and grants them admin permissions, allowing them to help manage the events.

4.  **Distribution:** Once the events are configured, he shares a single link to the sign-up page in the club's email list and social media channels.

---

### **The Participant's Journey: Signing Up**

1.  **Authentication & Live Viewing:** Alice, a club member, clicks the link. She is prompted to log in with her Northwestern Google account. The system verifies her email domain and grants her access. On the event page, she sees both practice events. **At the top of the screen, she can see the small circular profile icons of other members who are currently viewing the page, similar to Google Docs.** She also notes the rule that she can only sign up for one practice.

2.  **Successful Sign-Up:** Alice chooses the Friday practice. The system presents her with Brandon's custom questions. After she answers them, her name instantly appears on the public roster for Friday.

3.  **Joining the Waitlist:** Later, Ben clicks the same link. He sees that the Friday practice is now full but has an active waitlist. He clicks "Join Waitlist," answers the same set of questions, and sees his name appear on the waitlist with his queue position. **Both the main roster and the waitlist are live; all members viewing the page see these lists update in real-time as people sign up or leave.**

4.  **The Spot Opens:** Alice's plans change, so she returns to the app and clicks a button to remove herself from the Friday practice. Her spot is now open, and her name is removed from the live roster.

5.  **Automated Notification:** The system immediately and automatically sends an email to Ben (as the first person on the waitlist). Because the spot opened up at night, the email informs him that he has a 12-hour window to either **confirm** or **decline**, per the rules Brandon configured.

6.  **Waitlist Progression:** Ben has also made other plans, so he clicks "Decline." The system instantly processes his response, removes him from the waitlist, and sends a new notification email to the next person in the queue, continuing the process seamlessly.

---

### **Live Management**

Throughout the week, Brandon observes the sign-up activity. He notices that the Saturday practice has low demand. He logs in and lifts the "one practice per user" restriction, allowing members already signed up for Friday to also sign up for Saturday if they wish. The change is effective immediately.
