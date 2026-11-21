import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  Languages,
  MapPin,
  Trash2,
  User,
  X,
} from "lucide-react";
import type { ComplaintTicket, TicketStatus } from "../types/civic";
import { formatTicketDate } from "../utils/triageFallback";
import {
  AnalysisProvenance,
  SeverityIndicator,
  SeverityScoreBar,
  StatusSegmentedControl,
} from "./SeverityIndicator";

export function TicketDetailModal({
  ticket,
  onClose,
  onUpdateStatus,
  onDeleteTicket,
}: {
  ticket: ComplaintTicket | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onDeleteTicket: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
  }, [ticket?.id]);

  if (!ticket) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-[1px] p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div
        className="w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-xl border border-slate-200 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-5 py-4 bg-white border-b border-slate-200">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-mono font-semibold text-[#0F294A]">
                {ticket.id}
              </span>
              <span aria-hidden="true">·</span>
              <span>{ticket.category}</span>
              <span aria-hidden="true">·</span>
              <AnalysisProvenance
                source={ticket.analysisSource}
                reason={ticket.fallbackReason}
              />
            </div>
            <h2
              id="ticket-modal-title"
              className="text-lg font-display font-bold text-slate-900 leading-snug"
            >
              {ticket.summary}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close ticket details"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                Severity & Urgency Score
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <SeverityIndicator severity={ticket.severity} />
                <SeverityScoreBar
                  severity={ticket.severity}
                  score={ticket.priorityScore}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-500">
                Workflow Status
              </div>
              <StatusSegmentedControl
                value={ticket.status}
                onChange={(next) => onUpdateStatus(ticket.id, next)}
              />
            </div>
          </div>

          {ticket.analysisSource === "fallback" && (
            <div className="p-3.5 rounded-lg bg-orange-50 border border-orange-200 text-xs text-orange-900">
              <span className="font-semibold">DEMO/FALLBACK ANALYSIS:</span>{" "}
              {ticket.fallbackReason ||
                "Analyzed using deterministic keyword triage rules because Gemini AI was unavailable."}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2.5">
              <Building2
                className="w-4 h-4 text-teal-700 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <div className="text-xs text-slate-500">Assigned Department</div>
                <div className="font-semibold text-slate-900">
                  {ticket.department}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin
                className="w-4 h-4 text-teal-700 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <div className="text-xs text-slate-500">Location / Landmark</div>
                <div className="font-medium text-slate-900">
                  {ticket.location}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User
                className="w-4 h-4 text-slate-500 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <div className="text-xs text-slate-500">Citizen Reporter</div>
                <div className="font-medium text-slate-900">
                  {ticket.citizenName || "Anonymous citizen"}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar
                className="w-4 h-4 text-slate-500 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div>
                <div className="text-xs text-slate-500">Submitted</div>
                <div className="font-mono tabular-nums text-slate-900">
                  {formatTicketDate(ticket.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">Original Citizen Complaint</span>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Languages className="w-3.5 h-3.5" aria-hidden="true" />
                {ticket.detectedLanguage}
              </span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200 whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          {ticket.photoDataUrl && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-500">
                Citizen Photo Evidence
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img
                  src={ticket.photoDataUrl}
                  alt={`Evidence for ${ticket.id}`}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-72 object-contain bg-slate-900/5"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
              <div className="text-xs font-semibold text-[#0F294A] mb-1">
                Severity Rationale
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {ticket.severityReason}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/50">
              <div className="text-xs font-semibold text-teal-900 mb-1">
                Suggested Municipal Action
              </div>
              <p className="text-xs text-teal-950 leading-relaxed">
                {ticket.suggestedAction}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-700 transition-colors py-2 px-2"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                Delete Ticket
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-700 font-medium">
                  Remove permanently?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteTicket(ticket.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-[#0F294A] text-white rounded-lg hover:bg-[#163864] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
