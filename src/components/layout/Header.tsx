"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Menu, X, Leaf } from "lucide-react";
import { useState, Suspense } from "react";

function HeaderSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  if (pathname !== "/products") return null;

  const searchQuery = searchParams?.get("search") || "";

  const handleChange = (val: string) => {
    const params = new URLSearchParams(window.location.search);
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    router.replace(`/products?${params.toString()}`);
  };

  return (
    <div className="hidden lg:flex items-center relative w-full max-w-xs">
      <input
        type="text"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-full py-2.5 pl-5 pr-10 outline-none focus:border-primary-500 focus:bg-white transition"
        suppressHydrationWarning
      />
      <Search className="absolute right-3 text-gray-400" size={16} />
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-primary-700 rounded-lg flex items-center justify-center">
              <Leaf className="text-white" size={20} />
            </div>
            <div className="leading-tight">
              <span className="text-xl font-black text-primary-900 tracking-tight block">SVO<span className="text-primary-600">Biotech</span></span>
              <span className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase block -mt-0.5">Bio Fertilizers</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${pathname === link.href
                    ? "text-primary-700 border-b-2 border-primary-600 pb-0.5"
                    : "text-gray-600 hover:text-primary-700"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar (Desktop) */}
          <Suspense fallback={<div className="hidden lg:block w-full max-w-xs h-10 bg-gray-50 rounded-full animate-pulse" />}>
            <HeaderSearch />
          </Suspense>

          {/* Mobile Action Button */}
          <div className="md:hidden flex items-center">
            <button
              className="text-gray-600 p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-5 flex flex-col gap-2 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-semibold text-gray-900 border-b border-gray-50 py-3 hover:text-primary-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
