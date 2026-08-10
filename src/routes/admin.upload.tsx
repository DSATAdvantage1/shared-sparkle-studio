import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { extractPdfText } from "@/lib/pdf-extract";
import { createAdminTest } from "@/server-fns/admin.functions";
import { aiExtractQuestionsFromPdf } from "@/server-fns/ai-extract.functions";

export const Route = createFileRoute("/admin/upload")({
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<"RW" | "MATH" | "MIXED">("RW");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Please choose a PDF file");
    if (!title.trim()) return toast.error("Please enter a title");

    setBusy(true);
    try {
      // 1. Extract selectable text from the PDF
      setProgress("Reading PDF…");
      let text = "";
      try {
        text = await extractPdfText(file);
      } catch (textErr) {
        console.error("PDF text extraction failed", textErr);
        throw new Error("Invalid or unreadable PDF file.");
      }
      if (!text.trim()) {
        throw new Error(
          "Scanned PDFs are not supported. Please upload a text-based PDF.",
        );
      }

      // 2. Upload original PDF to storage (best-effort, for reference)
      setProgress("Uploading PDF…");
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id ?? "anon";
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("test-pdfs")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      const sourcePdfPath = upErr ? null : path;

      // 3. AI parses the extracted text into structured questions (with client-side fallback)
      setProgress("Analyzing & parsing questions…");
      const defaultModule = section === "MATH" ? "math" : "rw";
      let questions: any[] = [];
      let usedFallback = false;

      try {
        const aiResult = await aiExtractQuestionsFromPdf({
          data: { text, defaultModule },
        });
        questions = aiResult.questions || [];
      } catch (aiErr) {
        console.warn("AI extraction failed, trying heuristic fallback:", aiErr);
      }

      if (questions.length === 0) {
        const { parseSatQuestions } = await import("@/lib/pdf-extract");
        const qs = parseSatQuestions(text, defaultModule as any);
        questions = qs.map((q: any, idx: number) => ({
          id: q.id ?? Date.now() + idx,
          module: q.module || defaultModule,
          prompt: q.prompt || "",
          choices: [
            q.choices?.[0] ?? "",
            q.choices?.[1] ?? "",
            q.choices?.[2] ?? "",
            q.choices?.[3] ?? "",
          ],
          correct: Math.max(0, Math.min(3, q.correct ?? 0)),
          explanation: q.explanation ?? "",
        }));
        usedFallback = true;
      }

      if (questions.length === 0) {
        throw new Error("Could not parse any questions from the PDF.");
      }

      if (section === "MIXED" && questions.length > 0) {
        const half = Math.max(1, Math.floor(questions.length / 2));
        questions = questions.map((question, index) => ({
          ...question,
          module: index < half ? "rw" : "math",
        }));
      }

      // 4. Save as draft (with localStorage fallback if offline)
      setProgress("Saving test draft…");
      let testId = "";
      let dbSuccess = false;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const inserted = await createAdminTest({
            data: {
              accessToken: session.access_token,
              title: title.trim(),
              section,
              month: month || null,
              year: year ? Number(year) : null,
              sourcePdfPath,
              questions,
              isPublished: false,
            },
          });
          testId = inserted.id;
          dbSuccess = true;
        }
      } catch (dbErr) {
        console.warn("DB save failed, falling back to local storage:", dbErr);
      }

      if (!dbSuccess) {
        // Fallback to localStorage draft
        const localId = `local-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const localTestsStr = localStorage.getItem("dsat_local_tests") ?? "[]";
        try {
          const localTests = JSON.parse(localTestsStr);
          localTests.push({
            id: localId,
            title: title.trim(),
            section,
            month: month || null,
            year: year ? Number(year) : null,
            source_pdf_path: sourcePdfPath,
            is_published: false,
            questions,
            created_at: new Date().toISOString()
          });
          localStorage.setItem("dsat_local_tests", JSON.stringify(localTests));
          testId = localId;
          toast.success("Saved test draft locally in browser (offline mode)");
        } catch (localErr: any) {
          throw new Error(`Failed to save draft locally: ${localErr.message}`);
        }
      } else {
        toast.success(
          `Extracted ${questions.length} question${questions.length === 1 ? "" : "s"}${usedFallback ? " (heuristic fallback)" : ""}. Review and publish.`,
        );
      }

      navigate({ to: "/admin/edit/$id", params: { id: testId } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <div className="max-w-2xl">
      <Toaster />
      <h1 className="text-2xl font-bold">Upload SAT PDF</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We&apos;ll analyze the PDF, turn it into a website test, and add it to
        the main exams page.
      </p>

      <Card className="mt-6 p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Test title</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. RW Test — March 2025"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Section</Label>
              <Select
                value={section}
                onValueChange={(v) => setSection(v as typeof section)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RW">RW</SelectItem>
                  <SelectItem value="MATH">MATH</SelectItem>
                  <SelectItem value="MIXED">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">Month (optional)</Label>
              <Input
                id="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="March"
              />
            </div>
            <div>
              <Label htmlFor="year">Year (optional)</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pdf">PDF file</Label>
            <Input
              id="pdf"
              type="file"
              accept="application/pdf"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Text-based PDFs work best. Scanned PDFs won't extract well —
              you'll need to type questions manually in the editor.
            </p>
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? progress || "Working…" : "Extract & Continue"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
