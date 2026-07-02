"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Product } from "@/types";
import {
  subscribeToAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage
} from "@/lib/firebase/products";
import {
  Plus, Search, Edit2, Trash2, X, Upload, Eye, EyeOff, Star,
  AlertTriangle, CheckCircle2, Loader2
} from "lucide-react";
import { toast } from "sonner";

const MAX_IMAGES = 4;

const CATEGORIES = ["Fertilizers", "Organic", "Bio-Stimulants", "Pesticides", "Seeds"];
const FORM_TYPES: Product["formType"][] = ["Granular", "Liquid", "Powder"];
const GST_RATES = [0, 5, 12, 18];

type FormData = {
  name: string; shortDescription: string; description: string;
  category: string; brand: string;
  imageUrls: string[];
  price: string; mrp: string; discountPercent: string; gstRate: string;
  sku: string; stockQuantity: string; weight: string; formType: Product["formType"];
  npkRatio: string; targetCrops: string;
  dosage: string; method: string; precautions: string;
  tags: string;
  isFeatured: boolean; isVisible: boolean;
};

const BLANK_FORM: FormData = {
  name: "", shortDescription: "", description: "",
  category: "Fertilizers", brand: "SPR Biotech",
  imageUrls: [""],
  price: "", mrp: "", discountPercent: "", gstRate: "5",
  sku: "", stockQuantity: "", weight: "", formType: "Granular",
  npkRatio: "", targetCrops: "",
  dosage: "", method: "", precautions: "",
  tags: "",
  isFeatured: false, isVisible: true,
};

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 transition";
const TEXTAREA_CLS = `${INPUT_CLS} resize-none`;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Local image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllProducts(
      (fetched) => {
        setProducts(fetched);
        setLoading(false);
      },
      (err) => {
        toast.error("Failed to load products");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  function openAdd() {
    setForm(BLANK_FORM);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(product: Product) {
    setForm({
      name: product.name,
      shortDescription: product.shortDescription ?? "",
      description: product.description,
      category: product.category,
      brand: product.brand,
      imageUrls: product.images?.length ? product.images : [""],
      price: String(product.price),
      mrp: String(product.mrp),
      discountPercent: String(product.discountPercent ?? ""),
      gstRate: String(product.gstRate),
      sku: product.sku,
      stockQuantity: String(product.stockQuantity),
      weight: product.weight,
      formType: product.formType,
      npkRatio: product.specifications?.npkRatio ?? "",
      targetCrops: product.specifications?.targetCrops ?? "",
      dosage: product.usageGuide?.dosage ?? "",
      method: product.usageGuide?.method ?? "",
      precautions: product.usageGuide?.precautions ?? "",
      tags: product.tags?.join(", ") ?? "",
      isFeatured: product.isFeatured,
      isVisible: product.isVisible,
    });
    setEditingId(product.id);
    setShowModal(true);
  }

  function setField<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "price" && next.mrp) {
        const p = parseFloat(String(val)), m = parseFloat(next.mrp);
        if (!isNaN(p) && !isNaN(m) && m > 0) {
          next.discountPercent = String(Math.round(((m - p) / m) * 100));
        }
      }
      return next;
    });
  }

  function setImageUrl(idx: number, val: string) {
    setForm((prev) => {
      const urls = [...prev.imageUrls];
      urls[idx] = val;
      return { ...prev, imageUrls: urls };
    });
  }

  async function removeImageAt(idx: number) {
    const urlToRemove = form.imageUrls[idx];
    setForm((prev) => {
      const urls = prev.imageUrls.filter((_, i) => i !== idx);
      return { ...prev, imageUrls: urls.length ? urls : [""] };
    });
    
    // Clean up from Firebase Storage if it's a storage URL
    if (urlToRemove && urlToRemove.includes("firebasestorage.googleapis.com")) {
      try {
        await deleteProductImage(urlToRemove);
      } catch (err) {
        console.warn("Failed to delete removed image from storage:", err);
      }
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const existingCount = form.imageUrls.filter((u) => u.trim() !== "").length;
    const remainingSlots = MAX_IMAGES - existingCount;
    if (remainingSlots <= 0) {
      toast.error(`You can add up to ${MAX_IMAGES} images per product`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const selected = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      toast.error(`Only ${remainingSlots} more image(s) can be added (max ${MAX_IMAGES})`);
    }

    const invalid = selected.find((f) => !f.type.startsWith("image/"));
    if (invalid) {
      toast.error("Please select image files only");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingImages(true);
    try {
      const uploadedUrls = await uploadProductImages(selected);
      setForm((prev) => {
        const existing = prev.imageUrls.filter((u) => u.trim() !== "");
        const combined = [...existing, ...uploadedUrls].slice(0, MAX_IMAGES);
        return { ...prev, imageUrls: combined.length ? combined : [""] };
      });
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image(s). Ensure Storage CORS headers are configured.");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.price || !form.mrp || !form.sku || !form.stockQuantity) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const images = form.imageUrls.filter((u) => u.trim() !== "");
      const payload = {
        name: form.name,
        slug: slugify(form.name),
        shortDescription: form.shortDescription,
        description: form.description,
        category: form.category,
        brand: form.brand,
        images,
        price: parseFloat(form.price),
        mrp: parseFloat(form.mrp),
        discountPercent: parseFloat(form.discountPercent) || 0,
        gstRate: parseFloat(form.gstRate),
        sku: form.sku,
        stockQuantity: parseInt(form.stockQuantity),
        weight: form.weight,
        formType: form.formType,
        specifications: {
          ...(form.npkRatio ? { npkRatio: form.npkRatio } : {}),
          ...(form.targetCrops ? { targetCrops: form.targetCrops } : {}),
        },
        usageGuide: { dosage: form.dosage, method: form.method, precautions: form.precautions },
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        rating: editingId
          ? (products.find((p) => p.id === editingId)?.rating ?? { average: 0, count: 0 })
          : { average: 0, count: 0 },
        isFeatured: form.isFeatured,
        isVisible: form.isVisible,
        createdAt: editingId
          ? (products.find((p) => p.id === editingId)?.createdAt ?? new Date().toISOString())
          : new Date().toISOString(),
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success("Product updated successfully");
      } else {
        await createProduct(payload);
        toast.success("Product added successfully");
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save product. Check Firestore permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const productToDelete = products.find((p) => p.id === id);
      await deleteProduct(id, productToDelete?.images);
      toast.success("Product deleted");
      setDeleteConfirmId(null);
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  async function toggleVisibility(product: Product) {
    try {
      await updateProduct(product.id, { isVisible: !product.isVisible });
      toast.success(product.isVisible ? "Product hidden" : "Product published");
    } catch {
      toast.error("Failed to update visibility");
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-1">Products</h1>
          <p className="text-gray-500 text-sm">
            {products.length} total · {products.filter((p) => p.isVisible).length} published
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-5 rounded-xl transition flex items-center gap-2 text-sm shadow-md shadow-primary-500/20"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 items-center bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, SKU, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto ml-auto">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:border-primary-500">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">SKU</th>
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Stock</th>
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading products...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                    {search ? "No products match your search." : "No products yet. Add your first product."}
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 relative">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} fill className="object-contain p-1" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px]">IMG</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 line-clamp-1">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category} · {product.weight}</p>
                          {product.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">
                              <Star size={9} className="fill-amber-500" /> Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs text-gray-500 font-mono hidden md:table-cell">{product.sku}</td>
                    <td className="py-4 px-5">
                      <div>
                        <p className="font-bold text-sm text-gray-900">₹{product.price}</p>
                        {product.mrp > product.price && (
                          <p className="text-xs text-gray-400 line-through">₹{product.mrp}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 hidden sm:table-cell">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        product.stockQuantity === 0
                          ? "bg-red-100 text-red-700"
                          : product.stockQuantity < 10
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {product.stockQuantity === 0 ? "Out of Stock" : `${product.stockQuantity} units`}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <button
                        onClick={() => toggleVisibility(product)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition ${
                          product.isVisible
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {product.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                        {product.isVisible ? "Published" : "Hidden"}
                      </button>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-black text-gray-900">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 flex-1 space-y-6">

              {/* Basic Info */}
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Basic Info</h3>
                <div className="space-y-4">
                  <InputField label="Product Name" required>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setField("name", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. SPR Premium NPK 19:19:19"
                    />
                  </InputField>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Category" required>
                      <select
                        value={form.category}
                        onChange={(e) => setField("category", e.target.value)}
                        className={INPUT_CLS}
                      >
                        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </InputField>
                    <InputField label="Brand" required>
                      <input
                        type="text"
                        value={form.brand}
                        onChange={(e) => setField("brand", e.target.value)}
                        className={INPUT_CLS}
                        placeholder="Brand name"
                      />
                    </InputField>
                  </div>
                  <InputField label="Short Description">
                    <input
                      type="text"
                      value={form.shortDescription}
                      onChange={(e) => setField("shortDescription", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="One-line summary shown in product cards"
                      maxLength={120}
                    />
                  </InputField>
                  <InputField label="Full Description">
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      className={TEXTAREA_CLS}
                      placeholder="Detailed product description..."
                    />
                  </InputField>
                </div>
              </div>

              {/* Images */}
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">
                  <Upload size={12} className="inline mr-1" />
                  Product Images
                </h3>
                <div className="space-y-3">
                  {/* Hidden native file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFilesSelected}
                    className="hidden"
                  />

                  {/* Browse button */}
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={uploadingImages || form.imageUrls.filter((u) => u.trim() !== "").length >= MAX_IMAGES}
                    className="w-full border-2 border-dashed border-gray-200 rounded-lg py-5 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingImages ? (
                      <>
                        <Loader2 size={20} className="animate-spin text-primary-600" />
                        <span className="text-xs font-semibold">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span className="text-xs font-semibold">Click to browse files from your computer</span>
                        <span className="text-[10px] text-gray-400">PNG or JPG · up to {MAX_IMAGES} images</span>
                      </>
                    )}
                  </button>

                  {/* Selected / existing images with thumbnail preview */}
                  {form.imageUrls.map((url, idx) => (
                    url.trim() !== "" ? (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0 relative">
                          <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain" />
                        </div>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => setImageUrl(idx, e.target.value)}
                          className={INPUT_CLS}
                          placeholder={`Image URL ${idx + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeImageAt(idx)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : null
                  ))}

                  {form.imageUrls.filter((u) => u.trim() !== "").length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, imageUrls: [...p.imageUrls.filter((u) => u.trim() !== ""), ""] }))}
                      className="text-xs text-primary-600 font-semibold hover:text-primary-800 transition flex items-center gap-1"
                    >
                      <Plus size={13} /> Add image URL manually instead
                    </button>
                  )}
                  <p className="text-xs text-gray-400">Upload images directly from your computer, or paste an existing image URL.</p>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Pricing & Tax</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Selling Price (₹)" required>
                    <input
                      type="number"
                      required
                      min={0}
                      value={form.price}
                      onChange={(e) => setField("price", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. 450"
                    />
                  </InputField>
                  <InputField label="MRP (₹)" required>
                    <input
                      type="number"
                      required
                      min={0}
                      value={form.mrp}
                      onChange={(e) => setField("mrp", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. 600"
                    />
                  </InputField>
                  <InputField label="Discount %">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.discountPercent}
                      onChange={(e) => setField("discountPercent", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="Auto-calculated"
                    />
                  </InputField>
                  <InputField label="GST Rate (%)">
                    <select
                      value={form.gstRate}
                      onChange={(e) => setField("gstRate", e.target.value)}
                      className={INPUT_CLS}
                    >
                      {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                    </select>
                  </InputField>
                </div>
              </div>

              {/* Inventory */}
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Inventory</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="SKU" required>
                    <input
                      type="text"
                      required
                      value={form.sku}
                      onChange={(e) => setField("sku", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. SPR-NPK-191919-1KG"
                    />
                  </InputField>
                  <InputField label="Stock Quantity" required>
                    <input
                      type="number"
                      required
                      min={0}
                      value={form.stockQuantity}
                      onChange={(e) => setField("stockQuantity", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. 100"
                    />
                  </InputField>
                  <InputField label="Weight / Volume">
                    <input
                      type="text"
                      value={form.weight}
                      onChange={(e) => setField("weight", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. 1 kg or 500 ml"
                    />
                  </InputField>
                  <InputField label="Form Type">
                    <select
                      value={form.formType}
                      onChange={(e) => setField("formType", e.target.value as Product["formType"])}
                      className={INPUT_CLS}
                    >
                      {FORM_TYPES.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </InputField>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="NPK Ratio">
                    <input
                      type="text"
                      value={form.npkRatio}
                      onChange={(e) => setField("npkRatio", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. 19:19:19"
                    />
                  </InputField>
                  <InputField label="Target Crops">
                    <input
                      type="text"
                      value={form.targetCrops}
                      onChange={(e) => setField("targetCrops", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. Paddy, Wheat, Vegetables"
                    />
                  </InputField>
                </div>
              </div>

              {/* Usage Guide */}
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Usage Guide</h3>
                <div className="space-y-4">
                  <InputField label="Dosage">
                    <input
                      type="text"
                      value={form.dosage}
                      onChange={(e) => setField("dosage", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. 5g per litre of water"
                    />
                  </InputField>
                  <InputField label="Application Method">
                    <textarea
                      rows={2}
                      value={form.method}
                      onChange={(e) => setField("method", e.target.value)}
                      className={TEXTAREA_CLS}
                      placeholder="How to apply..."
                    />
                  </InputField>
                  <InputField label="Precautions">
                    <textarea
                      rows={2}
                      value={form.precautions}
                      onChange={(e) => setField("precautions", e.target.value)}
                      className={TEXTAREA_CLS}
                      placeholder="Safety precautions..."
                    />
                  </InputField>
                </div>
              </div>

              {/* Tags & Flags */}
              <div>
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Tags & Settings</h3>
                <div className="space-y-4">
                  <InputField label="Tags (comma separated)">
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => setField("tags", e.target.value)}
                      className={INPUT_CLS}
                      placeholder="e.g. npk, water-soluble, organic"
                    />
                  </InputField>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setField("isFeatured", !form.isFeatured)}
                        className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${form.isFeatured ? "bg-amber-500" : "bg-gray-200"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? "translate-x-5" : "translate-x-1"}`} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Featured Product</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setField("isVisible", !form.isVisible)}
                        className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${form.isVisible ? "bg-primary-600" : "bg-gray-200"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isVisible ? "translate-x-5" : "translate-x-1"}`} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">Published</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImages}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This action cannot be undone. The product and its stored images will be permanently removed from your store.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}