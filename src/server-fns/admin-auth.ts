import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AdminLookupResult =
  | { ok: true; userId: string; supabase: ReturnType<typeof createUserSupabase> }
  | { ok: false; reason: "unauthorized" | "forbidden" };

function getSupabaseEnv() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set.",
    );
  }

  return { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
}

export function createUserSupabase(accessToken: string) {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = getSupabaseEnv();

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function bootstrapAdminRole(userId: string, email?: string | null) {
  const bootstrapEmails = (
    process.env.ADMIN_BOOTSTRAP_EMAILS ?? "codeprodigy313@gmail.com"
  )
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!email || !bootstrapEmails.includes(email.toLowerCase())) {
    return false;
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: "admin" },
      { onConflict: "user_id,role" },
    );

    return !error;
  } catch {
    return false;
  }
}

export async function getAdminUser(accessToken: string): Promise<AdminLookupResult> {
  const supabase = createUserSupabase(accessToken);
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims(accessToken);
  const userId = claimsData?.claims?.sub;
  const email =
    typeof claimsData?.claims?.email === "string" ? claimsData.claims.email : null;

  if (claimsError || !userId) {
    return { ok: false, reason: "unauthorized" };
  }

  let { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    return { ok: false, reason: "unauthorized" };
  }

  if (!roleRow) {
    const bootstrapped = await bootstrapAdminRole(userId, email);
    if (!bootstrapped) {
      return { ok: false, reason: "forbidden" };
    }

    ({ data: roleRow, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle());

    if (roleError || !roleRow) {
      return { ok: false, reason: "forbidden" };
    }
  }

  return { ok: true, userId, supabase };
}

export function adminErrorMessage(reason: "unauthorized" | "forbidden") {
  return reason === "forbidden"
    ? "Your account does not have admin access."
    : "Your session expired. Please sign in again.";
}
