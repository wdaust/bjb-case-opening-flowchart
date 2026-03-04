import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function HeroSection({ children }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-6">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 hero-gradient-bg opacity-100" />

      {/* Second layer for depth */}
      <div
        className="absolute inset-0 hero-gradient-bg opacity-60"
        style={{ animationDelay: '-7s', filter: 'blur(40px)' }}
      />

      {/* Content */}
      <div className="relative z-10 p-6 space-y-4">
        {children}
      </div>

      {/* Gradient divider at bottom */}
      <div className="relative z-10 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
    </div>
  );
}
