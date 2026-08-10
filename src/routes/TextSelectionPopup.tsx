import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/TextSelectionPopup")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/TextSelectionPopup"!</div>;
}
