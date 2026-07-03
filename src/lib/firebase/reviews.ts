import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "./config";

export interface Review {
  id?: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}

const REVIEWS_COLLECTION = "reviews";
const PRODUCTS_COLLECTION = "products";

export async function recalculateProductRating(productId: string): Promise<void> {
  if (!db) return;
  const reviewsRef = collection(db, REVIEWS_COLLECTION);
  // Only calculate average based on approved reviews
  const q = query(
    reviewsRef,
    where("productId", "==", productId),
    where("status", "==", "approved")
  );
  
  const querySnapshot = await getDocs(q);
  
  let totalRating = 0;
  let count = 0;
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    totalRating += Number(data.rating || 0);
    count++;
  });

  const average = count > 0 ? Number((totalRating / count).toFixed(1)) : 0;

  const productDocRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(productDocRef, {
    rating: {
      average,
      count
    }
  });
}

export async function addReview(
  productId: string,
  userName: string,
  rating: number,
  comment: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");

  const reviewsRef = collection(db, REVIEWS_COLLECTION);
  await addDoc(reviewsRef, {
    productId,
    userName,
    rating,
    comment,
    createdAt: new Date().toISOString(),
    status: "pending" // Default to pending approval
  });
}

export async function updateReviewStatus(
  reviewId: string,
  newStatus: "pending" | "approved" | "rejected",
  productId: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await updateDoc(reviewRef, { status: newStatus });
  
  // Recalculate average rating since an approved review might have been added/removed
  await recalculateProductRating(productId);
}

export async function deleteReview(reviewId: string, productId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await deleteDoc(reviewRef);
  
  await recalculateProductRating(productId);
}

export function subscribeToReviews(
  productId: string,
  onNext: (reviews: Review[]) => void,
  statusFilter: "pending" | "approved" | "rejected" | null = "approved",
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) throw new Error("Firestore is not initialized.");

  const reviewsRef = collection(db, REVIEWS_COLLECTION);
  
  let q;
  if (statusFilter) {
    q = query(
      reviewsRef,
      where("productId", "==", productId),
      where("status", "==", statusFilter),
      orderBy("createdAt", "desc")
    );
  } else {
    q = query(
      reviewsRef,
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const reviews: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          productId: data.productId,
          userName: data.userName,
          rating: Number(data.rating || 0),
          comment: data.comment,
          createdAt: data.createdAt,
          status: data.status || "approved" // Fallback to approved for old reviews
        });
      });
      onNext(reviews);
    },
    (err) => {
      console.error("[reviews] subscribeToReviews failed:", err);
      if (onError) onError(err);
    }
  );
}

export function subscribeToAllReviews(
  onNext: (reviews: Review[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) throw new Error("Firestore is not initialized.");

  const reviewsRef = collection(db, REVIEWS_COLLECTION);
  const q = query(reviewsRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const reviews: Review[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          productId: data.productId,
          userName: data.userName,
          rating: Number(data.rating || 0),
          comment: data.comment,
          createdAt: data.createdAt,
          status: data.status || "approved"
        });
      });
      onNext(reviews);
    },
    (err) => {
      console.error("[reviews] subscribeToAllReviews failed:", err);
      if (onError) onError(err);
    }
  );
}
