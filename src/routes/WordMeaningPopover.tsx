import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/WordMeaningPopover")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/WordMeaningPopover"!</div>;
}
