'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import type { DormPlan } from '@/lib/plans';

interface PlanBadgeProps {
  plan: DormPlan;
  className?: string;
}

export default function PlanBadge({ plan, className = '' }: PlanBadgeProps) {
  const premium = plan === 'premium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
        premium
          ? 'border border-amber-200 bg-amber-50 text-amber-800'
          : 'border border-slate-200 bg-slate-50 text-slate-700'
      } ${className}`.trim()}
    >
      <Crown size={12} />
      {premium ? 'Premium' : 'Free'}
    </span>
  );
}
