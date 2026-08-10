import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/questions-bank/practice/fixed")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/questions-bank/practice/fixed"!</div>;
}
