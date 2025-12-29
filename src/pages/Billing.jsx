import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, FileText, Users, Zap, Shield, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function Billing() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [billingInterval, setBillingInterval] = useState("monthly");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const auth = await base44.auth.isAuthenticated();
      if (auth) {
        // Redirect logged-in users to documents
        navigate(createPageUrl("Documents"));
      }
      setIsAuthenticated(auth);
    };
    checkAuth();
  }, [navigate]);

  const plans = [
    {
      name: "Free",
      icon: FileText,
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: "Perfect for individuals getting started",
      features: [
        { text: "Up to 50 documents", included: true },
        { text: "1GB storage", included: true },
        { text: "Basic AI queries (50/month)", included: true },
        { text: "Email support", included: true },
        { text: "Advanced AI features", included: false },
        { text: "Priority support", included: false },
        { text: "Team collaboration", included: false },
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Pro",
      icon: Zap,
      monthlyPrice: 29,
      yearlyPrice: 290,
      description: "For power users and small teams",
      features: [
        { text: "Unlimited documents", included: true },
        { text: "100GB storage", included: true },
        { text: "Unlimited AI queries", included: true },
        { text: "Advanced AI features", included: true },
        { text: "Priority email support", included: true },
        { text: "API access", included: true },
        { text: "Team collaboration (up to 5)", included: true },
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Business",
      icon: Users,
      monthlyPrice: 99,
      yearlyPrice: 990,
      description: "For growing organizations",
      features: [
        { text: "Everything in Pro", included: true },
        { text: "Unlimited storage", included: true },
        { text: "Unlimited team members", included: true },
        { text: "Advanced security & compliance", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Custom integrations", included: true },
        { text: "SLA guarantee", included: true },
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  const getPrice = (plan) => {
    return billingInterval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const handlePlanSelect = (planName) => {
    // Redirect to login/signup with plan parameter
    window.location.href = createPageUrl("Documents") + `?plan=${planName.toLowerCase()}`;
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 sticky top-0 z-50 bg-white">
        <nav className="max-w-[1400px] mx-auto px-6 sm:px-10 py-5 flex justify-between items-center">
          <Link to={createPageUrl("Home")} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 text-white rounded-md flex items-center justify-center font-bold text-sm">
              87
            </div>
            <span className="text-xl font-bold">Signal87</span>
          </Link>
          
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" className="text-slate-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </nav>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-16 sm:py-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Choose your plan
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            Start free and scale as you grow. All plans include core AI features.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingInterval === "monthly"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingInterval === "yearly"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = getPrice(plan);
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-slate-900 text-white shadow-2xl scale-105"
                    : "bg-white border border-slate-200"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${
                  plan.highlighted ? "bg-white/10" : "bg-slate-100"
                }`}>
                  <Icon className={`w-6 h-6 ${plan.highlighted ? "text-white" : "text-slate-900"}`} />
                </div>

                <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                
                <p className={`text-sm mb-6 ${plan.highlighted ? "text-slate-300" : "text-slate-600"}`}>
                  {plan.description}
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${plan.highlighted ? "text-white" : "text-slate-900"}`}>
                      ${price}
                    </span>
                    {price > 0 && (
                      <span className={plan.highlighted ? "text-slate-300" : "text-slate-600"}>
                        /{billingInterval === "monthly" ? "mo" : "yr"}
                      </span>
                    )}
                  </div>
                  {billingInterval === "yearly" && price > 0 && (
                    <p className={`text-sm mt-2 ${plan.highlighted ? "text-slate-400" : "text-slate-500"}`}>
                      ${(price / 12).toFixed(0)}/month billed annually
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => handlePlanSelect(plan.name)}
                  className={`w-full mb-8 ${
                    plan.highlighted
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {plan.cta}
                </Button>

                <div className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className={`w-5 h-5 flex-shrink-0 ${
                          plan.highlighted ? "text-green-400" : "text-green-600"
                        }`} />
                      ) : (
                        <X className={`w-5 h-5 flex-shrink-0 ${
                          plan.highlighted ? "text-slate-600" : "text-slate-300"
                        }`} />
                      )}
                      <span className={`text-sm ${
                        feature.included
                          ? plan.highlighted ? "text-white" : "text-slate-900"
                          : plan.highlighted ? "text-slate-500" : "text-slate-400"
                      }`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                q: "Can I change plans later?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards (Visa, Mastercard, American Express) and PayPal."
              },
              {
                q: "Is there a free trial?",
                a: "Yes! Pro plan includes a 14-day free trial. No credit card required to start."
              },
              {
                q: "What happens to my data if I cancel?",
                a: "Your data remains accessible for 30 days after cancellation. You can export it anytime."
              }
            ].map((faq, index) => (
              <div key={index} className="border-b border-slate-200 pb-6">
                <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-5 h-5" />
              <span className="text-sm">SOC 2 Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-5 h-5" />
              <span className="text-sm">GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Shield className="w-5 h-5" />
              <span className="text-sm">256-bit Encryption</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}