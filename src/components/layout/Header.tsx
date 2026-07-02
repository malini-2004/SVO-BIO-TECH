"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, User, Heart, Search, Menu, X, Leaf } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const { items } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      {/* Top Bar */}
      <div className="bg-primary-800 text-white text-center py-2 text-xs font-medium tracking-wide hidden sm:block">
        100% Genuine Products &nbsp;|&nbsp; Call: +91 98765 43210
      </div>

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
          <div className="hidden lg:flex items-center relative w-full max-w-xs">
            <input
              type="text"
              placeholder="Search fertilizers, crops..."
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-full py-2.5 pl-5 pr-10 outline-none focus:border-primary-500 focus:bg-white transition"
              suppressHydrationWarning
            />
            <Search className="absolute right-3 text-gray-400" size={16} />
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-5">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="lg:hidden text-gray-600 hover:text-primary-600 transition"
            >
              <Search size={22} />
            </button>
            <Link href="/wishlist" className="text-gray-600 hover:text-primary-600 transition relative">
              <Heart size={22} />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-primary-600 transition relative">
              <ShoppingCart size={22} />
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                  {items.length}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/cart" className="text-gray-600 relative">
              <ShoppingCart size={24} />
              {items.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                  {items.length}
                </span>
              )}
            </Link>
            <button
              className="text-gray-600 p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Search (when toggled on desktop mid-size) */}
        {searchOpen && (
          <div className="hidden md:flex lg:hidden pb-3">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search fertilizers, crops..."
                className="w-full bg-gray-50 border border-gray-200 text-sm rounded-full py-2.5 pl-5 pr-10 outline-none focus:border-primary-500"
                autoFocus
                suppressHydrationWarning
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-5 flex flex-col gap-2 shadow-xl">
          <div className="relative w-full mb-3">
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-full py-3 pl-5 pr-10 outline-none focus:border-primary-500"
              suppressHydrationWarning
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>

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

          <Link
            href="/wishlist"
            className="text-base font-semibold text-gray-900 border-b border-gray-50 py-3 flex items-center gap-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            <Heart size={20} /> Wishlist
            {wishlistItems.length > 0 && (
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                {wishlistItems.length}
              </span>
            )}
          </Link>
        </div>
      )}
    </header>
  );
}
