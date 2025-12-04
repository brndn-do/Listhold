import { CallableRequest, HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions, logger } from 'firebase-functions';
import { adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { OAuth2Client } from 'google-auth-library';
import shortUUID from 'short-uuid';
import { EventData } from './types/eventData';
import { UserData } from './types/userData';
import { OrganizationData } from './types/organizationData';
import { MembershipData } from './types/membershipData';

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

const handleEmail = async (userId: string, eventId: string): Promise<void> => {
  const userDocRef = adminDb.doc(`users/${userId}`);
  const userDoc = await userDocRef.get();
  const userData = userDoc.data() as UserData;

  if (!userData) {
    return;
  }

  const eventDocRef = adminDb.doc(`events/${eventId}`);
  const eventDoc = await eventDocRef.get();
  const eventData = eventDoc.data() as EventData;

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
      warmup: boolean;
      eventId: string;
      userId: string;
      answers: Record<string, boolean | null>;
    }>,
  ) => {
    if (request.data.warmup) {
      logger.log('Received warm-up request');
      return { success: true };
    }
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
  async (request: CallableRequest<{ warmup: boolean; eventId: string; userId: string }>) => {
    if (request.data.warmup) {
      logger.log('Received warm-up request');
      return { success: true };
    }
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

interface CreateOrganizationRequest {
  id?: string; // Optional
  name: string; // Required, trimmed
}

interface CreateOrganizationResult {
  organizationId: string;
  message: string;
}

const handleCreateOrganization = async (
  organization: CreateOrganizationRequest,
  callerId: string,
): Promise<{ organizationId: string; message: string }> => {
  const { id, ...rest } = organization;

  let organizationId = id;
  if (!organizationId) {
    // if id is falsy, generate a random unique id
    organizationId = shortUUID().new();
  }

  try {
    logger.log('starting transaction...');
    const result: CreateOrganizationResult = await adminDb.runTransaction(async (transaction) => {
      const orgDocRef = adminDb.doc(`organizations/${organizationId}`);
      const orgDoc = await transaction.get(orgDocRef);

      // check for existance
      if (orgDoc.exists) {
        throw new HttpsError(
          'already-exists',
          `Organization with id ${organizationId} already exists`,
        );
      }

      // create organization
      transaction.create(orgDocRef, {
        ...rest,
        ownerId: callerId, // set the owner of org to be the caller by default
        createdAt: FieldValue.serverTimestamp(),
      });

      // create membership
      const membershipDocRef = adminDb.doc(`users/${callerId}/memberships/${organizationId}`);
      const membershipData: MembershipData = {
        organizationName: organization.name,
        role: 'owner',
      };
      transaction.create(membershipDocRef, membershipData);

      return {
        organizationId,
        message: `Created new organization ${organization.name} with id ${organizationId}`,
      };
    });
    return result;
  } catch (err) {
    logger.log(`ERROR CREATING ORGANIZATION: ${err}`);
    throw err as Error;
  }
};

export const createOrganization = onCall(
  async (
    request: CallableRequest<CreateOrganizationRequest>,
  ): Promise<CreateOrganizationResult> => {
    const { name, id } = request.data;

    // validate 'name'
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      throw new HttpsError(
        'invalid-argument',
        'Organization name must be a string between 2 and 100 characters, and not just whitespace.',
      );
    }
    const trimmedName = name.trim(); // Use the trimmed name going forward

    // 2. Validate 'id' if provided
    if (id !== undefined && id !== null) {
      // Check if id is explicitly provided (not undefined/null)
      if (typeof id !== 'string') {
        throw new HttpsError('invalid-argument', 'ID must be a string if provided.');
      }
      const trimmedId = id.trim(); // Trim ID for validation

      if (trimmedId.length < 4 || trimmedId.length > 50) {
        throw new HttpsError(
          'invalid-argument',
          'ID must be between 4 and 50 characters if provided.',
        );
      }

      // Regex for URL-safe characters: alphanumeric, hyphens, underscores
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
        throw new HttpsError(
          'invalid-argument',
          'ID can only contain letters, numbers, hyphens (-), and underscores (_).',
        );
      }

      // If id is an empty string after trimming, treat it as if it wasn't provided
      if (trimmedId === '') {
        request.data.id = undefined;
      } else {
        request.data.id = trimmedId; // Update request.data.id with the trimmed version
      }
    } else {
      request.data.id = undefined; // Ensure id is explicitly undefined if not provided or empty after trim
    }

    logger.log(`Received request to create organization with name ${trimmedName}`);

    // get uid from auth context
    const callerId = request.auth?.uid;
    if (!callerId)
      throw new HttpsError(
        'unauthenticated',

        'You are not authenticated',
      );

    logger.log('Authorized!');

    try {
      return await handleCreateOrganization({ name: trimmedName, id: request.data.id }, callerId);
    } catch (err) {
      throw err as Error;
    }
  },
);

interface CreateEventRequest {
  organizationId: string;
  name: string;
  location: string;
  start: string;
  end: string;
  capacity: number;
  eventId?: string;
  creatorId: string;
}

interface CreateEventResult {
  eventId: string;
  message: string;
}

const handleCreateEvent = async (request: CreateEventRequest): Promise<CreateEventResult> => {
  let eventId = request.eventId;
  if (!eventId) {
    eventId = shortUUID().new();
  }

  const orgDocRef = adminDb.doc(`organizations/${request.organizationId}`);
  const orgDoc = await orgDocRef.get();
  const orgData = orgDoc.data() as OrganizationData;
  const orgName = orgData.name;

  const { start, end, ...rest } = request;
  const firestoreEventData: EventData = {
    ...rest,
    organizationName: orgName,
    start: Timestamp.fromDate(new Date(start)),
    end: Timestamp.fromDate(new Date(end)),
    createdAt: FieldValue.serverTimestamp() as Timestamp,
    signupsCount: 0,
  };

  try {
    await adminDb.runTransaction(async (transaction) => {
      const eventDocRef = adminDb.doc(`events/${eventId}`);
      const eventDoc = await transaction.get(eventDocRef);

      if (eventDoc.exists) {
        throw new HttpsError('already-exists', `An event with the ID '${eventId}' already exists.`);
      }

      transaction.create(eventDocRef, firestoreEventData);
    });

    return {
      eventId,
      message: `Created new event ${request.name} with id ${eventId}`,
    };
  } catch (err) {
    logger.log(`ERROR CREATING EVENT: ${err}`);
    throw err as Error;
  }
};

export const createEvent = onCall(
  async (
    request: CallableRequest<Omit<CreateEventRequest, 'creatorId'>>,
  ): Promise<CreateEventResult> => {
    const { organizationId, name, location, start, end, capacity, eventId } = request.data;
    const callerId = request.auth?.uid;

    // 1. Authentication check
    if (!callerId) {
      throw new HttpsError('unauthenticated', 'You must be logged in to create an event.');
    }

    // 2. Authorization check (is user the owner of the org?)
    const orgDocRef = adminDb.doc(`organizations/${organizationId}`);
    const orgDoc = await orgDocRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError('not-found', `Organization with id ${organizationId} does not exist.`);
    }

    if (orgDoc.data()?.ownerId !== callerId) {
      throw new HttpsError(
        'permission-denied',
        'You do not have permission to create events for this organization.',
      );
    }

    // 3. Server-side validation
    if (!organizationId || typeof organizationId !== 'string')
      throw new HttpsError('invalid-argument', 'A valid organization ID must be provided.');
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100)
      throw new HttpsError(
        'invalid-argument',
        'Event name must be a string between 2 and 100 characters.',
      );
    if (
      !location ||
      typeof location !== 'string' ||
      location.trim().length < 2 ||
      location.trim().length > 100
    )
      throw new HttpsError(
        'invalid-argument',
        'Location must be a string between 2 and 100 characters.',
      );
    if (!start || typeof start !== 'string' || !Date.parse(start))
      throw new HttpsError('invalid-argument', 'A valid start date must be provided.');
    if (!end || typeof end !== 'string' || !Date.parse(end))
      throw new HttpsError('invalid-argument', 'A valid end date must be provided.');
    if (new Date(start) >= new Date(end))
      throw new HttpsError('invalid-argument', 'End date must be after start date.');
    if (
      typeof capacity !== 'number' ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      capacity > 1000
    )
      throw new HttpsError('invalid-argument', 'Capacity must be an integer between 1 and 1000.');

    const validatedData: CreateEventRequest = {
      organizationId,
      name: name.trim(),
      location: location.trim(),
      start,
      end,
      capacity,
      creatorId: callerId,
    };

    // Optional eventId validation
    if (eventId !== undefined && eventId !== null) {
      if (typeof eventId !== 'string')
        throw new HttpsError('invalid-argument', 'Event ID must be a string if provided.');
      const trimmedId = eventId.trim();
      if (trimmedId.toLowerCase() === 'new')
        throw new HttpsError('invalid-argument', 'The Event ID "new" is a reserved word.');
      if (trimmedId.length > 0) {
        if (trimmedId.length < 4 || trimmedId.length > 50)
          throw new HttpsError('invalid-argument', 'Event ID must be between 4 and 50 characters.');
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId))
          throw new HttpsError(
            'invalid-argument',
            'Event ID can only contain letters, numbers, hyphens, and underscores.',
          );
        validatedData.eventId = trimmedId;
      }
    }

    logger.log(`Received request to create event with name ${validatedData.name}`);

    try {
      return await handleCreateEvent(validatedData);
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
