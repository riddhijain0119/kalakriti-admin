import React, { createContext, useContext, useEffect, useState } from "react";
import { adminApi, tokenStore } from "@/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const t = tokenStore.get();
    if (!t) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const me = await adminApi.me();
      setAdmin(me);
    } catch (e) {
      setAdmin(null);
      tokenStore.clear();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email, password) => {
    const res = await adminApi.login(email, password);
    tokenStore.set(res.access_token);
    setAdmin(res.admin);
    return res;
  };

  const logout = () => {
    tokenStore.clear();
    setAdmin(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
