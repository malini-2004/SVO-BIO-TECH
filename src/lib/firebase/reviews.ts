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
}

const REVIEWS_COLLECTION = "reviews";
const PRODUCTS_COLLECTION = "products";

export async function addReview(
  productId: string,
  userName: string,
  rating: number,
  comment: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");

  // 1. Add review doc
  const reviewsRef = collection(db, REVIEWS_COLLECTION);
  await addDoc(reviewsRef, {
    productId,
    userName,
    rating,
    comment,
    createdAt: new Date().toISOString()
  });

  // 2. Query all reviews for this product to recalculate average & count
  const q = query(reviewsRef, where("productId", "==", productId));
  const querySnapshot = await getDocs(q);
  
  let totalRating = 0;
  let count = 0;
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    totalRating += Number(data.rating || 0);
    count++;
  });

  const average = count > 0 ? Number((totalRating / count).toFixed(1)) : 0;

  // 3. Update the product's rating stats in Firestore
  const productDocRef = doc(db, PRODUCTS_COLLECTION, productId);
  await updateDoc(productDocRef, {
    rating: {
      average,
      count
    }
  });
}

export function subscribeToReviews(
  productId: string,
  onNext: (reviews: Review[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (!db) throw new Error("Firestore is not initialized.");

  const reviewsRef = collection(db, REVIEWS_COLLECTION);
  const q = query(
    reviewsRef,
    where("productId", "==", productId),
    orderBy("createdAt", "desc")
  );

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
          createdAt: data.createdAt
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
