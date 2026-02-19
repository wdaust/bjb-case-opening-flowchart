export interface TaskStyle {
  fill: string;
  stroke: string;
  color: string;
}

export interface LegendItem {
  label: string;
  color: string;
}

export interface Subgraph {
  id: string;
  title: string;
  taskIds: string[];
}

export interface TableBanner {
  before?: string;
  after?: string;
  text: string;
  color: string;
  bg: string;
}

export interface Task {
  id: string;
  label: string;
  emoji?: string;
  assignedTo: string;
  sla: string;
  phase: string;
  phaseClass: string;
  quickAction: string;
  style: string;
  connectsTo: string[];
  isStartNode?: boolean;
  excludeFromTable?: boolean;
  edgeLabels?: Record<string, string>;
  function?: string;
  notes?: string;
  bannerAfter?: string;
  bannerColor?: string;
  bannerBg?: string;
}

export interface SectionData {
  id: string;
  title: string;
  subtitle: string;
  headerClass: string;
  themeColor: string;
  thClass: string;
  sectionClass: string;
  tableColumns: string[];
  legend: LegendItem[];
  subgraphs?: Subgraph[];
  tableBanners?: TableBanner[];
  tasks: Task[];
  styles: Record<string, TaskStyle>;
}
