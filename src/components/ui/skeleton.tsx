import { cn } from '../../utils/cn';

interface Props {
  className?: string;
}

export function Skeleton({ className }: Props) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  );
}
