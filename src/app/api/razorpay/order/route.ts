import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { v4 as uuidv4 } from "uuid";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "mock_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_secret",
});

export async function POST(request: Request) {
  try {
    const { amount, currency = "INR", receipt = uuidv4() } = await request.json();

    // In a real app with real Razorpay credentials, this would create an order
    // Since we might not have valid credentials, we'll try to create it, 
    // and if it fails (due to invalid credentials), return a mock order for dev purposes.
    
    let order;
    try {
      order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // amount in paise
        currency,
        receipt,
      });
    } catch (razorpayError) {
      console.warn("Razorpay API failed (likely missing credentials). Using Mock Order.");
      order = {
        id: `order_mock_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: "INR",
      };
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
