import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";

export const AnalysisResultSchema = z.object({
  doc_type: z.enum(["invoice", "contract", "form", "id", "other"]),
  confidence: z.number().min(0).max(1),
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
    status: z.enum(["pass", "fail"]),
    message: z.string()
  })),
  errors: z.array(z.string())
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export async function analyzeDocument(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string,
  extractedText?: string
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  console.log(`[Gemini] Using API Key: ${apiKey ? `${apiKey.substring(0, 4)}... (len: ${apiKey.length})` : 'MISSING'}`);
  
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Gemini API key is missing or invalid. Please ensure GEMINI_API_KEY is set in the environment.");
  }
  const ai = new (GoogleGenAI as any)({ apiKey });
  const model = "gemini-3-flash-preview"; 
  
  const systemInstruction = `You are an expert document intelligence system. 
Analyze the provided document and return a STRICT JSON response.
Do not include any text outside the JSON.
Follow this schema:
{
  "doc_type": "invoice|contract|form|id|other",
  "confidence": 0-1,
  "ocr_text": "full text found in document",
  "entities": { "key": "value" },
  "pii": [{ "type": "EMAIL|PHONE|NAME|ID|ADDRESS|DOB|PAN|AADHAAR", "text": "...", "score": 0-1 }],
  "redactions": [{ "text": "...", "replacement": "[REDACTED:TYPE]" }],
  "validation": [{ "rule": "...", "status": "pass|fail", "message": "..." }],
  "errors": []
}

Validation Rules:
- If invoice: total_amount (numeric), invoice_date (date string), invoice_no (not empty).
- If contract: party names present.
- Always check for PII.`;

  const prompt = `Analyze this document: ${fileName}. ${extractedText ? `Extracted text context: ${extractedText}` : ""}`;

  const parts = [
    { text: prompt },
    {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: mimeType
      }
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanedText);
    
    return AnalysisResultSchema.parse(result);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Simple retry logic or fallback
    throw new Error("Failed to analyze document with Gemini");
  }
}
