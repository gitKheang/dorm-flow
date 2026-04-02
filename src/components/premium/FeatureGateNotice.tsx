'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Lock } from 'lucide-react';

interface FeatureGateNoticeProps {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export default function FeatureGateNotice({
  eyebrow,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCta,
  secondaryLabel,
  secondaryHref,
}: FeatureGateNoticeProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
            <Lock size={12} />
            {eyebrow}
          </div>
          <h2 className="mt-4 text-[18px] font-semibold text-amber-950">
            {title}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-amber-900/85">
            {description}
          </p>
        </div>
        {(ctaLabel || secondaryLabel) && (
          <div className="flex flex-wrap gap-2">
            {ctaLabel && ctaHref ? (
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-900 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-amber-950"
              >
                {ctaLabel}
                <ArrowUpRight size={14} />
              </Link>
            ) : null}
            {ctaLabel && onCta ? (
              <button
                type="button"
                onClick={onCta}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-900 px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-amber-950"
              >
                {ctaLabel}
                <ArrowUpRight size={14} />
              </button>
            ) : null}
            {secondaryLabel && secondaryHref ? (
              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2.5 text-[13px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
              >
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
