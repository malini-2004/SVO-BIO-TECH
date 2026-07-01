"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

// The designated admin email — any user signing in with this address
// is granted admin privileges automatically (no custom claim required).
const ADMIN_EMAIL = "admin@gmail.com";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Grant admin if the email matches the designated admin account
        if (currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          setIsAdmin(true);
        } else {
          // Otherwise check custom claims
          try {
            const idTokenResult = await currentUser.getIdTokenResult();
            setIsAdmin(!!idTokenResult.claims.admin);
          } catch {
            setIsAdmin(false);
          }
        }

        // Set cookie for middleware
        try {
          const token = await currentUser.getIdToken();
          document.cookie = `auth_token=${token}; path=/; max-age=3600; SameSite=Strict`;
        } catch {
          // ignore cookie errors on server-side renders
        }
      } else {
        setIsAdmin(false);
        try {
          document.cookie = `auth_token=; path=/; max-age=0; SameSite=Strict`;
        } catch {
          // ignore
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
