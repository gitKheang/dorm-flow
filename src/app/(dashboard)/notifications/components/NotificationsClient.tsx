'use client';

import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  CreditCard,
  FileText,
  ChefHat,
  Users,
  UtensilsCrossed,
  Wrench,
  BedDouble,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDemoSession } from '@/components/DemoSessionProvider';
import { mockActivityFeed } from '@/lib/mockData';

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  actor: string;
  meta?: string;
  timestamp: string;
}

const chefNotifications: NotificationItem[] = [
  {
    id: 'chef-001',
    type: 'meal',
    message: 'Lunch servings increased for Wednesday prep',
    actor: 'DormFlow System',
    meta: '+8 servings',
    timestamp: '2026-03-26T05:50:00Z',
  },
  {
    id: 'chef-002',
    type: 'chef',
    message: 'Tomorrow breakfast plan was updated by the dorm owner',
    actor: 'Admin User',
    meta: 'Breakfast',
    timestamp: '2026-03-25T17:10:00Z',
  },
  {
    id: 'chef-003',
    type: 'chef',
    message: 'Kitchen prep starts at 5:30 AM for Friday service',
    actor: 'DormFlow System',
    meta: 'Reminder',
    timestamp: '2026-03-25T09:00:00Z',
  },
];

const typeIcons: Record<string, React.ElementType> = {
  payment: CreditCard,
  maintenance: Wrench,
  assignment: Users,
  invoice: FileText,
  room: BedDouble,
  meal: UtensilsCrossed,
  chef: ChefHat,
};

const typeBg: Record<string, string> = {
  payment: 'bg-green-50 text-green-600',
  maintenance: 'bg-amber-50 text-amber-600',
  assignment: 'bg-blue-50 text-blue-600',
  invoice: 'bg-slate-50 text-slate-700',
  room: 'bg-slate-50 text-slate-600',
  meal: 'bg-orange-50 text-orange-600',
  chef: 'bg-yellow-50 text-yellow-700',
};

function timeAgo(timestamp: string): string {
  const now = new Date('2026-03-26T07:00:00Z');
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

export default function NotificationsClient() {
  const { session } = useDemoSession();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(() => {
    if (!session) return [];

    if (session.role === 'Chef') {
      return chefNotifications;
    }

    if (session.role === 'Tenant') {
      return mockActivityFeed.filter((item) => {
        const isOwnActor = item.actor === session.name;
        const isRoomRelated = session.roomNumber ? item.message.includes(`Room ${session.roomNumber}`) : false;
        const isInvoiceReminder = item.type === 'invoice';
        return isOwnActor || isRoomRelated || isInvoiceReminder;
      });
    }

    return mockActivityFeed;
  }, [session]);

  if (!session) {
    return null;
  }

  function markAllRead() {
    setReadIds(new Set(notifications.map((notification) => notification.id)));
    toast.success('All notifications marked as read');
  }

  function markRead(id: string) {
    setReadIds((currentReadIds) => new Set([...currentReadIds, id]));
  }

  const unreadCount = notifications.filter((notification) => !readIds.has(notification.id)).length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
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

      <div className="bg-white rounded-xl border border-[hsl(var(--border))] overflow-hidden divide-y divide-[hsl(var(--border))]">
        {notifications.map((item) => {
          const Icon = typeIcons[item.type] || Bell;
          const isRead = readIds.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => markRead(item.id)}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-[hsl(var(--muted)/0.4)] ${isRead ? 'opacity-60' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeBg[item.type] ?? 'bg-slate-50 text-slate-600'}`}>
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
        {notifications.length === 0 && (
          <div className="px-6 py-10 text-center">
            <Bell size={28} className="mx-auto mb-3 text-[hsl(var(--muted-foreground))] opacity-40" />
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
