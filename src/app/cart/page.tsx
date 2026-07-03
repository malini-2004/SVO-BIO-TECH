"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import { Trash2, Plus, Minus, ShoppingCart, ChevronRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, getTotals } = useCartStore();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div></div>;

  const { subtotal, discount, delivery, total } = getTotals();

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please login to proceed to checkout");
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 max-w-lg w-full text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart size={40} className="text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any products to your cart yet.</p>
          <Link href="/products" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-10 rounded-xl transition shadow-md shadow-primary-500/30 inline-block">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          Shopping Cart <span className="text-sm font-bold bg-primary-100 text-primary-700 px-3 py-1 rounded-full">{items.length} Items</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-6">Product Details</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.product.id} className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center relative group transition-colors hover:bg-gray-50">
                    
                    {/* Product Info */}
                    <div className="col-span-1 md:col-span-6 flex gap-4">
                      <div className="w-24 h-24 bg-gray-50 rounded-xl border border-gray-200 relative flex-shrink-0">
                        <Image 
                          src={item.product.images[0] || "/placeholder.png"} 
                          alt={item.product.name} 
                          fill 
                          className="object-contain p-2" 
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{item.product.category}</p>
                        <Link href={`/products/${item.product.id}`} className="font-bold text-gray-900 text-lg hover:text-primary-600 transition line-clamp-1">
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">{item.product.sizes?.join(", ") || item.product.weight || "—"}</p>
                        <p className="md:hidden font-bold text-primary-600 mt-2">₹{item.product.price}</p>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="col-span-1 md:col-span-3 flex md:justify-center items-center">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                          className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition disabled:opacity-50"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="hidden md:block col-span-2 text-right">
                      <p className="font-bold text-gray-900 text-lg">₹{item.product.price * item.quantity}</p>
                      {item.product.mrp > item.product.price && (
                        <p className="text-xs text-gray-400 line-through">₹{item.product.mrp * item.quantity}</p>
                      )}
                    </div>

                    {/* Remove Action */}
                    <div className="absolute top-4 right-4 md:relative md:top-auto md:right-auto md:col-span-1 flex justify-end">
                      <button 
                        onClick={() => removeItem(item.product.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3 text-green-800">
              <ShieldCheck className="flex-shrink-0 text-green-600" />
              <p className="text-sm">Safe and secure payments. 100% Authentic agricultural products sourced directly from manufacturers.</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-28">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Coupon */}
              <div className="flex gap-2 mb-6 border-b border-gray-100 pb-6">
                <input 
                  type="text" 
                  placeholder="Coupon Code" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-grow border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary-500 uppercase"
                />
                <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                  Apply
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-gray-600">
                  <p>Subtotal</p>
                  <p className="font-medium">₹{subtotal.toFixed(2)}</p>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <p>Discount</p>
                    <p className="font-medium">-₹{discount.toFixed(2)}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-gray-600">
                  <p>Delivery Charges</p>
                  {delivery === 0 ? (
                    <p className="font-bold text-green-600">FREE</p>
                  ) : (
                    <p className="font-medium">₹{delivery.toFixed(2)}</p>
                  )}
                </div>
                
                {delivery > 0 && (
                  <p className="text-xs text-gray-500 text-right">Add ₹{(1000 - total).toFixed(2)} more for free delivery</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6 mb-6">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-lg font-bold text-gray-900">Total Amount</p>
                    <p className="text-xs text-gray-500">Includes all taxes</p>
                  </div>
                  <p className="text-3xl font-black text-primary-600">₹{total.toFixed(2)}</p>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition shadow-lg shadow-primary-500/30"
              >
                Proceed to Checkout <ChevronRight size={20} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
