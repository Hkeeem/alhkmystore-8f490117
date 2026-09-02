import { createFileRoute, redirect } from "@tanstack/react-router";

// قسم السيارات مخفي مؤقتاً — أي زيارة تُحوَّل للصفحة الرئيسية
export const Route = createFileRoute("/cars")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
