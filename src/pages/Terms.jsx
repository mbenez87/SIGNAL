import React from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-slate-900">Terms of Service</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-slate-700">
            <p className="text-sm text-slate-500">Last updated: December 21, 2025</p>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Agreement to Terms</h2>
              <p>
                By accessing or using SIGNAL87 AI, you agree to be bound by these Terms of Service. 
                If you disagree with any part of these terms, you may not access the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Use of Service</h2>
              <p className="mb-3">You agree to use SIGNAL87 AI only for lawful purposes. You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Upload malicious content or malware</li>
                <li>Attempt to gain unauthorized access to the platform</li>
                <li>Use the service to violate any laws or regulations</li>
                <li>Share your account credentials with others</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">User Content</h2>
              <p>
                You retain all rights to the documents and content you upload to SIGNAL87 AI. 
                By uploading content, you grant us a license to process, analyze, and display your 
                content solely for the purpose of providing our services to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Subscription and Billing</h2>
              <p className="mb-3">
                Subscription fees are billed in advance on a monthly or annual basis. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate billing information</li>
                <li>Pay all fees when due</li>
                <li>Notify us of any billing changes</li>
              </ul>
              <p className="mt-3">
                You may cancel your subscription at any time. Refunds are provided according to our 
                refund policy as stated at the time of purchase.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">AI Services</h2>
              <p>
                Our AI-powered features are provided "as is" and we make no guarantees about the 
                accuracy, completeness, or reliability of AI-generated insights and summaries. 
                You should always verify important information independently.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Intellectual Property</h2>
              <p>
                The SIGNAL87 AI platform, including its design, features, and technology, is owned by 
                SIGNAL87 AI and is protected by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, SIGNAL87 AI shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages resulting from 
                your use or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account if you violate these terms 
                or engage in conduct that we determine to be harmful to other users or the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will notify you of any 
                material changes by posting the new terms on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Contact</h2>
              <p>
                For questions about these Terms of Service, please contact us at legal@signal87.ai
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}