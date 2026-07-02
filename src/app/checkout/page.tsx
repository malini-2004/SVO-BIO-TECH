"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/context/AuthContext";
import { fetchPincodeDetails } from "@/lib/api/pincode";
import { Address } from "@/types";
import {
  CheckCircle2, ChevronRight, MapPin, Truck, CreditCard,
  ShieldCheck, Loader2, Lock
} from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open(): void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id: string;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  prefill: { name?: string; contact?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const INPUT_CLS =
  "w-full border border-gray-200 rounded-xl p-3.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 transition bg-white";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotals, clearCart } = useCartStore();
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(true);
  const [newAddress, setNewAddress] = useState({ fullName: "", phone: "", pincode: "", street: "", city: "", state: "" });
  const [fetchingPin, setFetchingPin] = useState(false);

  const [paying, setPaying] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login?redirect=/checkout");
    }
  }, [user, authLoading, mounted, router]);

  useEffect(() => {
    if (mounted && items.length === 0) router.push("/cart");
  }, [items.length, mounted, router]);

  if (!mounted || authLoading || !user || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  const { subtotal, discount, delivery, total } = getTotals();

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pin = e.target.value;
    setNewAddress((p) => ({ ...p, pincode: pin }));
    if (pin.length === 6) {
      setFetchingPin(true);
      const details = await fetchPincodeDetails(pin);
      if (details) {
        setNewAddress((p) => ({ ...p, city: details.city, state: details.state }));
        toast.success("City & State auto-filled");
      } else {
        toast.error("Invalid pincode");
      }
      setFetchingPin(false);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const address: Address = { id: Date.now().toString(), ...newAddress, isDefault: true };
    setSelectedAddress(address);
    setIsAddingAddress(false);
    toast.success("Address saved");
  };

  const initiatePayment = async () => {
    if (!selectedAddress || !user) return;
    setPaying(true);

    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load payment gateway. Check your connection.");
        setPaying(false);
        return;
      }

      // 2. Create Razorpay order on server
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "INR" }),
      });
      if (!orderRes.ok) throw new Error("Order creation failed");
      const rpOrder = await orderRes.json();

      // 3. Open Razorpay modal
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "rzp_test_mock_key_id",
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: "SVO Biotech",
        description: `Order of ${items.length} item(s)`,
        order_id: rpOrder.id,
        prefill: {
          name: selectedAddress.fullName,
          contact: selectedAddress.phone,
          email: user.email ?? undefined,
        },
        theme: { color: "#16a34a" },
        modal: {
          ondismiss: () => {
            setPaying(false);
            toast.error("Payment cancelled");
          },
        },
        handler: async (response) => {
          try {
            // 4. Verify payment & save order to Firestore
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: {
                  userId: user.uid,
                  items,
                  shippingAddress: selectedAddress,
                  pricing: { subtotal, discount, delivery, total },
                  paymentDetails: {
                    razorpayOrderId: response.razorpay_order_id,
                    method: "Razorpay",
                    status: "Pending",
                  },
                  orderStatus: "Processing",
                },
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              toast.success("Order placed successfully!");
              router.push(`/orders/success?id=${verifyData.orderId}`);
            } else {
              toast.error("Payment verification failed. Contact support.");
              setPaying(false);
            }
          } catch {
            toast.error("Something went wrong. Please contact support.");
            setPaying(false);
          }
        },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate payment. Please try again.");
      setPaying(false);
    }
  };

  const STEPS = [
    { step: 1 as const, label: "Address", icon: MapPin },
    { step: 2 as const, label: "Review", icon: Truck },
    { step: 3 as const, label: "Payment", icon: CreditCard },
  ];

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-5xl">

        {/* Step wizard */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 relative overflow-hidden">
          {/* Progress bar */}
          <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-100 -translate-y-1/2 -z-0" />
          <div
            className="absolute top-1/2 left-[10%] h-0.5 bg-primary-600 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: currentStep === 1 ? "0%" : currentStep === 2 ? "40%" : "80%" }}
          />
          <div className="relative z-10 flex justify-between items-center">
            {STEPS.map(({ step, label, icon: Icon }) => {
              const done = currentStep > step;
              const active = currentStep === step;
              return (
                <div key={step} className="flex flex-col items-center bg-white px-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all mb-2 ${
                    active ? "bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                    : done ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-400"
                  }`}>
                    {done ? <CheckCircle2 size={22} /> : <Icon size={22} />}
                  </div>
                  <span className={`text-sm font-bold ${active || done ? "text-gray-900" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Main area ── */}
          <div className="lg:flex-1">

            {/* STEP 1 — ADDRESS */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="text-primary-600" size={22} /> Delivery Address
                </h2>

                {selectedAddress && !isAddingAddress ? (
                  <div className="border-2 border-primary-500 bg-primary-50 rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-primary-600 uppercase tracking-wider">Selected Address</span>
                      <CheckCircle2 size={18} className="text-primary-600" />
                    </div>
                    <p className="font-black text-gray-900">{selectedAddress.fullName}</p>
                    <p className="text-gray-600 text-sm mt-1">{selectedAddress.street}</p>
                    <p className="text-gray-600 text-sm">{selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}</p>
                    <p className="text-gray-600 text-sm mt-1">📞 {selectedAddress.phone}</p>
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="mt-3 text-primary-600 text-sm font-bold hover:underline"
                    >
                      Change Address
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveAddress} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                        <input required type="text" className={INPUT_CLS} value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} placeholder="Your full name" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Mobile Number *</label>
                        <input required type="tel" pattern="[6-9][0-9]{9}" className={INPUT_CLS} value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} placeholder="10-digit mobile" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Pincode * <span className="text-primary-600 font-normal normal-case">(auto-fills city & state)</span></label>
                      <div className="relative">
                        <input required type="text" maxLength={6} pattern="[0-9]{6}" className={INPUT_CLS} value={newAddress.pincode} onChange={handlePincodeChange} placeholder="6-digit pincode" />
                        {fetchingPin && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-primary-500" size={18} />}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Street Address / Village *</label>
                      <textarea required rows={2} className={INPUT_CLS + " resize-none"} value={newAddress.street} onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })} placeholder="Door no, street, village, landmark..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">City / District</label>
                        <input readOnly className={`${INPUT_CLS} bg-gray-50`} value={newAddress.city} placeholder="Auto-filled" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">State</label>
                        <input readOnly className={`${INPUT_CLS} bg-gray-50`} value={newAddress.state} placeholder="Auto-filled" />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      {selectedAddress && (
                        <button type="button" onClick={() => setIsAddingAddress(false)} className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition text-sm">
                          Cancel
                        </button>
                      )}
                      <button type="submit" className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition text-sm">
                        Deliver to This Address
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => { if (!selectedAddress) { toast.error("Please select an address"); return; } setCurrentStep(2); }}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-xl transition shadow-md flex items-center gap-2 text-sm"
                  >
                    Review Order <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — REVIEW */}
            {currentStep === 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <Truck className="text-primary-600" size={22} /> Order Review
                </h2>

                <div className="border border-gray-100 rounded-xl overflow-hidden mb-6">
                  {items.map((item) => (
                    <div key={item.product.id} className="p-4 flex items-center gap-4 border-b border-gray-50 last:border-b-0">
                      <div className="w-14 h-14 bg-gray-50 rounded-lg border border-gray-100 relative overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] && (
                          <Image src={item.product.images[0]} alt={item.product.name} fill className="object-contain p-1" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.product.sizes?.join(", ") || item.product.weight || "—"}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-black text-gray-900 text-sm">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex gap-3 text-sm text-primary-800 mb-6">
                  <ShieldCheck className="text-primary-600 flex-shrink-0" size={18} />
                  100% genuine agricultural products. Delivery within 3–5 business days.
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                  <button onClick={() => setCurrentStep(1)} className="text-gray-500 font-bold hover:text-gray-900 text-sm transition">
                    ← Back to Address
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-8 rounded-xl transition shadow-md flex items-center gap-2 text-sm"
                  >
                    Proceed to Payment <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 — PAYMENT */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="text-primary-600" size={22} /> Secure Payment
                </h2>

                <div className="border border-gray-100 rounded-2xl p-6 text-center mb-6 bg-gradient-to-br from-primary-50 to-green-50">
                  <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Lock size={24} className="text-primary-700" />
                  </div>
                  <h3 className="font-black text-gray-900 text-lg mb-2">Secure Checkout via Razorpay</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Pay using UPI, Credit / Debit Cards, Net Banking, or Wallets. All transactions are 256-bit SSL encrypted.
                  </p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {["UPI", "Cards", "Net Banking", "Wallets"].map((m) => (
                      <span key={m} className="bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                  <button onClick={() => setCurrentStep(2)} className="text-gray-500 font-bold hover:text-gray-900 text-sm transition">
                    ← Back to Review
                  </button>
                  <button
                    onClick={initiatePayment}
                    disabled={paying}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 px-10 rounded-xl transition shadow-lg shadow-green-500/30 flex items-center gap-2 text-base"
                  >
                    {paying ? (
                      <><Loader2 size={18} className="animate-spin" /> Processing...</>
                    ) : (
                      <><Lock size={18} /> Pay ₹{total.toFixed(2)}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary Sidebar ── */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
              <h3 className="text-lg font-black text-gray-900 mb-5">Order Summary</h3>

              <div className="space-y-3 text-sm mb-5 pb-5 border-b border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({items.length})</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  {delivery === 0
                    ? <span className="text-green-600 font-semibold">FREE</span>
                    : <span>₹{delivery.toFixed(2)}</span>
                  }
                </div>
                {delivery > 0 && (
                  <p className="text-xs text-primary-600 text-right">Add ₹{(1000 - total).toFixed(2)} for free delivery</p>
                )}
              </div>

              <div className="flex justify-between items-center mb-5">
                <span className="font-black text-gray-900">Total</span>
                <span className="text-2xl font-black text-primary-700">₹{total.toFixed(2)}</span>
              </div>

              {currentStep > 1 && selectedAddress && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <MapPin size={11} /> Delivering to
                  </p>
                  <p className="font-bold text-gray-900 text-sm">{selectedAddress.fullName}</p>
                  <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                    {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-5 pt-5 border-t border-gray-100 text-xs text-gray-500">
                <ShieldCheck size={14} className="text-green-500" />
                Safe & secure payments via Razorpay
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
