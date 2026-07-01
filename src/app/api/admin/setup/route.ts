import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

// Development utility endpoint to assign admin claims to a user
// In a real production scenario, this should be heavily protected or done via Firebase Console/Cloud Function directly
export async function POST(request: Request) {
  try {
    const { email, secretKey } = await request.json();

    // Basic protection using an environment variable secret
    if (secretKey !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin SDK not initialized. Set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL in your environment." },
        { status: 503 }
      );
    }

    const userRecord = await adminAuth.getUserByEmail(email);
    
    // Set custom user claims
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });
    
    // Also update the Firestore user document
    await adminDb.collection("users").doc(userRecord.uid).set(
      { role: "admin" },
      { merge: true }
    );

    return NextResponse.json({ 
      message: `Successfully granted admin privileges to ${email}. User needs to sign out and sign back in for claims to take effect.` 
    });
  } catch (error: any) {
    console.error("Error setting admin claim:", error);
    return NextResponse.json({ error: error.message || "Failed to set admin claim" }, { status: 500 });
  }
}
