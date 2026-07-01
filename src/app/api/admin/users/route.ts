import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

// Helper to verify the caller is an existing admin
async function verifyAdmin(request: Request): Promise<boolean> {
  if (!adminAuth) return false;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    return !!decoded.admin;
  } catch {
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
    const snapshot = await adminDb.collection("adminUsers").orderBy("createdAt", "desc").get();
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

    // Create the Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: displayName || email.split("@")[0],
    });

    // Grant admin custom claim
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    // Persist to Firestore adminUsers collection
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || "",
      createdAt: new Date().toISOString(),
    };
    await adminDb.collection("adminUsers").doc(userRecord.uid).set(userData);

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

    // Remove from adminUsers collection
    await adminDb.collection("adminUsers").doc(uid).delete();

    // Update role in users collection
    await adminDb.collection("users").doc(uid).set({ role: "user" }, { merge: true });

    return NextResponse.json({ message: "Admin access revoked successfully." });
  } catch (error: any) {
    console.error("Error revoking admin access:", error);
    return NextResponse.json({ error: error.message || "Failed to revoke admin access" }, { status: 500 });
  }
}
