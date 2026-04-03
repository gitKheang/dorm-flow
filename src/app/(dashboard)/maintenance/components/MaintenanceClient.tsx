'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Plus, Search, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import MaintenanceAttachmentField, { MaintenanceAttachmentList } from '@/components/maintenance/MaintenanceAttachmentField';
import { useDemoSession } from '@/components/DemoSessionProvider';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import AppSelect from '@/components/ui/AppSelect';
import {
  MaintenanceAttachment,
  MaintenancePriority,
  MaintenanceStatus,
} from '@/lib/mockData';
import type {
  WorkspaceMaintenanceRecord,
  WorkspaceRoomRecord,
  WorkspaceTenantRecord,
} from '@/lib/demoWorkspace';

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

const MAINTENANCE_CREATE_PRIORITY_OPTIONS = [
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

function AdminMaintenanceComposer({
  addMaintenanceTicket,
  onClose,
  rooms,
  tenants,
}: {
  addMaintenanceTicket: ReturnType<typeof useDemoWorkspace>['addMaintenanceTicket'];
  onClose: () => void;
  rooms: WorkspaceRoomRecord[];
  tenants: WorkspaceTenantRecord[];
}) {
  const [title, setTitle] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? '');
  const [selectedTenantId, setSelectedTenantId] = useState('none');
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState<MaintenancePriority>('Medium');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<MaintenanceAttachment[]>([]);

  const roomOptions = useMemo(() => rooms.map((room) => ({
    value: room.id,
    label: `Room ${room.roomNumber} · ${room.type} · Floor ${room.floor}`,
  })), [rooms]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );
  const roomResidents = useMemo(
    () => tenants.filter((tenant) => tenant.status === 'Active' && tenant.roomId === selectedRoomId),
    [selectedRoomId, tenants],
  );
  const residentOptions = useMemo(() => ([
    { value: 'none', label: 'No specific resident' },
    ...roomResidents.map((tenant) => ({
      value: tenant.id,
      label: tenant.name,
    })),
  ]), [roomResidents]);

  useEffect(() => {
    if (rooms.length > 0 && !rooms.some((room) => room.id === selectedRoomId)) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (selectedTenantId !== 'none' && !roomResidents.some((tenant) => tenant.id === selectedTenantId)) {
      setSelectedTenantId('none');
    }
  }, [roomResidents, selectedTenantId]);

  function resetForm() {
    setTitle('');
    setSelectedRoomId(rooms[0]?.id ?? '');
    setSelectedTenantId('none');
    setCategory('Plumbing');
    setPriority('Medium');
    setDescription('');
    setAttachments([]);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedRoom) {
      toast.error('Select a room before creating the ticket.');
      return;
    }

    if (!title.trim()) {
      toast.error('Enter a ticket title before saving.');
      return;
    }

    const selectedTenant = roomResidents.find((tenant) => tenant.id === selectedTenantId);

    try {
      addMaintenanceTicket({
        title: title.trim(),
        roomId: selectedRoom.id,
        roomNumber: selectedRoom.roomNumber,
        tenantId: selectedTenant?.id,
        tenantName: selectedTenant?.name ?? 'Dorm Operations',
        description: description.trim() || 'No extra details provided.',
        category,
        priority,
        attachments,
      });
      toast.success(`Ticket created for Room ${selectedRoom.roomNumber}`);
      resetForm();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the maintenance ticket.';
      toast.error(message);
    }
  }

  if (rooms.length === 0) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">New Maintenance Ticket</h2>
          <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
            Log an issue, choose a room, and optionally link it to a resident.
          </p>
        </div>
        <span className="rounded-full bg-[hsl(var(--muted))] px-3 py-1 text-[12px] font-medium text-[hsl(var(--muted-foreground))]">
          Staff view
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Issue title</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Water pressure is low in the shower"
            className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Room</label>
          <AppSelect
            ariaLabel="Maintenance room"
            fullWidth
            value={selectedRoomId}
            options={roomOptions}
            onChange={setSelectedRoomId}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Resident</label>
          <AppSelect
            ariaLabel="Maintenance resident"
            fullWidth
            value={selectedTenantId}
            options={residentOptions}
            onChange={setSelectedTenantId}
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
          <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Priority</label>
          <AppSelect
            ariaLabel="Maintenance priority"
            fullWidth
            value={priority}
            options={MAINTENANCE_CREATE_PRIORITY_OPTIONS}
            onChange={(value) => setPriority(value as MaintenancePriority)}
          />
        </div>
      </div>

      {selectedRoom && (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
              Room {selectedRoom.roomNumber}
            </p>
            <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{selectedRoom.type}</span>
            <span className="text-[hsl(var(--muted-foreground))]">·</span>
            <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Floor {selectedRoom.floor}</span>
            <span className="text-[hsl(var(--muted-foreground))]">·</span>
            <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Status {selectedRoom.status}</span>
          </div>
          <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
            {roomResidents.length > 0
              ? `Active residents: ${roomResidents.map((tenant) => tenant.name).join(', ')}`
              : 'No active resident is currently assigned to this room.'}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Describe the issue, when it started, and anything staff should know before inspection."
          className="w-full px-3 py-2.5 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] resize-none"
        />
      </div>

      <MaintenanceAttachmentField
        attachments={attachments}
        onChange={setAttachments}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
        >
          Create Ticket
        </button>
        <button
          type="button"
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--muted-foreground))] bg-white border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TenantMaintenanceView({
  addMaintenanceTicket,
  tenantId,
  sessionName,
  roomNumber,
  roomId,
  tickets,
}: {
  addMaintenanceTicket: ReturnType<typeof useDemoWorkspace>['addMaintenanceTicket'];
  tenantId?: string;
  sessionName: string;
  roomNumber?: string;
  roomId?: string;
  tickets: WorkspaceMaintenanceRecord[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [attachments, setAttachments] = useState<MaintenanceAttachment[]>([]);

  const myTickets = tickets.filter((ticket) => (
    tenantId
      ? ticket.createdByTenantId === tenantId || (!ticket.createdByTenantId && ticket.tenantName === sessionName)
      : ticket.tenantName === sessionName
  ));
  const openCount = myTickets.filter((ticket) => ticket.status === 'Open').length;
  const inProgressCount = myTickets.filter((ticket) => ticket.status === 'In Progress').length;
  const resolvedCount = myTickets.filter((ticket) => ticket.status === 'Resolved').length;

  function handleSubmitRequest(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    try {
      addMaintenanceTicket({
        title,
        roomId: roomId ?? 'room-001',
        roomNumber: roomNumber ?? 'N/A',
        tenantName: sessionName,
        description: description.trim() || 'No extra details provided.',
        category,
        priority: 'Medium',
        attachments,
      });

      toast.success('Maintenance request submitted');
      setTitle('');
      setDescription('');
      setCategory('Plumbing');
      setAttachments([]);
      setShowForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit the maintenance request.';
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">My Maintenance Requests</h1>
          <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
            {roomNumber ? `Issues for Room ${roomNumber}` : 'Issues submitted for your room'}
          </p>
        </div>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
        >
          <Plus size={15} />
          {showForm ? 'Close form' : 'New request'}
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
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">New Maintenance Request</h2>
            <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
              Describe the issue so the dorm team can review it.
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
          <MaintenanceAttachmentField
            attachments={attachments}
            onChange={setAttachments}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
            >
              Send request
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setAttachments([]);
              }}
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
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-[12px] font-medium text-[hsl(var(--muted-foreground))]">
                      Attachments
                    </p>
                    <MaintenanceAttachmentList attachments={ticket.attachments} />
                  </div>
                )}
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
  const {
    addMaintenanceTicket,
    currentDorm,
    currentDormRooms,
    currentDormMaintenanceTickets,
    currentDormTenants,
    updateMaintenanceStatus,
  } = useDemoWorkspace();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<MaintenancePriority | 'All'>('All');
  const tickets = currentDormMaintenanceTickets;

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
      ? currentDormTenants.find((tenant) => tenant.id === session.tenantId)
      : undefined;

    return (
      <TenantMaintenanceView
        addMaintenanceTicket={addMaintenanceTicket}
        tenantId={session.tenantId}
        sessionName={session.name}
        roomNumber={session.roomNumber}
        roomId={tenantRecord?.roomId}
        tickets={tickets}
      />
    );
  }

  function handleStatusChange(id: string, status: MaintenanceStatus) {
    try {
      updateMaintenanceStatus(id, status);
      toast.success('Ticket status updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update the ticket.';
      toast.error(message);
    }
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
            {currentDorm?.name ?? 'Dorm'} · {tickets.length} requests on file
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((current) => !current)}
          disabled={currentDormRooms.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={15} />
          {showCreateForm ? 'Close form' : 'New ticket'}
        </button>
      </div>

      {showCreateForm && (
        <AdminMaintenanceComposer
          addMaintenanceTicket={addMaintenanceTicket}
          onClose={() => setShowCreateForm(false)}
          rooms={currentDormRooms}
          tenants={currentDormTenants}
        />
      )}

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
            placeholder="Search by title, room, or resident..."
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
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-2 text-[12px] font-medium text-[hsl(var(--muted-foreground))]">
                        Attachments
                      </p>
                      <MaintenanceAttachmentList attachments={ticket.attachments} />
                    </div>
                  )}
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
            <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No maintenance requests match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
