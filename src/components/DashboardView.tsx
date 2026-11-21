import { useMemo } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  Plus,
} from "lucide-react";
import type { Category, ComplaintTicket, TicketStatus } from "../types/civic";
import { ALL_STATUSES } from "../types/civic";
import {
  formatTicketDate,
  sortTicketsByPriority,
} from "../utils/triageFallback";
import {
  CategoryDistributionChart,
  DepartmentWorkloadChart,
} from "./Charts";
import {
  AnalysisProvenance,
  SeverityIndicator,
  SeverityScoreBar,
  StatusIndicator,
} from "./SeverityIndicator";

export function DashboardView({
  tickets,
  onSelectTicket,
  onUpdateStatus,
  onNavigateToSubmit,
  onNavigateToTickets,
  onFilterByCategory,
}: {
  tickets: ComplaintTicket[];
  onSelectTicket: (ticket: ComplaintTicket) => void;
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onNavigateToSubmit: () => void;
  onNavigateToTickets: () => void;
  onFilterByCategory: (category: Category) => void;
}) {
  const metrics = useMemo(() => {
    const total = tickets.length;
    const critical = tickets.filter((t) => t.severity === "Critical").length;
    const high = tickets.filter((t) => t.severity === "High").length;
    const pending = tickets.filter((t) => t.status === "Pending").length;
    const resolved = tickets.filter((t) => t.status === "Resolved").length;
    return { total, critical, high, pending, resolved };
  }, [tickets]);

  const priorityQueue = useMemo(() => {
    const active = tickets.filter((t) => t.status !== "Resolved");
    const list = active.length > 0 ? active : tickets;
    return sortTicketsByPriority(list).slice(0, 8);
  }, [tickets]);

  const recentComplaints = useMemo(() => {
    return [...tickets]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [tickets]);

  const kpiCards = [
    {
      label: "Total Complaints",
      value: metrics.total,
      sub: "Logged in registry",
      icon: Inbox,
      accent: "text-[#0F294A]",
    },
    {
      label: "Critical",
      value: metrics.critical,
      sub: "Immediate life/safety risk",
      icon: AlertOctagon,
      accent: "text-red-700",
    },
    {
      label: "High Priority",
      value: metrics.high,
      sub: "Major hazard or disruption",
      icon: AlertTriangle,
      accent: "text-orange-700",
    },
    {
      label: "Pending",
      value: metrics.pending,
      sub: "Awaiting assignment",
      icon: Clock,
      accent: "text-amber-700",
    },
    {
      label: "Resolved",
      value: metrics.resolved,
      sub:
        metrics.total > 0
          ? `${Math.round((metrics.resolved / metrics.total) * 100)}% closure rate`
          : "0% closure rate",
      icon: CheckCircle2,
      accent: "text-teal-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Summary Strip */}
      <section aria-label="Complaint Overview Metrics">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-medium text-slate-600">
                    {card.label}
                  </span>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${card.accent}`}
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <div
                    className={`text-2xl sm:text-3xl font-display font-bold tabular-nums ${card.accent}`}
                  >
                    {card.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Priority Queue */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-display font-bold text-[#0F294A]">
              Priority Dispatch Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active complaints ordered by Critical &gt; High &gt; Medium &gt; Low, then urgency score.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToTickets}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 transition-colors whitespace-nowrap shrink-0"
          >
            <span>View all tickets</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {priorityQueue.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-600">
              No civic complaints are currently in the queue.
            </p>
            <button
              type="button"
              onClick={onNavigateToSubmit}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#0F294A] text-white rounded-lg hover:bg-[#163864]"
            >
              <Plus className="w-4 h-4" />
              Submit First Complaint
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Ticket</th>
                    <th className="py-2.5 px-4">Complaint Summary & Location</th>
                    <th className="py-2.5 px-4">Severity</th>
                    <th className="py-2.5 px-4">Score</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {priorityQueue.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-[#0F294A]">
                          {ticket.id}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ticket.category}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top max-w-md">
                        <div className="font-medium text-slate-900 line-clamp-1">
                          {ticket.summary}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="truncate">{ticket.location}</span>
                          {ticket.analysisSource === "fallback" && (
                            <>
                              <span aria-hidden="true">·</span>
                              <AnalysisProvenance source="fallback" />
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <SeverityIndicator severity={ticket.severity} />
                      </td>
                      <td className="py-3 px-4 align-top whitespace-nowrap">
                        <SeverityScoreBar
                          severity={ticket.severity}
                          score={ticket.priorityScore}
                        />
                      </td>
                      <td className="py-3 px-4 align-top text-xs text-slate-700 whitespace-nowrap">
                        {ticket.department}
                      </td>
                      <td
                        className="py-3 px-4 align-top whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          aria-label={`Change status for ${ticket.id}`}
                          value={ticket.status}
                          onChange={(e) =>
                            onUpdateStatus(
                              ticket.id,
                              e.target.value as TicketStatus
                            )
                          }
                          className="text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-teal-600"
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-slate-200">
              {priorityQueue.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="p-4 space-y-2.5 active:bg-slate-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[#0F294A]">
                      {ticket.id}
                    </span>
                    <SeverityIndicator
                      severity={ticket.severity}
                      score={ticket.priorityScore}
                    />
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {ticket.summary}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                    <span>{ticket.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ticket.department}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <StatusIndicator status={ticket.status} />
                    <span className="text-xs text-slate-500 truncate max-w-[55%]">
                      {ticket.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Category Chart & Department Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-display font-bold text-[#0F294A]">
              Complaints by Category
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any category bar to inspect matching tickets.
            </p>
          </div>
          <CategoryDistributionChart
            tickets={tickets}
            onSelectCategory={onFilterByCategory}
          />
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-display font-bold text-[#0F294A]">
              Department Workload
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active vs. resolved complaint distribution across municipal units.
            </p>
          </div>
          <DepartmentWorkloadChart tickets={tickets} />
        </section>
      </div>

      {/* Recent Complaints */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-bold text-[#0F294A]">
              Recent Citizen Submissions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest incoming issues triaged by CivicLens.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToSubmit}
            className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap shrink-0"
          >
            New Report
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentComplaints.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onSelectTicket(ticket)}
              className="w-full text-left px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-[#0F294A]">
                    {ticket.id}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{ticket.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ticket.location}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {formatTicketDate(ticket.createdAt)}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-900 truncate">
                  {ticket.summary}
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <SeverityIndicator
                  severity={ticket.severity}
                  score={ticket.priorityScore}
                />
                <StatusIndicator status={ticket.status} />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
