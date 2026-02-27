import { SectionHeader } from '../../components/dashboard/SectionHeader.tsx';
import { VideoLibrary } from '../../components/provider-network/VideoLibrary.tsx';

export default function EducationLibrary() {
  return (
    <div className="space-y-6 mt-4">
      <SectionHeader
        title="Education Library"
        subtitle="Training videos and resources for providers and staff"
      />
      <VideoLibrary />
    </div>
  );
}
