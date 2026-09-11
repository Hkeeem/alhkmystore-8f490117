import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text } = (await request.json()) as { text?: string };
        if (!text || typeof text !== "string") return new Response("bad request", { status: 400 });
        if (text.length > 2000) return new Response("text too long", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("missing key", { status: 500 });

        const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice: "onyx",
            response_format: "mp3",
            instructions:
              "تحدث باللغة العربية الفصحى المعاصرة فقط، بصوت ثقيل وعميق وواضح، وبوتيرة معتدلة. لا تستخدم اللهجة العامية أو الكلمات العامية أبداً.",
          }),
        });
        if (!r.ok) return new Response(await r.text(), { status: r.status });
        return new Response(r.body, { headers: { "Content-Type": "audio/mpeg" } });
      },
    },
  },
});
