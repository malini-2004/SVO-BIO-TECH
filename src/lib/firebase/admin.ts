import * as admin from 'firebase-admin';

// Firebase Admin requires a service account private key.
// In development without one, skip initialization gracefully.
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  const isEmailConfigured = clientEmail && !clientEmail.startsWith("your_");
  const isKeyConfigured = privateKey && !privateKey.startsWith("your_") && !privateKey.startsWith('"your_');

  if (isEmailConfigured && isKeyConfigured) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error);
    }
  } else {
    console.warn(
      'Firebase Admin SDK: FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL not configured. ' +
      'Server-side admin features will be unavailable.'
    );
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
