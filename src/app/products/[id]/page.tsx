"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { subscribeToProduct } from "@/lib/firebase/products";
import { Product } from "@/types";
import { Star, ChevronRight, MessageCircle } from "lucide-react";

// Mock fallback removed — fetches live product data in real-time

const MOCK_REVIEWS = [
  { id: "r1", userName: "Rajesh K.", rating: 5, comment: "Excellent product. Yield increased by 35% within two seasons. Highly recommend!", createdAt: "2026-05-10", avatar: "RK" },
  { id: "r2", userName: "Priya Devi", rating: 5, comment: "Dissolves instantly and leaves no residue. Perfect for drip irrigation.", createdAt: "2026-04-22", avatar: "PD" },
  { id: "r3", userName: "Suresh Patel", rating: 4, comment: "Good quality NPK. Delivery was very fast. Will order again.", createdAt: "2026-03-15", avatar: "SP" },
];

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");

  useEffect(() => {
    const unsubscribe = subscribeToProduct(id, (p) => {
      if (p) {
        setProduct(p);
        const sizes = getAvailableSizes(p);
        if (sizes.length > 0) {
          const normalizedWeight = p.weight.toLowerCase().replace(/\s+/g, "");
          const matched = sizes.find(s => s.toLowerCase() === normalizedWeight);
          setSelectedSize(matched || sizes[0]);
        }
      } else {
        setProduct(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  function getAvailableSizes(p: Product): string[] {
    const type = p.formType;
    const wt = p.weight.toLowerCase();
    if (type === "Liquid" || wt.includes("ml") || wt.includes("ltr")) {
      return ["100ml", "250ml", "500ml", "1ltr", "5ltr"];
    }
    return ["1kg"];
  }

  const handleWhatsAppOrder = () => {
    if (!product) return;
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210";
    const textMessage = `Hello, I would like to order this product.

Product: ${product.name}
Selected Size: ${selectedSize}

Please share further details.`;

    const encodedText = encodeURIComponent(textMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <div className="bg-white rounded-2xl p-8 animate-pulse space-y-6">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="md:w-1/2 h-80 bg-gray-100 rounded-2xl" />
              <div className="md:w-1/2 space-y-4">
                <div className="h-8 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-10 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  const availableSizes = getAvailableSizes(product);

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="container mx-auto max-w-5xl flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight size={12} />
          <Link href="/products" className="hover:text-primary-600">Products</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 font-semibold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Main Product Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="flex flex-col md:flex-row">
            {/* Gallery */}
            <div className="md:w-[45%] p-6 md:p-8 md:border-r border-gray-100 flex flex-col justify-center">
              <div className="relative aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden mb-4">
                <Image
                  src={product.images?.[activeImage] || "https://images.unsplash.com/photo-1628543105315-977ba2e0964c?w=800"}
                  alt={product.name}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 768px) 100vw, 45vw"
                  priority
                />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-16 h-16 rounded-lg bg-gray-50 border overflow-hidden flex-shrink-0 transition ${
                        activeImage === idx ? "border-primary-500 ring-2 ring-primary-100" : "border-gray-200"
                      }`}
                    >
                      <Image src={img} alt={`View ${idx + 1}`} fill className="object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="md:w-[55%] p-6 md:p-8 flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-2">{product.category}</span>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 leading-tight">{product.name}</h1>

              <div className="flex items-center gap-1.5 mb-4">
                <Star className="fill-amber-400 text-amber-400" size={16} />
                <span className="font-bold text-gray-700 text-sm">{product.rating.average}</span>
                <span className="text-gray-400 text-sm">({product.rating.count} Reviews)</span>
              </div>

              <div className="border-t border-gray-100 my-4" />

              {/* Description */}
              <div className="text-gray-600 text-sm mb-6 leading-relaxed">
                <p className="font-medium text-gray-800 mb-2">{product.shortDescription}</p>
                <p>{product.description}</p>
              </div>

              {/* Available Sizes */}
              {availableSizes.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Available Sizes:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 text-sm font-bold rounded-xl border transition ${
                          selectedSize === size
                            ? "bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-500/20"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Order via WhatsApp Action */}
              <div className="mt-auto pt-6 border-t border-gray-100">
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition shadow-lg shadow-[#25D366]/20 text-base"
                >
                  <MessageCircle size={22} className="fill-white" />
                  Order by WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-black text-gray-900 mb-6">Customer Reviews</h2>
          <div className="space-y-6">
            {MOCK_REVIEWS.map((r) => (
              <div key={r.id} className="flex gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 bg-primary-50 text-primary-700 font-black rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                  {r.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">{r.userName}</span>
                    <span className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < r.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"} />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
