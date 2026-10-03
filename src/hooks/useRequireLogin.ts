import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export const useRequireLogin = () => {
  const { isAuthenticated } = useAuth();

  return useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAuthenticated) return;
    event.preventDefault();
    window.dispatchEvent(new Event("brothers:open-login"));
  }, [isAuthenticated]);
};
