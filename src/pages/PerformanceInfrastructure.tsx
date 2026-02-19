import { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import type { SectionData } from '../types/flowchart.ts';
import { SectionTabs } from '../components/SectionTabs.tsx';
import { FlowchartCanvas } from '../components/FlowchartCanvas.tsx';
import { Button } from '../components/ui/button.tsx';
import { Badge } from '../components/ui/badge.tsx';
import { initDb, loadAllSections, saveSection, clearAllSections } from '../utils/db.ts';
import { RotateCcw } from 'lucide-react';

const DATA_FILES = [
  'data/case-opening.json',
  'data/treatment-monitoring.json',
  'data/discovery.json',
  'data/expert-deposition.json',
  'data/arbitration-mediation.json',
  'data/trials.json',
];

export default function PerformanceInfrastructure() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [activeId, setActiveId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    async function load() {
      const ready = await initDb();
      setDbReady(ready);
      const saved = ready ? await loadAllSections() : {};
      const results: SectionData[] = [];
      for (const file of DATA_FILES) {
        try {
          const base = import.meta.env.BASE_URL;
          const resp = await fetch(`${base}${file}`);
          if (!resp.ok) throw new Error(`Failed to load ${file}`);
          const data: SectionData = await resp.json();
          results.push(saved[data.id] || data);
        } catch (err) {
          console.error(`Error loading ${file}:`, err);
        }
      }
      setSections(results);
      if (results.length > 0) setActiveId(results[0].id);
      setLoading(false);
    }
    load();
  }, []);

  const handleSectionUpdate = useCallback((updated: SectionData) => {
    setSections(sects => sects.map(s => s.id === updated.id ? updated : s));
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!dbReady) return;
      setSaving(true);
      await saveSection(updated);
      setSaving(false);
    }, 500);
  }, [dbReady]);

  const handleRenameSection = useCallback((id: string, newTitle: string) => {
    setSections(sects => {
      const updated = sects.map(s => s.id === id ? { ...s, title: newTitle } : s);
      const target = updated.find(s => s.id === id);
      if (target && dbReady) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
          setSaving(true);
          await saveSection(target);
          setSaving(false);
        }, 500);
      }
      return updated;
    });
  }, [dbReady]);

  const handleReset = useCallback(async () => {
    if (!confirm('Reset all sections to defaults? Your edits will be lost.')) return;
    if (dbReady) await clearAllSections();
    const results: SectionData[] = [];
    for (const file of DATA_FILES) {
      try {
        const base = import.meta.env.BASE_URL;
        const resp = await fetch(`${base}${file}`);
        if (!resp.ok) continue;
        results.push(await resp.json());
      } catch { /* ignore */ }
    }
    setSections(results);
    if (results.length > 0) setActiveId(results[0].id);
  }, [dbReady]);

  const activeSection = sections.find(s => s.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-muted-foreground text-sm">
        <div className="spinner" />
        Loading flowcharts...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="flex items-center justify-between px-5 py-3 bg-background border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Performance Infrastructure</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Litigation Process Flowcharts</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <Badge variant="secondary" className="animate-pulse">Saving...</Badge>
          )}
          {dbReady && !saving && (
            <Badge variant="outline" className="text-green-500 border-green-500/30">Saved</Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </header>

      <SectionTabs
        sections={sections}
        activeId={activeId}
        onSelect={setActiveId}
        onRenameSection={handleRenameSection}
      />

      {activeSection && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-5 pt-3 pb-1.5 shrink-0">
            <h2 className="text-sm font-medium text-foreground">{activeSection.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{activeSection.subtitle}</p>
          </div>
          <ReactFlowProvider key={activeSection.id}>
            <FlowchartCanvas
              section={activeSection}
              onSectionUpdate={handleSectionUpdate}
            />
          </ReactFlowProvider>
        </div>
      )}
    </div>
  );
}
