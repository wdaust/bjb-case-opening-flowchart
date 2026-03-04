interface Props {
  title: string;
  subtitle: string;
}

export function HeroTitle({ title, subtitle }: Props) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
        <span className="hero-live-badge flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">Live</span>
        </span>
      </div>
      <p className="text-sm text-white/40">{subtitle}</p>
      <div className="hero-accent-line w-48 mt-1" />
    </div>
  );
}
