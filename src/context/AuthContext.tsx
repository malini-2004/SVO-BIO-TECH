"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/config";

// ─── Single source of truth for designated admin accounts ────────────────────
export const DESIGNATED_ADMINS = ["admin@gmail.com", "nandhaorganics@gmail.com"];

// Cookie helpers — keeps cookie logic in one place
function setCookie(name: string, value: string, maxAge: number) {
  try {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict`;
  } catch {
    // Not in a browser context — safe to ignore
  }
}
function clearCookie(name: string) {
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
  } catch {}
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  firebaseReady: boolean;
  signOutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  firebaseReady: false,
  signOutAdmin: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const signOutAdmin = async () => {
    if (auth) await signOut(auth);
    clearCookie("auth_token");
    clearCookie("is_admin");
  };

  useEffect(() => {
    // ── If Firebase is not configured, stop loading immediately ───────────
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    // ── Safety timeout: if onAuthStateChanged never fires, unblock after 5s ─
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(timeout);
      setUser(currentUser);

      if (currentUser) {
        // ── Determine admin status ─────────────────────────────────────
        let adminStatus = false;

        const userEmail = currentUser.email?.toLowerCase() || "";

        // 1. Check designated admins list (hardcoded super-admins)
        if (DESIGNATED_ADMINS.includes(userEmail)) {
          adminStatus = true;
        } else {
          // 2. Check Firebase custom claims (set by Admin SDK when admin is created)
          try {
            const idTokenResult = await currentUser.getIdTokenResult(true); // force-refresh
            adminStatus = !!idTokenResult.claims.admin;
          } catch {
            adminStatus = false;
          }

          // 3. Fallback: check Firestore users/{uid}.role === "admin"
          //    This handles the case where the claim hasn't propagated yet.
          if (!adminStatus && db) {
            try {
              const userDoc = await getDoc(doc(db, "users", currentUser.uid));
              if (userDoc.exists() && userDoc.data()?.role === "admin") {
                adminStatus = true;
              }
            } catch {
              // Firestore read failed — keep adminStatus as-is
            }
          }
        }

        setIsAdmin(adminStatus);

        // ── Write cookies for edge middleware ─────────────────────────
        try {
          const token = await currentUser.getIdToken();
          setCookie("auth_token", token, 3600);
          if (adminStatus) {
            setCookie("is_admin", "true", 3600);
          } else {
            clearCookie("is_admin");
          }
        } catch {
          // ignore
        }
      } else {
        // ── Logged out — clear everything ──────────────────────────────
        setIsAdmin(false);
        clearCookie("auth_token");
        clearCookie("is_admin");
      }

      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        firebaseReady: isFirebaseConfigured,
        signOutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
