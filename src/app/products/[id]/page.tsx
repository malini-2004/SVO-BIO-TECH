"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { subscribeToProduct } from "@/lib/firebase/products";
import { addReview, subscribeToReviews, type Review } from "@/lib/firebase/reviews";
import { Product } from "@/types";
import { Star, ChevronRight, MessageCircle } from "lucide-react";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");

  const [reviews, setReviews] = useState<Review[]>([]);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToReviews(id, (fetchedReviews) => {
      setReviews(fetchedReviews);
    });
    return () => unsubscribe();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formComment.trim()) return;
    setSubmittingReview(true);
    try {
      await addReview(id, formName.trim(), formRating, formComment.trim());
      setFormName("");
      setFormComment("");
      setFormRating(5);
      alert("Thank you! Your review has been submitted and is pending admin approval.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    const unsubscribe = subscribeToProduct(
      id,
      (p) => {
        if (p) {
          setProduct(p);
          const sizes = getAvailableSizes(p);
          if (sizes.length > 0) {
            const normalizedWeight = (p.weight || "").toLowerCase().replace(/\s+/g, "");
            const matched = sizes.find(s => s.toLowerCase() === normalizedWeight);
            setSelectedSize(matched || sizes[0]);
          }
        } else {
          setProduct(null);
        }
        setLoading(false);
      },
      () => {
        setProduct(null);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [id]);

  function getAvailableSizes(p: Product): string[] {
    if (p.sizes && p.sizes.length > 0) return p.sizes;
    // Fallback for legacy products that only have a weight string
    if (p.weight) return [p.weight];
    return [];
  }

  const handleWhatsAppOrder = () => {
    if (!product) return;

    // Use env variable; fallback to the registered SVO Biotech business number
    const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919944877999").trim().replace(/\D/g, "");

    if (!whatsappNumber || whatsappNumber.length < 10) {
      alert("WhatsApp contact is not configured. Please call us at +91 99448 77999.");
      return;
    }

    const price = product.price ? `₹${product.price.toLocaleString("en-IN")}` : "Price on request";
    const size  = selectedSize || "Not selected";

    const textMessage =
      `Hello SVO Biotech! 👋\n` +
      `I would like to place an order for the following product:\n\n` +
      `📦 *Product:* ${product.name}\n` +
      `📐 *Size / Weight:* ${size}\n` +
      `💰 *Price:* ${price}\n\n` +
      `Please share the order confirmation, payment details, and estimated delivery.\n\n` +
      `Thank you!`;

    const encodedText = encodeURIComponent(textMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedText}`;

    // Works on both mobile (opens WhatsApp app) and desktop (opens WhatsApp Web)
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
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
                <span className="font-bold text-gray-700 text-sm">{averageRating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({reviews.length} {reviews.length === 1 ? "Review" : "Reviews"})</span>
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
          <h2 className="text-xl font-black text-gray-900 mb-4">Customer Reviews</h2>
          
          {/* Average Rating Summary */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                />
              ))}
            </div>
            <span className="font-bold text-gray-900 text-lg">{averageRating.toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({reviews.length} {reviews.length === 1 ? "Review" : "Reviews"})</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Submit Review Form */}
            <div className="lg:col-span-5 bg-gray-50 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 text-base mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-primary-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Rating
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormRating(star)}
                        className="focus:outline-none transition-transform active:scale-95"
                      >
                        <Star
                          size={24}
                          className={star <= formRating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Review Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Share your experience with this product..."
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-primary-500 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-bold py-3 px-6 rounded-xl transition text-sm shadow-md"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-7 space-y-6">
              {reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r.id} className="flex gap-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-10 h-10 bg-primary-50 text-primary-750 font-black rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                      {r.userName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">{r.userName}</span>
                        <span className="text-gray-400 text-xs">
                          {new Date(r.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < r.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                          />
                        ))}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{r.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No reviews yet. Be the first to review this product!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
