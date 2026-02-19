import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb {
  label: string;
  path?: string;
}

interface Props {
  crumbs: Crumb[];
  className?: string;
}

export function Breadcrumbs({ crumbs, className }: Props) {
  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      <Link to="/control-tower" className="text-muted-foreground hover:text-foreground transition-colors">
        <Home size={14} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={12} className="text-muted-foreground" />
          {crumb.path ? (
            <Link to={crumb.path} className="text-muted-foreground hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
