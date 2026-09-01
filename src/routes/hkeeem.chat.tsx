import { createFileRoute } from "@tanstack/react-router";
import AiChat from "../components/hkeeem/AiChat";

export const Route = createFileRoute("/hkeeem/chat")({
  component: AiChat,
});
