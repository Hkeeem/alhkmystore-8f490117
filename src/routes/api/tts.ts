import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) return new Response("Unauthorized", { status: 401 });

        const { text } = (await request.json()) as { text?: string };
        if (!text) return new Response("bad request", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("missing key", { status: 500 });

        const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: "alloy",
            response_format: "mp3",
            instructions: "تحدث بلهجة سعودية ودودة ومتحمسة، بسرعة طبيعية.",
          }),
        });
        if (!r.ok) return new Response(await r.text(), { status: r.status });
        return new Response(r.body, { headers: { "Content-Type": "audio/mpeg" } });
      },
    },
  },
});
