import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "@civicpulse/contract";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "./api";
import { supabase } from "./supabase";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const me = useQuery({
    queryKey: ["me", session?.user.id],
    queryFn: () => api<Profile>("/me"),
    enabled: !!session,
    refetchInterval: false,
  });

  return (
    <AuthContext.Provider
      value={{
        session,
        profile: session ? (me.data ?? null) : null,
        loading: !ready || (!!session && me.isLoading),
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Redirects to sign-in when logged out; optionally restricts to roles. */
export function RequireAuth({ children, roles }: { children: ReactNode; roles?: Profile["role"][] }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="p-6 text-slate-500">Loading...</p>;
  if (!session) return <Navigate to={`/signin?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (roles && (!profile || !roles.includes(profile.role))) {
    return <p className="p-6 text-slate-600">You do not have access to this page.</p>;
  }
  return <>{children}</>;
}
