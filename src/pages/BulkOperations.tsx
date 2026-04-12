import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { useOrders } from '@/hooks/useOrders';
import { useSettlements } from '@/hooks/useSettlements';
import { useToast } from '@/hooks/use-toast';
import { BulkSelectToolbar } from '@/components/BulkSelectToolbar';
import { BulkEditModal } from '@/components/BulkEditModal';
import { BulkCategorizeModal } from '@/components/BulkCategorizeModal';
import { BulkDeleteModal } from '@/components/BulkDeleteModal';
import { DeleteHistoryPanel } from '@/components/DeleteHistoryPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, ShoppingCart, DollarSign, Clock } from 'lucide-react';

type EntityType = 'products' | 'orders' | 'settlements';

interface SelectionState {
  products: Set<string>;
  orders: Set<string>;
  settlements: Set<string>;
}

export default function BulkOperations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const vendorId = user?.id || null;

  // Fetch data
  const { data: products = [], isLoading: isLoadingProducts } = useProducts(vendorId);
  const { data: orders = [], isLoading: isLoadingOrders } = useOrders(vendorId);
  const { data: settlements = [], isLoading: isLoadingSettlements } = useSettlements(vendorId);

  // Selection state
  const [selection, setSelection] = useState<SelectionState>({
    products: new Set(),
    orders: new Set(),
    settlements: new Set()
  });

  const [activeTab, setActiveTab] = useState<EntityType>('products');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [categorizeModalOpen, setCategorizeModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [selectedRecordForHistory, setSelectedRecordForHistory] = useState<string | null>(null);

  // Get current entity type selection
  const currentSelection = useMemo(() => {
    return selection[activeTab];
  }, [selection, activeTab]);

  // Handler: Toggle individual record
  const handleToggleRecord = (entityType: EntityType, id: string) => {
    setSelection(prev => {
      const newSelection = new Set(prev[entityType]);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { ...prev, [entityType]: newSelection };
    });
  };

  // Handler: Select all
  const handleSelectAll = (entityType: EntityType, ids: string[]) => {
    setSelection(prev => ({
      ...prev,
      [entityType]: new Set(ids)
    }));
  };

  // Handler: Clear selection
  const handleClearSelection = () => {
    setSelection(prev => ({
      ...prev,
      [activeTab]: new Set()
    }));
  };

  // Handler: Clear all (button in toolbar)
  const handleClearAll = () => {
    setSelection({
      products: new Set(),
      orders: new Set(),
      settlements: new Set()
    });
    toast({ title: 'Selection cleared' });
  };

  // Handler: Edit
  const handleEdit = () => {
    if (currentSelection.size === 0) return;
    setEditModalOpen(true);
  };

  // Handler: Categorize
  const handleCategorize = () => {
    if (currentSelection.size === 0) return;
    if (activeTab !== 'products') {
      toast({ title: 'Error', description: 'Categorization is only available for products', variant: 'destructive' });
      return;
    }
    setCategorizeModalOpen(true);
  };

  // Handler: Delete
  const handleDelete = () => {
    if (currentSelection.size === 0) return;
    setDeleteModalOpen(true);
  };

  // Handler: Show history panel
  const handleShowHistory = (recordId: string) => {
    setSelectedRecordForHistory(recordId);
    setHistoryPanelOpen(true);
  };

  // Product table
  const ProductTable = () => {
    const allIds = products.map(p => p.id);
    const allSelected = allIds.length > 0 && allIds.every(id => currentSelection.has(id));

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => handleSelectAll('products', allIds)}
                />
              </TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    checked={currentSelection.has(product.id)}
                    onCheckedChange={() => handleToggleRecord('products', product.id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{product.stock}</TableCell>
                <TableCell className="text-right">₹{product.price?.toLocaleString() || '0'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Orders table
  const OrdersTable = () => {
    const allIds = orders.map(o => o.id);
    const allSelected = allIds.length > 0 && allIds.every(id => currentSelection.has(id));

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => handleSelectAll('orders', allIds)}
                />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id}>
                <TableCell>
                  <Checkbox
                    checked={currentSelection.has(order.id)}
                    onCheckedChange={() => handleToggleRecord('orders', order.id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{order.external_order_id}</TableCell>
                <TableCell>{order.customer_name || '-'}</TableCell>
                <TableCell>
                  <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">₹{order.total_amount?.toLocaleString() || '0'}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Settlements table
  const SettlementsTable = () => {
    const allIds = settlements.map(s => s.id);
    const allSelected = allIds.length > 0 && allIds.every(id => currentSelection.has(id));

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => handleSelectAll('settlements', allIds)}
                />
              </TableHead>
              <TableHead>Settlement ID</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {settlements.map(settlement => (
              <TableRow key={settlement.id}>
                <TableCell>
                  <Checkbox
                    checked={currentSelection.has(settlement.id)}
                    onCheckedChange={() => handleToggleRecord('settlements', settlement.id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">{settlement.id.slice(0, 8)}</TableCell>
                <TableCell>{settlement.period}</TableCell>
                <TableCell>
                  <Badge variant={settlement.status === 'processed' ? 'default' : 'secondary'}>
                    {settlement.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">₹{settlement.amount?.toLocaleString() || '0'}</TableCell>
                <TableCell>{new Date(settlement.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Bulk Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentSelection.size > 0 && (
            <BulkSelectToolbar
              selectedCount={currentSelection.size}
              onEdit={handleEdit}
              onCategorize={handleCategorize}
              onDelete={handleDelete}
              onClear={handleClearAll}
            />
          )}

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EntityType)}>
            <TabsList>
              <TabsTrigger value="products" className="gap-2">
                <Package className="w-4 h-4" />
                Products ({products.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Orders ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="settlements" className="gap-2">
                <DollarSign className="w-4 h-4" />
                Settlements ({settlements.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-6">
              {products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No products found. <a href="/data-import" className="text-primary underline">Import products</a> to get started.
                </div>
              ) : (
                <ProductTable />
              )}
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No orders found. <a href="/data-import" className="text-primary underline">Import orders</a> to get started.
                </div>
              ) : (
                <OrdersTable />
              )}
            </TabsContent>

            <TabsContent value="settlements" className="mt-6">
              {settlements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No settlements found.
                </div>
              ) : (
                <SettlementsTable />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      <BulkEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        recordIds={Array.from(currentSelection)}
        entityType={activeTab}
        onSuccess={() => {
          setEditModalOpen(false);
          handleClearAll();
          toast({ title: `✓ ${currentSelection.size} records updated` });
        }}
      />

      <BulkCategorizeModal
        isOpen={categorizeModalOpen}
        onClose={() => setCategorizeModalOpen(false)}
        recordIds={Array.from(currentSelection)}
        onSuccess={() => {
          setCategorizeModalOpen(false);
          handleClearAll();
          toast({ title: `✓ ${currentSelection.size} products categorized` });
        }}
      />

      <BulkDeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        recordIds={Array.from(currentSelection)}
        entityType={activeTab}
        onSuccess={() => {
          setDeleteModalOpen(false);
          handleClearAll();
          toast({ title: `✓ ${currentSelection.size} records deleted` });
        }}
      />

      {selectedRecordForHistory && (
        <DeleteHistoryPanel
          isOpen={historyPanelOpen}
          onClose={() => {
            setHistoryPanelOpen(false);
            setSelectedRecordForHistory(null);
          }}
          recordId={selectedRecordForHistory}
          entityType={activeTab}
          onSuccess={() => {
            toast({ title: '✓ Record restored' });
          }}
        />
      )}
    </div>
  );
}
