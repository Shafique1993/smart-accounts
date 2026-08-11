import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getSession() {
      const {
        data,
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Get Session Error:",
          error
        );
      }

      if (mounted) {
        setSession(data?.session || null);
        setLoading(false);
      }
    }

    getSession();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function logout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Logout Error:",
        error
      );

      throw error;
    }

    setSession(null);
  }

  const value = {
    session,
    user: session?.user || null,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}