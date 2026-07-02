"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { subscribeToProducts } from "@/lib/firebase/products";
import { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import HeroSlider from "@/components/layout/HeroSlider";
import {
  ArrowRight, Leaf, Award, Truck, Shield, Star,
  CheckCircle2, Users, Package, MapPin, ChevronRight,
  Quote, ChevronLeft
} from "lucide-react";

// No mock data — all products come from Firestore in real time

const REVIEWS = [
  {
    name: "Rajesh Kumar",
    role: "Paddy Farmer, Tamil Nadu",
    rating: 5,
    text: "SVO NPK 19:19:19 has transformed my paddy fields. Yield increased by nearly 40% in two seasons. The water-soluble formula mixes instantly and the results are visible within days.",
    crop: "Paddy",
    initials: "RK",
    gradient: "from-green-500 to-emerald-700",
  },
  {
    name: "Priya Devi",
    role: "Vegetable Grower, Karnataka",
    rating: 5,
    text: "The neem cake is genuinely organic and works wonders. No more aphid or whitefly problems. My tomato and brinjal crops are completely pest-free and the soil feels healthier.",
    crop: "Vegetables",
    initials: "PD",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    name: "Suresh Patel",
    role: "Cotton Farmer, Gujarat",
    rating: 5,
    text: "Fast delivery and authentic products — that's what I love about SVO Biotech. The seaweed extract gave my cotton plants amazing vigour and the boll setting improved significantly.",
    crop: "Cotton",
    initials: "SP",
    gradient: "from-blue-500 to-indigo-700",
  },
  {
    name: "Anitha Rajan",
    role: "Banana Grower, Kerala",
    rating: 5,
    text: "The Humic Acid granules made an incredible difference in my banana plantation. Bunch weight increased and fruit quality improved visibly. I recommend SVO Biotech to every farmer I meet.",
    crop: "Banana",
    initials: "AR",
    gradient: "from-yellow-500 to-amber-600",
  },
  {
    name: "Mohan Das",
    role: "Wheat Farmer, Punjab",
    rating: 5,
    text: "Trichoderma Bio-Fungicide saved my wheat crop from root rot this season. Very effective, totally organic and the customer support team was extremely helpful throughout.",
    crop: "Wheat",
    initials: "MD",
    gradient: "from-rose-500 to-pink-700",
  },
];


function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setActive((c) => (c + 1) % REVIEWS.length);
    }, 4000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const go = (idx: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(idx);
    startTimer();
  };

  const prev = () => go((active - 1 + REVIEWS.length) % REVIEWS.length);
  const next = () => go((active + 1) % REVIEWS.length);

  const review = REVIEWS[active];

  return (
    <section className="py-20 bg-gradient-to-br from-[#052e16] via-[#0d4a24] to-[#052e16] overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-400/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#f89c3a]/5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="text-[#f89c3a] font-semibold text-sm uppercase tracking-widest mb-3">What Farmers Say</p>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Customer Testimonials</h2>
          <p className="text-green-200 max-w-lg mx-auto text-sm leading-relaxed">
            Trusted by 10,000+ farmers across India. Real results from real fields.
          </p>
          {/* Overall rating bar */}
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} size={18} className="fill-amber-400 text-amber-400" />)}
            </div>
            <span className="text-white font-black text-lg">4.9</span>
            <span className="text-green-300 text-sm">/ 5.0 &nbsp;·&nbsp; 2,400+ reviews</span>
          </div>
        </div>

        {/* Main card */}
        <div className="relative">
          <div
            key={active}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12 max-w-3xl mx-auto"
            style={{ animation: "testimonialFade 0.5s ease both" }}
          >
            {/* Quote icon */}
            <div className="mb-6">
              <Quote size={36} className="text-[#f89c3a]/60" />
            </div>

            {/* Stars */}
            <div className="flex gap-1 mb-5">
              {[1,2,3,4,5].map(i => <Star key={i} size={20} className="fill-amber-400 text-amber-400" />)}
            </div>

            {/* Review text */}
            <blockquote className="text-white text-lg md:text-xl font-medium leading-relaxed mb-8">
              &ldquo;{review.text}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${review.gradient} flex items-center justify-center text-white font-black text-lg shadow-lg flex-shrink-0`}>
                {review.initials}
              </div>
              <div>
                <p className="text-white font-bold text-base">{review.name}</p>
                <p className="text-green-300 text-sm">{review.role}</p>
              </div>
              <span className="ml-auto bg-[#f89c3a]/20 border border-[#f89c3a]/30 text-[#f89c3a] text-xs font-bold px-3 py-1.5 rounded-full">
                🌾 {review.crop}
              </span>
            </div>
          </div>

          {/* Arrows */}
          <button
            onClick={prev}
            className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
            aria-label="Previous testimonial"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
            aria-label="Next testimonial"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="transition-all duration-300"
              aria-label={`Testimonial ${i + 1}`}
            >
              <span className={`block rounded-full transition-all duration-300 ${
                i === active ? "w-7 h-2 bg-[#f89c3a]" : "w-2 h-2 bg-white/25 hover:bg-white/50"
              }`} />
            </button>
          ))}
        </div>

        {/* Mini cards row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-12">
          {REVIEWS.map((r, i) => (
            <button
              key={r.name}
              onClick={() => go(i)}
              className={`text-left p-4 rounded-2xl border transition-all duration-300 ${
                i === active
                  ? "bg-white/10 border-[#f89c3a]/50 shadow-lg shadow-[#f89c3a]/10"
                  : "bg-white/5 border-white/10 hover:bg-white/8"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center text-white font-bold text-xs mb-2`}>
                {r.initials}
              </div>
              <p className="text-white text-xs font-semibold leading-tight">{r.name}</p>
              <p className="text-green-400 text-[10px] mt-0.5">{r.crop}</p>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes testimonialFade {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-56 bg-gray-100" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-6 bg-gray-100 rounded w-20" />
          <div className="h-10 w-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (fetched) => {
        setProducts(fetched);
        setLoading(false);
      },
      () => {
        setProducts([]);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const topProducts = [...products]
    .sort((a, b) => b.rating.average - a.rating.average)
    .slice(0, 4);

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="bg-white">

      {/* ─── HERO SLIDER ────────────────────────────────────────────── */}
      <HeroSlider />

      {/* ─── STATS BAR ─────────────────────────────────────── */}
      <section className="bg-primary-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Package, value: "500+", label: "Products" },
              { icon: Users, value: "10,000+", label: "Happy Farmers" },
              { icon: MapPin, value: "28", label: "States Covered" },
              { icon: Award, value: "15 Yrs", label: "Experience" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1">
                <stat.icon size={22} className="text-green-300 mb-1" />
                <span className="text-2xl font-black">{stat.value}</span>
                <span className="text-green-200 text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TOP SELLING PRODUCTS ──────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-2">Best Picks</p>
              <h2 className="text-3xl font-black text-gray-900">Top Selling Products</h2>
            </div>
            <Link href="/products" className="hidden sm:flex items-center gap-1 text-primary-600 font-semibold hover:text-primary-800 transition text-sm">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
              : topProducts.map((product) => <ProductCard key={product.id} product={product} />)
            }
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="inline-flex items-center gap-2 bg-primary-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-primary-700 transition">
              View All Products <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── RECENTLY ADDED ────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-2">Fresh Stock</p>
              <h2 className="text-3xl font-black text-gray-900">Recently Added</h2>
            </div>
            <Link href="/products" className="hidden sm:flex items-center gap-1 text-primary-600 font-semibold hover:text-primary-800 transition text-sm">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
              : recentProducts.map((product) => <ProductCard key={product.id} product={product} />)
            }
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="inline-flex items-center gap-2 border-2 border-primary-600 text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-primary-50 transition">
              See All New Arrivals <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ABOUT BRIEF ───────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left — Visual */}
            <div className="lg:w-5/12 w-full">
              <div className="relative bg-gradient-to-br from-primary-800 to-primary-900 rounded-3xl p-8 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-400/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <Leaf size={40} className="text-green-300 mb-4" />
                <h3 className="text-2xl font-black mb-3">SVO Biotech</h3>
                <p className="text-green-100 text-sm leading-relaxed mb-6">
                  Founded in 2010, SVO Biotech is a leading manufacturer of bio-fertilizers and organic agricultural inputs based in Tamil Nadu.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "500+", label: "SKUs" },
                    { value: "ISO 9001", label: "Certified" },
                    { value: "FCO", label: "Approved" },
                    { value: "Direct", label: "to Farmer" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-green-200">{item.value}</p>
                      <p className="text-xs text-green-300 mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Text */}
            <div className="lg:w-7/12">
              <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">Who We Are</p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-5 leading-tight">
                Empowering Farmers with Science-Backed Nutrition
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                We formulate, test, and deliver premium agricultural inputs directly to farmers, bypassing middlemen. Every product undergoes rigorous quality control before reaching your hands.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  { icon: Award, title: "Government Certified", desc: "All products approved under the Fertiliser Control Order (FCO) and organic certification norms." },
                  { icon: Shield, title: "Quality Tested", desc: "Lab-tested for nutrient accuracy, purity, and safety before every batch dispatch." },
                  { icon: Truck, title: "Pan-India Delivery", desc: "Fast, reliable delivery across all 28 states with real-time order tracking." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon size={20} className="text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                      <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-primary-600 text-white font-bold px-8 py-4 rounded-xl hover:bg-primary-700 transition shadow-md shadow-primary-500/20"
              >
                Learn Our Story <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CUSTOMER TESTIMONIALS ────────────────────────────────── */}
      <TestimonialsSection />

      {/* ─── TRUST BADGES ──────────────────────────────────── */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Shield, title: "100% Genuine", desc: "Sourced directly from manufacturers" },
              { icon: Truck, title: "Fast Delivery", desc: "Ships within 24 hours of order" },
              { icon: Award, title: "FCO Certified", desc: "All products government approved" },
              { icon: CheckCircle2, title: "Easy Returns", desc: "Hassle-free 7-day return policy" },
            ].map((badge) => (
              <div key={badge.title} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                  <badge.icon size={24} className="text-primary-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{badge.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#052e16] to-[#14532d] py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center text-white">
          <Leaf size={48} className="text-green-300 mx-auto mb-6" />
          <h2 className="text-4xl font-black mb-4">Ready to Transform Your Farm?</h2>
          <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
            Browse our complete range of bio-fertilizers and organic inputs. Trusted by farmers, tested by scientists.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/products"
              className="bg-white text-primary-900 font-bold px-10 py-4 rounded-xl hover:bg-green-50 transition shadow-xl flex items-center gap-2 text-lg"
            >
              Shop Now <ArrowRight size={20} />
            </Link>
            <Link
              href="/about"
              className="border-2 border-white/40 text-white font-bold px-10 py-4 rounded-xl hover:bg-white/10 transition text-lg"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
