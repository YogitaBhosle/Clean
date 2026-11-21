import type {
  Category,
  ComplaintTicket,
  Severity,
  TriageResult,
} from "../types/civic";
import { DEPARTMENT_MAP, SEVERITY_RANK } from "../types/civic";

export function runKeywordTriageFallback(
  description: string,
  location: string,
  reason = "Gemini AI service unavailable; keyword triage engine active."
): TriageResult {
  const text = `${description} ${location}`.toLowerCase();

  // Language detection heuristic (Kannada, Hindi/Devanagari, Tamil, Telugu, English)
  let detectedLanguage = "English";
  if (/[\u0C80-\u0CFF]/.test(description)) detectedLanguage = "Kannada";
  else if (/[\u0900-\u097F]/.test(description)) detectedLanguage = "Hindi";
  else if (/[\u0B80-\u0BFF]/.test(description)) detectedLanguage = "Tamil";
  else if (/[\u0C00-\u0C7F]/.test(description)) detectedLanguage = "Telugu";

  let category: Category = "Other";
  if (
    /(pothole|road|asphalt|pavement|footpath|crater|sinkhole|speed breaker|manhole cover|ಗುಂಡಿ|ರಸ್ತೆ|ಗड्ढा|सड़क|रोड)/i.test(
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
    "Moderate municipal service disruption requiring scheduled departmental inspection.";

  if (
    /(exposed wire|live wire|sparking|electrocution|collapse|major flood|submerged|blocking main road|fallen on car|life|immediate danger|gas leak|open manhole|transformer fire|ಪ್ರಾಣಾಪಾಯ|ವಿದ್ಯುತ್ ತಂತಿ|करंट|आग|खतरनाक)/i.test(
      text
    )
  ) {
    severity = "Critical";
    priorityScore = 94;
    severityReason =
      "Poses an immediate threat to human life or critical public safety infrastructure.";
  } else if (
    /(deep pothole|dangerous|overflowing|major leak|burst pipe|broken streetlight|dark intersection|fallen tree|waterlogging|sewage|blocked|school|hospital|ಮಳೆನೀರು|ತುಂಬಿ|ಆಳವಾದ ಗುಂಡಿ|गहरा गड्ढा|बाढ़|टूटा|बह रहा)/i.test(
      text
    )
  ) {
    severity = "High";
    priorityScore = 81;
    severityReason =
      "Significant hazard affecting public mobility, sanitation, or local neighborhood safety.";
  } else if (
    /(minor|small|paint|trim|request|bench|signboard|dusty|ಸಣ್ಣ|छोटा|मरम्मत)/i.test(
      text
    )
  ) {
    severity = "Low";
    priorityScore = 32;
    severityReason =
      "Minor maintenance concern with no immediate risk to commuters or residents.";
  }

  const department = DEPARTMENT_MAP[category];

  const actionMap: Record<Category, string> = {
    Roads:
      "Deploy Roads & Engineering crew with temporary barricades and cold-mix patching material within 24 hours.",
    Waste:
      "Dispatch compactor collection vehicle and sanitation sweepers for immediate waste clearance and sanitization.",
    Water:
      "Isolate affected supply valve and send Water Supply maintenance team to seal pipeline leak.",
    Electricity:
      "Cut local feeder supply if hazardous and dispatch Electrical emergency line crew with insulated equipment.",
    Drainage:
      "Send jetting-cum-suction tanker and Stormwater crew to clear blockage and pump standing water.",
    Trees:
      "Dispatch Parks & Horticulture chainsaw crew with traffic cones to clear fallen timber safely.",
    "Public Safety":
      "Alert Municipal Emergency Response unit to cordon the zone and coordinate immediate hazard mitigation.",
    Other:
      "Assign General Municipal Services field inspector to verify issue on-site and coordinate resolution.",
  };

  const trimmed = description.trim();
  const cleanSummary =
    detectedLanguage === "English"
      ? trimmed.length > 96
        ? `${trimmed.slice(0, 93).trim()}...`
        : trimmed
      : `${category} issue reported in ${detectedLanguage} near ${location || "specified ward"}`;

  return {
    summary: cleanSummary,
    detectedLanguage,
    category,
    severity,
    severityReason,
    department,
    priorityScore,
    suggestedAction: actionMap[category],
    analysisSource: "fallback",
    fallbackReason: reason,
  };
}

export function sortTicketsByPriority(
  tickets: ComplaintTicket[]
): ComplaintTicket[] {
  return [...tickets].sort((a, b) => {
    const rankDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (rankDiff !== 0) return rankDiff;
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function formatTicketDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeCsvCell(value: string | number | undefined): string {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTicketsToCSV(tickets: ComplaintTicket[]): void {
  const headers = [
    "Ticket ID",
    "Status",
    "Severity",
    "Priority Score",
    "Category",
    "Department",
    "Summary",
    "Location",
    "Citizen Name",
    "Language",
    "Severity Reason",
    "Suggested Action",
    "Analysis Source",
    "Created At",
    "Original Description",
  ];

  const rows = tickets.map((t) =>
    [
      t.id,
      t.status,
      t.severity,
      t.priorityScore,
      t.category,
      t.department,
      t.summary,
      t.location,
      t.citizenName || "Anonymous",
      t.detectedLanguage,
      t.severityReason,
      t.suggestedAction,
      t.analysisSource === "gemini" ? "Gemini AI" : "DEMO/FALLBACK ANALYSIS",
      t.createdAt,
      t.description,
    ]
      .map(escapeCsvCell)
      .join(",")
  );

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute("download", `civiclens-complaints-${stamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function compressImageToDataUrl(
  file: File,
  maxDimension = 800,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onerror = () => {
        if (dataUrl.startsWith("data:image/") && dataUrl.length < 2_000_000) {
          resolve(dataUrl);
        } else {
          reject(new Error("Invalid image format."));
        }
      };
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
