import Link from "next/link";
import { ChevronRight, Shield, Leaf } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | SVO Biotech",
  description: "Read the Privacy Policy of SVO Biotech — understanding how we collect, use, and protect your agricultural business information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="container mx-auto max-w-4xl flex items-center gap-1.5 text-xs text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <ChevronRight size={12} />
          <span className="text-gray-900 font-semibold">Privacy Policy</span>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-10">
        {/* Document Header */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
              <Shield size={12} /> Privacy Policy
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
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
              Welcome to SVO Biotech. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us at <span className="font-semibold text-gray-900">svobiotech2010@gmail.com</span>.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mt-3">
              When you visit our website and use our services, you trust us with your personal information. We take your privacy very seriously. In this privacy policy, we describe our privacy policy. We seek to explain to you in the clearest way possible what information we collect, how we use it, and what rights you have in relation to it.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">2. Information We Collect</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              We collect personal information that you voluntarily provide to us when expressing an interest in obtaining information about us or our products, when participating in activities on the website, or otherwise contacting us.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
              <li><strong>Personal Identifiers:</strong> Name, phone number, email address, shipping and billing addresses.</li>
              <li><strong>Agricultural Details:</strong> Farm location, crop types, or fertilizer preferences you share when inquiring about inputs.</li>
              <li><strong>Interactive Inputs:</strong> Customer review text, ratings, and feedback messages you submit directly on our product pages.</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">3. How We Use Your Information</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              We use personal information collected via our website for a variety of business purposes described below:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
              <li>To facilitate order creation and communication via our integrated WhatsApp and enquiry features.</li>
              <li>To post and display customer-submitted reviews and ratings on our product details sections.</li>
              <li>To respond to user inquiries and offer agronomic advice, product recommendations, or support.</li>
              <li>To request feedback and to contact you about your use of our website.</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">4. Data Protection</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our website is at your own risk. You should only access the services within a secure environment.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">5. Third-Party Services</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. This includes third-party services like Firestore (Google Cloud) for database hosting, Cloudinary for media assets, and integration links to external communication platforms like WhatsApp.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">6. Cookies and Tracking</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may use cookies and similar tracking technologies to access or store information. Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove cookies and to reject cookies. If you choose to remove cookies or reject cookies, this could affect certain features or services of our website.
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">7. Your Privacy Rights</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Depending on your location, you may have certain rights under applicable data protection laws. These may include the right to request access and obtain a copy of your personal information, request rectification or erasure of your data, or restrict the processing of your personal information. To make such a request, please contact us using the contact details provided below.
            </p>
          </section>

          {/* Changes to This Privacy Policy */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">8. Changes to This Policy</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may update this privacy policy from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date and the updated version will be effective as soon as it is accessible. If we make material changes to this privacy policy, we may notify you either by prominently posting a notice of such changes or by directly sending you a notification. We encourage you to review this privacy policy frequently to be informed of how we are protecting your information.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">9. Contact Information</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              If you have questions or comments about this policy, you may contact us at:
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
