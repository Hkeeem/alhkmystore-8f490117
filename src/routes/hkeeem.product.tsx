import { createFileRoute } from "@tanstack/react-router";
import ProductDetail from "../components/hkeeem/ProductDetail";

export const Route = createFileRoute("/hkeeem/product")({
  component: ProductDetail,
});
