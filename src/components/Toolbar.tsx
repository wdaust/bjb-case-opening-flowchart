interface Props {
  onAddNode: () => void;
  onAutoLayout: () => void;
  onFitView: () => void;
  onImport: () => void;
  onExport: () => void;
  onToggleTable: () => void;
  tableVisible: boolean;
  themeColor: string;
  onAddGroup: () => void;
}

export function Toolbar({
  onAddNode, onAutoLayout, onFitView,
  onImport, onExport, onToggleTable,
  tableVisible, themeColor, onAddGroup,
}: Props) {
  const btnStyle: React.CSSProperties = {
    padding: '6px 14px',
    border: '1px solid #ccc',
    borderRadius: 6,
    background: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'inherit',
  };

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      padding: '10px 16px',
      background: '#fafafa',
      borderBottom: '1px solid #e0e0e0',
      flexWrap: 'wrap',
    }}>
      <button onClick={onAddNode} style={{ ...btnStyle, background: themeColor, color: '#fff', borderColor: themeColor }}>
        + Add Node
      </button>
      <button onClick={onAddGroup} style={{ ...btnStyle, background: '#424242', color: '#fff', borderColor: '#424242' }}>
        + Add Group
      </button>
      <button onClick={onAutoLayout} style={btnStyle}>Auto Layout</button>
      <button onClick={onFitView} style={btnStyle}>Fit View</button>
      <button onClick={onImport} style={btnStyle}>Import JSON</button>
      <button onClick={onExport} style={{ ...btnStyle, background: themeColor, color: '#fff', borderColor: themeColor }}>
        Export JSON
      </button>
      <button onClick={onToggleTable} style={btnStyle}>
        {tableVisible ? 'Hide Table' : 'Show Table'}
      </button>
    </div>
  );
}
