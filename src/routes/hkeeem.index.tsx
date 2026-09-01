import { createFileRoute } from "@tanstack/react-router";
import HomeScreen from "../components/hkeeem/HomeScreen";

export const Route = createFileRoute("/hkeeem/")({
  component: HomeScreen,
});
