import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Cpu,
  Info,
  ShieldAlert,
  UserCheck,
  Wrench,
} from "lucide-react";
import type { AnalysisSource, Severity, TicketStatus } from "../types/civic";
import { ALL_STATUSES } from "../types/civic";

const SEVERITY_STYLES: Record<
  Severity,
  { text: string; bar: string; icon: typeof AlertOctagon }
> = {
  Critical: {
    text: "text-red-700",
    bar: "bg-red-600",
    icon: AlertOctagon,
  },
  High: {
    text: "text-orange-700",
    bar: "bg-orange-600",
    icon: AlertTriangle,
  },
  Medium: {
    text: "text-amber-700",
    bar: "bg-amber-500",
    icon: Clock,
  },
  Low: {
    text: "text-teal-700",
    bar: "bg-teal-600",
    icon: Info,
  },
};

export function SeverityIndicator({
  severity,
  score,
}: {
  severity: Severity;
  score?: number;
}) {
  const cfg = SEVERITY_STYLES[severity];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${cfg.text}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{severity}</span>
      {typeof score === "number" && (
        <span className="font-mono tabular-nums text-slate-500 font-medium">
          ({score})
        </span>
      )}
    </span>
  );
}

export function SeverityScoreBar({
  severity,
  score,
}: {
  severity: Severity;
  score: number;
}) {
  const cfg = SEVERITY_STYLES[severity];
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${cfg.bar}`}
          style={{ width: `${Math.max(4, Math.min(100, score))}%` }}
        />
      </div>
      <span className="font-mono tabular-nums text-xs font-semibold text-slate-700">
        {score}/100
      </span>
    </div>
  );
}

const STATUS_STYLES: Record<
  TicketStatus,
  { text: string; icon: typeof CircleDashed }
> = {
  Pending: {
    text: "text-amber-700",
    icon: CircleDashed,
  },
  Assigned: {
    text: "text-blue-800",
    icon: UserCheck,
  },
  "In Progress": {
    text: "text-teal-700",
    icon: Wrench,
  },
  Resolved: {
    text: "text-emerald-700",
    icon: CheckCircle2,
  },
};

export function StatusIndicator({ status }: { status: TicketStatus }) {
  const cfg = STATUS_STYLES[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${cfg.text}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

export function StatusSegmentedControl({
  value,
  onChange,
  compact = false,
}: {
  value: TicketStatus;
  onChange: (next: TicketStatus) => void;
  compact?: boolean;
}) {
  return (
    <div
      className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
      role="group"
      aria-label="Update ticket status"
    >
      {ALL_STATUSES.map((status) => {
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(status);
            }}
            className={`whitespace-nowrap shrink-0 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-700 ${
              compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs min-h-[36px]"
            } ${
              active
                ? "bg-[#0F294A] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
            }`}
          >
            {status}
          </button>
        );
      })}
    </div>
  );
}

export function AnalysisProvenance({
  source,
  reason,
}: {
  source: AnalysisSource;
  reason?: string;
}) {
  if (source === "gemini") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800 whitespace-nowrap">
        <Cpu className="w-3.5 h-3.5 text-teal-700 shrink-0" aria-hidden="true" />
        <span>Gemini AI Triage</span>
      </span>
    );
  }
  return (
    <span
      title={reason || "Keyword-based fallback engine active"}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-800 whitespace-nowrap"
    >
      <ShieldAlert
        className="w-3.5 h-3.5 text-orange-600 shrink-0"
        aria-hidden="true"
      />
      <span>DEMO/FALLBACK ANALYSIS</span>
    </span>
  );
}
