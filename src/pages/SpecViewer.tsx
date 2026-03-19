import { useParams } from 'react-router-dom';

export default function SpecViewer() {
  const { page } = useParams<{ page: string }>();
  const src = `${import.meta.env.BASE_URL}specs/${page || 'index.html'}`;

  return (
    <iframe
      src={src}
      title="BJB Litify Specification"
      className="w-full border-0"
      style={{ height: 'calc(100vh - 3.5rem)' }}
    />
  );
}
