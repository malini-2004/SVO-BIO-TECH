"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useAuth, DESIGNATED_ADMINS } from "@/context/AuthContext";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Leaf,
} from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin/dashboard";
  const errorParam = searchParams.get("error");

  const { user, isAdmin, loading: authLoading, firebaseReady } = useAuth();

  // Show middleware-level rejection as a user-friendly message
  useEffect(() => {
    if (errorParam === "unauthorized") {
      setError(
        "Access Denied. Your account does not have administrator privileges. Please use valid admin credentials."
      );
    }
  }, [errorParam]);

  // If already logged in as admin, redirect
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      router.push(redirectTo);
    }
  }, [authLoading, user, isAdmin, redirectTo, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!auth) {
      setError(
        "Firebase is not configured. Please add your Firebase credentials to .env.local and restart the dev server."
      );
      return;
    }

    setLoading(true);

    try {
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        const code = signInErr.code as string;

        // Auto-seed: create account if it doesn't exist and is in DESIGNATED_ADMINS
        const isDesignated = DESIGNATED_ADMINS.includes(email.toLowerCase().trim());
        if (
          isDesignated &&
          (code === "auth/user-not-found" ||
            code === "auth/invalid-credential" ||
            code === "auth/invalid-email")
        ) {
          credential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw signInErr;
        }
      }

      const currentUser = credential.user;

      // ── 1. Check designated admins list first ──────────────────────────────
      const isDesignated = DESIGNATED_ADMINS.includes(
        currentUser.email?.toLowerCase() || ""
      );

      // ── 2. Force-refresh token and check admin custom claim ────────────────
      const tokenResult = await currentUser.getIdTokenResult(true);
      const hasAdminClaim = !!tokenResult.claims.admin;

      // ── 3. Fallback: check Firestore users/{uid}.role ──────────────────────
      let hasFirestoreAdminRole = false;
      if (!isDesignated && !hasAdminClaim && db) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data()?.role === "admin") {
            hasFirestoreAdminRole = true;
          }
        } catch {
          // Firestore unavailable — proceed without this check
        }
      }

      const isAdminUser = isDesignated || hasAdminClaim || hasFirestoreAdminRole;

      if (!isAdminUser) {
        // Sign out the non-admin user
        await signOut(auth);
        setError(
          "Access Denied. This account does not have administrator privileges. Please contact the system administrator."
        );
        return;
      }

      // Successful admin login — navigate to dashboard
      router.push(redirectTo);
    } catch (err: any) {
      const code = err.code as string;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setError("Incorrect email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError(
          "Too many failed attempts. Your account is temporarily locked. Please try again later."
        );
      } else if (code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner only while auth is resolving
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-primary-600" />
          <p className="text-gray-500 text-sm font-semibold">Verifying secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100/50 px-4 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md my-8">
        <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-primary-900 to-primary-700 px-8 py-10 text-center text-white relative">
            <div className="absolute top-4 right-4">
              <span className="bg-white/10 backdrop-blur-sm text-white/90 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border border-white/10">
                Secure Portal
              </span>
            </div>

            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg">
              <Leaf size={32} className="text-white animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
              SVO<span className="text-primary-200">Biotech</span>
            </h1>
            <p className="text-primary-100/80 text-sm mt-1 font-medium">
              Administrator Control Panel
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">
            {/* Firebase not configured warning */}
            {!firebaseReady && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 text-sm px-4 py-4 rounded-2xl shadow-sm">
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold text-amber-800 mb-1 text-xs">Firebase Not Configured</p>
                  <p className="text-[11px] leading-relaxed text-amber-700">
                    Real Firebase credentials are required. Open{" "}
                    <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">.env.local</code>
                    , fill in your API keys, and restart the dev server.
                  </p>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3 rounded-2xl shadow-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-red-600" />
                <span className="text-xs leading-relaxed font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                >
                  Admin Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-450 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-11 py-3 bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-455 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-700 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                id="admin-login-btn"
                type="submit"
                disabled={loading || !firebaseReady}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-all duration-300 shadow-lg shadow-primary-600/15 hover:shadow-primary-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    {firebaseReady ? "Sign In as Admin" : "Configure Firebase to Sign In"}
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 font-medium pt-2">
              This area is restricted to authorized administrators only.
            </p>
          </div>
        </div>

        {/* Back to site */}
        <p className="text-center mt-6">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-700 transition font-semibold"
          >
            <ArrowLeft size={14} />
            Back to main site
          </a>
        </p>
      </div>
    </div>
  );
}
