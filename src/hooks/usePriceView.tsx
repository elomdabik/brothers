import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

type PriceView = "retail" | "wholesale";

type PriceViewContextType = {
  priceView: PriceView;
  togglePriceView: () => void;
  canToggle: boolean;
};

const PriceViewContext = createContext<PriceViewContextType | undefined>(undefined);

const STORAGE_KEY = "brothers:price-view";

function readSaved(): PriceView | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "retail" || v === "wholesale") return v;
  } catch { /* ignore */ }
  return null;
}

export const PriceViewProvider = ({ children }: { children: ReactNode }) => {
  const { isAdmin, isSupervisor, isWholesale } = useAuth();
  const canToggle = isAdmin || isSupervisor || isWholesale;

  const defaultView: PriceView = canToggle ? "wholesale" : "retail";

  const [priceView, setPriceView] = useState<PriceView>(() => {
    if (!canToggle) return "retail";
    return readSaved() ?? defaultView;
  });

  // إذا اليوزر مش مخول يبدل، فرض القطاعي
  useEffect(() => {
    if (!canToggle) {
      setPriceView("retail");
    }
  }, [canToggle]);

  // حفظ الاختيار
  useEffect(() => {
    if (canToggle) {
      try {
        localStorage.setItem(STORAGE_KEY, priceView);
      } catch { /* ignore */ }
    }
  }, [priceView, canToggle]);

  const togglePriceView = () => {
    if (!canToggle) return;
    setPriceView((prev) => (prev === "retail" ? "wholesale" : "retail"));
  };

  return (
    <PriceViewContext.Provider value={{ priceView, togglePriceView, canToggle }}>
      {children}
    </PriceViewContext.Provider>
  );
};

export const usePriceView = () => {
  const ctx = useContext(PriceViewContext);
  if (!ctx) throw new Error("usePriceView must be used within PriceViewProvider");
  return ctx;
};
