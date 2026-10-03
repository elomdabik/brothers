import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Simple password-protected view modes — no real authentication.
// Wholesale password unlocks the wholesale price view (shows wholesale + retail).
// Admin password unlocks the admin dashboard AND the wholesale view.
export const WHOLESALE_PASSWORD = "jumla2026";
export const ADMIN_PASSWORD = "admin2026";

const LS_WHOLESALE = "view_mode_wholesale";
const LS_ADMIN = "view_mode_admin";

type AuthContextType = {
  isWholesale: boolean;
  isAdmin: boolean;
  canSeeWholesale: boolean;
  canManageProducts: boolean;
  unlockWholesale: (password: string) => boolean;
  unlockAdmin: (password: string) => boolean;
  lockWholesale: () => void;
  lockAdmin: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isWholesale, setIsWholesale] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    setIsWholesale(localStorage.getItem(LS_WHOLESALE) === "1");
    setIsAdmin(localStorage.getItem(LS_ADMIN) === "1");
  }, []);

  const unlockWholesale = (password: string) => {
    if (password === WHOLESALE_PASSWORD || password === ADMIN_PASSWORD) {
      localStorage.setItem(LS_WHOLESALE, "1");
      setIsWholesale(true);
      return true;
    }
    return false;
  };

  const unlockAdmin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(LS_ADMIN, "1");
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const lockWholesale = () => {
    localStorage.removeItem(LS_WHOLESALE);
    setIsWholesale(false);
  };

  const lockAdmin = () => {
    localStorage.removeItem(LS_ADMIN);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isWholesale,
        isAdmin,
        canSeeWholesale: isWholesale || isAdmin,
        canManageProducts: isAdmin,
        unlockWholesale,
        unlockAdmin,
        lockWholesale,
        lockAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
