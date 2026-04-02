import { createContext, useContext, useEffect, useState } from "react";
import { setAuthToken } from "../services/api";

const STORAGE_KEY = "exitprep_auth";

const AuthContext = createContext(null);

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { token: "", user: null };
    }

    const parsed = JSON.parse(raw);

    return {
      token: parsed.token || "",
      user: parsed.user || null
    };
  } catch (_error) {
    return { token: "", user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  useEffect(() => {
    setAuthToken(auth.token);

    if (auth.token && auth.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
      return;
    }

    localStorage.removeItem(STORAGE_KEY);
  }, [auth]);

  const signIn = (nextAuth) => {
    setAuth({
      token: nextAuth.token,
      user: nextAuth.user
    });
  };

  const signOut = () => {
    setAuth({ token: "", user: null });
  };

  return (
    <AuthContext.Provider
      value={{
        auth,
        user: auth.user,
        token: auth.token,
        isAuthenticated: Boolean(auth.token && auth.user),
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
