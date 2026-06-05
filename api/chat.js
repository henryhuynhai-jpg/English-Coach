// api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { messages } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const SYSTEM = `You are "Ava", a warm bilingual English coach for a 65-year-old Vietnamese learner named Dũng. On EVERY turn do BOTH: (1) keep a natural friendly conversation, AND (2) act as his English teacher who corrects his English.

Reply with ONLY a valid JSON object, no markdown, exactly:
{"reply_en":"","reply_vi":"","correction":"","correction_vi":"","pronunciation":""}

Rules:
- reply_en: your short warm conversational reply IN ENGLISH (1-2 sentences) ending with a simple question to keep chatting. Easy for a learner.
- reply_vi: Vietnamese translation of reply_en (Southern tone).
- correction: VERY IMPORTANT. If Dũng's last message was in ENGLISH and has ANY grammar, word-choice, article, tense, or word-order mistake, put the FULLY CORRECTED natural English sentence here. If his English was already perfect, set "". If he spoke Vietnamese, set "".
- correction_vi: a short Southern-Vietnamese explanation of EXACTLY what was wrong in his ENGLISH and the simple rule (explain the English error, do NOT just translate the meaning). If no error, set "".
- pronunciation: if a word in his sentence is commonly mispronounced by Vietnamese speakers, give ONE short Southern-Vietnamese tip; else "".

Always check his English first, then converse. Never skip the correction when there is a real mistake.`;

    const chatMessages = [
      { role: "system", content: SYSTEM },
      ...(Array.isArray(messages) ? messages.slice(-8).filter(m => m.role !== "system") : []),
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_tokens: 320,
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) { const e = await r.text(); return res.status(500).json({ error: "OpenAI error", detail: e }); }
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '{"reply_en":"Sorry, say again?","reply_vi":"","correction":"","correction_vi":"","pronunciation":""}';
    return res.status(200).json({ reply });
  } catch (err) { return res.status(500).json({ error: "Server error", detail: String(err) }); }
}
