"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Package, ShoppingBag, MessageSquare, Settings, LogOut, Tag } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  // ⚠️ /admin/login lives inside this layout — skip all checks to avoid infinite redirect loop
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return; // login page handles its own auth
    if (!loading && !user) {
      // Not logged in at all — redirect to admin login
      router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname, router, isLoginPage]);

  if (isLoginPage) {
    // Login page renders itself — no wrapper needed
    return <>{children}</>;
  }

  if (loading || (!loading && !user)) {
    // Show spinner while loading or while redirect is happening
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-600">You do not have administrator privileges to view this area.</p>
        <Link href="/admin/login" className="bg-primary-600 text-white px-6 py-2 rounded-lg font-bold">Admin Login</Link>
        <Link href="/" className="text-gray-500 text-sm underline">Return Home</Link>
      </div>
    );
  }

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { name: "Products", icon: Package, href: "/admin/products" },
    { name: "Orders", icon: ShoppingBag, href: "/admin/orders" },
    { name: "Coupons", icon: Tag, href: "/admin/coupons" },
    { name: "Reviews", icon: MessageSquare, href: "/admin/reviews" },
    { name: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-10">
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="text-2xl font-black text-primary-900 tracking-tight flex items-center gap-2">
            SPR<span className="text-primary-600">Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                  isActive 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-primary-600" : "text-gray-400"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
