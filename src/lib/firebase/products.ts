import {
  collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, orderBy, Unsubscribe,
} from "firebase/firestore";
import {
  ref as storageRef, uploadBytes, getDownloadURL, deleteObject,
} from "firebase/storage";
import { db, storage } from "./config";
import { Product } from "@/types";

const COLLECTION = "products";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function docToProduct(d: any): Product {
  return { ...d.data(), id: d.id } as Product;
}

// ─── ONE-SHOT READS (kept for backward compat / SSR) ─────────────────────────

export async function getProducts(): Promise<Product[]> {
  if (!db) {
    console.warn("[products] Firestore not initialized — returning empty.");
    return [];
  }
  try {
    const q = query(
      collection(db, COLLECTION),
      where("isVisible", "==", true),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map(docToProduct);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    return snap.exists() ? docToProduct(snap) : null;
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    return null;
  }
}

// ─── REAL-TIME LISTENERS ─────────────────────────────────────────────────────

/**
 * Subscribe to all *visible* products. Fires immediately with cached data,
 * then again whenever any product is added / modified / removed in Firestore.
 * Returns an `unsubscribe` function — call it when the component unmounts.
 */
export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where("isVisible", "==", true),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map(docToProduct)),
    (err) => {
      console.error("[products] onSnapshot error:", err);
      onError?.(err);
    },
  );
}

/**
 * Subscribe to ALL products (including hidden) — for admin dashboard.
 */
export function subscribeToAllProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  return onSnapshot(
    collection(db, COLLECTION),
    (snap) => onData(snap.docs.map(docToProduct)),
    (err) => {
      console.error("[products] admin onSnapshot error:", err);
      onError?.(err);
    },
  );
}

/**
 * Subscribe to a single product by ID (real-time updates on detail page).
 */
export function subscribeToProduct(
  id: string,
  onData: (product: Product | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!db) {
    onData(null);
    return () => {};
  }
  return onSnapshot(
    doc(db, COLLECTION, id),
    (snap) => onData(snap.exists() ? docToProduct(snap) : null),
    (err) => {
      console.error("[products] single onSnapshot error:", err);
      onError?.(err);
    },
  );
}

// ─── IMAGE HELPERS ───────────────────────────────────────────────────────────

/**
 * Upload an array of File objects to Firebase Storage under `products/`.
 * Returns an array of public download URLs.
 */
export async function uploadProductImages(files: File[]): Promise<string[]> {
  if (!storage) throw new Error("Firebase Storage is not initialized.");
  const urls: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
    const path = `products/${Date.now()}-${safeName}`;
    const sRef = storageRef(storage, path);
    await uploadBytes(sRef, file);
    urls.push(await getDownloadURL(sRef));
  }
  return urls;
}

/**
 * Delete a single image from Firebase Storage by its download URL.
 * Silently ignores errors (image may have already been removed externally).
 */
export async function deleteProductImage(url: string): Promise<void> {
  if (!storage) return;
  try {
    // Firebase Storage download URLs contain the path after /o/ (URL-encoded).
    const match = url.match(/\/o\/(.+?)\?/);
    if (!match) return;
    const filePath = decodeURIComponent(match[1]);
    await deleteObject(storageRef(storage, filePath));
  } catch (err: any) {
    // object-not-found is fine — already deleted
    if (err?.code !== "storage/object-not-found") {
      console.warn("[products] Failed to delete image from Storage:", err);
    }
  }
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

/** Build the Firestore payload from the raw form values. */
function buildPayload(data: Omit<Product, "id">): Record<string, any> {
  return {
    name: data.name,
    slug: data.slug,
    shortDescription: data.shortDescription ?? "",
    description: data.description ?? "",
    category: data.category,
    brand: data.brand,
    images: data.images ?? [],
    price: data.price,
    mrp: data.mrp,
    discountPercent: data.discountPercent ?? 0,
    gstRate: data.gstRate,
    sku: data.sku,
    stockQuantity: data.stockQuantity,
    weight: data.weight,
    formType: data.formType,
    rating: data.rating ?? { average: 0, count: 0 },
    specifications: data.specifications ?? {},
    usageGuide: data.usageGuide ?? { dosage: "", method: "", precautions: "" },
    tags: data.tags ?? [],
    isFeatured: data.isFeatured ?? false,
    isVisible: data.isVisible ?? true,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

/**
 * Create a new product in Firestore. Returns the new document ID.
 */
export async function createProduct(data: Omit<Product, "id">): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");
  const ref = await addDoc(collection(db, COLLECTION), buildPayload(data));
  return ref.id;
}

/**
 * Update an existing product. Only the provided fields are merged.
 */
export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  // Strip `id` so it isn't stored as a field inside the document
  const { id: _ignore, ...rest } = data as any;
  await updateDoc(doc(db, COLLECTION, id), rest);
}

/**
 * Delete a product and optionally clean up its images from Storage.
 */
export async function deleteProduct(id: string, imageUrls?: string[]): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");

  // Best-effort image cleanup
  if (imageUrls?.length) {
    await Promise.allSettled(imageUrls.map(deleteProductImage));
  }

  await deleteDoc(doc(db, COLLECTION, id));
}
