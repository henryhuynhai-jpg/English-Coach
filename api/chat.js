// api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { system, messages } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    const chatMessages = [
      { role: "system", content: system || "You are a friendly English coach. Reply in JSON." },
      ...(Array.isArray(messages) ? messages.slice(-8) : []),
    ];
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_tokens: 240,
        temperature: 0.6,
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) { const e = await r.text(); return res.status(500).json({ error: "OpenAI error", detail: e }); }
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '{"reply_en":"Sorry, say again?","reply_vi":"","correction":"","correction_vi":""}';
    return res.status(200).json({ reply });
  } catch (err) { return res.status(500).json({ error: "Server error", detail: String(err) }); }
}
