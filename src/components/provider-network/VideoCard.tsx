import { Play, Clock } from 'lucide-react';
import { Badge } from '../ui/badge.tsx';
import { cn } from '../../utils/cn.ts';
import type { EducationVideo } from '../../data/providerNetworkData.ts';

interface Props {
  video: EducationVideo;
  onClick: (video: EducationVideo) => void;
}

export function VideoCard({ video, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(video)}
      className="rounded-lg border border-border bg-card overflow-hidden text-left hover:border-foreground/20 transition-all group w-full"
    >
      <div className={cn('relative h-24 flex items-center justify-center', video.thumbnailColor)}>
        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
          <Play size={18} className="text-white ml-0.5" />
        </div>
        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
          <Clock size={10} />
          {video.duration}
        </div>
      </div>
      <div className="p-2.5 space-y-1.5">
        <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{video.title}</h4>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
          {video.category}
        </Badge>
      </div>
    </button>
  );
}
