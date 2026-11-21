import { useEffect, useState } from "react";
import {
  BarChart3,
  ClipboardList,
  Download,
  LayoutDashboard,
  PlusCircle,
  Radar,
} from "lucide-react";
import { AnalyticsView } from "./components/AnalyticsView";
import { ComplaintFormView } from "./components/ComplaintFormView";
import { DashboardView } from "./components/DashboardView";
import { TicketDetailModal } from "./components/TicketDetailModal";
import { TicketsView } from "./components/TicketsView";
import { SEED_TICKETS } from "./data/seedTickets";
import type {
  AppView,
  Category,
  ComplaintTicket,
  TicketStatus,
  TriageResult,
} from "./types/civic";
import { exportTicketsToCSV } from "./utils/triageFallback";

const STORAGE_KEY = "civiclens_tickets_v1";

function loadInitialTickets(): ComplaintTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed as ComplaintTicket[];
      }
    }
  } catch {
    // Ignore corrupt storage and re-seed
  }
  return SEED_TICKETS;
}

function generateTicketId(existing: ComplaintTicket[]): string {
  const year = new Date().getFullYear();
  const existingIds = new Set(existing.map((t) => t.id));
  let maxSeq = 100;
  existing.forEach((t) => {
    const match = /-(\d{4,})$/.exec(t.id);
    if (match) {
      const num = Number(match[1]);
      if (Number.isFinite(num) && num > maxSeq) maxSeq = num;
    }
  });
  let candidate = `CL-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
  while (existingIds.has(candidate)) {
    maxSeq += 1;
    candidate = `CL-${year}-${String(maxSeq + 1).padStart(4, "0")}`;
  }
  return candidate;
}

export default function App() {
  const [tickets, setTickets] = useState<ComplaintTicket[]>(loadInitialTickets);
  const [activeView, setActiveView] = useState<AppView>("dashboard");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [categoryDrilldown, setCategoryDrilldown] = useState<Category | "All">(
    "All"
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    } catch {
      setToastMessage(
        "Browser storage limit reached; older photo attachments may not persist."
      );
    }
  }, [tickets]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const selectedTicket =
    tickets.find((t) => t.id === selectedTicketId) ?? null;

  const handleSubmitComplaint = (
    payload: {
      description: string;
      location: string;
      citizenName?: string;
      photoDataUrl?: string;
    },
    triage: TriageResult
  ): ComplaintTicket => {
    const nowIso = new Date().toISOString();
    const newTicket: ComplaintTicket = {
      id: generateTicketId(tickets),
      description: payload.description,
      location: payload.location,
      citizenName: payload.citizenName,
      photoDataUrl: payload.photoDataUrl,
      summary: triage.summary,
      detectedLanguage: triage.detectedLanguage,
      category: triage.category,
      severity: triage.severity,
      severityReason: triage.severityReason,
      department: triage.department,
      priorityScore: triage.priorityScore,
      suggestedAction: triage.suggestedAction,
      status: "Pending",
      createdAt: nowIso,
      updatedAt: nowIso,
      analysisSource: triage.analysisSource,
      fallbackReason: triage.fallbackReason,
    };

    setTickets((prev) => [newTicket, ...prev]);
    showToast(`Ticket ${newTicket.id} routed to ${newTicket.department}`);
    return newTicket;
  };

  const handleUpdateStatus = (id: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, updatedAt: new Date().toISOString() }
          : t
      )
    );
    showToast(`${id} marked as ${status}`);
  };

  const handleDeleteTicket = (id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    showToast(`Ticket ${id} removed`);
  };

  const handleResetDemoData = () => {
    setTickets(SEED_TICKETS);
    setCategoryDrilldown("All");
    showToast("Demo dataset restored (6 civic complaints)");
  };

  const handleFilterByCategory = (category: Category) => {
    setCategoryDrilldown(category);
    setActiveView("tickets");
  };

  const navItems: Array<{
    id: AppView;
    label: string;
    shortLabel: string;
    icon: typeof LayoutDashboard;
  }> = [
    {
      id: "dashboard",
      label: "Dashboard",
      shortLabel: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "submit",
      label: "Submit Complaint",
      shortLabel: "Report",
      icon: PlusCircle,
    },
    {
      id: "tickets",
      label: "Manage Tickets",
      shortLabel: "Tickets",
      icon: ClipboardList,
    },
    {
      id: "analytics",
      label: "Analytics",
      shortLabel: "Analytics",
      icon: BarChart3,
    },
  ];

  const viewTitleMap: Record<AppView, string> = {
    dashboard: "Municipal Triage Dashboard",
    submit: "Report a Civic Issue",
    tickets: "Complaint Management",
    analytics: "Civic Intelligence & Analytics",
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-[#0F294A] text-white border-r border-slate-800">
        <div className="px-5 py-5 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveView("dashboard")}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shrink-0">
              <Radar className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <div className="font-display font-bold text-lg tracking-tight leading-none">
                CivicLens
              </div>
              <div className="text-[11px] text-slate-300 mt-1 leading-tight">
                From citizen complaints to civic action.
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id !== "tickets") setCategoryDrilldown("All");
                  setActiveView(item.id);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-teal-600 text-white"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-white">Local Dispatch Registry</div>
          <div className="font-mono tabular-nums text-[11px] text-slate-300">
            {tickets.length} total ·{" "}
            {tickets.filter((t) => t.status !== "Resolved").length} open
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="md:hidden font-display font-bold text-base text-[#0F294A] whitespace-nowrap shrink-0">
              CivicLens
            </span>
            <span
              className="md:hidden text-slate-300"
              aria-hidden="true"
            >
              /
            </span>
            <h1 className="text-sm sm:text-base font-display font-bold text-slate-900 truncate">
              {viewTitleMap[activeView]}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                exportTicketsToCSV(tickets);
                showToast("Exported complaint registry to CSV");
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView("submit")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Report Issue</span>
            </button>
          </div>
        </header>

        {/* Active View Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">
          {activeView === "dashboard" && (
            <DashboardView
              tickets={tickets}
              onSelectTicket={(t) => setSelectedTicketId(t.id)}
              onUpdateStatus={handleUpdateStatus}
              onNavigateToSubmit={() => setActiveView("submit")}
              onNavigateToTickets={() => {
                setCategoryDrilldown("All");
                setActiveView("tickets");
              }}
              onFilterByCategory={handleFilterByCategory}
            />
          )}

          {activeView === "submit" && (
            <ComplaintFormView
              onSubmitComplaint={handleSubmitComplaint}
              onInspectTicket={(t) => setSelectedTicketId(t.id)}
              onNavigateToDashboard={() => setActiveView("dashboard")}
            />
          )}

          {activeView === "tickets" && (
            <TicketsView
              tickets={tickets}
              initialCategoryFilter={categoryDrilldown}
              onClearInitialCategory={() => setCategoryDrilldown("All")}
              onSelectTicket={(t) => setSelectedTicketId(t.id)}
              onUpdateStatus={handleUpdateStatus}
              onResetDemoData={handleResetDemoData}
            />
          )}

          {activeView === "analytics" && (
            <AnalyticsView
              tickets={tickets}
              onFilterByCategory={handleFilterByCategory}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 grid grid-cols-4"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id !== "tickets") setCategoryDrilldown("All");
                setActiveView(item.id);
              }}
              className={`flex flex-col items-center justify-center py-2 px-1 min-h-[54px] text-[11px] font-medium transition-colors ${
                active
                  ? "text-teal-700 font-semibold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" aria-hidden="true" />
              <span className="truncate max-w-full">{item.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Ticket Detail Inspector */}
      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicketId(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeleteTicket={handleDeleteTicket}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-5 right-4 z-40 bg-[#0F294A] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg border border-white/10"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
