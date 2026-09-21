
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ObjectsPage from "./components/objects/ObjectsPage";
import ObjectDetailPage from "./components/objects/ObjectDetailPage";
import AddObjectPage from "./components/objects/AddObjectPage";
import EditObjectPage from "./components/objects/EditObjectPage";
import AdminPage from "./pages/AdminPage";
import AdminDashboard from "./pages/AdminDashboard";
import CrmPage from "./pages/CrmPage";
import AdminUserDetailPage from "./pages/AdminUserDetailPage";
import TelegramCallbackPage from "./pages/TelegramCallbackPage";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SiteAssistantWidget from "@/components/assistant/SiteAssistantWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/objects" element={<ObjectsPage />} />
              <Route path="/objects/add" element={<ProtectedRoute roles={['broker', 'admin', 'manager']}><AddObjectPage /></ProtectedRoute>} />
              <Route path="/objects/:id/edit" element={<ProtectedRoute roles={['broker', 'admin', 'manager']}><EditObjectPage /></ProtectedRoute>} />
              <Route path="/objects/:id" element={<ObjectDetailPage />} />
              <Route path="/admin" element={<ProtectedRoute roles={['admin', 'manager']}><AdminPage /></ProtectedRoute>} />
              <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin', 'manager']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users/:id" element={<ProtectedRoute roles={['admin', 'manager']}><AdminUserDetailPage /></ProtectedRoute>} />
              <Route path="/crm" element={<ProtectedRoute roles={['admin', 'manager', 'broker']}><CrmPage /></ProtectedRoute>} />
              <Route path="/auth/telegram/callback" element={<TelegramCallbackPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <SiteAssistantWidget />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;