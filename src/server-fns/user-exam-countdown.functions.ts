import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

const accessTokenSchema = z.object({
  accessToken: z.string().min(1),
});

const setSchema = z.object({
  accessToken: z.string().min(1),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "examDate must be in YYYY-MM-DD format"),
});

function getUtcPlus5DateOnlyDefault() {
  const now = new Date();
  // Convert local time -> UTC then UTC->UTC+5
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const utcPlus5Ms = utcMs + 5 * 60 * 60_000;
  const d = new Date(utcPlus5Ms);

  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function createUserClient(accessToken: string) {
  console.log("[createUserClient] env", {
    hasUrl: Boolean(process.env.SUPABASE_URL),
    hasKey: Boolean(process.env.SUPABASE_PUBLISHABLE_KEY),
  });
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  // If Supabase env vars are missing, return a dummy client that will fail gracefully.
  // This prevents the whole app from crashing; callers should handle missing exam data.
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Supabase not configured (missing SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY).",
    );
  }

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

async function getUserIdFromAccessToken(accessToken: string) {
  const supabase = createUserClient(accessToken);

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims(accessToken);
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) throw new Error("Unauthorized");

  return userId;
}

// NOTE: supabaseAdmin requires SUPABASE_SERVICE_ROLE_KEY.
// If it's missing, we must not crash the entire app on the home route.
function getUserCountdownTable(): ReturnType<
  (typeof supabaseAdmin)["from"]
> | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  // NOTE: supabaseAdmin types may not include the new table until types are regenerated.
  // Cast to `any` to avoid TS blocking while implementing.
  return (supabaseAdmin as any).from("user_exam_countdowns");
}

export const getUserExamCountdown = createServerFn({ method: "GET" })
  .inputValidator((input) => accessTokenSchema.parse(input))
  .handler(async ({ data }: { data: z.infer<typeof accessTokenSchema> }) => {
    console.log("[getUserExamCountdown] start", {
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
    const userId = await getUserIdFromAccessToken(data.accessToken);
    const defaultExamDate = getUtcPlus5DateOnlyDefault();

    const table = getUserCountdownTable();
    if (!table) {
      // Service role isn't configured; fall back to default exam date.
      return { examDate: defaultExamDate };
    }

    const { data: row, error } = await table
      .select("exam_date")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const examDate = row?.exam_date ? String(row.exam_date) : defaultExamDate;

    if (!row?.exam_date) {
      const insert = await table.upsert(
        { user_id: userId, exam_date: examDate },
        { onConflict: "user_id" },
      );
      if (insert?.error) throw new Error(insert.error.message);
    }

    return { examDate };
  });

export const setUserExamCountdown = createServerFn({ method: "POST" })
  .inputValidator((input) => setSchema.parse(input))
  .handler(async ({ data }) => {
    const userId = await getUserIdFromAccessToken(data.accessToken);

    const table = getUserCountdownTable() as any;
    const upsert = await table.upsert(
      { user_id: userId, exam_date: data.examDate },
      { onConflict: "user_id" },
    );

    if (upsert?.error) throw new Error(upsert.error.message);

    return { ok: true, examDate: data.examDate };
  });
