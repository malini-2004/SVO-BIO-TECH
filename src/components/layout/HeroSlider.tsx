"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

interface Slide {
  image: string;
  productId: string;
  title: string;
  subtitle: string;
  badge: string;
}

const SLIDES: Slide[] = [
  {
    image:
      "https://res.cloudinary.com/sahrh4jx/image/upload/f_auto,q_auto/ad11a404db757a6efc716288f46b3c90_5_qzbpql",
    productId: "p1",
    title: "Premium NPK 19:19:19",
    subtitle: "100% water-soluble for balanced crop nutrition & maximum yield",
    badge: "Best Seller",
  },
  {
    image:
      "https://res.cloudinary.com/sahrh4jx/image/upload/v1782916479/07a5f9eeef8bb69b5a53f47105e38c6e_4_ytgt0b.jpg",
    productId: "p2",
    title: "Organic Neem Cake",
    subtitle: "Natural pest repellent & soil conditioner rich in NPK nutrients",
    badge: "Organic Certified",
  },
  {
    image:
      "https://res.cloudinary.com/sahrh4jx/image/upload/v1782916564/bf27f1411211843559a9a9596cd74462_img_3_vnwjwd.jpg",
    productId: "p3",
    title: "Seaweed Liquid Extract",
    subtitle: "Bio-stimulant for better root development & drought tolerance",
    badge: "Top Rated",
  },
  {
    image:
      "https://res.cloudinary.com/sahrh4jx/image/upload/v1782916590/8647e826089aea502afd0d6a0733d4f1_images_2_qoxrgx.jpg",
    productId: "p4",
    title: "Humic Acid 98% Granules",
    subtitle: "Improves soil structure, nutrient retention & microbial activity",
    badge: "New Arrival",
  },
];

const INTERVAL_MS = 2000;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (index: number, dir: "next" | "prev" = "next") => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setAnimating(false);
      }, 420);
    },
    [animating]
  );

  const next = useCallback(() => {
    goTo((current + 1) % SLIDES.length, "next");
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + SLIDES.length) % SLIDES.length, "prev");
  }, [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  const slide = SLIDES[current];

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "clamp(300px, 55vw, 680px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero image slideshow"
    >
      {/* ── Slide images ────────────────────────────────────────────── */}
      {SLIDES.map((s, i) => (
        <div
          key={s.productId}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={s.image}
            alt={s.title}
            loading={i === 0 ? "eager" : "lazy"}
            className="w-full h-full object-cover"
            style={{ transform: i === current ? "scale(1.04)" : "scale(1)", transition: "transform 4s ease" }}
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>
      ))}

      {/* ── Slide content ───────────────────────────────────────────── */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-28">
        <div
          key={current}
          className="max-w-xl"
          style={{
            animation: "heroFadeUp 0.55s cubic-bezier(.22,1,.36,1) both",
          }}
        >
          {/* Badge */}
          <span className="inline-block bg-[#f89c3a] text-white text-[11px] font-black uppercase tracking-[0.18em] px-3 py-1 rounded-full mb-4 shadow-lg">
            {slide.badge}
          </span>

          {/* Title */}
          <h2
            className="text-white font-black leading-tight mb-3"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "clamp(1.6rem, 4vw, 3rem)",
            }}
          >
            {slide.title}
          </h2>

          {/* Subtitle */}
          <p
            className="text-white/80 leading-relaxed mb-6"
            style={{ fontSize: "clamp(0.875rem, 1.5vw, 1.1rem)", maxWidth: "38ch" }}
          >
            {slide.subtitle}
          </p>

          {/* CTA button */}
          <Link
            href={`/products/${slide.productId}`}
            className="inline-flex items-center gap-2 bg-[#f89c3a] hover:bg-[#d97b1c] text-white font-black text-sm uppercase tracking-widest px-7 py-3.5 rounded-full transition-all duration-300 shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95"
          >
            Visit Product <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* ── Arrows ──────────────────────────────────────────────────── */}
      <button
        onClick={prev}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-black/30 hover:bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-black/30 hover:bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* ── Dot indicators ──────────────────────────────────────────── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? "next" : "prev")}
            aria-label={`Go to slide ${i + 1}`}
            className="transition-all duration-300"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === current
                  ? "w-7 h-2 bg-[#f89c3a]"
                  : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 h-[3px] bg-white/10">
        <div
          key={`${current}-${paused}`}
          className="h-full bg-[#f89c3a] origin-left"
          style={{
            animation: paused ? "none" : `heroProgress ${INTERVAL_MS}ms linear forwards`,
          }}
        />
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes heroProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
