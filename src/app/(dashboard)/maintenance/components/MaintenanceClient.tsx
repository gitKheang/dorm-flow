'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Plus, Search, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { useDemoSession } from '@/components/DemoSessionProvider';
import AppSelect from '@/components/ui/AppSelect';
import {
  MaintenancePriority,
  MaintenanceStatus,
  MaintenanceTicket,
  mockMaintenanceTickets,
  mockTenants,
} from '@/lib/mockData';

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

const MAINTENANCE_CATEGORY_OPTIONS = ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Furniture', 'Other'].map((option) => ({
  value: option,
  label: option,
}));

const MAINTENANCE_STATUS_OPTIONS = [
  { value: 'All', label: 'All Status' },
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
];

const MAINTENANCE_PRIORITY_OPTIONS = [
  { value: 'All', label: 'All Priority' },
  { value: 'Critical', label: 'Critical' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

const MAINTENANCE_WORKFLOW_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
];

function TenantMaintenanceView({
  sessionName,
  roomNumber,
  roomId,
  tickets,
  setTickets,
}: {
  sessionName: string;
  roomNumber?: string;
  roomId?: string;
  tickets: MaintenanceTicket[];
  setTickets: React.Dispatch<React.SetStateAction<MaintenanceTicket[]>>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Plumbing');

  const myTickets = tickets.filter((ticket) => ticket.tenantName === sessionName);
  const openCount = myTickets.filter((ticket) => ticket.status === 'Open').length;
  const inProgressCount = myTickets.filter((ticket) => ticket.status === 'In Progress').length;
  const resolvedCount = myTickets.filter((ticket) => ticket.status === 'Resolved').length;

  function handleSubmitRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    const submittedDate = '2026-03-26';
    setTickets((currentTickets) => [
      {
        id: `maint-${Date.now()}`,
        title,
        roomId: roomId ?? 'room-001',
        roomNumber: roomNumber ?? 'N/A',
        tenantName: sessionName,
        priority: 'Medium',
        status: 'Open',
        submittedDate,
        updatedDate: submittedDate,
        description: description.trim() || 'No extra details provided.',
        category,
      },
      ...currentTickets,
    ]);

    toast.success('Maintenance request submitted');
    setTitle('');
    setDescription('');
    setCategory('Plumbing');
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">My Maintenance Requests</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {roomNumber ? `Tracking issues for Room ${roomNumber}` : 'Track issues submitted for your room'}
          </p>
        </div>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
        >
          <Plus size={15} />
          {showForm ? 'Close Form' : 'New Request'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-red-700">Open</p>
          <p className="mt-2 text-3xl font-700 text-red-800">{openCount}</p>
          <p className="mt-1 text-[13px] text-red-600">Waiting for dorm staff review</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-blue-700">In Progress</p>
          <p className="mt-2 text-3xl font-700 text-blue-800">{inProgressCount}</p>
          <p className="mt-1 text-[13px] text-blue-600">Currently being worked on</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-[12px] font-medium uppercase tracking-wider text-green-700">Resolved</p>
          <p className="mt-2 text-3xl font-700 text-green-800">{resolvedCount}</p>
          <p className="mt-1 text-[13px] text-green-600">Completed requests</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmitRequest} className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Submit a new issue</h2>
            <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
              Include enough detail so the dorm team can triage it quickly.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Issue title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Leaking faucet"
              className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Category</label>
            <AppSelect
              ariaLabel="Maintenance category"
              fullWidth
              value={category}
              options={MAINTENANCE_CATEGORY_OPTIONS}
              onChange={setCategory}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Describe what is happening, when it started, and any urgency."
              className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--muted-foreground))] bg-white border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {myTickets.map((ticket) => (
          <div key={ticket.id} className="bg-white rounded-xl border border-[hsl(var(--border))] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-semibold text-[hsl(var(--foreground))]">{ticket.title}</p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-[hsl(var(--muted-foreground))]">{ticket.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-[hsl(var(--muted-foreground))]">
                  <span>{ticket.category}</span>
                  <span>Submitted {ticket.submittedDate}</span>
                  <span>Updated {ticket.updatedDate}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {myTickets.length === 0 && (
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] px-6 py-10 text-center">
            <Wrench size={32} className="mx-auto mb-3 text-[hsl(var(--muted-foreground))] opacity-40" />
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No maintenance requests yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MaintenanceClient() {
  const { session } = useDemoSession();
  const [tickets, setTickets] = useState(mockMaintenanceTickets);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<MaintenancePriority | 'All'>('All');

  const filtered = useMemo(() => {
    return tickets.filter((ticket) => {
      const query = search.toLowerCase();
      const matchSearch =
        !query ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.roomNumber.includes(query) ||
        ticket.tenantName.toLowerCase().includes(query);
      const matchStatus = filterStatus === 'All' || ticket.status === filterStatus;
      const matchPriority = filterPriority === 'All' || ticket.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [filterPriority, filterStatus, search, tickets]);

  if (!session) {
    return null;
  }

  if (session.role === 'Tenant') {
    const tenantRecord = session.tenantId
      ? mockTenants.find((tenant) => tenant.id === session.tenantId)
      : undefined;

    return (
      <TenantMaintenanceView
        sessionName={session.name}
        roomNumber={session.roomNumber}
        roomId={tenantRecord?.roomId}
        tickets={tickets}
        setTickets={setTickets}
      />
    );
  }

  function handleStatusChange(id: string, status: MaintenanceStatus) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) => (ticket.id === id ? { ...ticket, status, updatedDate: '2026-03-26' } : ticket)),
    );
    toast.success('Ticket status updated');
  }

  const openCount = tickets.filter((ticket) => ticket.status === 'Open').length;
  const inProgressCount = tickets.filter((ticket) => ticket.status === 'In Progress').length;
  const criticalCount = tickets.filter((ticket) => ticket.priority === 'Critical' && ticket.status !== 'Resolved').length;

  return (
    <div className="space-y-6">
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
          <p className="text-2xl font-700 text-green-800">{tickets.filter((ticket) => ticket.status === 'Resolved').length}</p>
          <p className="text-[12px] text-green-600 mt-1">Completed tickets</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
          />
        </div>
        <AppSelect
          ariaLabel="Filter maintenance by status"
          value={filterStatus}
          options={MAINTENANCE_STATUS_OPTIONS}
          onChange={(value) => setFilterStatus(value as MaintenanceStatus | 'All')}
          triggerClassName="min-w-[148px]"
        />
        <AppSelect
          ariaLabel="Filter maintenance by priority"
          value={filterPriority}
          options={MAINTENANCE_PRIORITY_OPTIONS}
          onChange={(value) => setFilterPriority(value as MaintenancePriority | 'All')}
          triggerClassName="min-w-[148px]"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((ticket) => (
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
                <AppSelect
                  ariaLabel={`Maintenance status for ${ticket.title}`}
                  value={ticket.status}
                  options={MAINTENANCE_WORKFLOW_OPTIONS}
                  onChange={(value) => handleStatusChange(ticket.id, value as MaintenanceStatus)}
                  triggerClassName={`min-w-[126px] border-0 px-3 py-1.5 text-[12px] ${statusColors[ticket.status]}`}
                  menuClassName="min-w-[140px]"
                />
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
