import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if real credentials are present (not placeholders or undefined)
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_api_key_here" &&
  !firebaseConfig.apiKey.startsWith("your_");

let app: FirebaseApp = null as any;
let auth: Auth = null as any;
let db: Firestore = null as any;
let storage: FirebaseStorage = null as any;
let googleProvider: GoogleAuthProvider = null as any;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error("[Firebase] Initialization error:", e);
  }
} else {
  console.warn(
    "[Firebase] Missing or placeholder credentials in .env.local. " +
    "Authentication will be unavailable until real Firebase keys are provided."
  );
}

export { app, auth, db, storage, googleProvider };
