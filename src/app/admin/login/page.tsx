"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

// The designated admin email — granted admin access automatically
const ADMIN_EMAIL = "admin@gmail.com";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin/dashboard";

  const { user, isAdmin, loading: authLoading } = useAuth();

  // If already logged in as admin, redirect straight away
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      router.push(redirectTo);
    }
  }, [authLoading, user, isAdmin, redirectTo, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ── Step 1: Try to sign in ──────────────────────────────────────
      let credential;
      try {
        credential = await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        const code = signInErr.code as string;

        // If admin@gmail.com doesn't exist yet, create it automatically
        if (
          email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
          (code === "auth/user-not-found" ||
            code === "auth/invalid-credential" ||
            code === "auth/invalid-email")
        ) {
          try {
            credential = await createUserWithEmailAndPassword(
              auth,
              email,
              password
            );
          } catch (createErr: any) {
            throw createErr; // re-throw so the outer catch handles it
          }
        } else {
          throw signInErr; // re-throw so the outer catch handles it
        }
      }

      // ── Step 2: Privilege check ────────────────────────────────────
      const isDesignatedAdmin =
        credential.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (!isDesignatedAdmin) {
        // For non-admin accounts, still verify custom claims
        const tokenResult = await credential.user.getIdTokenResult(true);
        if (!tokenResult.claims.admin) {
          await signOut(auth);
          setError(
            "This account does not have admin privileges. Contact your super admin."
          );
          return;
        }
      }

      // ── Step 3: All good — redirect ───────────────────────────────
      router.push(redirectTo);
    } catch (err: any) {
      const code = err.code as string;
      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password" ||
        code === "auth/user-not-found"
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError(
          "Too many failed attempts. Please wait a moment and try again."
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

  // While checking existing session
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 size={28} className="animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      {/* Background subtle grid */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-primary-700 to-primary-500 px-8 py-6 text-center">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Control Panel</h1>
            <p className="text-primary-200 text-sm mt-1">
              SPR Bio Tech — Restricted Access
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-7 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-900/40 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    id="admin-email"
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                id="admin-login-btn"
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 rounded-xl text-sm transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    Sign In as Admin
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-600 pt-2">
              This area is restricted to authorised administrators only.
            </p>
          </div>
        </div>

        {/* Back to site */}
        <p className="text-center mt-5 text-sm text-gray-600">
          <a href="/" className="hover:text-gray-400 transition">
            ← Back to main site
          </a>
        </p>
      </div>
    </div>
  );
}
