'use client';
import React from 'react';
import Link from 'next/link';
import type { MaintenanceTicket } from '@/lib/mockData';

const priorityConfig = {
  Critical: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  High: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Medium: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  Low: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const statusConfig = {
  Open: { bg: 'bg-red-50', text: 'text-red-600' },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-600' },
  Resolved: { bg: 'bg-green-50', text: 'text-green-600' },
};

export default function MaintenanceList({ tickets }: { tickets: MaintenanceTicket[] }) {
  const activeTickets = tickets.filter((ticket) => ticket.status !== 'Resolved').sort((a, b) => {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return order?.[a?.priority] - order?.[b?.priority];
    }).slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Active Maintenance</h2>
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">{activeTickets.length} open tickets requiring attention</p>
        </div>
        <Link href="/maintenance" className="text-[12px] text-[hsl(var(--primary))] font-medium hover:underline">
          View all
        </Link>
      </div>
      <div className="space-y-2">
        {activeTickets.map((ticket) => {
          const pConf = priorityConfig?.[ticket?.priority];
          const sConf = statusConfig?.[ticket?.status];
          return (
            <div
              key={ticket?.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-[hsl(var(--muted)/0.5)] transition-colors cursor-pointer"
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${pConf?.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-medium text-[hsl(var(--foreground))] leading-snug truncate">{ticket?.title}</p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${sConf?.bg} ${sConf?.text}`}>
                    {ticket?.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Room {ticket?.roomNumber}</span>
                  <span className="text-[hsl(var(--muted-foreground))]">·</span>
                  <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${pConf?.bg} ${pConf?.text}`}>
                    {ticket?.priority}
                  </span>
                  <span className="text-[hsl(var(--muted-foreground))]">·</span>
                  <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{ticket?.category}</span>
                </div>
              </div>
            </div>
          );
        })}
        {activeTickets.length === 0 && (
          <p className="py-6 text-[13px] text-[hsl(var(--muted-foreground))]">No open maintenance items in this dorm.</p>
        )}
      </div>
    </div>
  );
}
