'use client';
import React from 'react';
import { CreditCard, Wrench, Users, FileText, BedDouble } from 'lucide-react';
import type { ActivityItem } from '@/lib/mockData';
import Link from 'next/link';


function timeAgo(ts: string): string {
  const now = new Date('2026-03-26T06:51:13Z');
  const then = new Date(ts);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const config = {
    payment: { icon: CreditCard, bg: 'bg-green-50', color: 'text-green-600' },
    maintenance: { icon: Wrench, bg: 'bg-amber-50', color: 'text-amber-600' },
    assignment: { icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
    invoice: { icon: FileText, bg: 'bg-purple-50', color: 'text-purple-600' },
    room: { icon: BedDouble, bg: 'bg-slate-50', color: 'text-slate-600' },
  };
  const { icon: Icon, bg, color } = config[type];
  return (
    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon size={14} className={color} />
    </div>
  );
}

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Recent Activity</h2>
        <Link href="/notifications" className="text-[12px] text-[hsl(var(--primary))] font-medium hover:underline">
          Open notifications
        </Link>
      </div>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 py-3 ${idx < items.length - 1 ? 'border-b border-[hsl(var(--border))]' : ''}`}
          >
            <ActivityIcon type={item.type} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[hsl(var(--foreground))] leading-snug">{item.message}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{item.actor}</span>
                {item.meta && (
                  <>
                    <span className="text-[hsl(var(--muted-foreground))]">·</span>
                    <span className="text-[12px] font-medium text-[hsl(var(--muted-foreground))]">{item.meta}</span>
                  </>
                )}
              </div>
            </div>
            <span className="text-[11px] text-[hsl(var(--muted-foreground))] tabular-nums flex-shrink-0 mt-0.5">
              {timeAgo(item.timestamp)}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-6 text-[13px] text-[hsl(var(--muted-foreground))]">No recent activity for this dorm yet.</p>
        )}
      </div>
    </div>
  );
}
