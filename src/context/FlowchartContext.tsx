import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import type { SectionData, Task } from '../types/flowchart.ts';

type Action =
  | { type: 'SET_SECTION'; payload: SectionData }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'ADD_EDGE'; payload: { source: string; target: string; label?: string } }
  | { type: 'DELETE_EDGE'; payload: { source: string; target: string } }
  | { type: 'IMPORT_JSON'; payload: SectionData };

function reducer(state: SectionData | null, action: Action): SectionData | null {
  if (!state && action.type !== 'SET_SECTION' && action.type !== 'IMPORT_JSON') return state;

  switch (action.type) {
    case 'SET_SECTION':
    case 'IMPORT_JSON':
      return action.payload;

    case 'ADD_TASK':
      return { ...state!, tasks: [...state!.tasks, action.payload] };

    case 'UPDATE_TASK':
      return {
        ...state!,
        tasks: state!.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      };

    case 'DELETE_TASK': {
      const removedId = action.payload;
      const tasks = state!.tasks
        .filter(t => t.id !== removedId)
        .map(t => ({
          ...t,
          connectsTo: t.connectsTo.filter(id => id !== removedId),
          edgeLabels: t.edgeLabels
            ? Object.fromEntries(Object.entries(t.edgeLabels).filter(([k]) => k !== removedId))
            : undefined,
        }));
      const subgraphs = state!.subgraphs?.map(sg => ({
        ...sg,
        taskIds: sg.taskIds.filter(id => id !== removedId),
      }));
      return { ...state!, tasks, subgraphs };
    }

    case 'ADD_EDGE': {
      const { source, target, label } = action.payload;
      const tasks = state!.tasks.map(t => {
        if (t.id !== source) return t;
        if (t.connectsTo.includes(target)) return t;
        const updated = { ...t, connectsTo: [...t.connectsTo, target] };
        if (label) {
          updated.edgeLabels = { ...updated.edgeLabels, [target]: label };
        }
        return updated;
      });
      return { ...state!, tasks };
    }

    case 'DELETE_EDGE': {
      const { source, target } = action.payload;
      const tasks = state!.tasks.map(t => {
        if (t.id !== source) return t;
        const updated = {
          ...t,
          connectsTo: t.connectsTo.filter(id => id !== target),
        };
        if (updated.edgeLabels) {
          const { [target]: _, ...rest } = updated.edgeLabels;
          void _;
          updated.edgeLabels = Object.keys(rest).length > 0 ? rest : undefined;
        }
        return updated;
      });
      return { ...state!, tasks };
    }

    default:
      return state;
  }
}

const FlowchartContext = createContext<SectionData | null>(null);
const FlowchartDispatchContext = createContext<Dispatch<Action>>(() => {});

export function FlowchartProvider({ children, initial }: { children: ReactNode; initial: SectionData }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <FlowchartContext.Provider value={state}>
      <FlowchartDispatchContext.Provider value={dispatch}>
        {children}
      </FlowchartDispatchContext.Provider>
    </FlowchartContext.Provider>
  );
}

export function useFlowchartState() {
  return useContext(FlowchartContext);
}

export function useFlowchartDispatch() {
  return useContext(FlowchartDispatchContext);
}
