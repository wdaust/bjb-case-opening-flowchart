import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { cn } from "../utils/cn";
import { Breadcrumbs } from "../components/dashboard/Breadcrumbs";
import { SectionHeader } from "../components/dashboard/SectionHeader";
import { DeadlineList } from "../components/dashboard/DeadlineList";
import { GateChecklist } from "../components/dashboard/GateChecklist";
import {
  cases,
  stageLabels,
  getDaysInStage,
  getSlaStatus,
  type Stage,
} from "../data/mockData";

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const stageColors: Record<Stage, string> = {
  opening: "bg-blue-500",
  treatment: "bg-emerald-500",
  discovery: "bg-amber-500",
  "expert-depo": "bg-purple-500",
  adr: "bg-cyan-500",
  trial: "bg-red-500",
};

function daysAgo(n: number): string {
  const d = new Date("2026-02-19");
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export default function CaseExecution() {
  const { caseId } = useParams();

  const theCase = useMemo(
    () => cases.find((c) => c.id === caseId),
    [caseId]
  );

  if (!theCase) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Case not found</h2>
          <p className="text-muted-foreground">No case found with ID "{caseId}".</p>
          <Link
            to="/control-tower"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            Back to Control Tower
          </Link>
        </div>
      </div>
    );
  }

  const daysInStage = getDaysInStage(theCase);
  const slaTarget = theCase.slaTarget;
  const slaRatio = daysInStage / slaTarget;
  const slaStatus = getSlaStatus(theCase);

  const slaColor =
    slaStatus === "breach" ? "text-red-500" : slaStatus === "warning" ? "text-amber-500" : "text-emerald-500";
  const slaBarColor =
    slaStatus === "breach" ? "bg-red-500" : slaStatus === "warning" ? "bg-amber-500" : "bg-emerald-500";
  const statusColors =
    theCase.status === "active"
      ? "bg-emerald-500/20 text-emerald-500"
      : theCase.status === "settled"
      ? "bg-amber-500/20 text-amber-500"
      : "bg-gray-500/20 text-gray-400";

  const timeline = [
    { date: daysAgo(1), action: "Filed motion to compel discovery responses", by: theCase.attorney },
    { date: daysAgo(5), action: "Received updated medical records from provider", by: theCase.attorney },
    { date: daysAgo(12), action: "Completed client interview and case review", by: theCase.attorney },
    { date: daysAgo(20), action: "Sent demand letter to opposing counsel", by: theCase.attorney },
    { date: daysAgo(30), action: "Case opened and initial intake completed", by: theCase.attorney },
  ];

  const deadlinesForList = theCase.deadlines.map((d) => ({
    ...d,
    caseId: theCase.id,
    caseTitle: theCase.title,
    attorney: theCase.attorney,
    stage: theCase.stage,
  }));

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <Breadcrumbs
        crumbs={[
          { label: "Control Tower", path: "/control-tower" },
          { label: stageLabels[theCase.stage], path: `/stage/${theCase.stage}` },
          { label: theCase.id },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <h1 className="text-2xl font-bold text-foreground">{theCase.title}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{theCase.id}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">{theCase.caseType}</span>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", statusColors)}>{theCase.status}</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className={cn("px-3 py-1 rounded-full text-xs font-semibold text-white", stageColors[theCase.stage])}>
                {stageLabels[theCase.stage]}
              </span>
              <span className="text-xs text-muted-foreground">Stage entry: {theCase.stageEntryDate}</span>
            </div>
            <div className={cn("text-lg font-semibold", slaColor)}>
              {daysInStage}d / {slaTarget}d target
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full transition-all", slaBarColor)} style={{ width: `${Math.min(slaRatio * 100, 100)}%` }} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Last activity</span>
                <p className="text-foreground font-medium">{theCase.lastActivityDate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Next action</span>
                <p className="text-foreground font-medium">{theCase.nextAction}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Owner</span>
                <p className="text-foreground font-medium">{theCase.nextActionOwner}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Due</span>
                <p className={cn("font-medium", theCase.nextActionDue < "2026-02-19" ? "text-red-500" : theCase.nextActionDue <= "2026-02-21" ? "text-amber-500" : "text-foreground")}>
                  {theCase.nextActionDue}
                </p>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="Exit Gate Checklist" />
            <GateChecklist gates={theCase.gateChecklist} interactive onToggle={() => {}} />
          </div>

          <div>
            <SectionHeader title="Activity Timeline" />
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="relative space-y-0">
                {timeline.map((entry, i) => (
                  <div key={i} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{entry.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
                        <span className="text-xs text-muted-foreground">by {entry.by}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div>
            <SectionHeader title="Upcoming Deadlines" />
            {deadlinesForList.length > 0 ? (
              <DeadlineList deadlines={deadlinesForList} />
            ) : (
              <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground">No upcoming deadlines</div>
            )}
          </div>

          <div>
            <SectionHeader title="Risk Flags" />
            <div className="bg-card border border-border rounded-xl p-6">
              {theCase.riskFlags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {theCase.riskFlags.map((flag, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">{flag}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-500">No risk flags</p>
              )}
            </div>
          </div>

          <div>
            <SectionHeader title="Financial Summary" />
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Exposure</span>
                  <p className="text-lg font-semibold text-foreground">{fmtCurrency(theCase.exposureAmount)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Expected Value</span>
                  <p className="text-lg font-semibold text-foreground">{fmtCurrency(theCase.expectedValue)}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">EV Confidence</span>
                  <p className="text-lg font-semibold text-foreground">{(theCase.evConfidence * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Hard Costs Remaining</span>
                  <p className="text-lg font-semibold text-foreground">{fmtCurrency(theCase.hardCostsRemaining)}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="Case Details" />
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              {[
                { label: "Venue", value: theCase.venue },
                { label: "Office", value: theCase.office },
                { label: "Pod", value: theCase.pod },
                { label: "Case Type", value: theCase.caseType },
                { label: "Open Date", value: theCase.openDate },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
