import { CallableRequest, HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions, logger } from 'firebase-functions';
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { OAuth2Client } from 'google-auth-library';

// Only up to 10 instances at a time, rest are queued
setGlobalOptions({ maxInstances: 10 });

const authClient = new OAuth2Client();

interface AddUserResult {
  status: 'signedUp' | 'waitlisted';
  message: string;
}

interface RemoveUserResult {
  status: 'leftEvent' | 'leftWaitlist';
  message: string;
  promotedUserId?: string;
}

const handleEmail = async (userId: string, eventId: string) => {
  const userDocRef = adminDb.doc(`users/${userId}`);
  const userDoc = await userDocRef.get();
  const userData = userDoc.data();

  if (!userData) {
    return;
  }

  const eventDocRef = adminDb.doc(`events/${eventId}`);
  const eventDoc = await eventDocRef.get();
  const eventData = eventDoc.data();

  if (!eventData) {
    return;
  }

  const appDomain = process.env.APP_DOMAIN;

  adminDb.collection('mail').add({
    to: userData.email,
    message: {
      subject: `You're off the waitlist for ${eventData.name}`,
      html: `
        <h1>You've got a spot!</h1>
        <p>Hi ${userData.displayName},</p>
        <p>A spot has opened up for the event: <strong>${eventData.name}</strong>. You have been automatically moved to the main list.</p>
        <p>No further action is needed.</p>
        <p>You can view the event details <a href="${appDomain}/events/${eventId}">here</a>.</p>
      `,
    },
  });
};

const handleAddUserToEvent = async (
  eventId: string,
  userId: string,
  answers: Record<string, boolean | null>,
): Promise<AddUserResult> => {
  // all db reads and writes should be a transaction
  try {
    logger.log('starting transaction...');
    const result: AddUserResult = await adminDb.runTransaction(async (transaction) => {
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

      const userData = userDoc.data();

      const userDisplayName = userData?.displayName;
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
          photoURL: userData?.photoURL,
          email: userData?.email,
          signupTime: FieldValue.serverTimestamp(),
          answers: answers,
        });
        transaction.update(eventDocRef, {
          signupsCount: FieldValue.increment(1),
        });
        return { status: 'signedUp', message: 'Signed up successfully!' };
      }

      // add to wait list
      transaction.create(waitlistDocRef, {
        displayName: userDisplayName,
        photoURL: userData?.photoURL,
        email: userData?.email,
        signupTime: FieldValue.serverTimestamp(),
        answers: answers,
      });
      return { status: 'waitlisted', message: 'Added to waitlist' };
    });
    return result;
  } catch (err) {
    logger.log(`ERROR ADDING USER TO EVENT: ${err}`);
    throw err as Error;
  }
};

const handleRemoveUserFromEvent = async (
  eventId: string,
  userId: string,
): Promise<RemoveUserResult> => {
  // all db operations should be a transaction
  try {
    logger.log('starting transaction...');
    const result: RemoveUserResult = await adminDb.runTransaction(async (transaction) => {
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
        return { status: 'leftWaitlist', message: 'Left waitlist successfully.' };
      }

      transaction.delete(signupDocRef);
      transaction.update(eventDocRef, {
        signupsCount: FieldValue.increment(-1),
      });

      // if no one found on waitlist, return early
      if (waitlistSnapshot.empty) {
        return { status: 'leftEvent', message: 'Left event successfully.' };
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
      return {
        status: 'leftEvent',
        message: 'Left event successfully.',
        promotedUserId: nextDoc.id,
      };
    });
    if (!result.promotedUserId) {
      return result;
    }
    handleEmail(result.promotedUserId, eventId);
    return result;
  } catch (err) {
    logger.log(`ERROR REMOVING USER FROM EVENT: ${err}`);
    throw err as Error;
  }
};

export const addUserToEvent = onCall(
  async (
    request: CallableRequest<{
      eventId: string;
      userId: string;
      answers: Record<string, boolean | null>;
    }>,
  ) => {
    // get event id
    const eventId = request.data.eventId;
    if (!eventId) throw new HttpsError('invalid-argument', 'Must provide valid event id');

    // get user id
    const userId = request.data.userId;
    if (!userId) throw new HttpsError('invalid-argument', 'Must provide valid user id');

    // get answers
    const answers = request.data.answers;
    if (!answers)
      throw new HttpsError(
        'invalid-argument',
        'Must provide valid answers map (empty map is fine)',
      );

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
    // option 2 (future): user with id authId is an admin of the event/organization
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

    try {
      return await handleAddUserToEvent(eventId, userId, answers);
    } catch (err) {
      throw err as Error;
    }
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
    // option 2 (future): user with id authId is an admin of the event/organization
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

    try {
      return await handleRemoveUserFromEvent(eventId, userId);
    } catch (err) {
      throw err as Error;
    }
  },
);

const verifyToken = async (idToken: string, functionUrl: string): Promise<boolean> => {
  try {
    const ticket = await authClient.verifyIdToken({
      idToken,
      audience: functionUrl,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return false;
    }
    const callerServiceAccountEmail = payload.email;
    const allowedServiceAccount = process.env.ALLOWED_SERVICE_ACCOUNT;

    if (callerServiceAccountEmail !== allowedServiceAccount) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
};

// must be called from service account
export const serviceAddUserToEvent = onRequest(
  { cors: true, secrets: ['ALLOWED_SERVICE_ACCOUNT'] },
  async (req, res) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      res.status(401).send('Unauthorized');
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const functionURL = `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/serviceAddUserToEvent`;
    let authorized = false;

    try {
      authorized = await verifyToken(idToken, functionURL);
    } catch {
      res.status(401).send('Unauthorized');
      return;
    }

    if (!authorized) {
      res.status(401).send('Unauthorized');
      return;
    }

    logger.log('Authorized!');

    const { eventId, userId, answers } = req.body.data;
    if (!eventId || !userId || !answers) {
      res.status(400).send({ error: { message: 'Bad Request: Missing eventId or userId' } });
      return;
    }

    try {
      const result = await handleAddUserToEvent(eventId, userId, answers);
      res.status(201).send({ data: result });
    } catch (err) {
      if (err instanceof HttpsError) {
        const status = err.code === 'not-found' ? 404 : err.code === 'already-exists' ? 409 : 500;
        res.status(status).send({ error: { message: err.message } });
      } else {
        res.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  },
);

// must be called from service account
export const serviceRemoveUserFromEvent = onRequest(
  { cors: true, secrets: ['ALLOWED_SERVICE_ACCOUNT'] },
  async (req, res) => {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      res.status(401).send('Unauthorized');
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const functionURL = `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/serviceRemoveUserFromEvent`;
    let authorized = false;

    try {
      authorized = await verifyToken(idToken, functionURL);
    } catch {
      res.status(401).send('Unauthorized');
      return;
    }

    if (!authorized) {
      res.status(401).send('Unauthorized');
      return;
    }

    logger.log('Authorized!');

    const { eventId, userId } = req.body.data;
    if (!eventId || !userId) {
      res.status(400).send({ error: { message: 'Bad Request: Missing eventId or userId' } });
      return;
    }

    try {
      await handleRemoveUserFromEvent(eventId, userId);
      res.status(204).send();
    } catch (err) {
      if (err instanceof HttpsError) {
        const status = err.code === 'not-found' ? 404 : err.code === 'already-exists' ? 409 : 500;
        res.status(status).send({ error: { message: err.message } });
      } else {
        res.status(500).send({ error: { message: 'Internal server error' } });
      }
    }
  },
);
