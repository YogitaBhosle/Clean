import { useMemo } from "react";
import type { Category, ComplaintTicket } from "../types/civic";
import {
  CategoryDistributionChart,
  DepartmentWorkloadChart,
  SeverityDonutChart,
  StatusPipelineChart,
} from "./Charts";

export function AnalyticsView({
  tickets,
  onFilterByCategory,
}: {
  tickets: ComplaintTicket[];
  onFilterByCategory: (category: Category) => void;
}) {
  const summary = useMemo(() => {
    const total = tickets.length;
    const resolved = tickets.filter((t) => t.status === "Resolved").length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const avgScore =
      total > 0
        ? Math.round(
            tickets.reduce((sum, t) => sum + t.priorityScore, 0) / total
          )
        : 0;
    const urgentOpen = tickets.filter(
      (t) =>
        t.status !== "Resolved" &&
        (t.severity === "Critical" || t.severity === "High")
    ).length;

    const deptCounts = new Map<string, number>();
    tickets.forEach((t) =>
      deptCounts.set(t.department, (deptCounts.get(t.department) || 0) + 1)
    );
    let topDept = "None";
    let topDeptCount = 0;
    deptCounts.forEach((count, dept) => {
      if (count > topDeptCount) {
        topDeptCount = count;
        topDept = dept;
      }
    });

    return {
      total,
      resolutionRate,
      avgScore,
      urgentOpen,
      topDept,
      topDeptCount,
    };
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Executive Analytics Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">
            Resolution Rate
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold tabular-nums text-teal-700 mt-1">
            {summary.resolutionRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {tickets.filter((t) => t.status === "Resolved").length} of{" "}
            {summary.total} closed
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">
            Mean Priority Score
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold tabular-nums text-[#0F294A] mt-1">
            {summary.avgScore}
            <span className="text-base font-normal text-slate-400">/100</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across all triaged complaints
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">
            Active Critical & High
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold tabular-nums text-red-700 mt-1">
            {summary.urgentOpen}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Unresolved urgent dispatches
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="text-xs font-medium text-slate-500">
            Highest Load Department
          </div>
          <div className="text-base sm:text-lg font-display font-bold text-[#0F294A] mt-1.5 truncate">
            {summary.topDept}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {summary.topDeptCount} assigned tickets
          </div>
        </div>
      </section>

      {/* Status Pipeline */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-display font-bold text-[#0F294A]">
            Complaint Resolution Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live ticket distribution across municipal workflow stages.
          </p>
        </div>
        <StatusPipelineChart tickets={tickets} />
      </section>

      {/* Severity Donut & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-display font-bold text-[#0F294A]">
              Severity Distribution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hover segments to inspect Critical, High, Medium, and Low shares.
            </p>
          </div>
          <SeverityDonutChart tickets={tickets} />
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-base font-display font-bold text-[#0F294A]">
              Category Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Volume across municipal infrastructure categories. Click to drill down.
            </p>
          </div>
          <CategoryDistributionChart
            tickets={tickets}
            onSelectCategory={onFilterByCategory}
          />
        </section>
      </div>

      {/* Department Workload */}
      <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="text-base font-display font-bold text-[#0F294A]">
            Department Workload & Closure Balance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active queue versus resolved closures per municipal department.
          </p>
        </div>
        <DepartmentWorkloadChart tickets={tickets} />
      </section>
    </div>
  );
}
