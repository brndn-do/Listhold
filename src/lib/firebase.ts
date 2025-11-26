import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck } from 'firebase/app-check';
import { ReCaptchaV3Provider } from 'firebase/app-check';
import { getFunctions } from 'firebase/functions';

// Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  reCAPTCHASiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

/**
 * Initializes Firebase App Check for client-side environments.
 *
 * Uses the ReCAPTCHA v3 provider to protect Firebase resources
 * from abuse and unauthorized access.
 *
 * This block should only run in the browser
 *
 * @see https://firebase.google.com/docs/app-check
 */
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    // Use the reCAPTCHASiteKey from your firebaseConfig
    provider: new ReCaptchaV3Provider(firebaseConfig.reCAPTCHASiteKey as string),
    isTokenAutoRefreshEnabled: true,
  });
}

// Export the Firebase Authentication Instance
export const auth = getAuth(app);

// Export the Firestore instance
export const db = getFirestore(app);

// Export the functions instance
export const functions = getFunctions(app);
