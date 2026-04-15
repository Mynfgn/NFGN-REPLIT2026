import { useEffect, useState } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("nfgn_token"));
    }
  }, []);

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
