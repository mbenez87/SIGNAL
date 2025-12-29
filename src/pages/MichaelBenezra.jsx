import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Linkedin, Mail, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MichaelBenezra() {
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
            <p className="text-blue-400 font-semibold mb-2">Meet our CEO</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Michael Benezra</h1>
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
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693a41be01661c1d9efc9479/a79585b56_Untitleddesigncopy.jpg"
                    alt="Michael Benezra"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Contact Information</h3>
                    <div className="space-y-2">
                      <a href="mailto:ceo@signal87.ai" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">ceo@signal87.ai</span>
                      </a>
                      <a href="#" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                        <Linkedin className="w-4 h-4" />
                        <span className="text-sm">LinkedIn Profile</span>
                      </a>
                      <a href="#" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">Signal87 AI</span>
                      </a>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">Based in United States</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Boards & Affiliations</h3>
                    <div className="space-y-1 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>Harvard Real Estate Alumni Association</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>Harvard Alumni Entrepreneurs</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>Housing Forward Advisory Board</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>Brex Consumer Advisory Board</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>MassChallenge Security Program</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>Data Gems (Board)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Education</h3>
                    <div className="space-y-2 text-xs text-gray-400">
                      <div>
                        <div className="font-semibold text-white">Harvard University (GSAS)</div>
                        <div>Master of Arts in Government (AM)</div>
                        <div className="mt-2">
                          <a 
                            href="https://www.google.com/books/edition/How_Policymakers_Started_the_Federal_Cha/GLGvtAEACAAJ?hl=en" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Graduate Thesis: "How Policymakers Started the Federal Charter School Movement: A Case Study in Policy Entrepreneurship" (2016)
                          </a>
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-white">University of Washington</div>
                        <div>BA in Political Science</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Focus Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-500/20 rounded-full text-xs text-blue-400">Product Strategy</span>
                      <span className="px-3 py-1 bg-purple-500/20 rounded-full text-xs text-purple-400">Team Leadership</span>
                      <span className="px-3 py-1 bg-green-500/20 rounded-full text-xs text-green-400">Innovation</span>
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
                    Partner (North America), Crewstone International
                  </div>
                  <div className="inline-block px-4 py-1 bg-purple-500/20 rounded-full text-purple-400 text-sm font-semibold mb-4 ml-2">
                    CEO, Signal87 AI
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-6">Chief Executive Officer</h2>
                
                <div className="space-y-6 text-gray-300 leading-relaxed">
                  <p>
                    Michael Benezra is a distinguished leader at the intersection of technology, finance, and international 
                    diplomacy. In addition to being the CEO of Signal87 AI, Michael serves as a Partner (North America) at 
                    Crewstone International, a private equity firm with a presence in New York City and Malaysia.
                  </p>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-blue-500 rounded"></span>
                      Venture Capital and Social Impact
                    </h3>
                    <p>
                      As the founder of Erez Capital, Michael leads a venture capital firm with a robust network of venture 
                      partners and a portfolio of strategic startup investments. His investment experience is also marked by a 
                      commitment to social impact. During the COVID-19 pandemic, he started the GK Fund, the first social 
                      impact fund dedicated to startups with founders of color, where he successfully negotiated access to 
                      millions in bank capital reserves and private capital for investments and grants.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-purple-500 rounded"></span>
                      Diplomatic and Government Leadership
                    </h3>
                    <p>
                      Prior to his current roles, Michael held significant diplomatic positions with the Israel Ministry of 
                      Foreign Affairs to the U.S. Mission (Northeast). As the Director of Innovation and Economic Development, 
                      he led critical trade negotiations to secure shipping lines and was instrumental in bridging and 
                      facilitating billions of dollars in venture capital investments, private equity acquisitions, strategic 
                      partnerships, and government contracts.
                    </p>
                    <p className="mt-3">
                      Previously, as the Director of Political Affairs, he worked closely with U.S. Governors, the Air National 
                      Guards, legislative leaders, and the American business community to expand Israeli corporate presence, 
                      enhance bilateral relations, and manage political-civil diplomatic efforts.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-green-500 rounded"></span>
                      Academic and Advisory Roles
                    </h3>
                    <p>
                      Michael's career includes serving as the Research Director for the Harvard Law School HPOD Initiative and 
                      holding economic advisory roles with members of Congress and governors. He earned a Master's degree in 
                      American Government from Harvard University and a Bachelor's degree in Political Science from the 
                      University of Washington. In recognition of his professional achievements and community contributions, 
                      the Boston Business Journal named him to its prestigious 40 Under 40 list.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-6 bg-orange-500 rounded"></span>
                      In The News
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <a href="https://www.openpr.com/news/4166981/signal87-ai-new-agentic-ai-platform-for-document-intelligence" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                          Signal87 AI: New Agentic AI Platform for Document Intelligence
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <a href="https://www.openvc.app/blog/how-i-lauched-erez-capital" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                          How I launched Erez Capital - OpenVC
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <a href="https://www.bizjournals.com/boston/news/2021/08/31/bbj-announces-this-year-s-40-under-40.html" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                          Boston Business Journal 40 Under 40
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                          Erez Capital launches, plans to raise $10M for pre-seed companies
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                          Erez Capital Announces Additional Venture Partners - NASDAQ
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                          Erez Capital Announces Strategic Partnerships to Drive Growth
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                          GK Fund founder aims to close the racial gap through small, targeted grants
                        </a>
                      </div>
                    </div>
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