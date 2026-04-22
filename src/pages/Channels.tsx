import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, RotateCw, ExternalLink } from 'lucide-react';
import { getChannelsForVendor, deleteChannel, updateChannelSyncStatus, getChannelSyncStatus } from '@/lib/channels';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { shopifyConfig } from '@/lib/shopify-config';
import { generateOAuthUrl } from '@/integrations/channels/shopify/shopify-auth';
import { generateOAuthUrl as generateAmazonAuthUrl } from '@/integrations/channels/amazon/amazon-auth';
import { createShopifyConnector } from '@/integrations/channels/shopify/shopify-connector';
import { createAmazonConnector } from '@/integrations/channels/amazon/amazon-connector';
import { createWooCommerceConnector } from '@/integrations/channels/woocommerce/woocommerce-connector';

type Channel = {
  channel_id: string;
  vendor_id: string;
  platform: string;
  external_account_id: string;
  connected_at: string;
  last_sync_at: string | null;
  sync_status: 'idle' | 'syncing' | 'error';
  sync_error: string | null;
};

export default function Channels() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'shopify' | 'amazon' | 'woocommerce' | null>(null);
  const [wooCommerceUrl, setWooCommerceUrl] = useState('');
  const [wooCommerceKey, setWooCommerceKey] = useState('');
  const [wooCommerceSecret, setWooCommerceSecret] = useState('');
  const [wooCommerceLoading, setWooCommerceLoading] = useState(false);
  const [wooCommerceError, setWooCommerceError] = useState('');

  // Fetch channels for current vendor
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['channels', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return getChannelsForVendor(user.id);
    },
    enabled: !!user?.id,
    refetchInterval: (data) => {
      // Auto-refetch while syncing
      if (!data || !Array.isArray(data)) return false;
      const isSyncing = data.some((c: Channel) => c.sync_status === 'syncing');
      return isSyncing ? 2000 : false;  // Refetch every 2s if syncing
    },
  });

  // Delete channel mutation
  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      await deleteChannel(channelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', user?.id] });
    },
  });

  // Sync channel mutation
  const syncChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user?.id) throw new Error('No user');

      // Get channel
      const channel = channels.find(c => c.channel_id === channelId);
      if (!channel) throw new Error('Channel not found');

      // Start sync
      await updateChannelSyncStatus(channelId, 'syncing');

      // Trigger sync based on platform
      try {
        if (channel.platform === 'shopify') {
          const connector = createShopifyConnector(user.id);
          const result = await connector.syncProducts(user.id);

          if (result.errors > 0) {
            await updateChannelSyncStatus(channelId, 'error', `${result.errors} products failed to sync`);
          } else {
            await updateChannelSyncStatus(channelId, 'idle');
          }
        } else if (channel.platform === 'amazon') {
          const connector = createAmazonConnector(user.id);
          const result = await connector.syncProducts(user.id);

          if (result.errors > 0) {
            await updateChannelSyncStatus(channelId, 'error', `${result.errors} products failed to sync`);
          } else {
            await updateChannelSyncStatus(channelId, 'idle');
          }
        } else if (channel.platform === 'woocommerce') {
          const connector = createWooCommerceConnector(user.id);
          const result = await connector.syncProducts(user.id);

          if (result.errors > 0) {
            await updateChannelSyncStatus(channelId, 'error', `${result.errors} products failed to sync`);
          } else {
            await updateChannelSyncStatus(channelId, 'idle');
          }
        }
      } catch (err) {
        await updateChannelSyncStatus(
          channelId,
          'error',
          err instanceof Error ? err.message : 'Sync failed'
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels', user?.id] });
    },
  });

  // Shopify OAuth redirect
  const handleConnectShopify = async () => {
    if (!user?.id) {
      alert('You must be logged in');
      return;
    }

    try {
      // Generate OAuth URL
      const authUrl = generateOAuthUrl(
        user.id,
        `${window.location.origin}/auth/shopify/callback`
      );

      // Redirect to Shopify OAuth
      window.location.href = authUrl;
    } catch (err) {
      alert(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Amazon OAuth redirect
  const handleConnectAmazon = async () => {
    if (!user?.id) {
      alert('You must be logged in');
      return;
    }

    try {
      // Generate OAuth URL
      const authUrl = generateAmazonAuthUrl(
        user.id,
        `${window.location.origin}/auth/amazon/callback`
      );

      // Redirect to Amazon OAuth
      window.location.href = authUrl;
    } catch (err) {
      alert(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // WooCommerce credential validation and connection
  const handleConnectWooCommerce = async () => {
    if (!user?.id) {
      alert('You must be logged in');
      return;
    }

    if (!wooCommerceUrl || !wooCommerceKey || !wooCommerceSecret) {
      setWooCommerceError('Please fill in all fields');
      return;
    }

    setWooCommerceLoading(true);
    setWooCommerceError('');

    try {
      const connector = createWooCommerceConnector(user.id);
      await connector.handleAuthCallback(wooCommerceUrl, wooCommerceKey, wooCommerceSecret);

      // Success - close dialog and reset form
      setShowConnectDialog(false);
      setSelectedPlatform(null);
      setWooCommerceUrl('');
      setWooCommerceKey('');
      setWooCommerceSecret('');

      // Refetch channels
      queryClient.invalidateQueries({ queryKey: ['channels', user?.id] });
    } catch (err) {
      setWooCommerceError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setWooCommerceLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Channel Connectors</h1>
        <p className="mt-2 text-gray-600">
          Connect your e-commerce stores to sync products and inventory in real-time
        </p>
      </div>

      {/* Connected Channels */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Connected Channels</h2>
          <Button onClick={() => setShowConnectDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Channel
          </Button>
        </div>

        {channels.length === 0 ? (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">No connected channels yet</p>
                <Button onClick={() => setShowConnectDialog(true)} variant="outline">
                  Connect Your First Channel
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel: Channel) => (
              <Card key={channel.channel_id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg capitalize">{channel.platform}</CardTitle>
                      <CardDescription className="text-xs">
                        {channel.external_account_id}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        channel.sync_status === 'idle'
                          ? 'default'
                          : channel.sync_status === 'syncing'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {channel.sync_status === 'syncing' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                      {channel.sync_status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex-grow space-y-4">
                  <div>
                    <p className="text-xs text-gray-600">Last Sync</p>
                    <p className="text-sm font-medium">
                      {channel.last_sync_at
                        ? new Date(channel.last_sync_at).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>

                  {channel.sync_error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {channel.sync_error}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncChannelMutation.mutate(channel.channel_id)}
                      disabled={syncChannelMutation.isPending || channel.sync_status === 'syncing'}
                      className="flex-1 gap-1"
                    >
                      {syncChannelMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RotateCw className="w-3 h-3" />
                      )}
                      Sync Now
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect Channel?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the connection to {channel.platform} but keep synced products.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteChannelMutation.mutate(channel.channel_id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Disconnect
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Connect Dialog */}
      {showConnectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Channel</CardTitle>
              <CardDescription>Connect your e-commerce store</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {selectedPlatform === 'woocommerce' ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Store URL</label>
                    <input
                      type="text"
                      placeholder="https://mystore.com"
                      value={wooCommerceUrl}
                      onChange={(e) => setWooCommerceUrl(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Consumer Key</label>
                    <input
                      type="password"
                      placeholder="ck_..."
                      value={wooCommerceKey}
                      onChange={(e) => setWooCommerceKey(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Consumer Secret</label>
                    <input
                      type="password"
                      placeholder="cs_..."
                      value={wooCommerceSecret}
                      onChange={(e) => setWooCommerceSecret(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                  {wooCommerceError && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      {wooCommerceError}
                    </div>
                  )}
                  <Button
                    onClick={handleConnectWooCommerce}
                    disabled={wooCommerceLoading}
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {wooCommerceLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {wooCommerceLoading ? 'Connecting...' : 'Connect'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedPlatform(null);
                      setWooCommerceError('');
                    }}
                    className="w-full"
                  >
                    Back
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleConnectShopify}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Connect with Shopify
                  </Button>

                  <Button
                    onClick={handleConnectAmazon}
                    className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Connect with Amazon
                  </Button>

                  <Button
                    onClick={() => setSelectedPlatform('woocommerce')}
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Connect with WooCommerce
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowConnectDialog(false)}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shopify Config Info */}
      {shopifyConfig.usedFallback && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Using test Shopify app.</strong> For production, configure Shopify OAuth credentials in .env.local (see .env.local.example).
          </p>
        </div>
      )}
    </div>
  );
}
