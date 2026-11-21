import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  Languages,
  Loader2,
  MapPin,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { MULTILINGUAL_PRESETS } from "../data/seedTickets";
import type { ComplaintTicket, TriageResult } from "../types/civic";
import {
  compressImageToDataUrl,
  runKeywordTriageFallback,
} from "../utils/triageFallback";
import {
  AnalysisProvenance,
  SeverityIndicator,
  SeverityScoreBar,
  StatusIndicator,
} from "./SeverityIndicator";

export function ComplaintFormView({
  onSubmitComplaint,
  onInspectTicket,
  onNavigateToDashboard,
}: {
  onSubmitComplaint: (
    payload: {
      description: string;
      location: string;
      citizenName?: string;
      photoDataUrl?: string;
    },
    triage: TriageResult
  ) => ComplaintTicket;
  onInspectTicket: (ticket: ComplaintTicket) => void;
  onNavigateToDashboard: () => void;
}) {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [citizenName, setCitizenName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [photoFileName, setPhotoFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<ComplaintTicket | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageFile = async (file: File) => {
    setErrorMsg(null);
    const looksLikeImage =
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
    if (!looksLikeImage) {
      setErrorMsg("Please select a valid image file (JPG, PNG, or WebP).");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setErrorMsg("Image file must be under 12 MB.");
      return;
    }
    try {
      const compressed = await compressImageToDataUrl(file);
      setPhotoDataUrl(compressed);
      setPhotoFileName(file.name);
    } catch {
      setErrorMsg("Unable to process selected image. Please try another photo.");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleImageFile(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleImageFile(file);
    }
  };

  const applyPreset = (presetIndex: number) => {
    const preset = MULTILINGUAL_PRESETS[presetIndex];
    if (!preset) return;
    setDescription(preset.description);
    setLocation(preset.location);
    setCitizenName(preset.citizenName);
    setErrorMsg(null);
  };

  const handleResetForm = () => {
    setDescription("");
    setLocation("");
    setCitizenName("");
    setPhotoDataUrl(undefined);
    setPhotoFileName("");
    setErrorMsg(null);
    setCreatedTicket(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedDesc = description.trim();
    const trimmedLoc = location.trim();

    if (trimmedDesc.length < 8) {
      setErrorMsg(
        "Please describe the civic issue in at least a few words so CivicLens can triage it."
      );
      return;
    }
    if (!trimmedLoc) {
      setErrorMsg("Please provide a street address, ward, or nearby landmark.");
      return;
    }

    setIsAnalyzing(true);
    let triageResult: TriageResult;

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: trimmedDesc,
          location: trimmedLoc,
          citizenName: citizenName.trim() || undefined,
          photoDataUrl,
        }),
      });

      if (!res.ok) {
        throw new Error(`Triage endpoint returned ${res.status}`);
      }
      triageResult = (await res.json()) as TriageResult;
    } catch (err) {
      const reason =
        err instanceof Error ? err.message : "Network request failed.";
      triageResult = runKeywordTriageFallback(
        trimmedDesc,
        trimmedLoc,
        `Offline fallback active (${reason}).`
      );
    } finally {
      setIsAnalyzing(false);
    }

    const ticket = onSubmitComplaint(
      {
        description: trimmedDesc,
        location: trimmedLoc,
        citizenName: citizenName.trim() || undefined,
        photoDataUrl,
      },
      triageResult
    );

    setCreatedTicket(ticket);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Citizen Submission Form */}
      <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <div className="mb-5 pb-4 border-b border-slate-200">
          <h2 className="text-lg font-display font-bold text-[#0F294A]">
            Citizen Complaint Intake
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit issues in English, ಕನ್ನಡ (Kannada), हिन्दी (Hindi), or other Indian regional languages. CivicLens automatically classifies urgency and routes to the responsible department.
          </p>
        </div>

        {/* Multilingual Quick-Fill Presets */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-2">
            <Languages className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
            <span>Quick Test Samples (Multilingual):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {MULTILINGUAL_PRESETS.map((preset, idx) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(idx)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="complaint-description"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              Complaint Description <span className="text-red-600">*</span>
            </label>
            <textarea
              id="complaint-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the pothole, garbage pileup, water pipe burst, exposed wire, fallen tree, or drainage overflow..."
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              required
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500">
              <span>Supports Unicode regional scripts</span>
              <span className="font-mono tabular-nums">
                {description.length} chars
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="complaint-location"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Location / Landmark <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <MapPin
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="complaint-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., 12th Main, Indiranagar"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="citizen-name"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Citizen Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="citizen-name"
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="Leave blank for anonymous"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              />
            </div>
          </div>

          {/* Photo Upload + Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Photo Evidence <span className="text-slate-400 font-normal">(optional)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="complaint-photo-input"
            />

            {!photoDataUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className={`border border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-teal-600 bg-teal-50/70"
                    : "border-slate-300 bg-slate-50/50 hover:border-teal-500 hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-teal-700">
                    <Camera className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="text-xs font-medium text-slate-700">
                    Tap to capture or upload site photo
                  </div>
                  <div className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>JPG, PNG, WebP — analyzed alongside text</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-slate-700 truncate">
                    {photoFileName || "Uploaded evidence photo"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoDataUrl(undefined);
                      setPhotoFileName("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Remove
                  </button>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <img
                    src={photoDataUrl}
                    alt="Complaint upload preview"
                    referrerPolicy="no-referrer"
                    className="w-full max-h-56 object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0F294A] hover:bg-[#163864] disabled:opacity-60 rounded-lg transition-colors min-h-[44px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Analyzing & Routing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>Analyze & Submit Complaint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Right: Live AI Triage Output */}
      <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        {!createdTicket && !isAnalyzing && (
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-200">
              <h3 className="text-base font-display font-bold text-[#0F294A]">
                Automated Triage Preview
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every submission generates an instant municipal dispatch ticket.
              </p>
            </div>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-semibold text-teal-700">01</span>
                <span>
                  <strong className="text-slate-900">Multilingual Translation & Summary:</strong>{" "}
                  Converts Kannada, Hindi, or English reports into a concise dispatcher brief.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-semibold text-teal-700">02</span>
                <span>
                  <strong className="text-slate-900">Severity & Risk Scoring:</strong>{" "}
                  Classifies Critical, High, Medium, or Low urgency with a 0–100 priority index.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono font-semibold text-teal-700">03</span>
                <span>
                  <strong className="text-slate-900">Department Routing:</strong>{" "}
                  Maps automatically to Roads & Engineering, Sanitation, Water Supply, Electrical, Drainage, Parks, or Emergency Response.
                </span>
              </li>
            </ul>
          </div>
        )}

        {isAnalyzing && (
          <div className="py-12 text-center space-y-3">
            <Loader2
              className="w-8 h-8 animate-spin text-teal-700 mx-auto"
              aria-hidden="true"
            />
            <div className="text-sm font-semibold text-[#0F294A]">
              Running CivicLens Triage...
            </div>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Inspecting complaint language, hazard severity, photo evidence, and departmental routing rules.
            </p>
          </div>
        )}

        {createdTicket && !isAnalyzing && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Ticket Created & Added to Queue</span>
                </div>
                <div className="font-mono text-sm font-bold text-[#0F294A]">
                  {createdTicket.id}
                </div>
              </div>
              <AnalysisProvenance
                source={createdTicket.analysisSource}
                reason={createdTicket.fallbackReason}
              />
            </div>

            {createdTicket.analysisSource === "fallback" && (
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-900">
                <strong className="font-semibold">DEMO/FALLBACK ANALYSIS:</strong>{" "}
                {createdTicket.fallbackReason ||
                  "Keyword fallback triage was used instead of live Gemini AI."}
              </div>
            )}

            <div>
              <div className="text-xs text-slate-500 mb-0.5">
                AI Summary ({createdTicket.detectedLanguage})
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {createdTicket.summary}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <div className="text-slate-500 mb-1">Severity</div>
                <SeverityIndicator severity={createdTicket.severity} />
              </div>
              <div>
                <div className="text-slate-500 mb-1">Priority Score</div>
                <SeverityScoreBar
                  severity={createdTicket.severity}
                  score={createdTicket.priorityScore}
                />
              </div>
              <div>
                <div className="text-slate-500 mb-0.5">Category</div>
                <div className="font-semibold text-slate-900">
                  {createdTicket.category}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-0.5">Initial Status</div>
                <StatusIndicator status={createdTicket.status} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#0F294A]">
                <Building2 className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                <span>Routed to {createdTicket.department}</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {createdTicket.severityReason}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-teal-50/70 border border-teal-200 text-xs">
              <div className="font-semibold text-teal-900 mb-0.5">
                Suggested Action
              </div>
              <p className="text-teal-950 leading-relaxed">
                {createdTicket.suggestedAction}
              </p>
            </div>

            {createdTicket.photoDataUrl && (
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img
                  src={createdTicket.photoDataUrl}
                  alt={`Uploaded evidence for ${createdTicket.id}`}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-40 object-contain"
                />
              </div>
            )}

            <div className="pt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onInspectTicket(createdTicket)}
                className="flex-1 px-3.5 py-2 text-xs font-semibold bg-[#0F294A] text-white rounded-lg hover:bg-[#163864] transition-colors whitespace-nowrap"
              >
                Inspect Full Ticket
              </button>
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="inline-flex items-center justify-center gap-1 px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Submit Another Complaint
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
