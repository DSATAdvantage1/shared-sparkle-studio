import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/pdf-import-question-bank")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/admin/pdf-import-question-bank"!</div>;
}
