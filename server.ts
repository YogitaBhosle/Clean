import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

type Category =
  | "Roads"
  | "Waste"
  | "Water"
  | "Electricity"
  | "Drainage"
  | "Trees"
  | "Public Safety"
  | "Other";

type Severity = "Critical" | "High" | "Medium" | "Low";

const VALID_CATEGORIES: Category[] = [
  "Roads",
  "Waste",
  "Water",
  "Electricity",
  "Drainage",
  "Trees",
  "Public Safety",
  "Other",
];

const VALID_SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

const DEPARTMENT_MAP: Record<Category, string> = {
  Roads: "Roads & Engineering",
  Waste: "Sanitation Department",
  Water: "Water Supply Department",
  Electricity: "Electrical Department",
  Drainage: "Stormwater & Drainage Department",
  Trees: "Parks & Horticulture Department",
  "Public Safety": "Municipal Emergency Response",
  Other: "General Municipal Services",
};

function normalizeCategory(input: unknown): Category {
  if (typeof input === "string") {
    const match = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === input.trim().toLowerCase()
    );
    if (match) return match;
  }
  return "Other";
}

function normalizeSeverity(input: unknown): Severity {
  if (typeof input === "string") {
    const match = VALID_SEVERITIES.find(
      (s) => s.toLowerCase() === input.trim().toLowerCase()
    );
    if (match) return match;
  }
  return "Medium";
}

function clampScore(value: unknown, severity: Severity): number {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isFinite(num)) {
    return Math.max(0, Math.min(100, Math.round(num)));
  }
  if (severity === "Critical") return 93;
  if (severity === "High") return 78;
  if (severity === "Medium") return 55;
  return 28;
}

function serverKeywordFallback(
  description: string,
  location: string,
  fallbackReason: string
) {
  const text = `${description} ${location}`.toLowerCase();

  let detectedLanguage = "English";
  if (/[\u0C80-\u0CFF]/.test(description)) detectedLanguage = "Kannada";
  else if (/[\u0900-\u097F]/.test(description)) detectedLanguage = "Hindi";
  else if (/[\u0B80-\u0BFF]/.test(description)) detectedLanguage = "Tamil";
  else if (/[\u0C00-\u0C7F]/.test(description)) detectedLanguage = "Telugu";

  let category: Category = "Other";
  if (
    /(pothole|road|asphalt|pavement|footpath|crater|sinkhole|speed breaker|manhole cover|ಗುಂಡಿ|ರಸ್ತೆ|गड्ढा|सड़क|रोड)/i.test(
      text
    )
  ) {
    category = "Roads";
  } else if (
    /(garbage|trash|waste|dump|bin|litter|rubbish|stink|smell|compost|ಕಸ|ತ್ಯಾಜ್ಯ|कचरा|गंदगी|कूड़ा)/i.test(
      text
    )
  ) {
    category = "Waste";
  } else if (
    /(water|pipe|leak|burst|drinking|pipeline|tap|tanker|supply|ನೀರು|ಪೈಪ್|पानी|पाइप|जल)/i.test(
      text
    )
  ) {
    category = "Water";
  } else if (
    /(electric|wire|cable|transformer|spark|shock|streetlight|street light|pole|power|short circuit|ವಿದ್ಯುತ್|ದೀಪ|ತಂತಿ|बिजली|तार|खंभा|लाइट)/i.test(
      text
    )
  ) {
    category = "Electricity";
  } else if (
    /(drain|sewer|sewage|flood|waterlog|clog|overflow|stormwater|gutter|nala|ಚರಂಡಿ|ಮಳೆನೀರು|नाला|नाली|जलभराव|सीवर)/i.test(
      text
    )
  ) {
    category = "Drainage";
  } else if (
    /(tree|branch|fallen|uprooted|stump|foliage|park|ಮರ|ಕೊಂಬೆ|पेड़|डाल|शाखा)/i.test(
      text
    )
  ) {
    category = "Trees";
  } else if (
    /(fire|collapse|accident|danger|emergency|unsafe|gas|stray|harassment|ಅಪಾಯ|ಬೆಂಕಿ|खतरा|आग|दुर्घटना)/i.test(
      text
    )
  ) {
    category = "Public Safety";
  }

  let severity: Severity = "Medium";
  let priorityScore = 58;
  let severityReason =
    "Moderate municipal service issue requiring scheduled field crew inspection.";

  if (
    /(exposed wire|live wire|sparking|electrocution|collapse|major flood|submerged|blocking main road|fallen on car|life|immediate danger|gas leak|open manhole|transformer fire|ಪ್ರಾಣಾಪಾಯ|ವಿದ್ಯುತ್ ತಂತಿ|करंट|आग|खतरनाक)/i.test(
      text
    )
  ) {
    severity = "Critical";
    priorityScore = 94;
    severityReason =
      "Immediate threat to human life or critical public safety infrastructure.";
  } else if (
    /(deep pothole|dangerous|overflowing|major leak|burst pipe|broken streetlight|dark intersection|fallen tree|waterlogging|sewage|blocked|school|hospital|ಮಳೆನೀರು|ತುಂಬಿ|ಆಳವಾದ ಗುಂಡಿ|गहरा गड्ढा|बाढ़|टूटा|बह रहा)/i.test(
      text
    )
  ) {
    severity = "High";
    priorityScore = 81;
    severityReason =
      "Significant hazard affecting public mobility, sanitation, or neighborhood safety.";
  } else if (
    /(minor|small|paint|trim|request|bench|signboard|dusty|ಸಣ್ಣ|छोटा|मरम्मत)/i.test(
      text
    )
  ) {
    severity = "Low";
    priorityScore = 32;
    severityReason =
      "Minor maintenance request without immediate risk to commuters or residents.";
  }

  const department = DEPARTMENT_MAP[category];

  const actionMap: Record<Category, string> = {
    Roads:
      "Deploy Roads & Engineering crew with temporary barricades and patching material within 24 hours.",
    Waste:
      "Dispatch compactor collection vehicle and sanitation crew for immediate clearance and sanitization.",
    Water:
      "Isolate affected supply valve and send Water Supply repair team to seal the pipeline leak.",
    Electricity:
      "De-energize affected feeder if hazardous and dispatch Electrical emergency line crew.",
    Drainage:
      "Send jetting-cum-suction tanker and Stormwater crew to clear culvert blockage and pump water.",
    Trees:
      "Dispatch Parks & Horticulture chainsaw crew with traffic cones to clear fallen timber safely.",
    "Public Safety":
      "Alert Municipal Emergency Response unit to cordon the area and coordinate hazard mitigation.",
    Other:
      "Assign General Municipal Services field inspector to verify on-site and coordinate resolution.",
  };

  const trimmed = description.trim();
  const summary =
    detectedLanguage === "English"
      ? trimmed.length > 96
        ? `${trimmed.slice(0, 93).trim()}...`
        : trimmed
      : `${category} complaint reported in ${detectedLanguage} near ${location || "ward area"}`;

  return {
    summary,
    detectedLanguage,
    category,
    severity,
    severityReason,
    department,
    priorityScore,
    suggestedAction: actionMap[category],
    analysisSource: "fallback" as const,
    fallbackReason,
  };
}

function parseDataUrl(
  dataUrl: string
): { mimeType: string; data: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  const rawKey = process.env.GEMINI_API_KEY?.trim() ?? "";
  const isApiKeyConfigured =
    rawKey.length > 0 && rawKey !== "MY_GEMINI_API_KEY";

  const ai = isApiKeyConfigured
    ? new GoogleGenAI({
        apiKey: rawKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      })
    : null;

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      aiConfigured: Boolean(ai),
    });
  });

  app.post("/api/triage", async (req: Request, res: Response) => {
    const body = req.body as {
      description?: unknown;
      location?: unknown;
      citizenName?: unknown;
      photoDataUrl?: unknown;
    };

    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const location =
      typeof body.location === "string" ? body.location.trim() : "";
    const citizenName =
      typeof body.citizenName === "string" ? body.citizenName.trim() : "";
    const photoDataUrl =
      typeof body.photoDataUrl === "string" ? body.photoDataUrl : "";

    if (!description) {
      res.status(400).json({ error: "Complaint description is required." });
      return;
    }

    if (!ai) {
      res.json(
        serverKeywordFallback(
          description,
          location,
          "Gemini API key is not configured on the server."
        )
      );
      return;
    }

    try {
      const systemInstruction = `You are CivicLens, an expert municipal civic complaint triage analyst.
Analyze the citizen complaint (which may be written in English, Kannada, Hindi, Tamil, Telugu, Marathi, or mixed regional languages) and any attached photo.
Always return English output for summary, severityReason, and suggestedAction so municipal dispatchers can act immediately.

Strictly classify into one of these categories:
- Roads
- Waste
- Water
- Electricity
- Drainage
- Trees
- Public Safety
- Other

Strictly follow these severity rules:
- Critical: immediate threat to life, exposed electrical wires, major flooding, fallen trees creating serious danger, structural collapse, open manholes.
- High: dangerous potholes, major water leakage, overflowing drainage/sewage, broken streetlights at busy/dark areas, significant public safety issues.
- Medium: moderate repair or municipal service issues (e.g. uncollected garbage bins, minor drainage clog, routine repairs).
- Low: minor problems without immediate risk (e.g. faded signage, park bench paint, light pruning request).

Assign priorityScore from 0 to 100 aligned with severity:
- Critical: 88–100
- High: 70–87
- Medium: 40–69
- Low: 10–39

Keep summary under 14 words, severityReason to exactly one clear sentence, and suggestedAction to one actionable dispatch instruction.`;

      const userPrompt = `Citizen Complaint Details:
Location / Landmark: ${location || "Not specified"}
Reporter: ${citizenName || "Anonymous citizen"}
Description: ${description}`;

      const parts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (photoDataUrl) {
        const parsedImage = parseDataUrl(photoDataUrl);
        if (parsedImage) {
          parts.push({
            inlineData: {
              mimeType: parsedImage.mimeType,
              data: parsedImage.data,
            },
          });
        }
      }
      parts.push({ text: userPrompt });

      const callGemini = () =>
        ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: { parts },
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description:
                    "Concise English summary of the civic issue (under 14 words).",
                },
                detectedLanguage: {
                  type: Type.STRING,
                  description:
                    "Detected primary language of the complaint text (e.g., English, Kannada, Hindi).",
                },
                category: {
                  type: Type.STRING,
                  description:
                    "One of: Roads, Waste, Water, Electricity, Drainage, Trees, Public Safety, Other.",
                },
                severity: {
                  type: Type.STRING,
                  description: "One of: Critical, High, Medium, Low.",
                },
                severityReason: {
                  type: Type.STRING,
                  description: "Exactly one sentence explaining the severity rating.",
                },
                priorityScore: {
                  type: Type.INTEGER,
                  description: "Numeric urgency score from 0 to 100.",
                },
                suggestedAction: {
                  type: Type.STRING,
                  description: "Concrete next dispatch step for the assigned department.",
                },
              },
              required: [
                "summary",
                "detectedLanguage",
                "category",
                "severity",
                "severityReason",
                "priorityScore",
                "suggestedAction",
              ],
            },
          },
        });

      const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
        Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Gemini request timed out")), ms)
          ),
        ]);

      let response;
      try {
        response = await withTimeout(callGemini(), 12000);
      } catch (firstErr) {
        const msg = firstErr instanceof Error ? firstErr.message : "";
        if (/503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|timed out/i.test(msg)) {
          await new Promise((r) => setTimeout(r, 600));
          response = await withTimeout(callGemini(), 12000);
        } else {
          throw firstErr;
        }
      }

      const rawText = response.text?.trim();
      if (!rawText) {
        throw new Error("Empty response returned by Gemini.");
      }

      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      const category = normalizeCategory(parsed.category);
      const severity = normalizeSeverity(parsed.severity);
      const department = DEPARTMENT_MAP[category];

      res.json({
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim()
            : description.slice(0, 90),
        detectedLanguage:
          typeof parsed.detectedLanguage === "string" &&
          parsed.detectedLanguage.trim()
            ? parsed.detectedLanguage.trim()
            : "English",
        category,
        severity,
        severityReason:
          typeof parsed.severityReason === "string" &&
          parsed.severityReason.trim()
            ? parsed.severityReason.trim()
            : "Assessed according to municipal safety impact criteria.",
        department,
        priorityScore: clampScore(parsed.priorityScore, severity),
        suggestedAction:
          typeof parsed.suggestedAction === "string" &&
          parsed.suggestedAction.trim()
            ? parsed.suggestedAction.trim()
            : "Assign field inspection crew to assess and resolve.",
        analysisSource: "gemini" as const,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gemini request failed.";
      res.json(
        serverKeywordFallback(
          description,
          location,
          `Gemini AI unavailable (${message}).`
        )
      );
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("/{*splat}", (_req: Request, res: Response) => {
      const indexHtml = path.join(distDir, "index.html");
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send("Application build not found.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicLens server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
