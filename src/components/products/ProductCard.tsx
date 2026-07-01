"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import { Heart, Star } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { toast } from "sonner";

export default function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = !isOutOfStock && product.stockQuantity < 10;

  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist(product);
      toast.success("Added to wishlist");
    }
  };

  return (
    <div className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 relative">

      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {product.discountPercent && product.discountPercent > 0 ? (
          <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
            {product.discountPercent}% OFF
          </span>
        ) : null}
        <span className="bg-primary-100 text-primary-800 text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize">
          {product.category}
        </span>
      </div>

      {/* Wishlist */}
      <button
        onClick={handleWishlist}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm transition-colors backdrop-blur-sm ${
          inWishlist
            ? "bg-red-50 text-red-500"
            : "bg-white/80 hover:bg-white text-gray-400 hover:text-red-500"
        }`}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart size={17} className={inWishlist ? "fill-red-500" : ""} />
      </button>

      {/* Image */}
      <Link href={`/products/${product.id}`} className="relative h-52 w-full overflow-hidden bg-gray-50 flex items-center justify-center">
        {product.images?.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-300 text-sm">
            No Image
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-1 mb-1.5">
          <Star className="fill-amber-400 text-amber-400" size={13} />
          <span className="text-sm font-medium text-gray-700">{product.rating?.average ?? 0}</span>
          <span className="text-xs text-gray-400">({product.rating?.count ?? 0})</span>
        </div>

        <Link href={`/products/${product.id}`} className="hover:text-primary-700 transition-colors">
          <h3 className="font-bold text-gray-900 line-clamp-2 mb-1 text-sm leading-snug">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-grow leading-relaxed">
          {product.shortDescription}
        </p>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-gray-900">₹{product.price}</span>
              {product.mrp > product.price && (
                <span className="text-xs text-gray-400 line-through">₹{product.mrp}</span>
              )}
            </div>
            <span className={`text-[11px] font-semibold ${
              isOutOfStock ? "text-red-500" : isLowStock ? "text-orange-500" : "text-green-600"
            }`}>
              {isOutOfStock ? "Out of Stock" : isLowStock ? `Only ${product.stockQuantity} left` : "In Stock"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
