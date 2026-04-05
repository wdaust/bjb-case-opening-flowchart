import { cn } from '../../utils/cn';
import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  info?: string;
}

export function SectionHeader({ title, subtitle, actions, className, info }: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-4", className)}>
      <div>
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {info && <InfoTooltip text={info} />}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
