import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';

type RequiredEnvKey =
  | 'NEXT_PUBLIC_FIREBASE_API_KEY'
  | 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'
  | 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  | 'NEXT_PUBLIC_FIREBASE_APP_ID';

function getRequiredEnv(key: RequiredEnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const firebaseConfig: FirebaseOptions = {
  apiKey: getRequiredEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getRequiredEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  appId: getRequiredEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const forceLongPolling =
  process.env.NEXT_PUBLIC_FIREBASE_FORCE_LONG_POLLING?.toLowerCase() === 'true';

let db: Firestore;

if (forceLongPolling) {
  try {
    db = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    });
  } catch {
    db = getFirestore(firebaseApp);
  }
} else {
  db = getFirestore(firebaseApp);
}

export { firebaseApp, db };
