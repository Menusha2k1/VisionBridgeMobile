const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export async function callGemini(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("key missing");
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
    API_KEY;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  const text =
    json?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join(" ") ??
    "";

  if (!text) throw new Error("No response text");

  return text.trim();
}
