import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck } from 'firebase/app-check';
import { ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  reCAPTCHASiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
};

// initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize App Check
// Only run this on the client side (in the browser)
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    // Use the reCAPTCHASiteKey from your firebaseConfig
    provider: new ReCaptchaV3Provider(firebaseConfig.reCAPTCHASiteKey as string),
    isTokenAutoRefreshEnabled: true,
  });
}

// get reference to auth
export const auth = getAuth(app);

// get reference to db
export const db = getFirestore(app);
