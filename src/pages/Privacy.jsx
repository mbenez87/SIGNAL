import React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-slate-900">Privacy Policy</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-slate-700">
            <p className="text-sm text-slate-500">Last updated: December 21, 2025</p>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Introduction</h2>
              <p>
                At SIGNAL87 AI, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our document intelligence platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Information We Collect</h2>
              <p className="mb-3">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account information (name, email address)</li>
                <li>Documents and files you upload to the platform</li>
                <li>Usage data and interactions with our AI assistant</li>
                <li>Payment information for subscription services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">How We Use Your Information</h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your documents using AI technology</li>
                <li>Generate insights and summaries from your documents</li>
                <li>Communicate with you about your account and updates</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. Your documents are 
                encrypted in transit and at rest. We regularly review and update our security practices 
                to ensure the highest level of protection.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">AI Processing</h2>
              <p>
                Your documents are processed by advanced AI models to provide insights and summaries. 
                We use trusted third-party AI providers who are contractually obligated to maintain 
                confidentiality and security standards.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide 
                services. You can request deletion of your account and data at any time through your 
                account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your documents and data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us 
                at privacy@signal87.ai
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}