import { useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("nfgn_token");
    }
    return null;
  });

  const login = (newToken: string) => {
    localStorage.setItem("nfgn_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("nfgn_token");
    setToken(null);
  };

  return { token, login, logout, isAuthenticated: !!token };
}
