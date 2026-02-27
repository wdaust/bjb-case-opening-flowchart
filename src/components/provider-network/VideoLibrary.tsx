import { useState } from 'react';
import { cn } from '../../utils/cn.ts';
import { VideoCard } from './VideoCard.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog.tsx';
import { EDUCATION_VIDEOS, VIDEO_CATEGORIES, type EducationVideo } from '../../data/providerNetworkData.ts';

export function VideoLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedVideo, setSelectedVideo] = useState<EducationVideo | null>(null);

  const filtered = selectedCategory === 'All'
    ? EDUCATION_VIDEOS
    : EDUCATION_VIDEOS.filter(v => v.category === selectedCategory);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Education Library</h3>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory('All')}
          className={cn(
            'px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors',
            selectedCategory === 'All'
              ? 'bg-foreground text-background'
              : 'bg-muted/50 text-muted-foreground hover:text-foreground'
          )}
        >
          All
        </button>
        {VIDEO_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors',
              selectedCategory === cat
                ? 'bg-foreground text-background'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(video => (
          <VideoCard key={video.id} video={video} onClick={setSelectedVideo} />
        ))}
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
            <DialogDescription>{selectedVideo?.category} &middot; {selectedVideo?.duration}</DialogDescription>
          </DialogHeader>
          <div className={cn('h-48 rounded-lg flex items-center justify-center', selectedVideo?.thumbnailColor)}>
            <div className="text-center text-white space-y-2">
              <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center mx-auto">
                <span className="text-2xl">&#9654;</span>
              </div>
              <p className="text-sm opacity-70">Video player placeholder</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{selectedVideo?.description}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
