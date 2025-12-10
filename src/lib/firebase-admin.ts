import 'server-only';

import * as admin from 'firebase-admin';

let app: admin.app.App;

/**
 * Parse the Firebase service account credentials from an environment variable.
 *
 * The environment variable `FIREBASE_SERVICE_ACCOUNT` should contain the
 * full JSON string of your Firebase service account credentials.
 */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

// Initialize a Firebase Admin app instance if one doesn't exist
if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  // Reuse the existing initialized Firebase Admin app
  app = admin.app();
}

// Export the Firestore instance for server-side operations
export const adminDb = app.firestore();
export const Timestamp = admin.firestore.Timestamp;
