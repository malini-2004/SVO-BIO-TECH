import Link from "next/link";
import { ChevronRight, FileText, Leaf } from "lucide-react";

export const metadata = {
  title: "Terms of Service | SVO Biotech",
  description: "Review the Terms of Service for SVO Biotech — understanding purchase conditions, crop output expectations, and delivery guidelines.",
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="container mx-auto max-w-4xl flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 font-semibold">Terms of Service</span>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-10">
        {/* Document Header */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <FileText size={12} /> Terms of Service
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-sm text-gray-500">Last updated: July 3, 2026</p>
          </div>
          <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
            <Leaf size={24} className="text-primary-600" />
          </div>
        </div>

        {/* Content Details */}
        <div className="bg-white rounded-2xl p-8 md:p-10 border border-gray-100 shadow-sm prose prose-primary max-w-none space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">1. Introduction</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              These Terms of Service govern your use of our website located at SVO Biotech and represent a legally binding agreement between you and SVO Biotech. Please read these terms carefully before exploring or placing orders through our website.
            </p>
          </section>

          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">2. Acceptance of Terms</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              By accessing our website, browsing our product catalog, or placing order requests, you confirm that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must immediately discontinue your use of our website.
            </p>
          </section>

          {/* Product Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">3. Product Information and Suitability</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              We make every effort to display the details, application rates, crop compatibility, and technical parameters of our bio-fertilizers and organic inputs as accurately as possible.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
              <li>All formulations are subject to natural variations. Recommended dosages serve as guidance and might need adjustments based on local soil tests.</li>
              <li>SVO Biotech does not guarantee identical crop yields or results, as farming success depends heavily on weather, soil health, irrigation practices, and overall farm management.</li>
            </ul>
          </section>

          {/* Orders and Payments */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">4. Orders and Enquiry Flows</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Our website facilitates product browsing and orders. Clicking &quot;Order by WhatsApp&quot; or submitting enquiry forms establishes communication with SVO Biotech representatives. Order confirmation, invoice creation, and payment terms will be finalized directly through offline communication channels or official digital payment links provided during dispatch.
            </p>
          </section>

          {/* Shipping and Delivery */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">5. Shipping and Delivery</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We process shipping requests promptly. Delivery schedules, freight charges, and transport partner designations are shared with the customer during order finalization. Any delays arising from transport services, weather interruptions, or local distribution blocks are outside SVO Biotech&apos;s direct operational scope, though we will assist in order tracking.
            </p>
          </section>

          {/* Returns and Refunds */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">6. Returns and Refunds</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Due to the bio-chemical and sensitive nature of organic products and living bacterial cultures, returns are accepted within 7 days of delivery only if the packaging is undamaged, sealed, and stores in recommended cool environments. Refunds or replacement batches are processed upon verification of the returned goods.
            </p>
          </section>

          {/* User Responsibilities */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">7. User Conduct and Reviews</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              When using interactive features (such as posting product reviews, submitting names, and writing feedback), you agree not to submit any defamatory, abusive, false, or spam content. SVO Biotech reserves the right to moderate, hide, or remove any user-submitted reviews that violate clean community guidelines.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">8. Intellectual Property</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Unless otherwise stated, all material, text, images, product names, formulation designs, and logo graphics on this website are the intellectual property of SVO Biotech. You must not copy, reproduce, republish, or distribute any site content for commercial purposes without our explicit written consent.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">9. Limitation of Liability</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              In no event shall SVO Biotech, nor any of its directors and employees, be held liable for anything arising out of or in any way connected with your use of this website or the application of our agricultural products, whether such liability is under contract, tort or otherwise.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">10. Changes to Terms</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We reserve the right to revise and modify these Terms of Service at any time. By continuing to use our website after updates are published, you agree to be bound by the revised terms. We encourage you to visit this page periodically to stay informed of our latest conditions.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">11. Contact Information</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please reach out to us:
            </p>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 text-sm text-gray-700 space-y-1">
              <p className="font-bold text-gray-900">SVO Biotech</p>
              <p>405, Main Road, Boothapadi,</p>
              <p>Anthiyur (TK), Erode (DT) — 638311</p>
              <p>Tamil Nadu, India</p>
              <p className="pt-2">Email: <span className="font-semibold text-gray-900">svobiotech2010@gmail.com</span></p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
