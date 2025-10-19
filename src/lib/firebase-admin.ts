import 'server-only';
import * as admin from 'firebase-admin';

let app: admin.app.App;

// Parse the JSON string from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  app = admin.app();
}

// Get Firestore database instance
const adminDb = app.firestore();

export { adminDb };
