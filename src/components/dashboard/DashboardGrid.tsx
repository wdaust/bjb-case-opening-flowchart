import { cn } from '../../utils/cn';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6;
  className?: string;
}

const colsMap = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
};

export function DashboardGrid({ children, cols = 4, className }: Props) {
  return (
    <div className={cn("grid gap-4", colsMap[cols], className)}>
      {children}
    </div>
  );
}
