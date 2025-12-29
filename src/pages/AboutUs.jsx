import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AboutUs() {
  const leaders = [
    {
      name: "Michael Benezra",
      role: "Chief Executive Officer",
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/a79585b56_Untitleddesigncopy.jpg",
      profileLink: "MichaelBenezra"
    },
    {
      name: "Michael Chavira",
      role: "Co-Founder & Managing Partner",
      image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/497789121_17539661602481.jpeg",
      profileLink: "MichaelChavira"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0e27] text-white">
      {/* Logo */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-50">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/9d1000aaa_Signal87_AI_Transparent.png"
          alt="Signal87 AI"
          className="h-12 md:h-20 lg:h-24 w-auto"
        />
      </div>

      {/* Back Button */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-50">
        <Link to={createPageUrl("Home")}>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
          >
            Meet the <span className="text-blue-400">Team</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg text-gray-400 max-w-3xl mx-auto"
          >
            Visionaries driving the future of document intelligence.
          </motion.p>
        </div>
      </section>

      {/* Our Company Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 md:p-12 border border-white/10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Our Company</h2>
            </div>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                Signal87 AI is dedicated to building the next generation of AI-powered tools to help you unlock the full 
                potential of your documents. Our mission is to empower individuals and businesses by transforming 
                unstructured information into actionable knowledge. We believe that the right tools can turn document 
                chaos into a competitive advantage, driving efficiency, compliance, and growth.
              </p>
              <p>
                At our core, we value innovation, integrity, and customer-centricity. We relentlessly pursue cutting-edge 
                technology to solve real-world problems. We operate with transparency and trust, ensuring your data is 
                always secure. Above all, we listen to our users, building solutions that are not just powerful, but also a 
                joy to use.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white">Leadership</h2>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {leaders.map((leader, index) => (
              <motion.div
                key={leader.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
              >
                <Link to={createPageUrl(leader.profileLink)}>
                  <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group h-full">
                    <div className="relative mb-6">
                      <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-blue-500/20 group-hover:border-blue-500/50 transition-all duration-300">
                        <img 
                          src={leader.image}
                          alt={leader.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {leader.name}
                      </h3>
                      <p className="text-blue-400 font-medium text-sm mb-4">
                        {leader.role}
                      </p>
                      <p className="text-gray-400 text-sm group-hover:text-blue-300 transition-colors">
                        Click to view full bio →
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}