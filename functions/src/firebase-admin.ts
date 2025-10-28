import * as admin from 'firebase-admin';

admin.initializeApp();

const adminDb = admin.firestore();

export { adminDb };
