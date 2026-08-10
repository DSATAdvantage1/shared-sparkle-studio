import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/TextSelectionPopupPassage")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/TextSelectionPopupPassage"!</div>;
}
