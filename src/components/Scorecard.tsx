import React from 'react';
import { cn, formatNumber } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

interface ScorecardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  className?: string;
}

export const Scorecard: React.FC<ScorecardProps> = ({ title, value, icon: Icon, description, className }) => {
  return (
    <div className={cn("bg-sleek-card p-4 rounded-lg border border-sleek-border flex flex-col items-center justify-center text-center", className)}>
      <h3 className="text-[12px] font-medium text-sleek-text-secondary uppercase tracking-[0.5px] mb-1">{title}</h3>
      <div className="text-[28px] font-bold text-sleek-accent leading-tight">
        {value}
      </div>
      {description && <span className="text-[10px] text-sleek-text-secondary mt-1 opacity-70">{description}</span>}
    </div>
  );
};
