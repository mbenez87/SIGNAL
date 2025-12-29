import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, Zap, Crown, Building2, TrendingUp, 
  FileText, Database, MessageSquare, Sparkles, AlertCircle, ArrowLeft
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function SubscriptionSettings() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch subscription
  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ user_email: user.email });
      return subs[0] || null;
    },
    enabled: !!user,
  });

  // Fetch usage
  const { data: usage } = useQuery({
    queryKey: ['usage', user?.email],
    queryFn: async () => {
      const records = await base44.entities.UsageRecord.filter({ 
        user_email: user.email 
      }, '-period_start', 1);
      return records[0] || null;
    },
    enabled: !!user,
  });

  const planConfig = {
    free: {
      name: "Free",
      icon: Zap,
      color: "slate",
      limits: {
        documents: 50,
        storage_gb: 1,
        ai_queries: 10,
        ai_generations: 0
      }
    },
    pro: {
      name: "Pro",
      icon: Crown,
      color: "indigo",
      limits: {
        documents: Infinity,
        storage_gb: 100,
        ai_queries: 500,
        ai_generations: 50
      }
    },
    business: {
      name: "Business",
      icon: Building2,
      color: "purple",
      limits: {
        documents: Infinity,
        storage_gb: Infinity,
        ai_queries: Infinity,
        ai_generations: Infinity
      }
    }
  };

  const currentPlan = subscription?.plan || 'free';
  const planInfo = planConfig[currentPlan];
  const Icon = planInfo.icon;

  const formatBytes = (bytes) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2);
  };

  const getUsagePercent = (current, limit) => {
    if (limit === Infinity) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const handleUpgrade = async (targetPlan) => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        plan: targetPlan
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to initiate upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createPortalSession', {});
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to={createPageUrl("Documents")}>
            <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscription & Usage</h1>
          <p className="text-slate-600">Manage your plan and monitor your usage</p>
        </div>

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg bg-${planInfo.color}-100 flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${planInfo.color}-600`} />
                </div>
                <div>
                  <CardTitle className="text-2xl">{planInfo.name} Plan</CardTitle>
                  {subscription && subscription.status && (
                    <Badge className={`mt-1 ${
                      subscription.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                {currentPlan !== 'free' && subscription?.current_period_end && (
                  <p className="text-sm text-slate-600">
                    Renews on {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {currentPlan === 'free' && (
                <>
                  <Button 
                    onClick={() => handleUpgrade('pro')}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                  <Button 
                    onClick={() => handleUpgrade('business')}
                    disabled={loading}
                    variant="outline"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Upgrade to Business
                  </Button>
                </>
              )}
              {currentPlan === 'pro' && (
                <>
                  <Button 
                    onClick={() => handleUpgrade('business')}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Upgrade to Business
                  </Button>
                  <Button 
                    onClick={handleManageBilling}
                    disabled={loading}
                    variant="outline"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                </>
              )}
              {currentPlan === 'business' && (
                <Button 
                  onClick={handleManageBilling}
                  disabled={loading}
                  variant="outline"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              )}
              <Link to={createPageUrl('Pricing')}>
                <Button variant="ghost">
                  View All Plans
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Usage Statistics */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Documents</CardTitle>
                </div>
                <span className="text-sm text-slate-600">
                  {usage?.total_documents || 0} / {
                    planInfo.limits.documents === Infinity 
                      ? '∞' 
                      : planInfo.limits.documents
                  }
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress 
                value={getUsagePercent(usage?.total_documents || 0, planInfo.limits.documents)} 
                className="h-2"
              />
              {getUsagePercent(usage?.total_documents || 0, planInfo.limits.documents) > 80 && (
                <Alert className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You're approaching your document limit. Consider upgrading.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Storage */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">Storage</CardTitle>
                </div>
                <span className="text-sm text-slate-600">
                  {formatBytes(usage?.storage_used_bytes || 0)} GB / {
                    planInfo.limits.storage_gb === Infinity 
                      ? '∞' 
                      : `${planInfo.limits.storage_gb} GB`
                  }
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress 
                value={getUsagePercent(
                  (usage?.storage_used_bytes || 0) / (1024 * 1024 * 1024), 
                  planInfo.limits.storage_gb
                )} 
                className="h-2"
              />
            </CardContent>
          </Card>

          {/* AI Queries */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">AI Queries</CardTitle>
                </div>
                <span className="text-sm text-slate-600">
                  {usage?.ai_queries || 0} / {
                    planInfo.limits.ai_queries === Infinity 
                      ? '∞' 
                      : planInfo.limits.ai_queries
                  }
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress 
                value={getUsagePercent(usage?.ai_queries || 0, planInfo.limits.ai_queries)} 
                className="h-2"
              />
              <p className="text-xs text-slate-500 mt-2">Resets monthly</p>
            </CardContent>
          </Card>

          {/* AI Generations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-lg">AI Generations</CardTitle>
                </div>
                <span className="text-sm text-slate-600">
                  {usage?.ai_generations || 0} / {
                    planInfo.limits.ai_generations === Infinity 
                      ? '∞' 
                      : planInfo.limits.ai_generations
                  }
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress 
                value={getUsagePercent(usage?.ai_generations || 0, planInfo.limits.ai_generations)} 
                className="h-2"
              />
              <p className="text-xs text-slate-500 mt-2">Resets monthly</p>
            </CardContent>
          </Card>
        </div>

        {/* Billing History - Placeholder for future */}
        {currentPlan !== 'free' && (
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                To view invoices and manage payment methods, click "Manage Billing" above.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}