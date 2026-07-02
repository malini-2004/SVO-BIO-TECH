import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

import { DESIGNATED_ADMINS } from "@/context/AuthContext";

// Helper to verify the caller is an existing admin
async function verifyAdmin(request: Request): Promise<boolean> {
  if (!adminAuth) return false;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    
    // 1. Check custom claim
    if (decoded.admin) return true;

    // 2. Check hardcoded designated admins
    const email = decoded.email?.toLowerCase();
    if (email && DESIGNATED_ADMINS.map(e => e.toLowerCase()).includes(email)) {
      return true;
    }

    // 3. Check Firestore 'admins' collection
    if (adminDb && decoded.uid) {
      const adminDoc = await adminDb.collection("admins").doc(decoded.uid).get();
      if (adminDoc.exists) return true;

      if (email) {
        const adminEmailSnap = await adminDb.collection("admins").where("email", "==", email).get();
        if (!adminEmailSnap.empty) return true;
      }
    }

    return false;
  } catch (error) {
    console.error("verifyAdmin error:", error);
    return false;
  }
}

// GET /api/admin/users — list all admin users stored in Firestore
export async function GET(request: Request) {
  if (!adminDb) {
    return NextResponse.json({ error: "Firebase Admin SDK not initialized." }, { status: 503 });
  }
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection("admins").orderBy("createdAt", "desc").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/users — create a new Firebase user and grant admin claim
export async function POST(request: Request) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ error: "Firebase Admin SDK not initialized." }, { status: 503 });
  }
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Prevent duplicate entries by checking if the email already exists in 'admins' collection
    const existingAdmins = await adminDb.collection("admins").where("email", "==", email).get();
    if (!existingAdmins.empty) {
      return NextResponse.json({ error: "An admin with this email already exists" }, { status: 409 });
    }

    // Create the Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || email.split("@")[0],
    });

    // Grant admin custom claim
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    // Persist to Firestore admins collection
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || "",
      createdAt: new Date().toISOString(),
    };
    await adminDb.collection("admins").doc(userRecord.uid).set(userData);

    // Also update the general users collection
    await adminDb.collection("users").doc(userRecord.uid).set(
      { role: "admin", email: userRecord.email },
      { merge: true }
    );

    return NextResponse.json({ message: `Admin user ${email} created successfully.`, user: userData });
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return NextResponse.json({ error: error.message || "Failed to create admin user" }, { status: 500 });
  }
}

// DELETE /api/admin/users — revoke admin claim and remove from adminUsers collection
export async function DELETE(request: Request) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json({ error: "Firebase Admin SDK not initialized." }, { status: 503 });
  }
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { uid } = await request.json();
    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 });
    }

    // Revoke admin claim (set to empty object)
    await adminAuth.setCustomUserClaims(uid, { admin: false });

    // Remove from admins collection
    await adminDb.collection("admins").doc(uid).delete();

    // Update role in users collection
    await adminDb.collection("users").doc(uid).set({ role: "user" }, { merge: true });

    return NextResponse.json({ message: "Admin access revoked successfully." });
  } catch (error: any) {
    console.error("Error revoking admin access:", error);
    return NextResponse.json({ error: error.message || "Failed to revoke admin access" }, { status: 500 });
  }
}
