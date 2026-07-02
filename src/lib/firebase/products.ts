import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  Unsubscribe,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { Product } from "@/types";
import { uploadManyToCloudinary } from "@/lib/cloudinary";
import { db } from "./config";

export const PRODUCTS_COLLECTION = "products";

type FirestoreProductData = Partial<Omit<Product, "id">> & {
  stock?: number;
  image?: string;
  featured?: boolean;
  sizes?: string[];
};

function toIsoString(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

function docToProduct(snapshot: QueryDocumentSnapshot<DocumentData>): Product {
  const data = snapshot.data() as FirestoreProductData;
  const images = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
  const primaryImage = typeof data.image === "string" && data.image.trim() ? data.image : "";
  const stockQuantity = Number(data.stockQuantity ?? data.stock ?? 0);

  return {
    id: snapshot.id,
    name: data.name ?? "",
    slug: data.slug ?? snapshot.id,
    shortDescription: data.shortDescription ?? "",
    description: data.description ?? "",
    category: data.category,
    brand: data.brand,
    images: images.length ? images : primaryImage ? [primaryImage] : [],
    price: Number(data.price ?? 0),
    mrp: Number(data.mrp ?? data.price ?? 0),
    discountPercent: Number(data.discountPercent ?? 0),
    gstRate: Number(data.gstRate ?? 0),
    sku: data.sku ?? snapshot.id,
    stockQuantity,
    sizes: Array.isArray(data.sizes) ? data.sizes : (data.weight ? [data.weight] : []),
    weight: data.weight,
    formType: data.formType,
    rating: data.rating ?? { average: 0, count: 0 },
    specifications: data.specifications ?? {},
    usageGuide: data.usageGuide ?? { dosage: "", method: "", precautions: "" },
    tags: data.tags ?? [],
    isFeatured: data.isFeatured ?? data.featured ?? false,
    isVisible: data.isVisible ?? true,
    createdAt: toIsoString(data.createdAt),
  };
}

function getProductsQuery(visibleOnly: boolean) {
  if (!db) throw new Error("Firestore is not initialized.");
  const productCollection = collection(db, PRODUCTS_COLLECTION);
  return visibleOnly
    ? query(productCollection, where("isVisible", "==", true))
    : query(productCollection, orderBy("createdAt", "desc"));
}

export async function getProducts(): Promise<Product[]> {
  if (!db) {
    console.warn("[products] Firestore not initialized. Returning an empty product list.");
    return [];
  }

  try {
    const snap = await getDocs(getProductsQuery(true));
    return snap.docs
      .map(docToProduct)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("[products] getProducts failed:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!db) return null;

  try {
    const snap = await getDoc(doc(db, PRODUCTS_COLLECTION, id));
    return snap.exists() ? docToProduct(snap) : null;
  } catch (error) {
    console.error("[products] getProductById failed:", error);
    return null;
  }
}

export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!db) {
    onData([]);
    onError?.(new Error("Firestore is not initialized."));
    return () => {};
  }

  return onSnapshot(
    getProductsQuery(true),
    (snap) => {
      const products = snap.docs
        .map(docToProduct)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(products);
    },
    (error) => {
      console.error("[products] subscribeToProducts failed:", error);
      onError?.(error);
    },
  );
}

export function subscribeToAllProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!db) {
    onData([]);
    onError?.(new Error("Firestore is not initialized."));
    return () => {};
  }

  return onSnapshot(
    getProductsQuery(false),
    (snap) => onData(snap.docs.map(docToProduct)),
    (error) => {
      console.error("[products] subscribeToAllProducts failed:", error);
      onError?.(error);
    },
  );
}

export function subscribeToProduct(
  id: string,
  onData: (product: Product | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  if (!db) {
    onData(null);
    onError?.(new Error("Firestore is not initialized."));
    return () => {};
  }

  return onSnapshot(
    doc(db, PRODUCTS_COLLECTION, id),
    (snap) => onData(snap.exists() ? docToProduct(snap) : null),
    (error) => {
      console.error("[products] subscribeToProduct failed:", error);
      onError?.(error);
    },
  );
}

export async function uploadProductImages(files: File[]): Promise<string[]> {
  return uploadManyToCloudinary(files);
}

function buildPayload(data: Omit<Product, "id">): Record<string, unknown> {
  const images = data.images?.filter(Boolean) ?? [];
  const stockQuantity = Number(data.stockQuantity ?? 0);

  return {
    name: data.name,
    slug: data.slug,
    shortDescription: data.shortDescription ?? "",
    description: data.description ?? "",
    images,
    image: images[0] ?? "",
    price: Number(data.price ?? 0),
    mrp: Number(data.mrp ?? data.price ?? 0),
    discountPercent: Number(data.discountPercent ?? 0),
    gstRate: Number(data.gstRate ?? 0),
    sku: data.sku,
    stockQuantity,
    stock: stockQuantity,
    sizes: data.sizes ?? [],
    rating: data.rating ?? { average: 0, count: 0 },
    specifications: data.specifications ?? {},
    usageGuide: data.usageGuide ?? { dosage: "", method: "", precautions: "" },
    tags: data.tags ?? [],
    isVisible: data.isVisible ?? true,
    createdAt: data.createdAt ?? new Date().toISOString(),
  };
}

function buildUpdatePayload(data: Partial<Product>): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...data };

  if (data.images) {
    const images = data.images.filter(Boolean);
    payload.images = images;
    payload.image = images[0] ?? "";
  }

  if (data.stockQuantity !== undefined) {
    const stockQuantity = Number(data.stockQuantity);
    payload.stockQuantity = stockQuantity;
    payload.stock = stockQuantity;
  }

  if (data.sizes !== undefined) {
    payload.sizes = data.sizes;
  }

  if (data.price !== undefined) payload.price = Number(data.price);
  if (data.mrp !== undefined) payload.mrp = Number(data.mrp);
  if (data.discountPercent !== undefined) payload.discountPercent = Number(data.discountPercent);
  if (data.gstRate !== undefined) payload.gstRate = Number(data.gstRate);

  return payload;
}

export async function createProduct(data: Omit<Product, "id">): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");
  const ref = await addDoc(collection(db, PRODUCTS_COLLECTION), buildPayload(data));
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  const rest = { ...data };
  delete rest.id;
  const payload = buildUpdatePayload(rest);
  await updateDoc(doc(db, PRODUCTS_COLLECTION, id), payload);
}

export async function deleteProduct(id: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
}
