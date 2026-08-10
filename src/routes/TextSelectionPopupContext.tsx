import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/TextSelectionPopupContext")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/TextSelectionPopupContext"!</div>;
}
