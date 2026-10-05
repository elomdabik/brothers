import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { initSqlite } from "@/services/db/sqlite";
import { syncAll, wireAutoSync } from "@/services/db/sync";
import { PriceViewProvider } from "@/hooks/usePriceView";
import Index from "./pages/Index";
import About from "./pages/About";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Brides from "./pages/Brides";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import OAuthConsent from "./pages/OAuthConsent";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";

const App = () => {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initSqlite()
      .then(() => {
        if (cancelled) return;
        setDbReady(true);
        wireAutoSync();
        void syncAll();
      })
      .catch((err) => {
        console.error("[db] init failed", err);
        if (!cancelled) {
          setDbError(err?.message ?? "DB init failed");
          setDbReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <PriceViewProvider>
              {dbReady ? (
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/brides" element={<Brides />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              ) : (
                <div className="min-h-screen flex items-center justify-center text-muted-foreground">
                  جاري التحميل...
                </div>
              )}
              {dbError && (
                <div className="fixed bottom-3 left-3 right-3 bg-destructive text-destructive-foreground text-xs px-3 py-2 rounded shadow-lg z-50">
                  تعذّر تهيئة التخزين المحلي: {dbError}
                </div>
              )}
            </PriceViewProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
