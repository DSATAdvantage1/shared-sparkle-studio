import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { adminErrorMessage, getAdminUser, createUserSupabase } from "@/server-fns/admin-auth";
import { z } from "zod";

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

function createAnonSupabase() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = getSupabaseEnv();

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

const adminAccessSchema = z.object({
  accessToken: z.string().min(1),
});

const questionSchema = z.object({
  id: z.coerce.number().optional().default(0),
  module: z.enum(["rw", "math"]),
  passage: z.string().optional(),
  prompt: z.string().default(""),
  choices: z.array(z.string().default("")),
  correct: z.coerce.number().default(0),
  explanation: z.string().default(""),
});

const createTestSchema = z.object({
  accessToken: z.string().min(1),
  title: z.string().min(1),
  section: z.enum(["RW", "MATH", "MIXED"]),
  month: z.string().nullable(),
  year: z.number().int().nullable(),
  sourcePdfPath: z.string().nullable(),
  questions: z.array(questionSchema),
  isPublished: z.boolean().optional().default(true),
});

const updateTestSchema = createTestSchema.extend({
  id: z.string().uuid(),
  isPublished: z.boolean().optional(),
});

const adminTestIdSchema = z.object({
  accessToken: z.string().min(1),
  id: z.string().uuid(),
});

const publicTestIdSchema = z.object({
  id: z.string().uuid(),
});

function cleanText(value?: string | null) {
  return (value ?? "").replace(/\u0000/g, "").trim();
}

export const getAdminAccess = createServerFn({ method: "POST" })
  .inputValidator((input) => adminAccessSchema.parse(input))
  .handler(async (ctx) => {
    const accessToken = ctx.data.accessToken;

    if (!accessToken) {
      return { isAdmin: false, adminStatus: "non-admin" as const };
    }

    const user = await getAdminUser(accessToken);
    const adminStatus = user.ok ? "admin" : "non-admin";

    return {
      isAdmin: user.ok,
      adminStatus,
    };
  });

export const createAdminTest = createServerFn({ method: "POST" })
  .inputValidator((input) => createTestSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await getAdminUser(data.accessToken);

    if (!user.ok) {
      throw new Error(adminErrorMessage(user.reason));
    }

    const normalizedQuestions = data.questions.map((question, index) => {
      const cleanedChoices = question.choices
        .map((choice) => cleanText(choice))
        .filter(Boolean)
        .slice(0, 4);

      return {
        id: Number.isFinite(question.id) ? question.id : Date.now() + index,
        module: question.module,
        passage: cleanText(question.passage) || undefined,
        prompt: cleanText(question.prompt),
        choices: cleanedChoices,
        correct: Math.max(
          0,
          Math.min(question.correct, Math.max(cleanedChoices.length - 1, 0)),
        ),
        explanation: cleanText(question.explanation),
      };
    });

    const { data: inserted, error } = await user.supabase
      .from("tests")
      .insert({
        title: cleanText(data.title),
        section: data.section,
        month: cleanText(data.month) || null,
        year: data.year,
        source_pdf_path: data.sourcePdfPath,
        questions: normalizedQuestions,
        is_published: data.isPublished,
        created_by: user.userId,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return inserted;
  });

export const updateAdminTest = createServerFn({ method: "POST" })
  .inputValidator((input) => updateTestSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await getAdminUser(data.accessToken);

    if (!user.ok) {
      throw new Error(adminErrorMessage(user.reason));
    }

    const normalizedQuestions = data.questions.map((question, index) => {
      const cleanedChoices = question.choices
        .map((choice) => cleanText(choice))
        .filter(Boolean)
        .slice(0, 4);

      return {
        id: Number.isFinite(question.id) ? question.id : Date.now() + index,
        module: question.module,
        passage: cleanText(question.passage) || undefined,
        prompt: cleanText(question.prompt),
        choices: cleanedChoices,
        correct: Math.max(
          0,
          Math.min(question.correct, Math.max(cleanedChoices.length - 1, 0)),
        ),
        explanation: cleanText(question.explanation),
      };
    });

    const updatePayload: {
      title: string;
      section: "RW" | "MATH" | "MIXED";
      month: string | null;
      year: number | null;
      source_pdf_path: string | null;
      questions: typeof normalizedQuestions;
      is_published?: boolean;
    } = {
      title: cleanText(data.title),
      section: data.section,
      month: cleanText(data.month) || null,
      year: data.year,
      source_pdf_path: data.sourcePdfPath,
      questions: normalizedQuestions,
    };

    if (typeof data.isPublished === "boolean") {
      updatePayload.is_published = data.isPublished;
    }

    const supabase = createUserSupabase(data.accessToken);
    const { error } = await supabase
      .from("tests")
      .update(updatePayload)
      .eq("id", data.id);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  });

export const getAdminTest = createServerFn({ method: "POST" })
  .inputValidator((input) => adminTestIdSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await getAdminUser(data.accessToken);

    if (!user.ok) {
      throw new Error(
        user.reason === "forbidden"
          ? "Your account does not have admin access."
          : "Your session expired. Please sign in again.",
      );
    }

    const supabase = createUserSupabase(data.accessToken);
    const { data: test, error } = await supabase
      .from("tests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!test) {
      throw new Error("Test not found.");
    }

    return test;
  });

export const listAdminTests = createServerFn({ method: "POST" })
  .inputValidator((input) => adminAccessSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await getAdminUser(data.accessToken);

    if (!user.ok) {
      throw new Error(
        user.reason === "forbidden"
          ? "Your account does not have admin access."
          : "Your session expired. Please sign in again.",
      );
    }

    const supabase = createUserSupabase(data.accessToken);
    const { data: tests, error } = await supabase
      .from("tests")
      .select(
        "id,title,section,month,year,source_pdf_path,is_published,questions,created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return tests ?? [];
  });

export const deleteAdminTest = createServerFn({ method: "POST" })
  .inputValidator((input) => adminTestIdSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await getAdminUser(data.accessToken);

    if (!user.ok) {
      throw new Error(
        user.reason === "forbidden"
          ? "Your account does not have admin access."
          : "Your session expired. Please sign in again.",
      );
    }

    const supabase = createUserSupabase(data.accessToken);
    const { error } = await supabase.from("tests").delete().eq("id", data.id);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  });

export const listPublishedTests = createServerFn({ method: "GET" }).handler(
  async () => {
    const supabase = createAnonSupabase();
    const { data: tests, error } = await supabase
      .from("tests")
      .select("id,title,section,month,year,questions")
      .eq("is_published", true);

    if (error) {
      throw new Error(error.message);
    }

    return tests ?? [];
  },
);

export const getPublishedTestQuestions = createServerFn({ method: "GET" })
  .inputValidator((input) => publicTestIdSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createAnonSupabase();
    const { data: test, error } = await supabase
      .from("tests")
      .select("questions")
      .eq("id", data.id)
      .eq("is_published", true)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!test) {
      throw new Error("Couldn't load this test");
    }

    return {
      questions: Array.isArray(test.questions) ? test.questions : [],
    };
  });
