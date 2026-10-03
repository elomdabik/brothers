import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isWholesale: boolean;
  isSupervisor: boolean;
  isAdmin: boolean;
  canSeeWholesale: boolean;
  canManageProducts: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("[auth] failed to restore session", error);
      setUser(data.session?.user ?? null);
      setSessionLoading(false);
      if (!data.session?.user) setRolesLoading(false);
    }).catch((error: unknown) => {
      console.error("[auth] failed to restore session", error);
      if (active) {
        setSessionLoading(false);
        setRolesLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setRoles([]);
      setAuthError(null);
      setRolesLoading(!!nextUser);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!user) {
      setRoles([]);
      setAuthError(null);
      setRolesLoading(false);
      return () => {
        active = false;
      };
    }

    setRolesLoading(true);
    setAuthError(null);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error("[auth] failed to load user roles", error);
          setRoles([]);
          setAuthError(error.message);
          setRolesLoading(false);
          return;
        }
        setRoles((data ?? []).map(({ role }) => role));
        setRolesLoading(false);
      }).catch((error: unknown) => {
        if (!active) return;
        console.error("[auth] failed to load user roles", error);
        setRoles([]);
        setAuthError("تعذّر تحميل صلاحيات الحساب");
        setRolesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const isAdmin = roles.includes("admin");
  const isSupervisor = roles.includes("product_manager");
  const isWholesale = roles.includes("wholesale");

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: sessionLoading || rolesLoading,
        authError,
        isWholesale,
        isSupervisor,
        isAdmin,
        canSeeWholesale: isWholesale || isSupervisor || isAdmin,
        canManageProducts: isAdmin || isSupervisor,
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
