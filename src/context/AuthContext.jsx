import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

function readSavedUser() {
  try {
    const saved = localStorage.getItem("drilldeck_user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    localStorage.removeItem("drilldeck_user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const clearSession = () => {
      setUser(null);
      setReady(true);
    };
    window.addEventListener("drilldeck:logout", clearSession);

    const token = localStorage.getItem("drilldeck_token");
    if (!token) {
      setUser(null);
      setReady(true);
    } else {
      api.get("/auth/me")
        .then(({ data }) => {
          localStorage.setItem("drilldeck_user", JSON.stringify(data.user));
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem("drilldeck_token");
          localStorage.removeItem("drilldeck_user");
          setUser(null);
        })
        .finally(() => setReady(true));
    }

    return () => window.removeEventListener("drilldeck:logout", clearSession);
  }, []);

  function saveSession(data) {
    localStorage.setItem("drilldeck_token", data.token);
    localStorage.setItem("drilldeck_user", JSON.stringify(data.user));
    setUser(data.user);
    setReady(true);
  }

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    saveSession(data);
    return data.user;
  }

  async function register(name, email, password) {
    const { data } = await api.post("/auth/register", { name, email, password });
    saveSession(data);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("drilldeck_token");
    localStorage.removeItem("drilldeck_user");
    setUser(null);
    setReady(true);
  }

  const value = useMemo(
    () => ({ user, ready, login, register, logout }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
