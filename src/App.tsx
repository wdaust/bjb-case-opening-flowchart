import { useState, useEffect, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import type { SectionData } from './types/flowchart.ts';
import { SectionTabs } from './components/SectionTabs.tsx';
import { FlowchartCanvas } from './components/FlowchartCanvas.tsx';
import './App.css';

const DATA_FILES = [
  'data/case-opening.json',
  'data/treatment-monitoring.json',
  'data/discovery.json',
  'data/expert-deposition.json',
];

export default function App() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [activeId, setActiveId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const results: SectionData[] = [];
      for (const file of DATA_FILES) {
        try {
          const base = import.meta.env.BASE_URL;
          const resp = await fetch(`${base}${file}`);
          if (!resp.ok) throw new Error(`Failed to load ${file}`);
          const data = await resp.json();
          results.push(data);
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
  }, []);

  const activeSection = sections.find(s => s.id === activeId);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        Loading flowcharts...
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>BJB Performance Infrastructure</h1>
        <p className="app-subtitle">Litigation Process Flowcharts</p>
      </header>

      <SectionTabs
        sections={sections}
        activeId={activeId}
        onSelect={setActiveId}
      />

      {activeSection && (
        <div className="section-container">
          <div className="section-info">
            <h2 style={{ color: activeSection.themeColor, margin: 0 }}>{activeSection.title}</h2>
            <p style={{ color: '#666', margin: '4px 0 0', fontSize: 13 }}>{activeSection.subtitle}</p>
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
