"use client";

import { useState, useEffect, useCallback } from "react";
import { auth, db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import {
  UserPlus,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Shield,
  CheckCircle,
  Users as UsersIcon,
  Calendar,
  Key,
  Edit2
} from "lucide-react";

interface AdminUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  permissions?: string[];
}

interface ToastState {
  type: "success" | "error";
  message: string;
}

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Add Admin Form State
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    role: "Administrator",
  });

  // Selected permissions state matching reference image
  const [permissions, setPermissions] = useState({
    productManagement: true,
    orderManagement: true,
    userManagement: true,
    reportsAccess: true,
    settingsAccess: true,
    dashboardAccess: true,
  });

  // Edit Admin State
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: "",
    role: "Administrator",
    status: "active",
  });

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  };

  // Setup Real-time Firestore Listener
  useEffect(() => {
    if (!db) return;

    // Listen to the adminUsers collection in real-time
    const q = query(collection(db, "adminUsers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Load current Auth user metadata for lastLoginTime in background via API
      try {
        const token = await getToken();
        const res = await fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.users) {
          setAdmins(data.users);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Failed fetching enhanced admin data:", err);
      }

      // Fallback to local firestore documents if API fails/offline
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data();
        let createdAtStr = new Date().toISOString();
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === "function") {
            createdAtStr = data.createdAt.toDate().toISOString();
          } else if (data.createdAt.seconds) {
            createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString();
          } else if (typeof data.createdAt === "string") {
            createdAtStr = data.createdAt;
          }
        }
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          email: data.email || "",
          displayName: data.displayName || "",
          role: data.role || "Administrator",
          status: data.status || "active",
          createdAt: createdAtStr,
          lastLoginAt: data.lastLoginAt,
          permissions: data.permissions || [],
        } as AdminUser;
      });
      setAdmins(docs);
      setLoading(false);
    }, (err) => {
      showToast("error", err.message || "Failed to setup real-time listener");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Force Manual Refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAdmins(data.users);
      showToast("success", "Admin users list refreshed");
    } catch (err: any) {
      showToast("error", err.message || "Failed to fetch admin users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) {
      showToast("error", "Full name is required");
      return;
    }
    if (!form.email || !form.password) {
      showToast("error", "Email and password are required");
      return;
    }
    if (form.password.length < 8) {
      showToast("error", "Password must be at least 8 characters long");
      return;
    }
    if (form.password !== form.confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        role: form.role,
        status: "active",
        permissions: Object.keys(permissions).filter(k => permissions[k as keyof typeof permissions]),
      };

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast("success", data.message || "Admin user created successfully");
      setForm({
        email: "",
        password: "",
        confirmPassword: "",
        displayName: "",
        role: "Administrator",
      });
    } catch (err: any) {
      showToast("error", err.message || "Failed to create admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (uid: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke admin access for ${email}?`)) return;
    setDeletingUid(uid);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", data.message || "Admin access revoked");
    } catch (err: any) {
      showToast("error", err.message || "Failed to revoke admin access");
    } finally {
      setDeletingUid(null);
    }
  };

  const handleEditClick = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditForm({
      displayName: admin.displayName,
      role: admin.role,
      status: admin.status || "active",
    });
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: editingAdmin.uid,
          ...editForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("success", "Admin user updated successfully");
      setEditingAdmin(null);
    } catch (err: any) {
      showToast("error", err.message || "Failed to update admin");
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics calculation
  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => (a.status ?? "active") === "active").length;
  const superAdmins = admins.filter((a) => a.role === "Super Admin").length;
  const currentMonthAdded = admins.filter((a) => {
    try {
      const date = new Date(a.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  }).length;

  // Search & filter logic
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      admin.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || admin.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAdmins.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-6 bg-gray-50/50 min-h-screen">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage administrator accounts and permissions for the SVO Bio Tech control panel.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-200"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-primary-600" : "text-gray-500"} />
          Refresh
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-semibold border shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="text-green-600" />
          ) : (
            <AlertCircle size={18} className="text-red-600" />
          )}
          {toast.message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md transition duration-300 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-primary-600 flex-shrink-0">
            <UsersIcon size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Admins</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{totalAdmins}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">All administrator accounts</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md transition duration-300 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Admins</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{activeAdmins}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Currently active accounts</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md transition duration-300 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Admins Added</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{currentMonthAdded}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Added in July 2026</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm hover:shadow-md transition duration-300 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Super Admins</p>
            <h3 className="text-2xl font-black text-gray-900 mt-0.5">{superAdmins}</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">Full access accounts</p>
          </div>
        </div>
      </div>

      {/* Edit Admin Modal/Form */}
      {editingAdmin && (
        <div className="bg-white rounded-3xl border-2 border-primary-500 shadow-lg p-6 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit2 size={18} className="text-primary-600" />
              Edit Admin: {editingAdmin.email}
            </h3>
            <button
              onClick={() => setEditingAdmin(null)}
              className="text-gray-400 hover:text-gray-650 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
          <form onSubmit={handleUpdateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
              <input
                type="text"
                value={editForm.displayName}
                onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Role</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              >
                <option value="Administrator">Administrator</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full mt-1.5 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl disabled:opacity-60 transition"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Admin Card */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-primary-600 flex-shrink-0">
            <UserPlus size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Add New Admin</h2>
            <p className="text-xs text-gray-500 mt-0.5">Create a new administrator account with access to the control panel.</p>
          </div>
        </div>

        <form onSubmit={handleAddAdmin} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={form.displayName}
                  onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all duration-200"
                />
              </div>
              <p className="text-[11px] text-gray-400">Enter the administrator's full name</p>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all duration-200"
                />
              </div>
              <p className="text-[11px] text-gray-400">Enter a valid email address</p>
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all duration-200"
              >
                <option value="Administrator">Administrator</option>
                <option value="Super Admin">Super Admin</option>
              </select>
              <p className="text-[11px] text-gray-400">Select the role for this user</p>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">Minimum 8 characters with letters and numbers</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">Re-enter the password to confirm</p>
            </div>

            {/* Permissions configuration checklist */}
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">
                Permissions
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-150">
                {Object.keys(permissions).map((key) => {
                  const label = key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase());
                  return (
                    <label key={key} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={permissions[key as keyof typeof permissions]}
                        onChange={(e) =>
                          setPermissions((p) => ({
                            ...p,
                            [key]: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() =>
                setForm({
                  email: "",
                  password: "",
                  confirmPassword: "",
                  displayName: "",
                  role: "Administrator",
                })
              }
              className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary-600/10 hover:shadow-primary-600/20 transition-all duration-200"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {submitting ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Users List Card */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden">
        {/* Header containing search & filter inputs */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gray-50/50">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Admin Users</h2>
            <p className="text-xs text-gray-500 mt-0.5">Manage and monitor administrator accounts</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative w-full sm:w-48">
              <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition appearance-none"
              >
                <option value="all">All Roles</option>
                <option value="Administrator">Administrator</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin text-primary-600" />
              <span className="text-sm font-semibold">Loading administrators...</span>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <ShieldCheck size={48} className="opacity-20 text-primary-600" />
              <p className="text-sm font-bold text-gray-900">No admin users found</p>
              <p className="text-xs">Try adjusting your search criteria or create a new admin</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-bold text-gray-500 uppercase bg-gray-50/30">
                  <th className="px-6 py-4">Admin</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created On</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentItems.map((admin) => (
                  <tr key={admin.uid} className="hover:bg-gray-50/50 transition group">
                    {/* Admin info (Avatar + Name) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
                          {(admin.displayName || admin.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{admin.displayName || admin.email.split("@")[0]}</p>
                          {admin.role === "Super Admin" && (
                            <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-600 rounded-md mt-0.5">
                              Super Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {admin.email}
                    </td>

                    {/* Role Tag */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          admin.role === "Super Admin"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {admin.role || "Administrator"}
                      </span>
                    </td>

                    {/* Status Tag */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700">
                        <span className={`w-2 h-2 rounded-full ${
                          (admin.status ?? "active") === "active" ? "bg-green-500" : "bg-gray-400"
                        }`} />
                        {admin.status === "inactive" ? "Inactive" : "Active"}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div>{formatDate(admin.createdAt)}</div>
                      <div className="text-[10px] text-gray-400">{formatTime(admin.createdAt)}</div>
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {admin.lastLoginAt ? (
                        <>
                          <div>{formatDate(admin.lastLoginAt)}</div>
                          <div className="text-[10px] text-gray-400">{formatTime(admin.lastLoginAt)}</div>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">Never logged in</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(admin)}
                          title="Edit Admin"
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.uid, admin.email)}
                          disabled={deletingUid === admin.uid}
                          title="Revoke Admin Access"
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          {deletingUid === admin.uid ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer with Pagination info */}
        {filteredAdmins.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <span className="text-xs font-semibold text-gray-500">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAdmins.length)} of{" "}
              {filteredAdmins.length} results
            </span>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                      currentPage === i + 1
                        ? "bg-primary-600 border-primary-600 text-white shadow-sm"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Panel Note */}
      <div className="flex gap-4 p-5 bg-amber-50/70 border border-amber-150 rounded-3xl text-sm text-amber-800">
        <AlertCircle size={18} className="flex-shrink-0 mt-0.5 text-amber-600" />
        <div className="space-y-1">
          <p className="font-bold">Security Note</p>
          <p className="text-xs leading-relaxed text-amber-700/90">
            Admin roles and states are fully integrated with Firebase authentication custom claims and Firestore rules.
            Revoked accounts lose their administrative claim tokens upon their next token refresh cycle (typically within 60 minutes or instantly when signing back in).
          </p>
        </div>
      </div>
    </div>
  );
}
