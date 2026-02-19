import type { Task } from '../types/flowchart.ts';

export function generateNextId(tasks: Task[]): string {
  const ids = tasks.map(t => t.id);
  let num = 1;
  while (ids.includes(`T${num}`)) {
    num++;
  }
  return `T${num}`;
}
