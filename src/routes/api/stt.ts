import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("missing key", { status: 500 });

        const inForm = await request.formData();
        const file = inForm.get("file");
        if (!(file instanceof Blob)) return new Response("no file", { status: 400 });
        if (file.size > 5 * 1024 * 1024) return new Response("audio too large", { status: 400 });

        const type = file.type || "audio/webm";
        const ext = type.includes("mp4") ? "mp4" : type.includes("wav") ? "wav" : type.includes("mpeg") ? "mp3" : "webm";

        const fd = new FormData();
        fd.append("model", "openai/gpt-4o-transcribe");
        fd.append("file", file, `recording.${ext}`);

        const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: fd,
        });
        const body = await r.text();
        return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
