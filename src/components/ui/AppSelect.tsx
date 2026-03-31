'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface AppSelectOption {
  value: string;
  label: string;
}

interface AppSelectProps {
  value: string;
  options: AppSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string | ((option: AppSelectOption, isSelected: boolean) => string);
  disabled?: boolean;
  fullWidth?: boolean;
  align?: 'left' | 'right';
  renderValue?: (option: AppSelectOption | undefined) => React.ReactNode;
  renderOption?: (option: AppSelectOption, isSelected: boolean) => React.ReactNode;
}

export default function AppSelect({
  value,
  options,
  onChange,
  ariaLabel,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  optionClassName = '',
  disabled = false,
  fullWidth = false,
  align = 'left',
  renderValue,
  renderOption,
}: AppSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const resolvedOptionClassName = (option: AppSelectOption, isSelected: boolean) => {
    if (typeof optionClassName === 'function') {
      return optionClassName(option, isSelected);
    }

    return optionClassName;
  };

  return (
    <div
      ref={rootRef}
      className={`relative ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className={[
          'flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-left text-[13px] text-[hsl(var(--foreground))] transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] disabled:cursor-not-allowed disabled:opacity-60',
          fullWidth ? 'w-full' : '',
          triggerClassName,
        ].join(' ')}
      >
        <span className="min-w-0 flex-1 truncate">
          {renderValue ? renderValue(selectedOption) : selectedOption?.label ?? ''}
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-[hsl(var(--muted-foreground))] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className={[
            'absolute top-[calc(100%+0.375rem)] z-50 max-h-64 min-w-full overflow-y-auto rounded-xl border border-[hsl(var(--border))] bg-white p-1.5 shadow-lg fade-in',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName,
          ].join(' ')}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={[
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-[hsl(var(--muted))]',
                  isSelected ? 'font-medium text-[hsl(var(--foreground))]' : 'text-[hsl(var(--foreground))]',
                  resolvedOptionClassName(option, isSelected),
                ].join(' ')}
              >
                <span className="min-w-0 flex-1 truncate">
                  {renderOption ? renderOption(option, isSelected) : option.label}
                </span>
                {isSelected && <Check size={14} className="flex-shrink-0 text-[hsl(var(--primary))]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
