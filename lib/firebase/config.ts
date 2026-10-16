import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

export const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDoHckMzXrScOdG-ipd-1NKcSZkRHQM_ew",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "dream-dollars-1eaee.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "dream-dollars-1eaee",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "dream-dollars-1eaee.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "1093351334049",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:1093351334049:web:e5b2f44f57dd708c1d90e0",
};

// Initialize Firebase as a singleton to avoid duplicate initialization in Next.js
export const getFirebaseApp = (): FirebaseApp => {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
};

export const app = getFirebaseApp();
