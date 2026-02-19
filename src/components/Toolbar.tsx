interface Props {
  onAddNode: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
  onImport: () => void;
  onExport: () => void;
  onExportPng: () => void;
  onToggleTable: () => void;
  tableVisible: boolean;
  themeColor: string;
  onAddGroup: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (a: string) => void;
  assignees: string[];
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function Toolbar({
  onAddNode, onAutoLayout, onFitView,
  onImport, onExport, onExportPng, onToggleTable,
  tableVisible, themeColor, onAddGroup,
  searchQuery, onSearchChange,
  assigneeFilter, onAssigneeFilterChange, assignees,
  onUndo, onRedo, canUndo, canRedo,
}: Props) {
  const btnStyle: React.CSSProperties = {
    padding: '6px 14px',
    border: '1px solid var(--border-color, #ccc)',
    borderRadius: 6,
    background: 'var(--btn-bg, #fff)',
    color: 'var(--text-color, #333)',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
  };

  const primaryBtn: React.CSSProperties = {
    ...btnStyle,
    background: themeColor,
    color: '#fff',
    borderColor: themeColor,
  };

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '10px 16px',
      background: 'var(--toolbar-bg, #fafafa)',
      borderBottom: '1px solid var(--border-color, #e0e0e0)',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}>
      {/* Actions */}
      <button onClick={onAddNode} style={primaryBtn}>+ Add Node</button>
      <button onClick={onAddGroup} style={{ ...btnStyle, background: 'var(--text-color, #424242)', color: 'var(--surface, #fff)', borderColor: 'var(--text-color, #424242)' }}>
        + Add Group
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--border-color, #ddd)' }} />

      {/* Undo/Redo */}
      <button onClick={onUndo} disabled={!canUndo} style={{ ...btnStyle, opacity: canUndo ? 1 : 0.4 }} title="Undo (Ctrl+Z)">
        ↩ Undo
      </button>
      <button onClick={onRedo} disabled={!canRedo} style={{ ...btnStyle, opacity: canRedo ? 1 : 0.4 }} title="Redo (Ctrl+Shift+Z)">
        ↪ Redo
      </button>

      <div style={{ width: 1, height: 24, background: 'var(--border-color, #ddd)' }} />

      {/* Layout/View */}
      <button onClick={onAutoLayout} style={btnStyle}>Auto Layout</button>
      <button onClick={onFitView} style={btnStyle}>Fit View</button>

      <div style={{ width: 1, height: 24, background: 'var(--border-color, #ddd)' }} />

      {/* Import/Export */}
      <button onClick={onImport} style={btnStyle}>Import JSON</button>
      <button onClick={onExport} style={primaryBtn}>Export JSON</button>
      <button onClick={onExportPng} style={btnStyle}>Export PNG</button>

      <div style={{ width: 1, height: 24, background: 'var(--border-color, #ddd)' }} />

      <button onClick={onToggleTable} style={btnStyle}>
        {tableVisible ? 'Hide Table' : 'Show Table'}
      </button>

      {/* Spacer pushes search/filter to the right on wide screens */}
      <div style={{ flex: 1, minWidth: 8 }} />

      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="Search nodes..."
        style={{
          padding: '6px 10px',
          border: '1px solid var(--border-color, #ccc)',
          borderRadius: 6,
          fontSize: 13,
          width: 160,
          background: 'var(--input-bg, #fff)',
          color: 'var(--text-color, #333)',
          fontFamily: 'inherit',
        }}
      />

      {/* Assignee filter */}
      <select
        value={assigneeFilter}
        onChange={e => onAssigneeFilterChange(e.target.value)}
        style={{
          padding: '6px 10px',
          border: '1px solid var(--border-color, #ccc)',
          borderRadius: 6,
          fontSize: 13,
          background: 'var(--input-bg, #fff)',
          color: 'var(--text-color, #333)',
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        <option value="">All Assignees</option>
        {assignees.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>
    </div>
  );
}
