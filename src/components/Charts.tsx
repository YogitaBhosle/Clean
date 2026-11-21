import { useMemo, useState } from "react";
import type { Category, ComplaintTicket, Severity } from "../types/civic";
import {
  ALL_CATEGORIES,
  ALL_SEVERITIES,
  ALL_STATUSES,
  DEPARTMENT_MAP,
} from "../types/civic";

const CATEGORY_COLORS: Record<Category, string> = {
  Roads: "#0F294A",
  Drainage: "#0D9488",
  Electricity: "#EA580C",
  Water: "#0284C7",
  Waste: "#D97706",
  Trees: "#15803D",
  "Public Safety": "#DC2626",
  Other: "#64748B",
};

const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#DC2626",
  High: "#EA580C",
  Medium: "#D97706",
  Low: "#0D9488",
};

export function CategoryDistributionChart({
  tickets,
  onSelectCategory,
}: {
  tickets: ComplaintTicket[];
  onSelectCategory?: (category: Category) => void;
}) {
  const [hovered, setHovered] = useState<Category | null>(null);

  const data = useMemo(() => {
    const counts = new Map<Category, number>();
    ALL_CATEGORIES.forEach((c) => counts.set(c, 0));
    tickets.forEach((t) => counts.set(t.category, (counts.get(t.category) || 0) + 1));

    const total = tickets.length || 1;
    return ALL_CATEGORIES.map((category) => {
      const count = counts.get(category) || 0;
      return {
        category,
        count,
        pct: Math.round((count / total) * 100),
      };
    }).sort((a, b) => b.count - a.count);
  }, [tickets]);

  const maxCount = Math.max(1, ...data.map((d) => d.count));

  if (tickets.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        No complaint data available to chart yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const barWidth = Math.round((item.count / maxCount) * 100);
        const isHovered = hovered === item.category;
        return (
          <button
            key={item.category}
            type="button"
            onClick={() => onSelectCategory?.(item.category)}
            onMouseEnter={() => setHovered(item.category)}
            onMouseLeave={() => setHovered(null)}
            className={`w-full text-left group rounded-lg px-2 py-1.5 transition-colors ${
              onSelectCategory ? "hover:bg-slate-50 cursor-pointer" : "cursor-default"
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span
                className={`font-medium ${
                  isHovered ? "text-[#0F294A]" : "text-slate-700"
                }`}
              >
                {item.category}
              </span>
              <span className="font-mono tabular-nums text-slate-600">
                {item.count}{" "}
                <span className="text-slate-400">({item.pct}%)</span>
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden">
              <div
                className="h-full rounded-sm transition-all duration-300"
                style={{
                  width: `${item.count > 0 ? Math.max(4, barWidth) : 0}%`,
                  backgroundColor: CATEGORY_COLORS[item.category],
                  opacity: hovered && !isHovered ? 0.55 : 1,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function DepartmentWorkloadChart({
  tickets,
}: {
  tickets: ComplaintTicket[];
}) {
  const departments = useMemo(() => {
    const map = new Map<
      string,
      { department: string; active: number; resolved: number; total: number }
    >();

    Object.values(DEPARTMENT_MAP).forEach((dept) => {
      map.set(dept, { department: dept, active: 0, resolved: 0, total: 0 });
    });

    tickets.forEach((t) => {
      const entry = map.get(t.department) || {
        department: t.department,
        active: 0,
        resolved: 0,
        total: 0,
      };
      entry.total += 1;
      if (t.status === "Resolved") entry.resolved += 1;
      else entry.active += 1;
      map.set(t.department, entry);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [tickets]);

  const maxTotal = Math.max(1, ...departments.map((d) => d.total));

  if (tickets.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        No department workload recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-end gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#0F294A] inline-block" />
          Active
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-teal-600 inline-block" />
          Resolved
        </span>
      </div>

      {departments.map((dept) => {
        const activeWidth = Math.round((dept.active / maxTotal) * 100);
        const resolvedWidth = Math.round((dept.resolved / maxTotal) * 100);
        return (
          <div key={dept.department} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-medium text-slate-700 truncate">
                {dept.department}
              </span>
              <span className="font-mono tabular-nums text-slate-600 shrink-0">
                {dept.active} open / {dept.resolved} done
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-sm overflow-hidden flex">
              {dept.active > 0 && (
                <div
                  className="h-full bg-[#0F294A] transition-all duration-300"
                  style={{ width: `${Math.max(4, activeWidth)}%` }}
                  title={`${dept.active} active`}
                />
              )}
              {dept.resolved > 0 && (
                <div
                  className="h-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${Math.max(4, resolvedWidth)}%` }}
                  title={`${dept.resolved} resolved`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SeverityDonutChart({
  tickets,
}: {
  tickets: ComplaintTicket[];
}) {
  const [activeSlice, setActiveSlice] = useState<Severity | null>(null);

  const stats = useMemo(() => {
    const counts: Record<Severity, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };
    tickets.forEach((t) => {
      counts[t.severity] += 1;
    });
    const total = tickets.length;
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    const slices = ALL_SEVERITIES.map((severity) => {
      const count = counts[severity];
      const fraction = total > 0 ? count / total : 0;
      const dashLength = fraction * circumference;
      const slice = {
        severity,
        count,
        pct: total > 0 ? Math.round(fraction * 100) : 0,
        color: SEVERITY_COLORS[severity],
        dashArray: `${dashLength} ${circumference}`,
        dashOffset: -offset,
      };
      offset += dashLength;
      return slice;
    });

    return { total, slices, radius };
  }, [tickets]);

  const focused = activeSlice
    ? stats.slices.find((s) => s.severity === activeSlice)
    : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 144 144" className="w-full h-full -rotate-90">
          <circle
            cx="72"
            cy="72"
            r={stats.radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="16"
          />
          {stats.slices.map((slice) =>
            slice.count > 0 ? (
              <circle
                key={slice.severity}
                cx="72"
                cy="72"
                r={stats.radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={activeSlice === slice.severity ? 19 : 16}
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setActiveSlice(slice.severity)}
                onMouseLeave={() => setActiveSlice(null)}
              />
            ) : null
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-display font-bold tabular-nums text-[#0F294A]">
            {focused ? focused.count : stats.total}
          </span>
          <span className="text-xs text-slate-500">
            {focused ? focused.severity : "Total"}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {stats.slices.map((slice) => (
          <div
            key={slice.severity}
            onMouseEnter={() => setActiveSlice(slice.severity)}
            onMouseLeave={() => setActiveSlice(null)}
            className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="font-medium text-slate-800">{slice.severity}</span>
            </div>
            <div className="font-mono tabular-nums text-slate-600">
              {slice.count}{" "}
              <span className="text-slate-400">({slice.pct}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusPipelineChart({
  tickets,
}: {
  tickets: ComplaintTicket[];
}) {
  const stages = useMemo(() => {
    const total = tickets.length || 1;
    return ALL_STATUSES.map((status) => {
      const matching = tickets.filter((t) => t.status === status);
      const avgScore =
        matching.length > 0
          ? Math.round(
              matching.reduce((sum, t) => sum + t.priorityScore, 0) /
                matching.length
            )
          : 0;
      return {
        status,
        count: matching.length,
        pct: Math.round((matching.length / total) * 100),
        avgScore,
      };
    });
  }, [tickets]);

  const statusBarColor: Record<string, string> = {
    Pending: "#D97706",
    Assigned: "#1D4ED8",
    "In Progress": "#0D9488",
    Resolved: "#16A34A",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stages.map((stage) => (
        <div
          key={stage.status}
          className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50"
        >
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-medium">{stage.status}</span>
            <span className="font-mono tabular-nums">{stage.pct}%</span>
          </div>
          <div className="text-2xl font-display font-bold tabular-nums text-[#0F294A] mb-2">
            {stage.count}
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${stage.count > 0 ? Math.max(6, stage.pct) : 0}%`,
                backgroundColor: statusBarColor[stage.status],
              }}
            />
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            Avg score: {stage.avgScore}
          </div>
        </div>
      ))}
    </div>
  );
}
