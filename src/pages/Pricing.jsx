import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function Pricing() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const plans = [
    {
      name: "Free",
      icon: Zap,
      price: "$0",
      period: "forever",
      description: "Perfect for individuals getting started",
      features: [
        "50 documents",
        "1 GB storage",
        "10 AI queries/month",
        "Basic document management",
        "PDF & image support",
        "Mobile access"
      ],
      limitations: [
        "No AI document generation",
        "No team workspaces",
        "No advanced analytics"
      ],
      cta: "Get Started",
      highlighted: false,
      planId: "free"
    },
    {
      name: "Pro",
      icon: Crown,
      price: "$29",
      period: "per month",
      description: "Advanced features for power users",
      features: [
        "Unlimited documents",
        "100 GB storage",
        "500 AI queries/month",
        "50 AI generations/month",
        "Advanced search & filters",
        "Document signing",
        "Priority support",
        "Export to PDF/DOCX",
        "Duplicate detection"
      ],
      limitations: [],
      cta: "Upgrade to Pro",
      highlighted: true,
      planId: "pro"
    },
    {
      name: "Business",
      icon: Building2,
      price: "$99",
      period: "per month",
      description: "Complete solution for teams",
      features: [
        "Everything in Pro",
        "Unlimited storage",
        "Unlimited AI queries",
        "Unlimited AI generations",
        "Team workspaces (up to 10 members)",
        "Role-based access control",
        "Audit logs & compliance",
        "Advanced permissions",
        "Custom integrations",
        "Dedicated support"
      ],
      limitations: [],
      cta: "Upgrade to Business",
      highlighted: false,
      planId: "business"
    }
  ];

  const handleSelectPlan = async (planId) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.origin + createPageUrl("Pricing"));
      return;
    }

    if (planId === "free") {
      window.location.href = createPageUrl("Documents");
      return;
    }

    // Redirect to subscription settings to initiate checkout
    window.location.href = createPageUrl("SubscriptionSettings") + "?plan=" + planId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-indigo-100 text-indigo-800">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Start free and scale as you grow. All plans include core document management features.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative h-full ${
                  plan.highlighted 
                    ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-600' 
                    : 'border-slate-200'
                }`}>
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-indigo-600 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg ${
                        plan.highlighted 
                          ? 'bg-indigo-600' 
                          : 'bg-slate-100'
                      } flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${
                          plan.highlighted ? 'text-white' : 'text-slate-600'
                        }`} />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <p className="text-slate-600 text-sm mt-2">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-600 ml-2">/ {plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Button
                      onClick={() => handleSelectPlan(plan.planId)}
                      className={`w-full mb-6 ${
                        plan.highlighted
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {plan.cta}
                    </Button>

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-slate-900">Features:</p>
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the end of your billing period for downgrades.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Our Free plan is available forever with no credit card required. For Pro and Business plans, we offer a 14-day free trial.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
}