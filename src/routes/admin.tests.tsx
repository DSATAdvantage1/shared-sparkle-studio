import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  deleteAdminTest,
  listAdminTests,
  updateAdminTest,
} from "@/server-fns/admin.functions";

export const Route = createFileRoute("/admin/tests")({
  component: TestsList,
});

type TestRow = {
  id: string;
  title: string;
  section: string;
  month: string | null;
  year: number | null;
  source_pdf_path: string | null;
  is_published: boolean;
  questions: unknown;
  created_at: string;
};

function TestsList() {
  const [rows, setRows] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error("Please sign in again and retry.");
      setLoading(false);
      return;
    }

    try {
      const data = await listAdminTests({
        data: { accessToken: session.access_token },
      });
      setRows((data ?? []) as TestRow[]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't load tests",
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePublish(r: TestRow) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token)
      return toast.error("Please sign in again and retry.");

    try {
      await updateAdminTest({
        data: {
          id: r.id,
          accessToken: session.access_token,
          title: r.title,
          section: r.section as "RW" | "MATH" | "MIXED",
          month: r.month,
          year: r.year,
          sourcePdfPath: r.source_pdf_path,
          questions: (Array.isArray(r.questions) ? r.questions : []) as never[],
          isPublished: !r.is_published,
        },
      });
    } catch (error) {
      return toast.error(
        error instanceof Error ? error.message : "Couldn't update test",
      );
    }

    toast.success(r.is_published ? "Unpublished" : "Published");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this test? This cannot be undone.")) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token)
      return toast.error("Please sign in again and retry.");

    try {
      await deleteAdminTest({
        data: { id, accessToken: session.access_token },
      });
    } catch (error) {
      return toast.error(
        error instanceof Error ? error.message : "Couldn't delete test",
      );
    }

    toast.success("Deleted");
    load();
  }

  return (
    <div>
      <Toaster />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tests</h1>
        <Button asChild>
          <Link to="/admin/upload">+ Upload new PDF</Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted-foreground">
            No tests yet. Upload your first PDF to get started.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => {
            const qCount = Array.isArray(r.questions) ? r.questions.length : 0;
            return (
              <Card
                key={r.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{r.title}</h3>
                    {r.is_published ? (
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        PUBLISHED
                      </span>
                    ) : (
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        DRAFT
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.section} • {qCount} questions
                    {r.month && r.year ? ` • ${r.month} ${r.year}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/admin/edit/$id" params={{ id: r.id }}>
                      Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePublish(r)}
                  >
                    {r.is_published ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(r.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
