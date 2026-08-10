import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { createBankQuestionsBatch, listBankQuestionsAdmin } from "../server-fns/bank-questions.functions";
import { BANK_TAXONOMY } from "@/lib/bank-taxonomy";
import type { BankDomain } from "@/lib/bank-taxonomy";
import { Trash2, Check } from "lucide-react";

export const Route = createFileRoute("/admin/question-bank")({
  head: () => ({
    meta: [{ title: "Question Bank — Admin" }],
  }),
  component: AdminQuestionBank,
});

type Row = {
  id: string;
  section: "RW" | "MATH";
  domain: string;
  skill: string;
  difficulty: string;
  prompt: string;
  correct_answer: string;
  created_at: string;
};

function AdminQuestionBank() {
  const [section, setSection] = useState<"RW" | "MATH">("RW");

  const [pdfMode, setPdfMode] = useState<
    "idle" | "reading" | "importing" | "done" | "error"
  >("idle");
  const [pdfError, setPdfError] = useState<string>("");
  const [pdfProgress, setPdfProgress] = useState<{
    extracted: number;
    total?: number;
    percent?: number;
    etaSec?: number;
    currentChunk?: number;
    chunkCount?: number;
  }>({ extracted: 0 });

  const [pdfQuestions, setPdfQuestions] = useState<
    Array<{
      id?: number;
      section: "RW" | "MATH";
      domain: string;
      skill: string;
      difficulty: string;
      passage: string;
      prompt: string;
      choices: [string, string, string, string];
      correct: "A" | "B" | "C" | "D";
      explanation: string;
      questionType?: string;
      graph?: { type?: string; description?: string; expressions?: string[] };
      warnings?: string[];
    }>
  >([]);
  const [pdfIdx, setPdfIdx] = useState(0);

  const [uploadedFileName, setUploadedFileName] = useState<string>("");

  const [domain, setDomain] = useState(BANK_TAXONOMY.RW[0].name);
  const [skill, setSkill] = useState(BANK_TAXONOMY.RW[0].skills[0].name);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [questionType, setQuestionType] = useState("");
  const [graphMeta, setGraphMeta] = useState("");
  const [passage, setPassage] = useState("");
  const [prompt, setPrompt] = useState("");
  const [choices, setChoices] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [adminRowCount, setAdminRowCount] = useState<number | null>(null);
  const [anonRowCount, setAnonRowCount] = useState<number | null>(null);

  function populateFromPdfQuestion(q: (typeof pdfQuestions)[number]) {
    setSection(q.section);

    // Fuzzy-match domain and skill to taxonomy values
    const taxonomy = BANK_TAXONOMY[q.section] ?? BANK_TAXONOMY.RW;
    const matchedDomain = fuzzyMatchTaxonomy(q.domain, taxonomy);
    const domainSkills = matchedDomain?.skills ?? [];
    const matchedSkill = fuzzyMatchSkill(q.skill, domainSkills);

    const rawDifficulty = typeof q.difficulty === "string" ? q.difficulty.trim().toLowerCase() : "";
    const normalizedDifficulty =
      rawDifficulty === "easy" || rawDifficulty === "medium" || rawDifficulty === "hard"
        ? rawDifficulty
        : "medium";

    setDomain(matchedDomain?.name ?? taxonomy[0]?.name ?? q.domain);
    setSkill(matchedSkill ?? domainSkills[0]?.name ?? q.skill);
    setDifficulty(normalizedDifficulty);
    setQuestionType(typeof q.questionType === "string" ? q.questionType.trim() : "");
    setGraphMeta(q.graph ? JSON.stringify(q.graph, null, 2) : "");
    setPassage(q.passage ?? "");
    setPrompt(q.prompt ?? "");
    setChoices(q.choices);
    setCorrect(q.correct);
    setExplanation(q.explanation ?? "");
  }

  // Auto-fetch DB counts so admin sees whether rows exist (service role vs anon)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const adminRows = await listBankQuestionsAdmin();
        if (!mounted) return;
        setAdminRowCount(Array.isArray(adminRows) ? adminRows.length : null);
      } catch (e) {
        console.warn("listBankQuestionsAdmin failed:", e);
        setAdminRowCount(null);
      }

      try {
        const { data: anonRows, error } = await supabase
          .from("bank_questions")
          .select("id")
          .eq("is_published", true)
          .limit(1);
        if (!mounted) return;
        if (error) {
          setAnonRowCount(null);
        } else {
          // We used limit(1) so we can't get length; instead run count separately
          const { count, error: cErr } = await supabase
            .from("bank_questions")
            .select("id", { count: "exact", head: true }) as any;
          setAnonRowCount(typeof count === "number" ? count : null);
        }
      } catch (e) {
        console.warn("anon count failed:", e);
        setAnonRowCount(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /** Fuzzy-match a raw domain string against known taxonomy domains */
  function fuzzyMatchTaxonomy(
    raw: string,
    domains: BankDomain[],
  ): BankDomain | undefined {
    if (!raw) return domains[0];
    const lower = raw.toLowerCase().trim();
    // Exact match first
    const exact = domains.find((d) => d.name.toLowerCase() === lower);
    if (exact) return exact;
    // Substring/contains match
    const contains = domains.find(
      (d) =>
        d.name.toLowerCase().includes(lower) ||
        lower.includes(d.name.toLowerCase()),
    );
    if (contains) return contains;
    // Word overlap scoring
    const lowerWords = lower.split(/\s+/);
    let bestDomain = domains[0];
    let bestScore = 0;
    for (const d of domains) {
      const dWords = d.name.toLowerCase().split(/\s+/);
      const score = lowerWords.filter((w) => dWords.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        bestDomain = d;
      }
    }
    return bestDomain;
  }

  /** Fuzzy-match a raw skill string against known skills */
  function fuzzyMatchSkill(
    raw: string,
    skills: { name: string }[],
  ): string | undefined {
    if (!raw || skills.length === 0) return skills[0]?.name;
    const lower = raw.toLowerCase().trim();
    const exact = skills.find((s) => s.name.toLowerCase() === lower);
    if (exact) return exact.name;
    const contains = skills.find(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        lower.includes(s.name.toLowerCase()),
    );
    if (contains) return contains.name;
    const lowerWords = lower.split(/\s+/);
    let bestSkill = skills[0]?.name;
    let bestScore = 0;
    for (const s of skills) {
      const sWords = s.name.toLowerCase().split(/\s+/);
      const score = lowerWords.filter((w) => sWords.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        bestSkill = s.name;
      }
    }
    return bestSkill;
  }

  async function handlePdfUpload(file: File) {
    setPdfError("");
    setUploadedFileName(file.name);
    setPdfMode("reading");

    try {
      const { extractPdfText } = await import("@/lib/pdf-extract");
      const text = await extractPdfText(file);

      const extractedLen = text?.length ?? 0;
      console.log(
        "[admin.question-bank][debug] extractedText.length:",
        extractedLen,
      );
      console.log(
        "[admin.question-bank][debug] extractedText.first1000:",
        (text ?? "").slice(0, 1000),
      );

      if (!text?.trim())
        throw new Error(
          "Could not extract text from the PDF (scanned PDFs not supported).",
        );

      setPdfMode("importing");
      const { importQuestionsFromPdfText } =
        await import("@/server-fns/pdf-import.functions");
      const defaultModule = section === "MATH" ? "math" : "rw";

      // AI pipeline: extractPdfText(file) => importQuestionsFromPdfText(...)
      // importQuestionsFromPdfText will call aiExtractQuestionsFromPdf() first and
      // fall back to parseSatQuestions() when AI fails.
      console.log(
        "[admin.question-bank][debug] calling importQuestionsFromPdfText with extractedText length:",
        extractedLen,
      );

      let rawRes: any = undefined;
      try {
        rawRes = await importQuestionsFromPdfText({
          data: {
            text,
            defaultModule,
            mode: "hybrid",
          },
        });
      } catch (err: any) {
        console.error(
          "[admin.question-bank][debug] raw AI/server response/exception:",
          err,
        );
        throw err;
      }

      console.log(
        "[admin.question-bank][debug] raw AI/server response:",
        rawRes,
      );

      const res = rawRes;

      // If zod validation failed server-side, rawRes may be undefined.
      // Treat this as a non-fatal failure and recover via client-side heuristic.
      if (!res) {
        console.warn(
          "[admin.question-bank][debug] importQuestionsFromPdfText returned undefined; falling back to heuristic parser (client-side parseSatQuestions).",
        );

        const { parseSatQuestions } = await import("@/lib/pdf-extract");
        const qs = parseSatQuestions(text, defaultModule as any);
        const mapped: any[] = qs.map((q: any, idx: number) => ({
          id: q.id ?? Date.now() + idx,
          section: q.module === "math" ? "MATH" : "RW",
          domain: "Unknown",
          skill: "Unknown",
          difficulty: "medium",
          passage: "",
          prompt: q.prompt,
          choices: [
            q.choices[0] ?? "",
            q.choices[1] ?? "",
            q.choices[2] ?? "",
            q.choices[3] ?? "",
          ],
          correct: ["A", "B", "C", "D"][
            Math.max(0, Math.min(3, q.correct ?? 0))
          ],
          explanation: q.explanation ?? "",
          warnings: [
            "Server-side importQuestionsFromPdfText returned undefined; used client-side heuristic fallback.",
            "Please review domain/skill/difficulty manually.",
          ],
        }));

        setPdfQuestions(mapped);
        setPdfIdx(0);
        populateFromPdfQuestion(mapped[0]);
        setPdfMode("done");
        toast.success(
          `Extracted ${mapped.length} question${mapped.length === 1 ? "" : "s"} (heuristic fallback).`,
        );
        return;
      }

      // If res exists but has no questions, recover via client-side heuristic too.
      if (!res?.questions?.length) {
        console.warn(
          "[admin.question-bank][debug] importQuestionsFromPdfText returned no questions; using client-side heuristic parser.",
        );

        const { parseSatQuestions } = await import("@/lib/pdf-extract");
        const qs = parseSatQuestions(text, defaultModule as any);
        const mapped: any[] = qs.map((q: any, idx: number) => ({
          id: q.id ?? Date.now() + idx,
          section: q.module === "math" ? "MATH" : "RW",
          domain: "Unknown",
          skill: "Unknown",
          difficulty: "medium",
          passage: "",
          prompt: q.prompt,
          choices: [
            q.choices[0] ?? "",
            q.choices[1] ?? "",
            q.choices[2] ?? "",
            q.choices[3] ?? "",
          ],
          correct: ["A", "B", "C", "D"][
            Math.max(0, Math.min(3, q.correct ?? 0))
          ],
          explanation: q.explanation ?? "",
          warnings: [
            "Server-side importQuestionsFromPdfText returned no questions; used client-side heuristic fallback.",
            "Please review domain/skill/difficulty manually.",
          ],
        }));

        if (!mapped.length)
          throw new Error("No questions detected in the PDF.");

        setPdfQuestions(mapped);
        setPdfIdx(0);
        populateFromPdfQuestion(mapped[0]);
        setPdfMode("done");
        toast.success(
          `Extracted ${mapped.length} question${mapped.length === 1 ? "" : "s"} (heuristic fallback).`,
        );
        return;
      }

      // Debug: show structured parsed questions preview if available
      console.log(
        "[admin.question-bank][debug] parsed structured res section/questionsCount:",
        {
          section: res.section,
          questionsCount: res.questions.length,
          firstQuestionPromptPreview: res.questions?.[0]?.prompt?.slice?.(
            0,
            160,
          ),
          firstQuestionChoicesPreview: res.questions?.[0]?.choices?.slice?.(
            0,
            4,
          ),
        },
      );

      if (!res?.questions?.length) {
        throw new Error("No questions detected in the PDF.");
      }

      const mapped = res.questions.map((q: any) => ({
        id: q.id,
        section: q.section,
        domain: q.domain ?? "Unknown",
        skill: q.skill ?? "Unknown",
        difficulty: q.difficulty ?? "medium",
        passage: q.passage ?? "",
        prompt: q.prompt ?? "",
        choices: q.choices as any,
        correct: q.correct,
        explanation: q.explanation ?? "",
        warnings: q.warnings,
      }));

      setPdfQuestions(mapped);
      setPdfIdx(0);
      populateFromPdfQuestion(mapped[0]);
      setPdfMode("done");
      toast.success(
        `Extracted ${mapped.length} question${mapped.length === 1 ? "" : "s"}.`,
      );
    } catch (e: any) {
      const rawMsg = e instanceof Error ? e.message : "PDF import failed";
      const msg = rawMsg.includes("LOVABLE_API_KEY")
        ? "AI extraction is not configured (LOVABLE_API_KEY missing). Using heuristic fallback — results may be less accurate."
        : rawMsg;
      setPdfMode("error");
      setPdfError(msg);
      toast.error(msg);
    }
  }

  const isValidUuid = (id?: string | null): boolean => {
    if (!id) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  };

  const formatChoicesSafe = (rawChoices: any): { letter: string; text: string }[] => {
    if (!Array.isArray(rawChoices)) return [];
    return rawChoices
      .map((c, i) => {
        let text = "";
        if (typeof c === "string") {
          text = c.trim();
        } else if (c && typeof c === "object") {
          text = (c.text || c.choice || "").trim();
        }
        return {
          letter: String.fromCharCode(65 + i),
          text,
        };
      })
      .filter((item) => item.text.length > 0);
  };

  function normalizePdfQuestionForSave(q: (typeof pdfQuestions)[number]) {
    const section = q.section === "MATH" ? "MATH" : "RW";
    const taxonomy = BANK_TAXONOMY[section];
    const matchedDomain = fuzzyMatchTaxonomy(q.domain, taxonomy);
    const domainSkills = matchedDomain?.skills ?? [];
    const matchedSkill = fuzzyMatchSkill(q.skill, domainSkills);

    const rawDifficulty = typeof q.difficulty === "string" ? q.difficulty.trim().toLowerCase() : "";
    const normalizedDifficulty =
      rawDifficulty === "easy" || rawDifficulty === "medium" || rawDifficulty === "hard"
        ? rawDifficulty
        : "medium";

    return {
      section,
      domain: matchedDomain?.name ?? taxonomy[0]?.name ?? q.domain,
      skill: matchedSkill ?? domainSkills[0]?.name ?? q.skill,
      difficulty: normalizedDifficulty,
      question_type:
        typeof q.questionType === "string" && q.questionType.trim()
          ? q.questionType.trim()
          : null,
    };
  }

  async function handleSaveAll() {
    if (!pdfQuestions.length) return;
    setSavingAll(true);
    setSavedCount(0);
    try {
      let userId: string | null = null;
      try {
        const { data: userData } = await supabase.auth.getUser();
        userId = userData?.user?.id && isValidUuid(userData.user.id) ? userData.user.id : null;
      } catch (err) {
        console.warn("Failed to get user session for creator ID:", err);
      }

      let count = 0;
      const failedPayloads: any[] = [];

      // Build payloads for batch insert
      const payloads = pdfQuestions.map((q) => {
        const normalized = normalizePdfQuestionForSave(q);
        return {
          section: normalized.section,
          domain: normalized.domain,
          skill: normalized.skill,
          difficulty: normalized.difficulty,
          question_type: normalized.question_type,
          prompt: q.prompt?.trim() ?? "",
          passage: q.passage?.trim() || null,
          choices: formatChoicesSafe(q.choices),
          correct_answer: q.correct?.trim() ?? "A",
          explanation: q.explanation?.trim() || null,
          is_published: true,
          created_by: userId,
        };
      });

      // Try to use server-side batch insert (service role / bypass RLS)
      try {
        // Call server-side batch insert (service role). No client access token required.
        await createBankQuestionsBatch({ data: { questions: payloads } } as any);
        count = payloads.length;
        setSavedCount(count);
      } catch (batchErr) {
        console.warn("Batch insert failed, falling back to per-row client insert:", batchErr);
        // Fallback: try individual client inserts
        for (const payload of payloads) {
          const { error } = await supabase.from("bank_questions").insert(payload as any);
          if (error) {
            console.error("Failed to insert question to bank:", error, payload);
            failedPayloads.push(payload);
          } else {
            count++;
          }
          setSavedCount(count + failedPayloads.length);
        }
      }

      if (failedPayloads.length > 0) {
        const localDataStr = localStorage.getItem("dsat_local_bank_questions") ?? "[]";
        try {
          const localRows = JSON.parse(localDataStr);
          failedPayloads.forEach((payload, index) => {
            localRows.unshift({
              id: `local-pdf-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
              ...payload,
              created_at: new Date().toISOString()
            });
          });
          localStorage.setItem("dsat_local_bank_questions", JSON.stringify(localRows));
          toast.success(
            `Saved ${count} to database, and ${failedPayloads.length} locally to browser.`,
          );
        } catch (err: any) {
          toast.error(`Local save failed for some questions: ${err.message}`);
        }
      } else {
        toast.success(
          `Saved all ${count} questions to the bank.`,
        );
      }
    } catch (e: any) {
      console.error("Save all failed:", e);
      toast.error(`Failed to save: ${e.message || e}`);
    } finally {
      setSavingAll(false);
      void loadRows();
    }
  }

  async function handleDbDebug() {
    try {
      // Admin/service-role fetch
      const adminRows = await listBankQuestionsAdmin();
      console.log("[DB DEBUG] admin rows:", adminRows);
      // Anonymous client fetch similar to practice page
      const { data: anonRows, error } = await supabase
        .from("bank_questions")
        .select("*")
        .eq("section", section)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error("[DB DEBUG] anon query error:", error);
        toast.error("Anon query failed — see console");
        return;
      }
      console.log("[DB DEBUG] anon rows:", anonRows);
      toast.success(`Admin rows: ${adminRows?.length ?? 0}; Anon rows: ${anonRows?.length ?? 0}`);
    } catch (err: any) {
      console.error("[DB DEBUG] failed:", err);
      toast.error(`DB debug failed: ${err?.message ?? err}`);
    }
  }

  const domains = BANK_TAXONOMY[section];
  const skills = useMemo(
    () => domains.find((d) => d.name === domain)?.skills ?? [],
    [domains, domain],
  );

  // Removed automatic side effects that overwrite domain/skill selections during populateFromPdfQuestion.
  // Synchronization is now handled directly in the dropdown onChange handlers.

  async function loadRows() {
    // Fetch ALL rows (paginated in batches of 1000 to avoid Supabase limits)
    const all: Row[] = [];
    let from = 0;
    const batchSize = 1000;
    try {
      while (true) {
        const { data, error } = await supabase
          .from("bank_questions")
          .select(
            "id,section,domain,skill,difficulty,prompt,correct_answer,created_at",
          )
          .order("created_at", { ascending: false })
          .range(from, from + batchSize - 1);
        if (error) {
          throw error;
        }
        if (!data || data.length === 0) break;
        all.push(...(data as Row[]));
        if (data.length < batchSize) break;
        from += batchSize;
      }
      
      // Merge with local items for complete local/remote list
      const localDataStr = localStorage.getItem("dsat_local_bank_questions") ?? "[]";
      try {
        const localRows = JSON.parse(localDataStr);
        all.unshift(...localRows);
      } catch {}

      setRows(all);
    } catch (dbErr: any) {
      console.warn("Supabase fetch failed, falling back to localStorage:", dbErr);
      const localDataStr = localStorage.getItem("dsat_local_bank_questions") ?? "[]";
      try {
        const localRows = JSON.parse(localDataStr);
        setRows(localRows);
      } catch {
        setRows([]);
      }
    }
  }

  async function handleDeleteAll() {
    if (
      !confirm(
        `Are you sure you want to delete ALL ${rows.length} questions from the bank? This cannot be undone.`,
      )
    )
      return;

    setDeleting(true);
    let deleted = 0;

    const localIds = rows.filter((r) => r.id.startsWith("local-")).map((r) => r.id);
    const dbIds = rows.filter((r) => !r.id.startsWith("local-")).map((r) => r.id);

    if (localIds.length > 0) {
      localStorage.setItem("dsat_local_bank_questions", "[]");
      deleted += localIds.length;
    }

    const batchSize = 100;
    for (let i = 0; i < dbIds.length; i += batchSize) {
      const batch = dbIds.slice(i, i + batchSize);
      const { error } = await supabase
        .from("bank_questions")
        .delete()
        .in("id", batch);
      if (!error) deleted += batch.length;
    }

    setDeleting(false);
    setSelectedIds(new Set());
    toast.success(`Deleted ${deleted} questions.`);
    void loadRows();
  }

  useEffect(() => {
    void loadRows();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || !correct.trim()) {
      toast.error("Prompt and correct answer are required");
      return;
    }
    setSaving(true);
    
    let userId: string | null = null;
    try {
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id && isValidUuid(userData.user.id) ? userData.user.id : null;
    } catch {}

    const payload = {
      section,
      domain,
      skill,
      difficulty,
      question_type: questionType || null,
      prompt: prompt.trim(),
      passage: passage.trim() || null,
      choices: formatChoicesSafe(choices),
      correct_answer: correct.trim(),
      explanation: explanation.trim() || null,
      is_published: true,
      created_by: userId,
    };
    const graphPayload = graphMeta.trim()
      ? {
          type: "desmos",
          description: graphMeta.trim(),
          expressions: [],
        }
      : null;

    let dbSuccess = false;
    try {
      const { error } = await supabase
        .from("bank_questions")
        .insert(payload as any);
      if (!error) {
        dbSuccess = true;
      } else {
        console.warn("DB insert error, falling back to localStorage:", error);
      }
    } catch (e) {
      console.warn("DB insert exception, falling back to localStorage:", e);
    }

    if (!dbSuccess) {
      const localDataStr = localStorage.getItem("dsat_local_bank_questions") ?? "[]";
      try {
        const localRows = JSON.parse(localDataStr);
        const newRow = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...payload,
          ...(graphPayload ? { graph: graphPayload } : {}),
          created_at: new Date().toISOString()
        };
        localRows.unshift(newRow);
        localStorage.setItem("dsat_local_bank_questions", JSON.stringify(localRows));
        toast.success("Question added (Saved locally to browser)");
      } catch (err: any) {
        toast.error(`Local save failed: ${err.message}`);
      }
    } else {
      toast.success("Question added");
    }

    setSaving(false);
    setPrompt("");
    setPassage("");
    setGraphMeta("");
    setChoices(["", "", "", ""]);
    setExplanation("");
    void loadRows();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;

    if (id.startsWith("local-")) {
      const localDataStr = localStorage.getItem("dsat_local_bank_questions") ?? "[]";
      try {
        let localRows = JSON.parse(localDataStr);
        localRows = localRows.filter((r: any) => r.id !== id);
        localStorage.setItem("dsat_local_bank_questions", JSON.stringify(localRows));
        toast.success("Deleted");
        void loadRows();
      } catch (err) {
        toast.error("Failed to delete local question");
      }
      return;
    }

    const { error } = await supabase
      .from("bank_questions")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    void loadRows();
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) {
      toast.error("No questions selected");
      return;
    }

    if (
      !confirm(
        `Delete ${selectedIds.size} question${selectedIds.size === 1 ? "" : "s"}?`,
      )
    )
      return;

    setDeleting(true);
    let deleted = 0;

    const localIdsToDelete = Array.from(selectedIds).filter((id) => id.startsWith("local-"));
    const dbIdsToDelete = Array.from(selectedIds).filter((id) => !id.startsWith("local-"));

    if (localIdsToDelete.length > 0) {
      const localDataStr = localStorage.getItem("dsat_local_bank_questions") ?? "[]";
      try {
        let localRows = JSON.parse(localDataStr);
        localRows = localRows.filter((r: any) => !localIdsToDelete.includes(r.id));
        localStorage.setItem("dsat_local_bank_questions", JSON.stringify(localRows));
        deleted += localIdsToDelete.length;
      } catch (err) {
        console.error("Local bulk delete failed:", err);
      }
    }

    for (const id of dbIdsToDelete) {
      const { error } = await supabase
        .from("bank_questions")
        .delete()
        .eq("id", id);
      if (!error) deleted++;
    }

    setDeleting(false);
    setSelectedIds(new Set());
    toast.success(
      `Deleted ${deleted} of ${selectedIds.size} question${selectedIds.size === 1 ? "" : "s"}`,
    );
    void loadRows();
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === rows.length && rows.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Question Bank</h1>

        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Upload SAT PDF</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload a PDF with questions and explanations. The form will be
                auto-filled; you can review and edit before saving.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {uploadedFileName ? `File: ${uploadedFileName}` : null}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] items-start">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={pdfMode === "reading" || pdfMode === "importing"}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handlePdfUpload(f);
                }}
              />
              <div className="flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted/40">
                {pdfMode === "reading" || pdfMode === "importing"
                  ? "Processing…"
                  : "Upload PDF"}
              </div>
            </label>

            <div className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground">
                {pdfMode === "reading"
                  ? "Reading PDF text…"
                  : pdfMode === "importing"
                    ? "Extracting questions…"
                    : pdfMode === "done"
                      ? `Extracted ${pdfQuestions.length} question(s)`
                      : pdfMode === "error"
                        ? "Extraction failed"
                        : "Drag & drop area below"}
              </div>
              <div
                className="rounded-lg border-2 border-dashed border-border bg-background/30 p-4 text-xs text-muted-foreground"
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (pdfMode === "reading" || pdfMode === "importing") return;
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handlePdfUpload(f);
                }}
              >
                Drag & drop PDF here (PDF text based works best).
              </div>
            </div>
          </div>

          {pdfMode !== "error" && (
            <div className="mt-4">
              {pdfMode === "reading" ? (
                <div className="text-xs text-muted-foreground">
                  Reading PDF text…
                </div>
              ) : null}

              {pdfMode === "importing" ? (
                <div className="text-xs text-muted-foreground">
                  Extracting questions in chunks (this may take 10–20 minutes
                  for large PDFs)…
                </div>
              ) : null}

              {pdfMode === "done" && pdfQuestions.length ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      Review extracted question {pdfIdx + 1} of{" "}
                      {pdfQuestions.length}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-full px-4"
                        onClick={() => {
                          if (pdfIdx <= 0) return;
                          const next = pdfIdx - 1;
                          setPdfIdx(next);
                          populateFromPdfQuestion(pdfQuestions[next]);
                        }}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 rounded-full px-4"
                        onClick={() => {
                          if (pdfIdx >= pdfQuestions.length - 1) return;
                          const next = pdfIdx + 1;
                          setPdfIdx(next);
                          populateFromPdfQuestion(pdfQuestions[next]);
                        }}
                      >
                        Next
                      </Button>

                      <div className="ml-1 flex items-center gap-2">
                        <Input
                          aria-label="Jump to question"
                          className="h-8 w-20"
                          inputMode="numeric"
                          value={String(pdfIdx + 1)}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (!Number.isFinite(n)) return;
                            const idx = Math.max(
                              0,
                              Math.min(pdfQuestions.length - 1, n - 1),
                            );
                            setPdfIdx(idx);
                            populateFromPdfQuestion(pdfQuestions[idx]);
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          / {pdfQuestions.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={savingAll}
                        className="h-8 rounded-full bg-emerald-600 px-4 text-white hover:bg-emerald-700"
                      >
                      {savingAll
                        ? `Saving… (${savedCount}/${pdfQuestions.length})`
                        : `Save All ${pdfQuestions.length} Questions`}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDbDebug}
                        className="h-8 rounded-full"
                      >
                        DB Debug
                      </Button>
                    </div>
                  </div>

                  {pdfQuestions[pdfIdx]?.warnings?.length ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                      <div className="font-semibold">Warnings</div>
                      <ul className="mt-1 list-disc pl-5">
                        {pdfQuestions[pdfIdx].warnings!.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {pdfMode === "error" && pdfError ? (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {pdfError}
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Question Bank</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add individual questions to the bank by topic and skill. They appear
          on the public{" "}
          <Link to="/questions-bank" className="text-primary underline">
            Question Bank
          </Link>{" "}
          pages.
        </p>
        <div className="mt-3 text-sm">
          <strong>DB status:</strong>{' '}
          Admin rows: {adminRowCount === null ? 'unknown' : adminRowCount}{' '}
          • Anon rows: {anonRowCount === null ? 'unknown' : anonRowCount}
          <span className="ml-3 text-xs text-muted-foreground">(If Admin rows &gt; 0 but Anon rows = 0, published flag or RLS is blocking public view.)</span>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Section">
            <select
              value={section}
              onChange={(e) => {
                const nextSection = e.target.value as "RW" | "MATH";
                setSection(nextSection);
                const nextDomains = BANK_TAXONOMY[nextSection];
                const firstDomain = nextDomains[0];
                setDomain(firstDomain.name);
                setSkill(firstDomain.skills[0].name);
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="RW">Reading & Writing</option>
              <option value="MATH">Math</option>
            </select>
          </Field>
          <Field label="Domain">
            <select
              value={domain}
              onChange={(e) => {
                const nextDomain = e.target.value;
                setDomain(nextDomain);
                const nextSkills = domains.find((d) => d.name === nextDomain)?.skills ?? [];
                setSkill(nextSkills[0]?.name ?? "");
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {domains.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Skill">
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {skills.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty">
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "easy" | "medium" | "hard")
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Field>
        </div>

        {section === "RW" && (
          <Field label="Passage (optional)">
            <Textarea
              value={passage}
              onChange={(e) => setPassage(e.target.value)}
              rows={4}
              placeholder="Reading passage…"
            />
          </Field>
        )}

        <Field label="Question prompt">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            required
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          {choices.map((c, i) => (
            <Field key={i} label={`Choice ${String.fromCharCode(65 + i)}`}>
              <Input
                value={c}
                onChange={(e) => {
                  const next = [...choices];
                  next[i] = e.target.value;
                  setChoices(next);
                }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
              />
            </Field>
          ))}
        </div>

        <Field label="Correct answer (letter A–D, or numeric for grid-in)">
          <Input
            value={correct}
            onChange={(e) => setCorrect(e.target.value)}
            className="max-w-xs"
            required
          />
        </Field>

        <Field label="Explanation (optional)">
          <Textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
          />
        </Field>

        <Field label="Graph metadata (optional)">
          <Textarea
            value={graphMeta}
            onChange={(e) => setGraphMeta(e.target.value)}
            rows={3}
            placeholder="Optional graph notes, e.g. Desmos expression list or a figure description."
          />
        </Field>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Add question"}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {rows.length > 0 && (
              <input
                type="checkbox"
                checked={selectedIds.size === rows.length && rows.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 cursor-pointer rounded border border-border"
                aria-label="Select all"
              />
            )}
            <span className="text-sm font-semibold">
              All questions ({rows.length})
            </span>
            {selectedIds.size > 0 && (
              <span className="text-xs text-muted-foreground">
                ({selectedIds.size} selected)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {rows.length > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteAll}
                disabled={deleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? `Deleting…` : `Delete All (${rows.length})`}
              </Button>
            )}
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={deleting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleting
                  ? `Deleting…`
                  : `Delete Selected (${selectedIds.size})`}
              </Button>
            )}
          </div>
        </div>
        <ul className="divide-y divide-border">
          {rows.length === 0 && (
            <li className="px-5 py-6 text-sm text-muted-foreground">
              No questions yet.
            </li>
          )}
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-4 px-5 py-3 text-sm"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={selectedIds.has(r.id)}
                  onChange={() => toggleSelection(r.id)}
                  className="h-4 w-4 mt-1 cursor-pointer rounded border border-border flex-shrink-0"
                  aria-label={`Select question`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">
                      {r.section}
                    </span>
                    <span>{r.domain}</span>
                    <span>•</span>
                    <span>{r.skill}</span>
                    <span>•</span>
                    <span className="capitalize">{r.difficulty}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-foreground">
                    {r.prompt}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Correct:{" "}
                    <span className="font-mono">{r.correct_answer}</span>
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(r.id)}
                aria-label="Delete"
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
