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
      <rect x="6" y="8" width="52" height="52" rx="16" fill={badgeFill} />
      <path
        d="M18 31L32 19L46 31V48C46 49.1046 45.1046 50 44 50H20C18.8954 50 18 49.1046 18 48V31Z"
        fill={buildingFill}
      />
      <path
        d="M16 31L32 17L48 31"
        stroke={accentStroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="28.5" y="36" width="7" height="14" rx="2" fill={detailFill} />
      <rect x="22" y="31.5" width="5" height="5" rx="1.25" fill={detailFill} />
      <rect x="37" y="31.5" width="5" height="5" rx="1.25" fill={detailFill} />
      <rect x="22" y="39.5" width="5" height="5" rx="1.25" fill={detailFill} />
      <rect x="37" y="39.5" width="5" height="5" rx="1.25" fill={detailFill} />
    </svg>
  );
});

export default DormFlowMark;
