"use client";

import { useState, useEffect } from "react";
import { Review, subscribeToAllReviews, updateReviewStatus, deleteReview } from "@/lib/firebase/reviews";
import { subscribeToAllProducts } from "@/lib/firebase/products";
import { Product } from "@/types";
import { Loader2, CheckCircle, XCircle, Trash2, MessageSquare, ExternalLink, Star } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    
    // Subscribe to all products to map product IDs to names
    const unsubProducts = subscribeToAllProducts((fetched) => {
      const productMap: Record<string, Product> = {};
      fetched.forEach(p => { productMap[p.id] = p; });
      setProducts(productMap);
    });
    unsubs.push(unsubProducts);

    // Subscribe to all reviews
    const unsubReviews = subscribeToAllReviews((fetched) => {
      setReviews(fetched);
      setLoading(false);
    }, () => {
      toast.error("Failed to load reviews");
      setLoading(false);
    });
    unsubs.push(unsubReviews);

    return () => unsubs.forEach(fn => fn());
  }, []);

  const handleStatusUpdate = async (review: Review, status: "approved" | "rejected") => {
    if (!review.id) return;
    try {
      await updateReviewStatus(review.id, status, review.productId);
      toast.success(`Review ${status}`);
    } catch (err) {
      toast.error(`Failed to mark review as ${status}`);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!review.id) return;
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    
    try {
      await deleteReview(review.id, review.productId);
      toast.success("Review deleted");
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Reviews</h1>
          <p className="text-gray-500 text-sm">
            {reviews.length} total · {reviews.filter(r => r.status === "pending").length} pending
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & User</th>
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Rating & Review</th>
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-5 align-top">
                      <p className="font-bold text-sm text-gray-900">{r.userName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-5 align-top">
                      <p className="font-semibold text-sm text-gray-700 line-clamp-1">
                        {products[r.productId]?.name || "Unknown Product"}
                      </p>
                      <Link 
                        href={`/products/${r.productId}`} 
                        target="_blank"
                        className="text-primary-600 hover:text-primary-800 text-xs flex items-center gap-1 mt-1 inline-flex"
                      >
                        View Product <ExternalLink size={10} />
                      </Link>
                    </td>
                    <td className="py-4 px-5 align-top max-w-sm">
                      <div className="flex gap-0.5 mb-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < r.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">"{r.comment}"</p>
                    </td>
                    <td className="py-4 px-5 align-top">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        r.status === "approved" ? "bg-green-100 text-green-700" :
                        r.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-5 align-top text-right space-x-2">
                      {r.status !== "approved" && (
                        <button
                          onClick={() => handleStatusUpdate(r, "approved")}
                          className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition inline-flex items-center gap-1 text-xs font-bold"
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                      )}
                      {r.status !== "rejected" && (
                        <button
                          onClick={() => handleStatusUpdate(r, "rejected")}
                          className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition inline-flex items-center gap-1 text-xs font-bold"
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
