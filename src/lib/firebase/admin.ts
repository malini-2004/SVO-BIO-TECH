import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Firebase Admin requires a service account private key.
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const isEmailConfigured = clientEmail && !clientEmail.startsWith("your_");
      const isKeyConfigured = privateKey && !privateKey.startsWith("your_") && !privateKey.startsWith('"your_');

      if (isEmailConfigured && isKeyConfigured) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        console.warn(
          'Firebase Admin SDK: serviceAccountKey.json not found and FIREBASE_PRIVATE_KEY env vars not configured. ' +
          'Server-side admin features will be unavailable.'
        );
      }
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.firestore() : null;
