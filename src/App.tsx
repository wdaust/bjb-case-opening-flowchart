import { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import type { SectionData } from './types/flowchart.ts';
import { SectionTabs } from './components/SectionTabs.tsx';
import { FlowchartCanvas } from './components/FlowchartCanvas.tsx';
import { initDb, loadAllSections, saveSection, clearAllSections } from './utils/db.ts';
import './App.css';

const DATA_FILES = [
  'data/case-opening.json',
  'data/treatment-monitoring.json',
  'data/discovery.json',
  'data/expert-deposition.json',
];

const DARK_MODE_KEY = 'bjb-flowchart-dark';

export default function App() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [activeId, setActiveId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem(DARK_MODE_KEY) === 'true'; } catch { return false; }
  });
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    try { localStorage.setItem(DARK_MODE_KEY, String(darkMode)); } catch { /* ignore */ }
  }, [darkMode]);

  // Initialize DB + load data
  useEffect(() => {
    async function load() {
      // Init Neon table
      const ready = await initDb();
      setDbReady(ready);

      // Load saved sections from Neon
      const saved = ready ? await loadAllSections() : {};

      // Load static JSON files, prefer saved versions
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

  // Debounced save to Neon
  const handleSectionUpdate = useCallback((updated: SectionData) => {
    setSections(sects => sects.map(s => s.id === updated.id ? updated : s));

    // Debounce save — wait 500ms after last edit
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      if (!dbReady) return;
      setSaving(true);
      await saveSection(updated);
      setSaving(false);
    }, 500);
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
      <div className="app-loading">
        <div className="spinner" />
        Loading flowcharts...
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>BJB Performance Infrastructure</h1>
            <p className="app-subtitle">Litigation Process Flowcharts</p>
          </div>
          <div className="header-actions">
            {saving && (
              <span className="save-indicator">Saving...</span>
            )}
            {dbReady && !saving && (
              <span className="save-indicator saved">Saved to cloud</span>
            )}
            <button onClick={handleReset} className="header-btn" title="Reset all sections to defaults">
              Reset
            </button>
            <button
              onClick={() => setDarkMode(d => !d)}
              className="header-btn"
              title="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
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
            <p style={{ color: 'var(--text-muted, #666)', margin: '4px 0 0', fontSize: 13 }}>{activeSection.subtitle}</p>
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
