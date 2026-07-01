"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getProducts } from "@/lib/firebase/products";
import { Product } from "@/types";
import ProductCard from "@/components/products/ProductCard";
import {
  Filter, LayoutGrid, List, SlidersHorizontal,
  ChevronDown, X, Leaf, Search
} from "lucide-react";

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1", name: "SPR Premium NPK 19:19:19 Water Soluble Fertilizer", slug: "spr-premium-npk-19-19-19",
    shortDescription: "100% water-soluble fertilizer for balanced crop growth.", description: "Full description...",
    category: "Fertilizers", brand: "SPR Biotech",
    images: ["https://images.unsplash.com/photo-1628543105315-977ba2e0964c?w=500&q=80"],
    price: 450, mrp: 600, discountPercent: 25, gstRate: 5, sku: "SPR-NPK-191919-1KG",
    stockQuantity: 50, weight: "1 kg", formType: "Powder",
    rating: { average: 4.8, count: 124 },
    specifications: {}, usageGuide: { dosage: "5g/liter", method: "Foliar spray", precautions: "Avoid sunlight" },
    tags: ["npk"], isFeatured: true, isVisible: true, createdAt: "2026-05-15T00:00:00.000Z"
  },
  {
    id: "p2", name: "SPR Organic Neem Cake (Neem Khali)", slug: "spr-organic-neem-khali",
    shortDescription: "Natural pest repellent and soil conditioner.", description: "Full description...",
    category: "Organic", brand: "SPR Biotech",
    images: ["https://images.unsplash.com/photo-1592982537447-6f2a6a0c6c8c?w=500&q=80"],
    price: 180, mrp: 220, discountPercent: 18, gstRate: 5, sku: "SPR-NEEM-1KG",
    stockQuantity: 120, weight: "1 kg", formType: "Granular",
    rating: { average: 4.5, count: 89 },
    specifications: {}, usageGuide: { dosage: "50g/plant", method: "Soil application", precautions: "Mix well" },
    tags: ["organic"], isFeatured: false, isVisible: true, createdAt: "2026-05-20T00:00:00.000Z"
  },
  {
    id: "p3", name: "Seaweed Liquid Extract — Plant Growth Promoter", slug: "seaweed-liquid-extract",
    shortDescription: "Bio-stimulant for root development and stress tolerance.", description: "Full description...",
    category: "Bio-Stimulants", brand: "SPR Biotech",
    images: ["https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=500&q=80"],
    price: 350, mrp: 400, discountPercent: 12, gstRate: 18, sku: "SPR-SEAWEED-500ML",
    stockQuantity: 5, weight: "500 ml", formType: "Liquid",
    rating: { average: 4.9, count: 210 },
    specifications: {}, usageGuide: { dosage: "2ml/liter", method: "Foliar spray", precautions: "Shake well" },
    tags: ["seaweed"], isFeatured: true, isVisible: true, createdAt: "2026-06-01T00:00:00.000Z"
  },
  {
    id: "p4", name: "Humic Acid 98% Granules — Soil Conditioner", slug: "humic-acid-granules",
    shortDescription: "Improves soil structure and nutrient retention.", description: "Full description...",
    category: "Organic", brand: "SPR Biotech",
    images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500&q=80"],
    price: 520, mrp: 650, discountPercent: 20, gstRate: 5, sku: "SPR-HUMIC-1KG",
    stockQuantity: 80, weight: "1 kg", formType: "Granular",
    rating: { average: 4.7, count: 67 },
    specifications: {}, usageGuide: { dosage: "2-3kg/acre", method: "Soil application", precautions: "Store cool" },
    tags: ["humic"], isFeatured: true, isVisible: true, createdAt: "2026-06-05T00:00:00.000Z"
  },
  {
    id: "p5", name: "Trichoderma Viride Bio-Fungicide", slug: "trichoderma-viride",
    shortDescription: "Bio-control agent for soil-borne fungal diseases.", description: "Full description...",
    category: "Bio-Stimulants", brand: "SPR Biotech",
    images: ["https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500&q=80"],
    price: 280, mrp: 320, discountPercent: 12, gstRate: 18, sku: "SPR-TRICHO-200G",
    stockQuantity: 40, weight: "200 g", formType: "Powder",
    rating: { average: 4.6, count: 45 },
    specifications: {}, usageGuide: { dosage: "5g/liter", method: "Soil drench", precautions: "Avoid fungicides" },
    tags: ["bio-fungicide"], isFeatured: false, isVisible: true, createdAt: "2026-06-08T00:00:00.000Z"
  },
  {
    id: "p6", name: "Potassium Humate Flakes — Crop Booster", slug: "potassium-humate-flakes",
    shortDescription: "Enhances potassium availability and cell wall strength.", description: "Full description...",
    category: "Fertilizers", brand: "SPR Biotech",
    images: ["https://images.unsplash.com/photo-1628543105315-977ba2e0964c?w=500&q=80"],
    price: 390, mrp: 450, discountPercent: 13, gstRate: 5, sku: "SPR-KHUM-500G",
    stockQuantity: 60, weight: "500 g", formType: "Granular",
    rating: { average: 4.4, count: 32 },
    specifications: {}, usageGuide: { dosage: "1-2kg/acre", method: "Soil / Drip", precautions: "Avoid eyes" },
    tags: ["potassium"], isFeatured: false, isVisible: true, createdAt: "2026-06-11T00:00:00.000Z"
  },
];

const FORM_TYPES = ["Granular", "Liquid", "Powder"];
const SORT_OPTIONS = [
  { value: "best_selling", label: "Best Selling" },
  { value: "rating", label: "Highest Rated" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "newest", label: "Newest Arrivals" },
];

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-4"
      >
        <h3 className="font-bold text-gray-900">{title}</h3>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && children}
    </div>
  );
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(5000);
  const [sortBy, setSortBy] = useState("best_selling");
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    // Pre-apply URL query params
    const form = searchParams.get("formType");
    if (form) setSelectedForms([form]);
  }, [searchParams]);

  useEffect(() => {
    getProducts().then((fetched) => {
      setAllProducts(fetched.length > 0 ? fetched : MOCK_PRODUCTS);
      setLoading(false);
    });
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

    if (selectedForms.length > 0) {
      list = list.filter((p) => selectedForms.includes(p.formType));
    }

    list = list.filter((p) => p.price >= priceMin && p.price <= priceMax);

    if (inStockOnly) list = list.filter((p) => p.stockQuantity > 0);

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
  }, [allProducts, search, selectedForms, priceMin, priceMax, inStockOnly, sortBy]);

  const activeFilterCount =
    selectedForms.length +
    (inStockOnly ? 1 : 0) +
    (priceMin > 0 || priceMax < 5000 ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedForms([]);
    setPriceMin(0);
    setPriceMax(5000);
    setInStockOnly(false);
    setSearch("");
  };

  function toggleForm(form: string) {
    setSelectedForms((prev) =>
      prev.includes(form) ? prev.filter((f) => f !== form) : [...prev, form]
    );
  }

  const FilterPanel = () => (
    <div className="space-y-6">
      <FilterSection title="Form Type">
        <div className="space-y-2.5">
          {FORM_TYPES.map((form) => (
            <label key={form} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedForms.includes(form)}
                onChange={() => toggleForm(form)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700 text-sm group-hover:text-primary-700 transition">{form}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={5000}
            step={50}
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className="w-full accent-primary-600"
          />
          <div className="flex gap-3 items-center">
            <input
              type="number"
              placeholder="Min"
              value={priceMin || ""}
              onChange={(e) => setPriceMin(Number(e.target.value) || 0)}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-primary-500"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="number"
              placeholder="Max"
              value={priceMax === 5000 ? "" : priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value) || 5000)}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <p className="text-xs text-gray-500">Up to ₹{priceMax.toLocaleString("en-IN")}</p>
        </div>
      </FilterSection>

      <FilterSection title="Availability" defaultOpen={false}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-gray-700 text-sm">In Stock Only</span>
        </label>
      </FilterSection>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 transition"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

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
        {/* Mobile filter toggle */}
        <button
          className="md:hidden w-full mb-4 flex items-center justify-center gap-2 bg-white border border-gray-200 py-3 rounded-xl font-semibold text-gray-700 shadow-sm"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Filter size={18} />
          Filters & Sorting
          {activeFilterCount > 0 && (
            <span className="bg-primary-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className={`
            ${mobileFiltersOpen
              ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto flex flex-col"
              : "hidden"}
            md:block md:w-64 md:flex-shrink-0 md:sticky md:top-24 md:h-[calc(100vh-96px)] md:overflow-y-auto no-scrollbar
          `}>
            {/* Mobile header */}
            <div className="flex items-center justify-between mb-6 md:hidden">
              <h2 className="text-xl font-black text-gray-900">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <X size={18} />
              </button>
            </div>
            <FilterPanel />
            <button
              className="mt-6 w-full bg-primary-600 text-white font-bold py-3 rounded-xl md:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Apply Filters ({filtered.length} results)
            </button>
          </aside>

          {/* Product area */}
          <div className="flex-1 min-w-0">
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

            {/* Active filter chips */}
            {(selectedForms.length > 0 || inStockOnly) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedForms.map((form) => (
                  <span key={form} className="bg-primary-50 text-primary-700 border border-primary-100 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    {form}
                    <button onClick={() => toggleForm(form)}><X size={12} /></button>
                  </span>
                ))}
                {inStockOnly && (
                  <span className="bg-primary-50 text-primary-700 border border-primary-100 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    In Stock
                    <button onClick={() => setInStockOnly(false)}><X size={12} /></button>
                  </span>
                )}
                <button onClick={clearAllFilters} className="text-xs text-gray-500 hover:text-gray-900 underline underline-offset-2 ml-1 font-medium">
                  Clear all
                </button>
              </div>
            )}

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
                  No products match your current filters. Try adjusting or clearing them.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-primary-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary-700 transition text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
