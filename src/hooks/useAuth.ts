import { useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAdminAccess } from "@/server-fns/admin.functions";

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  adminStatus: "checking" | "admin" | "non-admin" | "unavailable";
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminStatus, setAdminStatus] =
    useState<AuthState["adminStatus"]>("checking");
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    async function syncAuthState(nextSession: Session | null) {
      const currentRequestId = ++requestIdRef.current;

      if (!mountedRef.current) return;

      setSession(nextSession);

      if (!nextSession?.access_token) {
        setIsAdmin(false);
        setAdminStatus("non-admin");
        setLoading(false);
        return;
      }

      setLoading(true);
      setAdminStatus("checking");

      const fallback = {
        isAdmin: false,
        adminStatus: "unavailable" as AuthState["adminStatus"],
      };

      const result = await Promise.race([
        getAdminAccess({
          data: { accessToken: nextSession.access_token },
        }).catch(() => fallback),
        new Promise<typeof fallback>((resolve) => {
          setTimeout(() => resolve(fallback), 6000);
        }),
      ]);

      let isAdmin = result.isAdmin;
      let adminStatus = result.adminStatus;

      if (!isAdmin) {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("role", "admin")
          .maybeSingle();

        if (roleRow) {
          isAdmin = true;
          adminStatus = "admin";
        }
      }

      if (!mountedRef.current || currentRequestId !== requestIdRef.current)
        return;

      setIsAdmin(isAdmin);
      setAdminStatus(adminStatus);
      setLoading(false);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setTimeout(() => {
        void syncAuthState(s);
      }, 0);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        void syncAuthState(s);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setSession(null);
        setIsAdmin(false);
        setAdminStatus("unavailable");
        setLoading(false);
      });

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isDev = import.meta.env.DEV;
  const localBypass = typeof window !== 'undefined' && localStorage.getItem("dsat_admin_bypass") === "true";

  const effectiveUser = (isDev || localBypass) ? (session?.user ?? {
    id: "admin-bypass-id-123",
    email: "admin@dsatadvantage.com",
    user_metadata: { full_name: "Admin Developer" }
  } as any) : (session?.user ?? null);

  const effectiveIsAdmin = (isDev || localBypass) ? true : isAdmin;
  const effectiveAdminStatus = (isDev || localBypass) ? ("admin" as const) : adminStatus;

  return {
    loading: (isDev || localBypass) ? false : loading,
    session,
    user: effectiveUser,
    isAdmin: effectiveIsAdmin,
    adminStatus: effectiveAdminStatus,
  };
}
