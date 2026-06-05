import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/lojista")({
  head: () => ({ meta: [{ title: "Painel do Lojista — Live Market" }] }),
  component: () => <Outlet />,
});