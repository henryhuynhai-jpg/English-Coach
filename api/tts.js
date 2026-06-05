// api/tts.js — phát giọng nói tự nhiên bằng OpenAI TTS
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { text, voice } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: voice || "coral",
        input: String(text || "").slice(0, 1000),
        instructions: "Speak slowly and clearly, like a warm, patient English teacher helping a beginner. Friendly and encouraging.",
      }),
    });
    if (!r.ok) { const e = await r.text(); return res.status(500).json({ error: "TTS error", detail: e }); }
    const buf = Buffer.from(await r.arrayBuffer());
    return res.status(200).json({ audio: buf.toString("base64") });
  } catch (e) { return res.status(500).json({ error: "Server error", detail: String(e) }); }
}
