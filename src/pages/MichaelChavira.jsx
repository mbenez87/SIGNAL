import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Linkedin, Mail, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MichaelChavira() {
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
        <Link to={createPageUrl("AboutUs")}>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Team
          </Button>
        </Link>
      </div>

      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="text-blue-400 font-semibold mb-2">Meet our Co-Founder</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Michael Chavira</h1>
          </motion.div>

          {/* Profile Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Left Column - Image & Contact */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="md:col-span-1"
            >
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 sticky top-24">
                <div className="w-full aspect-square rounded-xl overflow-hidden mb-6 border-4 border-blue-500/20">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/497789121_17539661602481.jpeg"
                    alt="Michael Chavira"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <a href="mailto:michael.chavira@signal87.ai" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">michael.chavira@signal87.ai</span>
                      </a>
                      <a href="#" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                        <Linkedin className="w-4 h-4" />
                        <span className="text-sm">LinkedIn Profile</span>
                      </a>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Focus Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-500/20 rounded-full text-xs text-blue-400">Data Science</span>
                      <span className="px-3 py-1 bg-purple-500/20 rounded-full text-xs text-purple-400">AI Technology</span>
                      <span className="px-3 py-1 bg-green-500/20 rounded-full text-xs text-green-400">Systems Engineering</span>
                      <span className="px-3 py-1 bg-orange-500/20 rounded-full text-xs text-orange-400">Leadership</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Bio */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="md:col-span-2"
            >
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                <div className="mb-6">
                  <div className="inline-block px-4 py-1 bg-blue-500/20 rounded-full text-blue-400 text-sm font-semibold mb-4">
                    Co-Founder & Managing Partner, Axiologic Solutions
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-6">About Michael</h2>
                
                <div className="space-y-6 text-gray-300 leading-relaxed">
                  <p>
                    Michael Chavira is the Co-Founder and Managing Partner at Axiologic Solutions in Fairfax, VA, a premier 
                    provider of engineering solutions, support, and enhancement services to government clients. He is an 
                    accomplished business leader with over 20 years of exceptional performance in Data Science, Systems 
                    Engineering and Integration, and Enterprise Architecture. Michael is known for his collaborative leadership 
                    style and the ability to build and manage high-performance teams.
                  </p>

                  <p>
                    Michael is highly skilled in developing and executing strategic plans to achieve business objectives, 
                    ensuring alignment with market trends and technological advancements. He is well-versed in identifying 
                    and pursuing new business opportunities, partnerships, and collaborations in systems engineering, data 
                    science, and artificial intelligence. Michael is committed to continuous learning, consistently striving to 
                    foster a growth mindset.
                  </p>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-blue-500 rounded"></span>
                      Axiologic Solutions Leadership
                    </h3>
                    <p>
                      At Axiologic, Michael administered the company's expansion from a two-person team to a peak of over 300 
                      employees, achieving a pinnacle revenue of $90 million annually. He managed the firm's financial strategy, 
                      focusing on maintaining a healthy balance sheet and exceeding profit margin targets. Michael enabled two 
                      strategic acquisitions without external equity. Axiologic acquired and integrated Knowledge Link in Dec 
                      2020, which expanded the company's service offerings and market reach into the National 
                      Geospatial-Intelligence Agency (NGA). In 2022, they acquired Data Intelligence Technology, which broadened 
                      their customer base further into the Intelligence Community. These acquisitions accelerated the company's 
                      growth by an impressive 45%.
                    </p>
                    <p className="mt-3 italic text-gray-400">
                      "We work with defense contractors to help keep the country safe. We solve challenging problems for the 
                      government. We are vital in protecting the country's welfare by working with the defense, intelligence, 
                      and government communities."
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-purple-500 rounded"></span>
                      Career Experience
                    </h3>
                    <p>
                      Before starting Axiologic Solutions, Michael worked at Booz Allen Hamilton as an Associate Systems 
                      Engineer. There, he was able to apply his systems engineering knowledge to develop and integrate sensor 
                      systems for the U.S. Army. Here at the consulting firm, Michael learned the importance of focusing on the 
                      human component of complex systems and incorporating changes from user feedback.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-green-500 rounded"></span>
                      Military Service
                    </h3>
                    <p>
                      Michael has also served his country honorably as an officer in the U.S. Navy, first in the U.S. Navy's 
                      nuclear submarine fleet and then as an Intelligence Officer. In the Navy, he got his first taste of 
                      leadership and management. Michael still carries with him the values of the Navy, which include honor, 
                      courage, leadership, and collaboration.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-orange-500 rounded"></span>
                      Leadership Philosophy
                    </h3>
                    <p>
                      Michael Chavira's broad experience in systems engineering, data science, project management, risk 
                      management, and team leadership is a differentiator to any position he might attain in the future. He 
                      solves problems, drives growth, reduces costs, and improves productivity. Michael is also a "people person" 
                      who has mentored many direct reports and colleagues to bring out the best in their performance and engage 
                      them in the organization's mission and values.
                    </p>
                    <p className="mt-3">
                      When he's not working, Michael can spend time with his growing family and "rediscover" the world through 
                      his children's eyes.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}