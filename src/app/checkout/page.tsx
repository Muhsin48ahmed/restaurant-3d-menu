import type { Metadata } from "next";
import { CheckoutForm } from "@/components/forms/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 pt-12 sm:px-10 lg:pt-16">
      <p className="eyebrow">Pickup order</p>
      <h1 className="display mt-5 mb-14 text-6xl sm:text-7xl">Almost there.</h1>
      <CheckoutForm />
    </div>
  );
}
