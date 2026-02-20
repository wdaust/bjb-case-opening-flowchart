import { RotateCcw } from 'lucide-react';
import { LitifyMatterNav, type MatterId } from './LitifyMatterNav.tsx';
import { Button } from '../ui/button.tsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs.tsx';
import { LitifyRecordHeader, type RecordHeaderField, type StatusBadge } from './LitifyRecordHeader.tsx';
import { LitifyPathBar, type PathBarStage } from './LitifyPathBar.tsx';
import { LitifyUtilityBar, type UtilityBarItem } from './LitifyUtilityBar.tsx';

// ── Types ──────────────────────────────────────────────────────────────

export interface MatterTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface LitifyMatterLayoutProps {
  title: string;
  activeMatterId: MatterId;
  recordHeaderProps: {
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
    fields: RecordHeaderField[];
    statusBadge: StatusBadge;
  };
  pathBarProps: {
    stages: PathBarStage[];
    onStageClick: (stage: PathBarStage) => void;
    currentTaskLabel?: string;
  };
  tabs: MatterTab[];
  utilityBarItems: UtilityBarItem[];
  onReset?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────

export function LitifyMatterLayout({
  title,
  activeMatterId,
  recordHeaderProps,
  pathBarProps,
  tabs,
  utilityBarItems,
  onReset,
}: LitifyMatterLayoutProps) {
  const defaultTab = tabs.length > 0 ? tabs[0].id : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Top navigation */}
      <div className="mx-6 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          {onReset && (
            <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
        <LitifyMatterNav active={activeMatterId} />
      </div>

      {/* Record header */}
      <div className="mx-6 mt-4">
        <LitifyRecordHeader {...recordHeaderProps} />
      </div>

      {/* Path bar */}
      <div className="mx-6 mt-4">
        <LitifyPathBar {...pathBarProps} />
      </div>

      {/* Tabs */}
      {defaultTab && (
        <Tabs defaultValue={defaultTab} className="mx-6 mt-4 flex flex-col flex-1 min-h-0">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Utility bar */}
      <LitifyUtilityBar items={utilityBarItems} />
    </div>
  );
}
