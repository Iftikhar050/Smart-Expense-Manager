import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gray' | 'blue' | 'purple' | 'teal' | 'accent' | 'secondary' | 'red';
  className?: string;
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  const variants = {
    gray: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    teal: 'bg-teal-100 text-teal-700',
    accent: 'bg-accent/10 text-accent',
    secondary: 'bg-secondary/10 text-secondary',
    red: 'bg-red-100 text-red-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function SplitTypeBadge({ type }: { type: string }) {
  const mapping: Record<string, BadgeProps['variant']> = {
    EQUAL: 'gray',
    EXACT: 'blue',
    PERCENTAGE: 'purple',
    SHARES: 'teal'
  };
  return <Badge variant={mapping[type] || 'gray'}>{type}</Badge>;
}
