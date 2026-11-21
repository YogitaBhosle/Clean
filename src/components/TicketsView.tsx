import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Image as ImageIcon,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import type {
  Category,
  ComplaintTicket,
  Severity,
  TicketStatus,
} from "../types/civic";
import {
  ALL_CATEGORIES,
  ALL_SEVERITIES,
  ALL_STATUSES,
} from "../types/civic";
import {
  exportTicketsToCSV,
  formatTicketDate,
  sortTicketsByPriority,
} from "../utils/triageFallback";
import {
  AnalysisProvenance,
  SeverityIndicator,
  SeverityScoreBar,
  StatusSegmentedControl,
} from "./SeverityIndicator";

type SortMode = "priority" | "score" | "newest";

export function TicketsView({
  tickets,
  initialCategoryFilter,
  onClearInitialCategory,
  onSelectTicket,
  onUpdateStatus,
  onResetDemoData,
}: {
  tickets: ComplaintTicket[];
  initialCategoryFilter: Category | "All";
  onClearInitialCategory: () => void;
  onSelectTicket: (ticket: ComplaintTicket) => void;
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onResetDemoData: () => void;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">(
    initialCategoryFilter
  );
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "All">("All");
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setCategoryFilter(initialCategoryFilter);
  }, [initialCategoryFilter]);

  const activeCategory = categoryFilter;

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();

    const matched = tickets.filter((t) => {
      if (activeCategory !== "All" && t.category !== activeCategory) {
        return false;
      }
      if (severityFilter !== "All" && t.severity !== severityFilter) {
        return false;
      }
      if (statusFilter !== "All" && t.status !== statusFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          t.id,
          t.summary,
          t.description,
          t.location,
          t.department,
          t.citizenName || "",
          t.category,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sortMode === "priority") {
      return sortTicketsByPriority(matched);
    }
    if (sortMode === "score") {
      return [...matched].sort((a, b) => b.priorityScore - a.priorityScore);
    }
    return [...matched].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tickets, search, activeCategory, severityFilter, statusFilter, sortMode]);

  const hasFilters =
    search.trim() !== "" ||
    activeCategory !== "All" ||
    severityFilter !== "All" ||
    statusFilter !== "All";

  const clearAllFilters = () => {
    setSearch("");
    setCategoryFilter("All");
    onClearInitialCategory();
    setSeverityFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Ticket ID (e.g. CL-2026-0101), complaint, or landmark..."
              aria-label="Search complaints"
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <select
              aria-label="Filter by category"
              value={activeCategory}
              onChange={(e) => {
                onClearInitialCategory();
                setCategoryFilter(e.target.value as Category | "All");
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600"
            >
              <option value="All">All Categories</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by severity"
              value={severityFilter}
              onChange={(e) =>
                setSeverityFilter(e.target.value as Severity | "All")
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600"
            >
              <option value="All">All Severities</option>
              {ALL_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TicketStatus | "All")
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600"
            >
              <option value="All">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort complaints"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600"
            >
              <option value="priority">Sort: Priority</option>
              <option value="score">Sort: Score (High–Low)</option>
              <option value="newest">Sort: Newest First</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
          <div className="flex items-center gap-3 text-slate-600">
            <span className="font-mono tabular-nums">
              Showing <strong>{filteredTickets.length}</strong> of{" "}
              <strong>{tickets.length}</strong> tickets
            </span>
            {hasFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 font-semibold"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Reset filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportTicketsToCSV(filteredTickets)}
              disabled={filteredTickets.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Export Filtered CSV
            </button>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset Demo Data
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onResetDemoData();
                    setConfirmReset(false);
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-[#0F294A] text-white rounded-md hover:bg-[#163864]"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tickets List / Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-slate-700">
              No complaints match your current search or filter criteria.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0F294A] rounded-lg hover:bg-[#163864]"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Complaint & Location</th>
                    <th className="py-3 px-4">Category & Dept</th>
                    <th className="py-3 px-4">Severity & Score</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-[#0F294A]">
                          {ticket.id}
                        </div>
                        <div className="mt-1">
                          <AnalysisProvenance source={ticket.analysisSource} />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top max-w-sm">
                        <div className="font-semibold text-slate-900 line-clamp-1">
                          {ticket.summary}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {ticket.location}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                          <span>{ticket.detectedLanguage}</span>
                          {ticket.photoDataUrl && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                                <ImageIcon
                                  className="w-3 h-3"
                                  aria-hidden="true"
                                />
                                Photo attached
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-900">
                          {ticket.category}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {ticket.department}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap space-y-1.5">
                        <SeverityIndicator severity={ticket.severity} />
                        <SeverityScoreBar
                          severity={ticket.severity}
                          score={ticket.priorityScore}
                        />
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap font-mono tabular-nums text-xs text-slate-600">
                        {formatTicketDate(ticket.createdAt)}
                      </td>

                      <td
                        className="py-3.5 px-4 align-top"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <StatusSegmentedControl
                          compact
                          value={ticket.status}
                          onChange={(next) => onUpdateStatus(ticket.id, next)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards */}
            <div className="lg:hidden divide-y divide-slate-200">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="p-4 space-y-3 cursor-pointer active:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-[#0F294A]">
                        {ticket.id}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-500 font-mono tabular-nums">
                        {formatTicketDate(ticket.createdAt)}
                      </span>
                    </div>
                    <SeverityIndicator
                      severity={ticket.severity}
                      score={ticket.priorityScore}
                    />
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {ticket.summary}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {ticket.category} · {ticket.department} · {ticket.location}
                    </div>
                  </div>

                  <div
                    className="pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusSegmentedControl
                      compact
                      value={ticket.status}
                      onChange={(next) => onUpdateStatus(ticket.id, next)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
