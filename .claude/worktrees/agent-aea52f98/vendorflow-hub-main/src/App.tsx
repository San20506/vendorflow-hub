import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AIAccessProvider } from "@/contexts/AIAccessContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import CatalogManager from "./pages/CatalogManager";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import Returns from "./pages/Returns";
import Settlements from "./pages/Settlements";
import Alerts from "./pages/Alerts";
import ProductHealth from "./pages/ProductHealth";
import ConsolidatedOrders from "./pages/ConsolidatedOrders";
import SKUMapping from "./pages/SKUMapping";
import Reconciliation from "./pages/Reconciliation";
import DataImport from "./pages/DataImport";
import SocialInsights from "./pages/SocialInsights";
import Subscription from "./pages/Subscription";
import Support from "./pages/Support";
import Vendors from "./pages/Vendors";
import Warehouses from "./pages/Warehouses";
import Tasks from "./pages/Tasks";
import Analytics from "./pages/Analytics";
import AIChatbot from "./pages/AIChatbot";
import OwnWebsite from "./pages/OwnWebsite";
import Permissions from "./pages/Permissions";
import Reports from "./pages/Reports";
import PricePayout from "./pages/PricePayout";
import NotFound from "./pages/NotFound";
import DataConfiguration from "./pages/DataConfiguration";
import SystemArchitecture from "./pages/SystemArchitecture";
import SystemSettings from "./pages/SystemSettings";
import FinanceTaxation from "./pages/FinanceTaxation";
import APISettings from "./pages/APISettings";
import VideoManagement from "./pages/VideoManagement";
import LegalCompliance from "./pages/LegalCompliance";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AIAccessProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
            <Route path="/catalog-manager" element={<AppLayout><CatalogManager /></AppLayout>} />
            <Route path="/product-health" element={<AppLayout><ProductHealth /></AppLayout>} />
            <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
            <Route path="/orders" element={<AppLayout><Orders /></AppLayout>} />
            <Route path="/consolidated-orders" element={<AppLayout><ConsolidatedOrders /></AppLayout>} />
            <Route path="/returns" element={<AppLayout><Returns /></AppLayout>} />
            <Route path="/settlements" element={<AppLayout><Settlements /></AppLayout>} />
            <Route path="/sku-mapping" element={<AppLayout><SKUMapping /></AppLayout>} />
            <Route path="/reconciliation" element={<AppLayout><Reconciliation /></AppLayout>} />
            <Route path="/data-import" element={<AppLayout><DataImport /></AppLayout>} />
            <Route path="/social-insights" element={<AppLayout><SocialInsights /></AppLayout>} />
            <Route path="/subscription" element={<AppLayout><Subscription /></AppLayout>} />
            <Route path="/support" element={<AppLayout><Support /></AppLayout>} />
            <Route path="/alerts" element={<AppLayout><Alerts /></AppLayout>} />
            <Route path="/vendors" element={<AppLayout><Vendors /></AppLayout>} />
            <Route path="/warehouses" element={<AppLayout><Warehouses /></AppLayout>} />
            <Route path="/tasks" element={<AppLayout><Tasks /></AppLayout>} />
            <Route path="/analytics" element={<AppLayout><Analytics /></AppLayout>} />
            <Route path="/ecommerce" element={<AppLayout><OwnWebsite /></AppLayout>} />
            <Route path="/chatbot" element={<AppLayout><AIChatbot /></AppLayout>} />
            <Route path="/permissions" element={<AppLayout><Permissions /></AppLayout>} />
            <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
            <Route path="/price-payout" element={<AppLayout><PricePayout /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><Permissions /></AppLayout>} />
            <Route path="/data-configuration" element={<AppLayout><DataConfiguration /></AppLayout>} />
            <Route path="/system-architecture" element={<AppLayout><SystemArchitecture /></AppLayout>} />
            <Route path="/system-settings" element={<AppLayout><SystemSettings /></AppLayout>} />
            <Route path="/finance" element={<AppLayout><FinanceTaxation /></AppLayout>} />
            <Route path="/api-settings" element={<AppLayout><APISettings /></AppLayout>} />
            <Route path="/video-management" element={<AppLayout><VideoManagement /></AppLayout>} />
            <Route path="/legal-compliance" element={<AppLayout><LegalCompliance /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </AIAccessProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
