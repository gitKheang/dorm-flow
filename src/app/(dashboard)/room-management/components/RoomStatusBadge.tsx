'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { RoomStatus } from '@/lib/mockData';

const statusConfig: Record<RoomStatus, { bg: string; text: string; dot: string }> = {
  Occupied: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  Available: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  'Under Maintenance': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  Reserved: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
};

interface RoomStatusBadgeProps {
  status: RoomStatus;
  onStatusChange: (s: RoomStatus) => void;
}

export default function RoomStatusBadge({ status, onStatusChange }: RoomStatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const conf = statusConfig[status];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium transition-all ${conf.bg} ${conf.text} hover:shadow-sm`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
        {status}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg p-1 min-w-[160px] fade-in">
          {(Object.keys(statusConfig) as RoomStatus[]).map(s => {
            const c = statusConfig[s];
            return (
              <button
                key={`status-opt-${s}`}
                onClick={() => { onStatusChange(s); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] hover:bg-[hsl(var(--muted))] transition-colors text-left ${s === status ? 'font-medium' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                {s}
                {s === status && <span className="ml-auto text-[hsl(var(--primary))]">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}