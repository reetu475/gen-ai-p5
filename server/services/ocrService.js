import { GoogleGenerativeAI } from '@google/generative-ai';

function parseJson(text) {
  const cleaned = text
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini response could not be parsed as JSON.');
    return JSON.parse(match[0]);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function extractExpenseText({ buffer, mimeType }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Add it to .env before uploading receipts.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const imageBase64 = buffer.toString('base64');
  const maxAttempts = 4;
  let attempt = 0;
  let responseText;

  while (attempt < maxAttempts) {
    try {
      const result = await model.generateContent([
        'Extract all readable text from this expense receipt or bill. Return only valid JSON with keys: extractedText, vendor, amount, currency, purchasedAt, category. Use null for unknown fields. Keep extractedText as readable plain text with line breaks. Do not include markdown.',
        { inlineData: { mimeType, data: imageBase64 } }
      ]);

      responseText = result.response.text();
      console.log('[ocrService] Gemini response:', responseText.slice(0, 300));
      break;
    } catch (error) {
      attempt += 1;
      const message = error.message || '';
      const status = error.status;
      console.error('[ocrService] error attempt', attempt, 'status:', status, 'msg:', message.slice(0, 200));

      if (status === 401 || status === 403) {
        throw new Error(`Gemini auth error: ${message}. Check GEMINI_API_KEY in .env.`);
      }

      const isRateLimit = status === 429 || message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate limit');

      if (!isRateLimit || attempt >= maxAttempts) {
        if (isRateLimit) throw new Error(`Gemini error (status ${status}): ${message}`);
        throw error;
      }

      const delay = Math.round(500 * Math.pow(2, attempt - 1) * (0.8 + Math.random() * 0.4));
      await sleep(delay);
    }
  }

  const parsed = parseJson(responseText || '{}');

  return {
    extractedText: String(parsed.extractedText || '').trim(),
    vendor: parsed.vendor || null,
    amount: typeof parsed.amount === 'number' ? parsed.amount : Number(parsed.amount) || null,
    currency: parsed.currency || null,
    purchasedAt: parsed.purchasedAt || null,
    category: parsed.category || null
  };
}
