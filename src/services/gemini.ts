import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

export const AnalysisSchema = z.object({
  doc_type: z.string(),
  confidence: z.number(),
  ocr_text: z.string(),
  entities: z.record(z.string(), z.any()),
  pii: z.array(z.object({
    type: z.string(),
    text: z.string(),
    score: z.number()
  })),
  redactions: z.array(z.object({
    text: z.string(),
    replacement: z.string()
  })),
  validation: z.array(z.object({
    rule: z.string(),
    status: z.enum(['pass', 'fail']),
    message: z.string()
  })),
  errors: z.array(z.string())
});

export type GeminiAnalysis = z.infer<typeof AnalysisSchema>;

export async function analyzeWithGemini(
  content: { text?: string; inlineData?: { data: string; mimeType: string } },
  retryCount = 0
): Promise<GeminiAnalysis> {
  // Use process.env.GEMINI_API_KEY as per platform guidelines
  const apiKey = (process.env as any).GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY' || apiKey.trim() === '') {
    throw new Error("Gemini API key is missing or not configured. Please ensure GEMINI_API_KEY is set in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const prompt = `Analyze this document and return a STRICT JSON response matching this schema:
{
  "doc_type": "string (e.g. invoice, contract, id, etc)",
  "confidence": number (0-1),
  "ocr_text": "full text content",
  "entities": { "key": "value" },
  "pii": [{ "type": "string", "text": "string", "score": number }],
  "redactions": [{ "text": "string to redact", "replacement": "[REDACTED]" }],
  "validation": [{ "rule": "string", "status": "pass|fail", "message": "string" }],
  "errors": ["string"]
}

Ensure all PII like names, emails, phones, and addresses are identified in the pii and redactions arrays.
Return ONLY the JSON object.`;

  try {
    const parts: any[] = [{ text: prompt }];
    if (content.text) parts.push({ text: content.text });
    if (content.inlineData) parts.push({ inlineData: content.inlineData });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    const json = JSON.parse(text);
    return AnalysisSchema.parse(json);
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (retryCount < 1) {
      console.log("Gemini failed, retrying once...");
      return analyzeWithGemini(content, retryCount + 1);
    }
    throw error;
  }
}
