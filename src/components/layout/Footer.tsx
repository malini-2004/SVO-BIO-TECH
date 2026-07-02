"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Don't render footer on admin routes
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="text-3xl font-black text-white tracking-tight flex items-center gap-2 mb-6">
              SVO<span className="text-primary-500">Biotech</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Empowering farmers with premium agricultural inputs, organic fertilizers, and cutting-edge bio-technology for maximum yield.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition"><Facebook size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition"><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition"><Instagram size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-gray-400 hover:text-primary-400 transition text-sm">All Products</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-primary-400 transition text-sm">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-primary-400 transition text-sm">Contact Support</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-bold mb-6">Customer Service</h4>
            <ul className="space-y-3">
              <li><Link href="/faq" className="text-gray-400 hover:text-primary-400 transition text-sm">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin className="text-primary-500 flex-shrink-0" size={20} />
                <span className="text-gray-400 text-sm leading-tight">405, Main Road, Boothapadi, Anthiyur (TK), Erode (DT) — 638311</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-primary-500 flex-shrink-0" size={20} />
                <span className="text-gray-400 text-sm">+91 99448 77999</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-primary-500 flex-shrink-0" size={20} />
                <span className="text-gray-400 text-sm">svobiotech2010@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} SPR Biotech. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-300 text-sm transition">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-300 text-sm transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
