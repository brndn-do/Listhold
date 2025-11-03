import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions, logger } from 'firebase-functions';
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Only up to 10 instances at a time, rest are queued
setGlobalOptions({ maxInstances: 10 });

export const addUserToEvent = onCall(
  async (request: CallableRequest<{ eventId: string; userId: string }>) => {
    // get event id
    const eventId = request.data.eventId;
    if (!eventId) throw new HttpsError('invalid-argument', 'Must use valid event id');

    // get user id
    const userId = request.data.userId;
    if (!userId) throw new HttpsError('invalid-argument', 'Must use valid user id');

    logger.log(`Received request to add user with id ${userId} to event with id ${eventId}`);

    // get uid from auth context
    const callerId = request.auth?.uid;

    // determine if the caller is authorized
    let authorized = false;
    // option 1: userId === callerId
    if (userId === callerId) {
      authorized = true;
    }
    /*
    // option 2: called from firebase-admin env
    else if (...) {
      authorized = true;
    }

    // option 3 (future): user with id authId is an admin of the event/organization
    else if (...) {
      authorized = true;
    }
    */

    if (!authorized)
      throw new HttpsError(
        'permission-denied',
        'You do not have the necessary permissions to perform this action',
      );

    logger.log('Authorized!');
    // all db reads and writes should be a transaction
    try {
      logger.log('starting transaction...');
      await adminDb.runTransaction(async (transaction) => {
        const eventDocRef = adminDb.doc(`events/${eventId}`);
        const eventDoc = await transaction.get(eventDocRef);

        if (!eventDoc.exists) {
          throw new HttpsError('not-found', `Event with id ${eventId} does not exist`);
        }

        const userDocRef = adminDb.doc(`users/${userId}`);
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists) {
          throw new HttpsError('not-found', `User with id ${userId} does not exist`);
        }

        const userDisplayName = userDoc.data()?.displayName;
        if (!userDisplayName) {
          throw new HttpsError(
            'failed-precondition',
            `User with id ${userId} does not have a display name`,
          );
        }

        // check if user is on list/waitlist already
        const signupDocRef = adminDb.doc(`events/${eventId}/signups/${userId}`);
        const signupDoc = await transaction.get(signupDocRef);
        if (signupDoc.exists) {
          throw new HttpsError(
            'already-exists',
            `User with id ${userId} is already signed up for event with id ${eventId}`,
          );
        }
        const waitlistDocRef = adminDb.doc(`events/${eventId}/waitlist/${userId}`);
        const waitlistDoc = await transaction.get(waitlistDocRef);
        if (waitlistDoc.exists) {
          throw new HttpsError(
            'already-exists',
            `User with id ${userId} is already on the waitlist for event with id ${eventId}`,
          );
        }

        // get current event capacity and sign up count
        const eventCapacity = eventDoc.data()?.capacity || 0;
        const eventSignupsCount = eventDoc.data()?.signupsCount || 0;

        if (eventSignupsCount < eventCapacity) {
          // add to main list
          transaction.create(signupDocRef, {
            displayName: userDisplayName,
            signupTime: FieldValue.serverTimestamp(),
          });
          transaction.update(eventDocRef, {
            signupsCount: FieldValue.increment(1),
          });
        } else {
          // add to wait list
          transaction.create(waitlistDocRef, {
            displayName: userDisplayName,
            signupTime: FieldValue.serverTimestamp(),
          });
        }
      });
    } catch (err) {
      logger.log(`ERROR ADDING USER TO EVENT: ${err}`);
      throw err as Error;
    }
    logger.log('Added user successfully!');
    return { success: true, message: 'Signed up successfully!' };
  },
);

export const removeUserFromEvent = onCall(
  async (request: CallableRequest<{ eventId: string; userId: string }>) => {
    // get event id
    const eventId = request.data.eventId;
    if (!eventId) throw new HttpsError('invalid-argument', 'Must use valid event id');

    // get user id
    const userId = request.data.userId;
    if (!userId) throw new HttpsError('invalid-argument', 'Must use valid user id');

    logger.log(`Received request to remove user with id ${userId} from event with id ${eventId}`);

    // get uid from auth context
    const callerId = request.auth?.uid;

    // determine if the caller is authorized
    let authorized = false;
    // option 1: userId === callerId
    if (userId === callerId) {
      authorized = true;
    }
    /*
    // option 2: called from firebase-admin env
    else if (...) {
      authorized = true;
    }

    // option 3 (future): user with id authId is an admin of the event/organization
    else if (...) {
      authorized = true;
    }
    */

    if (!authorized)
      throw new HttpsError(
        'permission-denied',
        'You do not have the necessary permissions to perform this action',
      );

    logger.log('Authorized!');

    // all db operations should be a transaction
    try {
      logger.log('starting transaction...');
      await adminDb.runTransaction(async (transaction) => {
        const eventDocRef = adminDb.doc(`events/${eventId}`);
        const eventDoc = await transaction.get(eventDocRef);

        if (!eventDoc.exists) {
          throw new HttpsError('not-found', `Event with id ${eventId} does not exist`);
        }

        const signupDocRef = adminDb.doc(`events/${eventId}/signups/${userId}`);
        const signupDoc = await transaction.get(signupDocRef);
        const waitlistDocRef = adminDb.doc(`events/${eventId}/waitlist/${userId}`);
        const waitlistDoc = await transaction.get(waitlistDocRef);

        // snapshot of top spot on waitlist, if exist
        const waitlistQuery = adminDb
          .collection(`events/${eventId}/waitlist`)
          .orderBy('signupTime', 'asc')
          .limit(1);
        const waitlistSnapshot = await transaction.get(waitlistQuery);

        if (!signupDoc.exists && !waitlistDoc.exists) {
          throw new HttpsError(
            'not-found',
            `User with id ${userId} was not found for event with id ${eventId}`,
          );
        }

        if (waitlistDoc.exists) {
          transaction.delete(waitlistDocRef);
          return;
        }

        transaction.delete(signupDocRef);
        transaction.update(eventDocRef, {
          signupsCount: FieldValue.increment(-1),
        });

        // if no one found on waitlist, return early
        if (waitlistSnapshot.empty) {
          return;
        }
        // get next on waitlist to promote
        const nextDoc = waitlistSnapshot.docs[0];
        // place to write
        const newSignupDocRef = adminDb.doc(`events/${eventId}/signups/${nextDoc.id}`);
        // place to delete
        const oldWaitlistDocRef = adminDb.doc(`events/${eventId}/waitlist/${nextDoc.id}`);

        transaction.create(newSignupDocRef, nextDoc.data());
        transaction.update(eventDocRef, {
          signupsCount: FieldValue.increment(1),
        });
        transaction.delete(oldWaitlistDocRef);
      });
    } catch (err) {
      logger.log(`ERROR REMOVING USER FROM EVENT: ${err}`);
      throw err as Error;
    }
    logger.log('Removed user successfully!');
    return { success: true, message: 'Left event successfully!' };
  },
);
