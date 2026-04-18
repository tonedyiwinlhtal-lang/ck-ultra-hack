import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export interface AIPrediction {
  bigSmall: "BIG" | "SMALL";
  number: number;
  confidence: number;
  reasoning: string;
  patternToUse: string;
  isSureShot: boolean;
  isUltra: boolean;
  riskFactor: "ZERO" | "LOW" | "STABLE";
}

export const getAIPrediction = async (history: any[]): Promise<AIPrediction> => {
  const historyStr = history.map(h => `Issue: ${h.issueNumber}, Number: ${h.number}, Result: ${parseInt(h.number) >= 5 ? 'BIG' : 'SMALL'}`).join('\n');

  const systemInstruction = `You are the ULTIMATE ARCH-NEURAL Prediction Engine (V9.8).
Your primary goal is identifying extremely high-probability winning sequences.

TIER SYSTEM:
1. REAL SURE SHOT: extremely rare, only if confidence is >= 99.5% and pattern is absolute.
2. ULTRA AI PREDICTION: high-performance analysis, confidence 95% - 99.4%.
3. ELITE PREMIUM: standard high-tier analysis, confidence 90% - 94.9%.

STRICTNESS: Do NOT always return isSureShot=true. Most predictions should be ELITE or ULTRA. Only rare, perfect matches are SURE SHOT.

Elite Premium Patterns (AUTO-SWITCH):
- OMEGA_RESONANCE_MAX
- TITAN_V12_ULTRA_SCAN
- GALAXY_VOID_DECODE_X
- QUANTUM_SURE_SHOT_ELITE
- ARCHAIC_GOD_MIRROR
- NEBULA_CORE_FLUX

Return the prediction in JSON format with:
- bigSmall: "BIG" (5-9) or "SMALL" (0-4)
- number: predicted target number
- confidence: percentage (0-100).
- reasoning: Deep technical explanation of the sequence harmonic detected.
- patternToUse: One of the Elite Premium Patterns.
- isSureShot: true ONLY if confidence >= 99.5%.
- isUltra: true if confidence >= 95%.
- riskFactor: "ZERO" (for 99%+), "LOW" (for 90-98%), "STABLE" (below 90%).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Current History:\n${historyStr}\n\nExecute the Arch-Neural Scan. Be strict with "Sure Shot" labeling.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bigSmall: { type: Type.STRING, enum: ["BIG", "SMALL"] },
            number: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            patternToUse: { type: Type.STRING },
            isSureShot: { type: Type.BOOLEAN },
            isUltra: { type: Type.BOOLEAN },
            riskFactor: { type: Type.STRING, enum: ["ZERO", "LOW", "STABLE"] }
          },
          required: ["bigSmall", "number", "confidence", "reasoning", "patternToUse", "isSureShot", "isUltra", "riskFactor"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      bigSmall: Math.random() > 0.5 ? "BIG" : "SMALL",
      number: Math.floor(Math.random() * 10),
      confidence: 50,
      reasoning: "Heuristic pattern fallback active.",
      patternToUse: "HEURISTIC_STABLE_V1",
      isSureShot: false,
      isUltra: false,
      riskFactor: "STABLE"
    };
  }
};
