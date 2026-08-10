import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import type { Question } from "@/lib/test-data";
import { Trash2, Plus } from "lucide-react";
import { getAdminTest, updateAdminTest } from "@/server-fns/admin.functions";

export const Route = createFileRoute("/admin/edit/$id")({
  component: EditPage,
});

type Test = {
  id: string;
  title: string;
  section: "RW" | "MATH" | "MIXED";
  month: string | null;
  year: number | null;
  source_pdf_path?: string | null;
  is_published: boolean;
  questions: Question[];
};

type LoadedTest = Omit<Test, "questions"> & { questions: unknown };

function EditPage() {
  const { id } = Route.useParams();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // 1. If it's a local draft, load it directly from localStorage
      if (id.startsWith("local-")) {
        const localTestsStr = localStorage.getItem("dsat_local_tests") ?? "[]";
        try {
          const localTests = JSON.parse(localTestsStr);
          const matched = localTests.find((t: any) => t.id === id);
          if (matched) {
            setTest(matched);
            setLoading(false);
            return;
          }
        } catch {}
        toast.error("Local draft not found");
        setLoading(false);
        return;
      }

      // 2. Otherwise try loading from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        // Safe check localStorage if session is missing but offline test exists
        const localTestsStr = localStorage.getItem("dsat_local_tests") ?? "[]";
        try {
          const localTests = JSON.parse(localTestsStr);
          const matched = localTests.find((t: any) => t.id === id);
          if (matched) {
            setTest(matched);
            setLoading(false);
            return;
          }
        } catch {}

        toast.error("Please sign in again and retry.");
        setLoading(false);
        return;
      }

      let data: LoadedTest;
      try {
        data = (await getAdminTest({
          data: { id, accessToken: session.access_token },
        })) as LoadedTest;
      } catch (error) {
        // Safe check localStorage if database loading fails
        const localTestsStr = localStorage.getItem("dsat_local_tests") ?? "[]";
        try {
          const localTests = JSON.parse(localTestsStr);
          const matched = localTests.find((t: any) => t.id === id);
          if (matched) {
            setTest(matched);
            setLoading(false);
            return;
          }
        } catch {}

        toast.error(
          error instanceof Error ? error.message : "Couldn't load test",
        );
        setLoading(false);
        return;
      }

      setTest({
        ...data,
        questions: (Array.isArray(data.questions)
          ? data.questions
          : []) as Question[],
      } as Test);
      setLoading(false);
    })();
  }, [id]);

  function update(patch: Partial<Test>) {
    setTest((t) => (t ? { ...t, ...patch } : t));
  }

  function updateQ(idx: number, patch: Partial<Question>) {
    setTest((t) => {
      if (!t) return t;
      const qs = [...t.questions];
      qs[idx] = { ...qs[idx], ...patch };
      return { ...t, questions: qs };
    });
  }

  function updateChoice(qIdx: number, cIdx: number, value: string) {
    setTest((t) => {
      if (!t) return t;
      const qs = [...t.questions];
      const choices = [...qs[qIdx].choices];
      choices[cIdx] = value;
      qs[qIdx] = { ...qs[qIdx], choices };
      return { ...t, questions: qs };
    });
  }

  function addQ() {
    setTest((t) =>
      t
        ? {
            ...t,
            questions: [
              ...t.questions,
              {
                id: Date.now(),
                module: t.section === "MATH" ? "math" : "rw",
                prompt: "",
                choices: ["", "", "", ""],
                correct: 0,
                explanation: "",
              },
            ],
          }
        : t,
    );
  }

  function deleteQ(idx: number) {
    setTest((t) =>
      t ? { ...t, questions: t.questions.filter((_, i) => i !== idx) } : t,
    );
  }

  async function save(publish?: boolean) {
    if (!test) return;
    setSaving(true);

    // 1. If it's a local draft, update in localStorage
    if (test.id.startsWith("local-")) {
      const localTestsStr = localStorage.getItem("dsat_local_tests") ?? "[]";
      try {
        const localTests = JSON.parse(localTestsStr);
        const idx = localTests.findIndex((t: any) => t.id === test.id);
        const updatedTest = {
          ...test,
          is_published: publish !== undefined ? publish : test.is_published,
        };
        if (idx >= 0) {
          localTests[idx] = updatedTest;
        } else {
          localTests.push(updatedTest);
        }
        localStorage.setItem("dsat_local_tests", JSON.stringify(localTests));
        setTest(updatedTest);
        toast.success(publish === true ? "Published locally!" : "Saved locally");
      } catch (err: any) {
        toast.error(`Local save failed: ${err.message}`);
      }
      setSaving(false);
      return;
    }

    // 2. Otherwise try saving to Supabase
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setSaving(false);
      return toast.error("Please sign in again and retry.");
    }

    try {
      await updateAdminTest({
        data: {
          id: test.id,
          accessToken: session.access_token,
          title: test.title,
          section: test.section,
          month: test.month,
          year: test.year,
          sourcePdfPath: test.source_pdf_path ?? null,
          questions: test.questions,
          ...(publish !== undefined ? { isPublished: publish } : {}),
        },
      });
      toast.success(publish === true ? "Published!" : "Saved");
      if (publish !== undefined) update({ is_published: publish });
    } catch (error) {
      console.warn("DB save failed, saving copy locally:", error);
      // Fallback save copy locally
      const localTestsStr = localStorage.getItem("dsat_local_tests") ?? "[]";
      try {
        const localTests = JSON.parse(localTestsStr);
        const idx = localTests.findIndex((t: any) => t.id === test.id);
        const updatedTest = {
          ...test,
          is_published: publish !== undefined ? publish : test.is_published,
        };
        if (idx >= 0) {
          localTests[idx] = updatedTest;
        } else {
          localTests.push(updatedTest);
        }
        localStorage.setItem("dsat_local_tests", JSON.stringify(localTests));
        toast.success("Saved copy locally (Supabase offline/error)");
      } catch (localErr) {
        toast.error("Couldn't save test to database or local storage");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!test) return <p className="text-muted-foreground">Test not found.</p>;

  return (
    <div>
      <Toaster />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/admin/tests"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← All tests
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Edit test</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => save()} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
          {test.is_published ? (
            <Button
              variant="outline"
              onClick={() => save(false)}
              disabled={saving}
            >
              Unpublish
            </Button>
          ) : (
            <Button onClick={() => save(true)} disabled={saving}>
              Save & Publish
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6 grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={test.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>
        <div>
          <Label>Section</Label>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={test.section}
            onChange={(e) =>
              update({ section: e.target.value as Test["section"] })
            }
          >
            <option value="RW">RW</option>
            <option value="MATH">MATH</option>
            <option value="MIXED">MIXED</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Month</Label>
            <Input
              value={test.month ?? ""}
              onChange={(e) => update({ month: e.target.value })}
            />
          </div>
          <div>
            <Label>Year</Label>
            <Input
              type="number"
              value={test.year ?? ""}
              onChange={(e) =>
                update({ year: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
        </div>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Questions ({test.questions.length})
        </h2>
        <Button size="sm" variant="outline" onClick={addQ}>
          <Plus className="mr-1 h-4 w-4" />
          Add question
        </Button>
      </div>

      <div className="space-y-4">
        {test.questions.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No questions yet. The PDF parser found nothing — add questions
            manually.
          </Card>
        )}
        {test.questions.map((q, i) => (
          <Card key={i} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                Q{i + 1}
              </span>
              <div className="flex items-center gap-3">
                <select
                  className="h-8 rounded border border-input bg-background px-2 text-xs"
                  value={q.module}
                  onChange={(e) =>
                    updateQ(i, { module: e.target.value as "rw" | "math" })
                  }
                >
                  <option value="rw">RW</option>
                  <option value="math">MATH</option>
                </select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteQ(i)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Label className="text-xs">Passage (optional, for RW)</Label>
            <Textarea
              rows={3}
              value={q.passage ?? ""}
              onChange={(e) => updateQ(i, { passage: e.target.value })}
              className="mb-3"
            />

            <Label className="text-xs">Question prompt</Label>
            <Textarea
              rows={2}
              value={q.prompt}
              onChange={(e) => updateQ(i, { prompt: e.target.value })}
              className="mb-3"
            />

            <Label className="text-xs">Choices (select the correct one)</Label>
            <div className="mt-1 space-y-2">
              {q.choices.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={q.correct === ci}
                    onChange={() => updateQ(i, { correct: ci })}
                  />
                  <span className="w-6 text-sm font-semibold">
                    {String.fromCharCode(65 + ci)}.
                  </span>
                  <Input
                    value={c}
                    onChange={(e) => updateChoice(i, ci, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <Label className="mt-3 block text-xs">Explanation (optional)</Label>
            <Textarea
              rows={2}
              value={q.explanation}
              onChange={(e) => updateQ(i, { explanation: e.target.value })}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
