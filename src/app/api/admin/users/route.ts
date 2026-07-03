import { NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

// ── Designated admins (must match AuthContext) ─────────────────────────────
const DESIGNATED_ADMINS = ["admin@gmail.com", "arunpandimca@gmail.com"];

// Helper: verify the caller is an admin (custom claim OR designated email)
async function verifyAdmin(request: Request): Promise<boolean> {
  if (!adminAuth) return false;
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  try {
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || "").toLowerCase();
    return !!decoded.admin || DESIGNATED_ADMINS.includes(email);
  } catch (error) {
    console.error("verifyAdmin error:", error);
    return false;
  }
}

// Helper: serialize Firestore Timestamp / ISO string → ISO string
function serializeTs(val: any): string | null {
  if (!val) return null;
  if (typeof val.toDate === "function") return (val.toDate() as Date).toISOString();
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  if (typeof val === "string") return val;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users — list all admin users with lastLoginAt from Auth
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  if (!adminDb || !adminAuth) {
    return NextResponse.json(
      { error: "Firebase Admin SDK not initialized. Please configure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local." },
      { status: 503 }
    );
  }
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await adminDb
      .collection("adminUsers")
      .orderBy("createdAt", "desc")
      .get();

    // Batch-fetch Firebase Auth records to get lastSignInTime
    const uids = snapshot.docs.map((d) => d.id);
    const authUserMap = new Map<string, admin.auth.UserRecord>();
    if (uids.length > 0) {
      try {
        const { users: authUsers } = await adminAuth.getUsers(
          uids.map((uid) => ({ uid }))
        );
        authUsers.forEach((u) => authUserMap.set(u.uid, u));
      } catch (err) {
        console.error("Failed to batch fetch auth user metadata:", err);
      }
    }

    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      const authUser = authUserMap.get(doc.id);
      return {
        id: doc.id,
        ...data,
        createdAt: serializeTs(data.createdAt) ?? new Date().toISOString(),
        lastLoginAt: authUser?.metadata.lastSignInTime ?? null,
        // Ensure status defaults to "active" for legacy records without the field
        status: data.status ?? "active",
        role: data.role ?? "admin",
      };
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("[GET /api/admin/users]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/users — create new Firebase Auth user + Firestore docs
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { error: "Firebase Admin SDK not initialized. Please configure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local." },
      { status: 503 }
    );
  }
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, displayName, role = "admin", status = "active" } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  try {
    // ── Duplicate email guard ──────────────────────────────────────────────
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      // User already exists in Firebase Auth
      const existingDoc = await adminDb.collection("adminUsers").doc(existingUser.uid).get();
      if (existingDoc.exists) {
        return NextResponse.json(
          { error: `An admin account with the email "${email}" already exists.` },
          { status: 409 }
        );
      }
      // Upgrade existing user to admin
      await adminAuth.setCustomUserClaims(existingUser.uid, { admin: true });
      const resolvedName =
        (displayName as string | undefined)?.trim() ||
        existingUser.displayName ||
        email.split("@")[0];
      const now = admin.firestore.FieldValue.serverTimestamp();
      const userData = {
        uid: existingUser.uid,
        email: existingUser.email,
        displayName: resolvedName,
        role,
        status,
        createdAt: now,
      };
      await adminDb.collection("adminUsers").doc(existingUser.uid).set(userData);
      await adminDb
        .collection("users")
        .doc(existingUser.uid)
        .set({ ...userData }, { merge: true });

      return NextResponse.json({
        message: `Existing user "${email}" has been upgraded to admin.`,
        user: { ...userData, createdAt: new Date().toISOString() },
      });
    } catch (lookupErr: any) {
      if (lookupErr.code !== "auth/user-not-found") throw lookupErr;
    }

    // ── Create new Firebase Auth user ──────────────────────────────────────
    const resolvedDisplayName =
      (displayName as string | undefined)?.trim() || email.split("@")[0];

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: resolvedDisplayName,
    });

    // ── Grant admin custom claim ────────────────────────────────────────────
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    // ── Persist profile to adminUsers + users collections ──────────────────
    const now = admin.firestore.FieldValue.serverTimestamp();
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: resolvedDisplayName,
      role,
      status,
      createdAt: now,
    };
    await adminDb.collection("adminUsers").doc(userRecord.uid).set(userData);
    await adminDb.collection("users").doc(userRecord.uid).set({ ...userData }, { merge: true });

    return NextResponse.json({
      message: `Admin account for "${email}" created successfully.`,
      user: { ...userData, createdAt: new Date().toISOString() },
    });
  } catch (error: any) {
    console.error("[POST /api/admin/users]", error);
    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: `An account with the email "${email}" already exists in Firebase Authentication.` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create admin user" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users — update displayName, role, or status
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(request: Request) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { error: "Firebase Admin SDK not initialized." },
      { status: 503 }
    );
  }
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { uid, displayName, role, status } = body;
  if (!uid) {
    return NextResponse.json({ error: "UID is required" }, { status: 400 });
  }

  try {
    // Update Firebase Auth displayName if provided
    if (displayName !== undefined) {
      await adminAuth.updateUser(uid, { displayName });
    }

    // Build Firestore update payload
    const update: Record<string, unknown> = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (role !== undefined) update.role = role;
    if (status !== undefined) update.status = status;

    if (Object.keys(update).length > 0) {
      await adminDb.collection("adminUsers").doc(uid).set(update, { merge: true });
      await adminDb.collection("users").doc(uid).set(update, { merge: true });
    }

    return NextResponse.json({ message: "Admin updated successfully." });
  } catch (error: any) {
    console.error("[PATCH /api/admin/users]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update admin" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/users — revoke admin claim + remove from Firestore
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { error: "Firebase Admin SDK not initialized." },
      { status: 503 }
    );
  }
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { uid } = body;
  if (!uid) {
    return NextResponse.json({ error: "UID is required" }, { status: 400 });
  }

  try {
    await adminAuth.setCustomUserClaims(uid, { admin: false });
    await adminDb.collection("adminUsers").doc(uid).delete();
    await adminDb.collection("users").doc(uid).set({ role: "user" }, { merge: true });

    return NextResponse.json({ message: "Admin access revoked successfully." });
  } catch (error: any) {
    console.error("[DELETE /api/admin/users]", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke admin access" },
      { status: 500 }
    );
  }
}
