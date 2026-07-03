"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { subscribeToProducts } from "@/lib/firebase/products";
import { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import {
  LayoutGrid, List, SlidersHorizontal, Leaf, Search
} from "lucide-react";

const SORT_OPTIONS = [
  { value: "best_selling", label: "Best Selling" },
  { value: "rating", label: "Highest Rated" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "newest", label: "Newest Arrivals" },
];

function ProductsContent() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("best_selling");

  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams?.get("search") || "";

  const setSearch = (val: string) => {
    const params = new URLSearchParams(window.location.search);
    if (val) {
      params.set("search", val);
    } else {
      params.delete("search");
    }
    router.replace(`/products?${params.toString()}`);
  };

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (fetched) => {
        setAllProducts(fetched);
        setLoading(false);
      },
      () => {
        setAllProducts([]);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    let list = [...allProducts];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case "price_low":  return a.price - b.price;
        case "price_high": return b.price - a.price;
        case "rating":     return b.rating.average - a.rating.average;
        case "newest":     return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:           return b.rating.count - a.rating.count;
      }
    });

    return list;
  }, [allProducts, search, sortBy]);

  const clearSearch = () => {
    setSearch("");
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">

      {/* Page Header */}
      <div className="bg-primary-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-sm text-primary-200 mb-4 flex gap-2 items-center">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">Products</span>
          </div>
          <h1 className="text-4xl font-black mb-3">Agricultural Inputs</h1>
          <p className="text-primary-200 max-w-2xl text-sm">
            Premium fertilizers, organic manure, and bio-stimulants for Indian agriculture — direct from manufacturer to your farm.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-5 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-gray-500 text-sm whitespace-nowrap">
              <span className="font-bold text-gray-900">{filtered.length}</span> results
            </span>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-2 flex-1 sm:flex-none">
              <SlidersHorizontal size={15} className="text-gray-400 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-white shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition ${viewMode === "list" ? "bg-white shadow-sm text-primary-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-52 bg-gray-100" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-6 bg-gray-100 rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Leaf size={28} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-5">
              No products match your search. Try adjusting the query.
            </p>
            <button
              onClick={clearSearch}
              className="bg-primary-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary-700 transition text-sm"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="bg-gray-50 min-h-screen p-12 text-center">Loading products...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
