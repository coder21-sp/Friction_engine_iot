import type { ReactNode } from 'react';

type SectionProps = { children: ReactNode; className?: string; delay?: number };

export function FadeIn({ children, className = '' }: SectionProps) {
  return <div className={className}>{children}</div>;
}

export const StaggerContainer = FadeIn;
export const StaggerItem = FadeIn;
