import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type CreateBankQuestionsBatchInput = {
  accessToken?: string | null;
  questions: Array<Record<string, any>>;
};

// Server-side batch insert that uses the Supabase service role client (bypasses RLS).
export const createBankQuestionsBatch = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: CreateBankQuestionsBatchInput }) => {
    if (!data || !Array.isArray(data.questions)) {
      throw new Error("Invalid input: questions array required");
    }

    // We intentionally use the service role client so admin UI can publish rows
    const { questions } = data;

    // Ensure minimal shape: at least prompt and section
    const sanitized = questions.map((q) => ({
      section: (q.section as string) ?? null,
      domain: (q.domain as string) ?? null,
      skill: (q.skill as string) ?? null,
      difficulty: (q.difficulty as string) ?? null,
      question_type: (q.question_type as string) ?? null,
      prompt: (q.prompt as string) ?? null,
      passage: (q.passage as string) ?? null,
      choices: q.choices ?? null,
      correct_answer: q.correct_answer ?? q.correct ?? null,
      explanation: (q.explanation as string) ?? null,
      is_published: typeof q.is_published === "boolean" ? q.is_published : true,
      created_by: q.created_by ?? null,
    }));

    const { data: inserted, error } = await (supabaseAdmin as any)
      .from("bank_questions")
      .insert(sanitized);

    if (error) {
      console.error("createBankQuestionsBatch insert error:", error);
      throw error;
    }

    return inserted;
  },
);

// Minimal single-create function (used in some admin flows)
export const createBankQuestion = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: Record<string, any> }) => {
    const payload = data;
    const { data: inserted, error } = await (supabaseAdmin as any)
      .from("bank_questions")
      .insert([payload]);

    if (error) {
      console.error("createBankQuestion error:", error);
      throw error;
    }
    return inserted?.[0] ?? null;
  },
);

// Admin list helper — returns recent questions (service role)
export const listBankQuestionsAdmin = createServerFn({ method: "POST" }).handler(
  async () => {
    const { data: rows, error } = await (supabaseAdmin as any)
      .from("bank_questions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("listBankQuestionsAdmin error:", error);
      throw error;
    }
    return rows ?? [];
  },
);

export const deleteBankQuestion = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { id: string } }) => {
    const { id } = data;
    if (!id) throw new Error("Missing id");
    const { error } = await (supabaseAdmin as any).from("bank_questions").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  },
);

export const deleteBankQuestionsBatch = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { ids: string[] } }) => {
    const { ids } = data;
    if (!Array.isArray(ids) || ids.length === 0) throw new Error("Missing ids");
    const { error } = await (supabaseAdmin as any).from("bank_questions").delete().in("id", ids);
    if (error) throw error;
    return { ok: true };
  },
);

export default {} as any;
