import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/dsat-advantage-logo.png";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — DSAT Advantage" },
      { name: "description", content: "Admin dashboard for DSAT Advantage." },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { loading, user, isAdmin, adminStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  if (adminStatus === "unavailable") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Admin check timed out</h1>
          <p className="mt-2 text-muted-foreground">
            We couldn't verify your admin access right now. Please refresh once
            and try again.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
            <Button onClick={() => supabase.auth.signOut()}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-muted-foreground">
            Your account ({user.email}) does not have admin access.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            To grant admin: open the backend, go to the <code>user_roles</code>{" "}
            table, and insert a row with your user id and role{" "}
            <code>admin</code>.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/">Back home</Link>
            </Button>
            <Button onClick={() => supabase.auth.signOut()}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-9 w-9 rounded-lg" />
            <span className="font-bold">
              DSAT <span className="text-primary">Advantage</span>
              <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                ADMIN
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/admin/tests"
              className="text-sm font-medium text-foreground/80 hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              Tests
            </Link>
            <Link
              to="/admin/question-bank"
              className="text-sm font-medium text-foreground/80 hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              Question Bank
            </Link>
            <Link
              to="/admin/upload"
              className="text-sm font-medium text-foreground/80 hover:text-foreground"
              activeProps={{ className: "text-primary" }}
            >
              Upload PDF
            </Link>

            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
            >
              Sign out
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {location.pathname === "/admin" ? <AdminHome /> : null}
        <Outlet />
      </main>
    </div>
  );
}

function AdminHome() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h1 className="text-2xl font-bold">Upload SAT PDF</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a new test, extract questions, then review everything before
          publishing.
        </p>
        <Button asChild className="mt-5">
          <Link to="/admin/upload">Go to upload</Link>
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h2 className="text-2xl font-bold">Manage tests</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Edit extracted questions, publish drafts, or remove old tests.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/admin/tests">Open test library</Link>
        </Button>
      </div>
      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h2 className="text-2xl font-bold">Question Bank</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add individual practice questions organized by section, domain, and
          skill.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/admin/question-bank">Manage question bank</Link>
        </Button>
      </div>
    </div>
  );
}
