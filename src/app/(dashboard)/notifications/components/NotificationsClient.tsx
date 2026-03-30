'use client';
import React, { useState } from 'react';
import { Bell, CreditCard, Wrench, Users, FileText, BedDouble, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { mockActivityFeed } from '@/lib/mockData';
import Icon from '@/components/ui/AppIcon';


const typeIcons: Record<string, React.ElementType> = {
  payment: CreditCard,
  maintenance: Wrench,
  assignment: Users,
  invoice: FileText,
  room: BedDouble,
};

const typeBg: Record<string, string> = {
  payment: 'bg-green-50 text-green-600',
  maintenance: 'bg-amber-50 text-amber-600',
  assignment: 'bg-blue-50 text-blue-600',
  invoice: 'bg-purple-50 text-purple-600',
  room: 'bg-slate-50 text-slate-600',
};

function timeAgo(ts: string): string {
  const now = new Date('2026-03-26T07:00:00Z');
  const then = new Date(ts);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function NotificationsClient() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  function markAllRead() {
    setReadIds(new Set(mockActivityFeed.map(a => a.id)));
    toast.success('All notifications marked as read');
  }

  function markRead(id: string) {
    setReadIds(prev => new Set([...prev, id]));
  }

  const unreadCount = mockActivityFeed.filter(a => !readIds.has(a.id)).length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Notifications</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] bg-white border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden divide-y divide-[hsl(var(--border))]">
        {mockActivityFeed.map(item => {
          const Icon = typeIcons[item.type] || Bell;
          const isRead = readIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => markRead(item.id)}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[hsl(var(--muted)/0.4)] ${isRead ? 'opacity-60' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeBg[item.type]}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-[13px] leading-snug ${isRead ? 'text-[hsl(var(--muted-foreground))]' : 'font-medium text-[hsl(var(--foreground))]'}`}>
                    {item.message}
                  </p>
                  {!isRead && (
                    <div className="w-2 h-2 bg-[hsl(var(--primary))] rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{item.actor}</span>
                  {item.meta && (
                    <>
                      <span className="text-[hsl(var(--muted-foreground))]">·</span>
                      <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{item.meta}</span>
                    </>
                  )}
                  <span className="text-[hsl(var(--muted-foreground))]">·</span>
                  <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{timeAgo(item.timestamp)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
