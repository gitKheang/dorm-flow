'use client';

import React, { memo } from 'react';

interface DormFlowMarkProps {
  size?: number;
  className?: string;
  theme?: 'brand' | 'light';
}

const DormFlowMark = memo(function DormFlowMark({
  size = 64,
  className = '',
  theme = 'brand',
}: DormFlowMarkProps) {
  const badgeFill = theme === 'light' ? '#ffffff' : 'hsl(var(--primary))';
  const buildingFill = theme === 'light' ? 'hsl(var(--primary))' : '#ffffff';
  const detailFill = theme === 'light' ? '#ffffff' : 'hsl(var(--primary))';
  const accentStroke = theme === 'light' ? '#f1b541' : 'hsl(var(--accent))';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Badge */}
      <rect x="6" y="8" width="52" height="52" rx="16" fill={badgeFill} />

      {/* Main building — tall dorm block */}
      <rect x="22" y="18" width="20" height="32" rx="2" fill={buildingFill} />

      {/* Side wing — lower annexe for depth */}
      <rect x="14" y="28" width="12" height="22" rx="2" fill={buildingFill} />

      {/* Window grid — main block (3 rows x 3 cols) */}
      <rect x="25" y="22" width="4" height="4" rx="1" fill={detailFill} />
      <rect x="30" y="22" width="4" height="4" rx="1" fill={detailFill} />
      <rect x="35" y="22" width="4" height="4" rx="1" fill={detailFill} />
      <rect x="25" y="29" width="4" height="4" rx="1" fill={detailFill} />
      <rect x="30" y="29" width="4" height="4" rx="1" fill={detailFill} />
      <rect x="35" y="29" width="4" height="4" rx="1" fill={detailFill} />
      <rect x="25" y="36" width="4" height="4" rx="1" fill={detailFill} />
      <rect x="30" y="36" width="4" height="4" rx="1" fill={detailFill} />
      <rect x="35" y="36" width="4" height="4" rx="1" fill={detailFill} />

      {/* Door — main entrance */}
      <rect x="30" y="43" width="4" height="7" rx="1" fill={detailFill} />

      {/* Window grid — side wing (2 rows x 2 cols) */}
      <rect x="16" y="31" width="3.5" height="3.5" rx="0.75" fill={detailFill} />
      <rect x="21" y="31" width="3.5" height="3.5" rx="0.75" fill={detailFill} />
      <rect x="16" y="37" width="3.5" height="3.5" rx="0.75" fill={detailFill} />
      <rect x="21" y="37" width="3.5" height="3.5" rx="0.75" fill={detailFill} />

      {/* Flow accent — curved line suggesting movement / flow */}
      <path
        d="M44 44C46 38 48 30 46 22"
        stroke={accentStroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
});

export default DormFlowMark;
