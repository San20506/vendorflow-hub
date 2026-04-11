/**
 * Marketing Campaigns Management Page
 *
 * Create, manage, and track marketing campaigns across email, SMS, and in-app.
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { CampaignEngine } from '@/lib/campaign-engine';
import { Campaign } from '@/types/campaigns';
import {
  Mail,
  MessageSquare,
  Bell,
  TrendingUp,
  Plus,
  Eye,
  BarChart3,
  Pause,
  Play,
  Trash2,
} from 'lucide-react';

export default function MarketingCampaigns() {
  const { user } = useAuth();
  const vendorId = user?.id || '';
  const [showBuilder, setShowBuilder] = useState(false);

  // Load campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', vendorId],
    queryFn: async () => {
      const { data, error } = await fetch(
        `/api/campaigns?vendor_id=${vendorId}`
      ).then((r) => r.json());
      return data || [];
    },
    enabled: !!vendorId,
  });

  // Load performance
  const { data: performance = [] } = useQuery({
    queryKey: ['campaignPerformance', vendorId],
    queryFn: () =>
      vendorId ? CampaignEngine.getPerformance(vendorId) : Promise.resolve([]),
    enabled: !!vendorId,
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'sent':
        return 'bg-green-100 text-green-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Stats
  const stats = {
    total: campaigns.length,
    scheduled: campaigns.filter((c: Campaign) => c.status === 'scheduled').length,
    sent: campaigns.filter((c: Campaign) => c.status === 'sent').length,
    totalRevenue: performance.reduce((sum: number, p: any) => sum + (p.total_revenue || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Campaigns</h1>
          <p className="mt-2 text-gray-600">Create and manage campaigns across email, SMS, and in-app messaging.</p>
        </div>
        <Button
          onClick={() => setShowBuilder(!showBuilder)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-gray-900">{stats.total}</div>
            <p className="mt-2 text-sm text-gray-600">Total Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-blue-600">{stats.scheduled}</div>
            <p className="mt-2 text-sm text-gray-600">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-green-600">{stats.sent}</div>
            <p className="mt-2 text-sm text-gray-600">Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600">
              ₹{(stats.totalRevenue / 100000).toFixed(1)}L
            </div>
            <p className="mt-2 text-sm text-gray-600">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No campaigns yet. Create one to get started.
              </p>
            ) : (
              campaigns.map((campaign: Campaign) => {
                const perf = performance.find(
                  (p: any) => p.id === campaign.id
                );
                return (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="rounded-full bg-gray-100 p-2">
                        {getTypeIcon(campaign.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">
                          {campaign.type} • Created {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                      {perf && (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {perf.open_rate}% open rate
                          </p>
                          <p className="text-xs text-gray-500">
                            {perf.total_sent} sent
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Builder Placeholder */}
      {showBuilder && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Campaign Name
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2"
                  placeholder="e.g., Summer Sale Campaign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Campaign Type
                </label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2">
                  <option>Email</option>
                  <option>SMS</option>
                  <option>In-App Notification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Template
                </label>
                <select className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2">
                  <option>Welcome Template</option>
                  <option>Promotional Template</option>
                  <option>Re-engagement Template</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700">Create Campaign</Button>
                <Button
                  onClick={() => setShowBuilder(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
