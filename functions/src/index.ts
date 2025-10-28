import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions, logger } from 'firebase-functions';
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Only up to 10 instances at a time, rest are queued
setGlobalOptions({ maxInstances: 10 });

export const handleSignup = onCall(async (request: CallableRequest<{ eventId: string }>) => {
  logger.log('Received signup request');
  // get event id
  const eventId = request.data.eventId;
  if (!eventId) throw new HttpsError('invalid-argument', 'Error: must use valid event id');
  logger.log(`Event ID: ${eventId}`);

  // get uid from auth context
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Error: must be authenticated');
  logger.log(`uid: ${uid}`);

  // all db reads and writes should be a transaction
  try {
    logger.log('starting transaction...');
    await adminDb.runTransaction(async (transaction) => {
      const eventDocRef = adminDb.doc(`events/${eventId}`);
      const eventDoc = await transaction.get(eventDocRef);

      if (!eventDoc.exists) {
        throw new HttpsError('not-found', `Error: event with id ${eventId} does not exist`);
      }

      // get current event capacity and sign up count
      const eventCapacity = eventDoc.data()?.capacity || 0;
      const eventSignupsCount = eventDoc.data()?.signupsCount || 0;

      if (eventSignupsCount >= eventCapacity) {
        throw new HttpsError(
          'resource-exhausted',
          `Error: event with id ${eventId} is at full capacity`,
        );
      }

      const userDocRef = adminDb.doc(`users/${uid}`);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists) {
        throw new HttpsError('not-found', `Error: user with id ${uid} does not exist`);
      }

      const userDisplayName = userDoc.data()?.displayName;
      if (!userDisplayName) {
        throw new HttpsError(
          'failed-precondition',
          `Error: user with id ${uid} does not have a display name`,
        );
      }

      const signupDocRef = adminDb.doc(`events/${eventId}/signups/${uid}`);
      const signupDoc = await transaction.get(signupDocRef);

      if (signupDoc.exists) {
        throw new HttpsError(
          'already-exists',
          `Error: user with id ${uid} is already signed up for event with id ${eventId}`,
        );
      }

      transaction.create(signupDocRef, {
        displayName: userDisplayName,
        signupTime: FieldValue.serverTimestamp(),
      });
      transaction.update(eventDocRef, {
        signupsCount: FieldValue.increment(1),
      });
    });
  } catch (err) {
    logger.log(`ERROR SIGNING UP: ${err}`);
    throw err as Error;
  }
  logger.log('Signed up successfully!');
  return { success: true, message: 'Signed up successfully!' };
});

export const handleLeave = onCall(async (request: CallableRequest<{ eventId: string }>) => {
  logger.log('Receieved request to leave event');
  // get event id
  const eventId = request.data.eventId;
  if (!eventId) throw new HttpsError('invalid-argument', 'Error: must use valid event id');
  logger.log(`Event ID: ${eventId}`);

  // get uid from auth context
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Error: must be authenticated');
  logger.log(`uid: ${uid}`);

  // all db operations should be a transaction
  try {
    logger.log('starting transaction...');
    await adminDb.runTransaction(async (transaction) => {
      const signupDocRef = adminDb.doc(`events/${eventId}/signups/${uid}`);
      const signupDoc = await transaction.get(signupDocRef);

      if (!signupDoc.exists) {
        throw new HttpsError(
          'not-found',
          `Error: user with id ${uid} was not found for event with id ${eventId}`,
        );
      }

      // remove signup
      transaction.delete(signupDocRef);
    });
  } catch (err) {
    logger.log(`ERROR LEAVING EVENT: ${err}`);
    throw err as Error;
  }
  logger.log('Left event successfully!');
  return { success: true, message: 'Left event successfully!' };
});
