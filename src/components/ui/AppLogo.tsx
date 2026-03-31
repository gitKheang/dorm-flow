'use client';

import React, { memo, useMemo } from 'react';
import AppIcon from './AppIcon';
import AppImage from './AppImage';
import DormFlowMark from './DormFlowMark';

interface AppLogoProps {
  src?: string; // Image source (optional)
  iconName?: string; // Optional icon name override
  size?: number; // Size for icon/image
  className?: string; // Additional classes
  onClick?: () => void; // Click handler
  theme?: 'brand' | 'light';
}

const AppLogo = memo(function AppLogo({
  src,
  iconName,
  size = 64,
  className = '',
  onClick,
  theme = 'brand',
}: AppLogoProps) {
  // Memoize className calculation
  const containerClassName = useMemo(() => {
    const classes = ['flex items-center'];
    if (onClick) classes.push('cursor-pointer hover:opacity-80 transition-opacity');
    if (className) classes.push(className);
    return classes.join(' ');
  }, [onClick, className]);

  return (
    <div className={containerClassName} onClick={onClick}>
      {/* Show image if src provided, otherwise render the dorm mark by default */}
      {src ? (
        <AppImage
          src={src}
          alt="Logo" 
          width={size}
          height={size}
          className="flex-shrink-0"
          priority={true}
          unoptimized={src.endsWith('.svg')}
        />
      ) : iconName ? (
        <AppIcon name={iconName} size={size} className="flex-shrink-0" />
      ) : (
        <DormFlowMark size={size} theme={theme} className="flex-shrink-0" />
      )}
    </div>
  );
});

export default AppLogo;
