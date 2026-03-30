'use client';
import React, { useState, useMemo } from 'react';
import { Search, Plus, Wrench, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { mockMaintenanceTickets, MaintenanceStatus, MaintenancePriority } from '@/lib/mockData';

const priorityColors: Record<MaintenancePriority, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
};

const statusColors: Record<MaintenanceStatus, string> = {
  Open: 'bg-red-100 text-red-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  Resolved: 'bg-green-100 text-green-700',
};

export default function MaintenanceClient() {
  const [tickets, setTickets] = useState(mockMaintenanceTickets);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<MaintenancePriority | 'All'>('All');

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.title.toLowerCase().includes(q) || t.roomNumber.includes(q) || t.tenantName.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'All' || t.status === filterStatus;
      const matchPriority = filterPriority === 'All' || t.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, filterStatus, filterPriority]);

  function handleStatusChange(id: string, status: MaintenanceStatus) {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status, updatedDate: '2026-03-26' } : t));
    toast.success('Ticket status updated');
  }

  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
  const criticalCount = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Maintenance</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {tickets.length} total tickets
          </p>
        </div>
        <button
          onClick={() => toast.info('Create ticket feature coming soon')}
          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
        >
          <Plus size={15} />
          New Ticket
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-[12px] font-medium text-red-700 uppercase tracking-wider">Open</span>
          </div>
          <p className="text-2xl font-700 text-red-800">{openCount}</p>
          <p className="text-[12px] text-red-600 mt-1">{criticalCount} critical</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-blue-600" />
            <span className="text-[12px] font-medium text-blue-700 uppercase tracking-wider">In Progress</span>
          </div>
          <p className="text-2xl font-700 text-blue-800">{inProgressCount}</p>
          <p className="text-[12px] text-blue-600 mt-1">Being worked on</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-[12px] font-medium text-green-700 uppercase tracking-wider">Resolved</span>
          </div>
          <p className="text-2xl font-700 text-green-800">{tickets.filter(t => t.status === 'Resolved').length}</p>
          <p className="text-[12px] text-green-600 mt-1">Completed tickets</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as MaintenanceStatus | 'All')}
          className="px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
        >
          <option value="All">All Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as MaintenancePriority | 'All')}
          className="px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
        >
          <option value="All">All Priority</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {filtered.map(ticket => (
          <div key={ticket.id} className="bg-white rounded-xl border border-[hsl(var(--border))] p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="bg-[hsl(var(--muted))] p-2.5 rounded-lg flex-shrink-0">
                  <Wrench size={16} className="text-[hsl(var(--muted-foreground))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-[hsl(var(--foreground))]">{ticket.title}</p>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-1">{ticket.description}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Room {ticket.roomNumber}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">·</span>
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{ticket.tenantName}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">·</span>
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{ticket.category}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">·</span>
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Submitted {ticket.submittedDate}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <select
                  value={ticket.status}
                  onChange={e => handleStatusChange(ticket.id, e.target.value as MaintenanceStatus)}
                  className={`text-[12px] font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] ${statusColors[ticket.status]}`}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-[hsl(var(--border))]">
            <Wrench size={32} className="text-[hsl(var(--muted-foreground))] mx-auto mb-2 opacity-40" />
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No tickets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
