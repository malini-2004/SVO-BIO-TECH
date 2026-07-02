import { NextResponse } from "next/server";
import * as admin from "firebase-admin";

// ─── Lazy-init Firebase Admin ──────────────────────────────────────────────
function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin@123#";

/**
 * POST /api/admin/seed
 *
 * Idempotently creates/updates the admin Firebase account and grants
 * the `admin: true` custom claim. Protected by SEED_SECRET env var.
 *
 * Call once after setting up Firebase credentials:
 *   curl -X POST http://localhost:3000/api/admin/seed \
 *        -H "x-seed-secret: <your_secret>"
 */
export async function POST(request: Request) {
  // ── 0. Guard: only allow if Firebase Admin is configured ─────────────
  const app = getAdminApp();
  if (!app) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Firebase Admin SDK is not configured. " +
          "Set FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL in .env.local.",
      },
      { status: 503 }
    );
  }

  // ── 1. Optional secret header protection ─────────────────────────────
  const seedSecret = process.env.SEED_SECRET;
  if (seedSecret) {
    const provided = request.headers.get("x-seed-secret");
    if (provided !== seedSecret) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: invalid seed secret." },
        { status: 401 }
      );
    }
  }

  try {
    const authAdmin = admin.auth();
    let uid: string;

    // ── 2. Try to fetch existing user ──────────────────────────────────
    try {
      const existing = await authAdmin.getUserByEmail(ADMIN_EMAIL);
      uid = existing.uid;

      // Update password in case it changed
      await authAdmin.updateUser(uid, { password: ADMIN_PASSWORD });
      console.log("[seed] Updated existing admin user:", uid);
    } catch (fetchErr: any) {
      if (fetchErr.code === "auth/user-not-found") {
        // ── 3. Create user if it doesn't exist ─────────────────────────
        const created = await authAdmin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          displayName: "SVO Admin",
          emailVerified: true,
        });
        uid = created.uid;
        console.log("[seed] Created new admin user:", uid);
      } else {
        throw fetchErr;
      }
    }

    // ── 4. Set admin custom claim ──────────────────────────────────────
    await authAdmin.setCustomUserClaims(uid, { admin: true });
    console.log("[seed] Set admin claim on uid:", uid);

    return NextResponse.json({
      success: true,
      message: `Admin account ready. UID: ${uid}`,
      email: ADMIN_EMAIL,
    });
  } catch (err: any) {
    console.error("[seed] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// Reject all other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
