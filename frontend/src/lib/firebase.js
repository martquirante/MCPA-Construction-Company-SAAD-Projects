import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app = null;
let firestoreDb = null;
let realtimeDb = null;

export function getFirebaseApp() {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;

  if (!app) {
    try {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    } catch (err) {
      console.warn("[Firebase] Init app warning:", err.message);
    }
  }
  return app;
}

export function getFirebaseFirestore() {
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;
  if (!firestoreDb) {
    try {
      firestoreDb = getFirestore(currentApp);
    } catch (err) {
      console.warn("[Firebase] Init Firestore warning:", err.message);
    }
  }
  return firestoreDb;
}

export function getFirebaseRealtimeDb() {
  const currentApp = getFirebaseApp();
  if (!currentApp) return null;
  if (!realtimeDb) {
    try {
      realtimeDb = getDatabase(currentApp);
    } catch (err) {
      console.warn("[Firebase] Init RealtimeDB warning:", err.message);
    }
  }
  return realtimeDb;
}

export { firebaseConfig };
