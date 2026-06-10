import Anthropic from "npm:@anthropic-ai/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { destination, startDate, endDate, travelType, interests, activityLevel } =
    await req.json();

  const nbDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 3;

  const activitiesPerDay =
    activityLevel === "Relax"
      ? "2-3"
      : activityLevel === "Intense"
      ? "6-7"
      : "4-5";

  const client = new Anthropic({
    apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = "";

      const stream = await client.messages.stream({
        model: "claude-haiku-4-5",
        max_tokens: 8192,
        system: `Tu es un expert en planification de voyages. Génère un itinéraire de ${nbDays} jours pour ${destination}.

Règles STRICTES:
- Output UN objet JSON valide par jour, sur UNE seule ligne, sans espaces superflus
- Sépare chaque jour par exactement "\\n---\\n"
- Réponds UNIQUEMENT en français
- ${activitiesPerDay} activités par jour (rythme: ${activityLevel})
- Centres d'intérêt: ${interests.join(", ")}
- Type de voyage: ${travelType}
- Ne génère rien d'autre que les JSON et les séparateurs

Format exact de chaque ligne:
{"day":N,"date":"YYYY-MM-DD","theme":"...","intro":"...","activities":[{"name":"...","time":"HHhMM - HHhMM","description":"...","category":"...","tips":"..."}]}`,
        messages: [
          {
            role: "user",
            content: `Génère l'itinéraire complet pour ${destination}${
              startDate ? ` du ${startDate} au ${endDate}` : ` sur ${nbDays} jours`
            }.`,
          },
        ],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          buffer += chunk.delta.text;

          const parts = buffer.split("\n---\n");
          for (let i = 0; i < parts.length - 1; i++) {
            const dayJson = parts[i].trim();
            if (!dayJson) continue;
            try {
              JSON.parse(dayJson);
              controller.enqueue(encoder.encode(`data: ${dayJson}\n\n`));
            } catch {
              // invalid JSON fragment, skip
            }
          }
          buffer = parts[parts.length - 1];
        }
      }

      // Flush last day if no trailing separator
      const remaining = buffer.trim();
      if (remaining) {
        try {
          JSON.parse(remaining);
          controller.enqueue(encoder.encode(`data: ${remaining}\n\n`));
        } catch {
          // skip invalid
        }
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
