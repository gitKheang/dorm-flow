'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { BedDouble, Mail, Phone, Plus, Search, UserCheck, UserX, Users, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { useDemoSession } from '@/components/DemoSessionProvider';
import AppSelect from '@/components/ui/AppSelect';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';

type ViewMode = 'residents' | 'kitchen';

const chefShiftOptions = [
  { value: 'Morning', label: 'Morning Shift' },
  { value: 'Evening', label: 'Evening Shift' },
  { value: 'Split', label: 'Split Shift' },
];

export default function TenantsClient() {
  const { createInvitation } = useDemoSession();
  const {
    addChef,
    addTenant,
    currentDorm,
    currentDormChefs,
    currentDormRooms,
    currentDormTenants,
    hasModule,
    updateChefStatus,
    updateTenantStatus,
  } = useDemoWorkspace();
  const [activeView, setActiveView] = useState<ViewMode>('residents');
  const [search, setSearch] = useState('');
  const [residentStatusFilter, setResidentStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [chefStatusFilter, setChefStatusFilter] = useState<'All' | 'Active' | 'Invited' | 'Inactive'>('All');
  const [showResidentForm, setShowResidentForm] = useState(false);
  const [showChefForm, setShowChefForm] = useState(false);
  const [residentName, setResidentName] = useState('');
  const [residentEmail, setResidentEmail] = useState('');
  const [residentPhone, setResidentPhone] = useState('');
  const [residentRoomId, setResidentRoomId] = useState('unassigned');
  const [chefName, setChefName] = useState('');
  const [chefEmail, setChefEmail] = useState('');
  const [chefShift, setChefShift] = useState<'Morning' | 'Evening' | 'Split'>('Morning');
  const [chefSpecialty, setChefSpecialty] = useState('');

  const mealServiceEnabled = hasModule('mealService');

  const filteredResidents = useMemo(() => {
    return currentDormTenants.filter((tenant) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        tenant.name.toLowerCase().includes(query) ||
        tenant.email.toLowerCase().includes(query) ||
        tenant.phone.toLowerCase().includes(query);
      const matchesStatus = residentStatusFilter === 'All' || tenant.status === residentStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [currentDormTenants, residentStatusFilter, search]);

  const filteredChefs = useMemo(() => {
    return currentDormChefs.filter((chef) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        chef.name.toLowerCase().includes(query) ||
        chef.email.toLowerCase().includes(query) ||
        chef.specialty.toLowerCase().includes(query);
      const matchesStatus = chefStatusFilter === 'All' || chef.status === chefStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [chefStatusFilter, currentDormChefs, search]);

  const residentCounts = useMemo(() => ({
    total: currentDormTenants.length,
    active: currentDormTenants.filter((tenant) => tenant.status === 'Active').length,
    inactive: currentDormTenants.filter((tenant) => tenant.status === 'Inactive').length,
  }), [currentDormTenants]);

  const chefCounts = useMemo(() => ({
    total: currentDormChefs.length,
    active: currentDormChefs.filter((chef) => chef.status === 'Active').length,
    invited: currentDormChefs.filter((chef) => chef.status === 'Invited').length,
  }), [currentDormChefs]);

  const residentRoomOptions = useMemo(
    () => [
      { value: 'unassigned', label: 'Assignment pending' },
      ...currentDormRooms.map((room) => ({
        value: room.id,
        label: `Room ${room.roomNumber} · ${room.occupants}/${room.capacity}`,
      })),
    ],
    [currentDormRooms],
  );

  function getRoomLabel(roomId: string) {
    if (!roomId || roomId === 'unassigned') {
      return 'Assignment pending';
    }

    const room = currentDormRooms.find((item) => item.id === roomId);
    return room ? `Room ${room.roomNumber}` : 'Assignment pending';
  }

  function handleAddResident(event: React.FormEvent) {
    event.preventDefault();
    if (!residentName.trim() || !residentEmail.trim() || !residentPhone.trim()) {
      return;
    }

    const nextTenant = addTenant({
      name: residentName.trim(),
      email: residentEmail.trim(),
      phone: residentPhone.trim(),
      roomId: residentRoomId,
    });

    setResidentName('');
    setResidentEmail('');
    setResidentPhone('');
    setResidentRoomId('unassigned');
    setShowResidentForm(false);

    try {
      const invitation = createInvitation({
        email: nextTenant.email,
        role: 'Tenant',
        targetRecordId: nextTenant.id,
      });
      toast.success(`${nextTenant.name} added to the resident pipeline`);
      toast.info(`Demo invite code: ${invitation.code}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the invitation.';
      toast.success(`${nextTenant.name} added to the resident pipeline`);
      toast.error(message);
    }
  }

  function handleAddChef(event: React.FormEvent) {
    event.preventDefault();
    if (!chefName.trim() || !chefEmail.trim() || !chefSpecialty.trim()) {
      return;
    }

    const nextChef = addChef({
      name: chefName.trim(),
      email: chefEmail.trim(),
      specialty: chefSpecialty.trim(),
      shift: chefShift,
    });

    setChefName('');
    setChefEmail('');
    setChefSpecialty('');
    setChefShift('Morning');
    setShowChefForm(false);

    try {
      const invitation = createInvitation({
        email: nextChef.email,
        role: 'Chef',
        targetRecordId: nextChef.id,
      });
      toast.success(`${nextChef.name} invited to the kitchen team`);
      toast.info(`Demo invite code: ${invitation.code}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the invitation.';
      toast.success(`${nextChef.name} invited to the kitchen team`);
      toast.error(message);
    }
  }

  function handleResidentStatusToggle(tenantId: string, currentStatus: 'Active' | 'Inactive') {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    updateTenantStatus(tenantId, nextStatus);
    toast.success(`Resident marked ${nextStatus.toLowerCase()}`);
  }

  function handleChefStatusChange(chefId: string, nextStatus: 'Active' | 'Invited' | 'Inactive') {
    updateChefStatus(chefId, nextStatus);
    toast.success(`Kitchen staff status changed to ${nextStatus.toLowerCase()}`);
  }

  const activeViewCount = activeView === 'residents' ? filteredResidents.length : filteredChefs.length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">People</h1>
          <p className="mt-0.5 text-[14px] text-[hsl(var(--muted-foreground))]">
            {currentDorm?.name ?? 'Dorm'} · manage residents, kitchen staff, and onboarding readiness for each role.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (activeView === 'residents') {
              setShowResidentForm((current) => !current);
              return;
            }

            if (!mealServiceEnabled) {
              toast.info('Enable meal service in Dorm Settings before inviting kitchen staff.');
              return;
            }

            setShowChefForm((current) => !current);
          }}
          className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
        >
          <Plus size={15} />
          {activeView === 'residents' ? (showResidentForm ? 'Close Form' : 'Add Resident') : (showChefForm ? 'Close Form' : 'Invite Chef')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-[hsl(var(--primary))] p-5 text-white">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/75">Residents</p>
          <p className="mt-3 text-3xl font-semibold">{residentCounts.total}</p>
          <p className="mt-1 text-[13px] text-white/75">{residentCounts.active} active residents</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-amber-700">Pending Resident Actions</p>
          <p className="mt-3 text-3xl font-semibold text-amber-900">{residentCounts.inactive}</p>
          <p className="mt-1 text-[13px] text-amber-700">Waiting on activation or assignment follow-up</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-blue-700">Kitchen Staff</p>
          <p className="mt-3 text-3xl font-semibold text-blue-900">{chefCounts.active}</p>
          <p className="mt-1 text-[13px] text-blue-700">
            {mealServiceEnabled ? `${chefCounts.invited} invitation${chefCounts.invited === 1 ? '' : 's'} still pending` : 'Meal service is currently disabled'}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-emerald-700">Shared Workflow</p>
          <p className="mt-3 text-lg font-semibold text-emerald-900">
            {mealServiceEnabled ? 'Meal service active' : 'Core operations only'}
          </p>
          <p className="mt-1 text-[13px] text-emerald-700">
            Residents manage their stay, while staff only sees the work assigned to them.
          </p>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-[hsl(var(--muted))] p-1">
        {([
          { id: 'residents' as const, label: 'Residents', icon: Users },
          { id: 'kitchen' as const, label: 'Kitchen Staff', icon: ChefHat },
        ]).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveView(option.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
              activeView === option.id
                ? 'bg-white text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <option.icon size={14} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={activeView === 'residents' ? 'Search residents...' : 'Search kitchen staff...'}
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-white py-2.5 pl-9 pr-4 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
          />
        </div>
        {activeView === 'residents' ? (
          <div className="flex gap-2">
            {(['All', 'Active', 'Inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setResidentStatusFilter(status)}
                className={`rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-all ${
                  residentStatusFilter === status
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
                    : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.35)]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2">
            {(['All', 'Active', 'Invited', 'Inactive'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setChefStatusFilter(status)}
                className={`rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-all ${
                  chefStatusFilter === status
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white'
                    : 'border-[hsl(var(--border))] bg-white text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary)/0.35)]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {showResidentForm && activeView === 'residents' && (
        <form onSubmit={handleAddResident} className="space-y-4 rounded-xl border border-[hsl(var(--border))] bg-white p-6">
          <div>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Add Resident</h2>
            <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
              New residents start as inactive until their move-in, room assignment, and billing setup are confirmed.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Full Name</label>
              <input
                type="text"
                value={residentName}
                onChange={(event) => setResidentName(event.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Email</label>
              <input
                type="email"
                value={residentEmail}
                onChange={(event) => setResidentEmail(event.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Phone</label>
              <input
                type="text"
                value={residentPhone}
                onChange={(event) => setResidentPhone(event.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Room assignment</label>
              <AppSelect
                ariaLabel="Resident room assignment"
                fullWidth
                value={residentRoomId}
                options={residentRoomOptions}
                onChange={setResidentRoomId}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
            >
              Add Resident
            </button>
            <button
              type="button"
              onClick={() => setShowResidentForm(false)}
              className="rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {showChefForm && activeView === 'kitchen' && mealServiceEnabled && (
        <form onSubmit={handleAddChef} className="space-y-4 rounded-xl border border-[hsl(var(--border))] bg-white p-6">
          <div>
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Invite Chef</h2>
            <p className="mt-1 text-[13px] text-[hsl(var(--muted-foreground))]">
              Kitchen staff should only be invited when meal service is active and operating.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Chef Name</label>
              <input
                type="text"
                value={chefName}
                onChange={(event) => setChefName(event.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Email</label>
              <input
                type="email"
                value={chefEmail}
                onChange={(event) => setChefEmail(event.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Shift</label>
              <AppSelect
                ariaLabel="Chef shift"
                fullWidth
                value={chefShift}
                options={chefShiftOptions}
                onChange={(value) => setChefShift(value as 'Morning' | 'Evening' | 'Split')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Specialty</label>
              <input
                type="text"
                value={chefSpecialty}
                onChange={(event) => setChefSpecialty(event.target.value)}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
            >
              Invite Chef
            </button>
            <button
              type="button"
              onClick={() => setShowChefForm(false)}
              className="rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {activeView === 'residents' ? (
        <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-white">
          <div className="border-b border-[hsl(var(--border))] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Resident Directory</h2>
            <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">
              {activeViewCount} resident record{activeViewCount === 1 ? '' : 's'} match the current filter.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted)/0.45)]">
                <tr>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Resident</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Contact</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Room</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Move-in</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Status</th>
                  <th className="px-5 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filteredResidents.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.12)] text-[12px] font-semibold text-[hsl(var(--primary))]">
                          {tenant.avatar}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{tenant.name}</p>
                          <p className="text-[12px] text-[hsl(var(--muted-foreground))]">{tenant.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                          <Mail size={11} />
                          {tenant.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                          <Phone size={11} />
                          {tenant.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--foreground))]">
                      <div className="flex items-center gap-1.5">
                        <BedDouble size={14} className="text-[hsl(var(--muted-foreground))]" />
                        {getRoomLabel(tenant.roomId)}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--muted-foreground))]">{tenant.moveInDate}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
                        tenant.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {tenant.status === 'Active' ? <UserCheck size={11} /> : <UserX size={11} />}
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleResidentStatusToggle(tenant.id, tenant.status)}
                        className="text-[12px] font-medium text-[hsl(var(--primary))] hover:underline"
                      >
                        Mark as {tenant.status === 'Active' ? 'inactive' : 'active'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredResidents.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No residents found</p>
            </div>
          )}
        </div>
      ) : mealServiceEnabled ? (
        <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-white">
          <div className="border-b border-[hsl(var(--border))] px-5 py-4">
            <h2 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Kitchen Staff</h2>
            <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">
              {activeViewCount} kitchen staff record{activeViewCount === 1 ? '' : 's'} match the current filter.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[hsl(var(--muted)/0.45)]">
                <tr>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Chef</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Shift</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Specialty</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Status</th>
                  <th className="px-5 py-3 text-right text-[12px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filteredChefs.map((chef) => (
                  <tr key={chef.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{chef.name}</p>
                        <p className="mt-0.5 text-[12px] text-[hsl(var(--muted-foreground))]">{chef.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--foreground))]">{chef.shift}</td>
                    <td className="px-5 py-4 text-[13px] text-[hsl(var(--muted-foreground))]">{chef.specialty}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-medium ${
                        chef.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : chef.status === 'Invited'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {chef.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {chef.status !== 'Active' && (
                          <button
                            type="button"
                            onClick={() => handleChefStatusChange(chef.id, 'Active')}
                            className="text-[12px] font-medium text-[hsl(var(--primary))] hover:underline"
                          >
                            Activate
                          </button>
                        )}
                        {chef.status !== 'Invited' && (
                          <button
                            type="button"
                            onClick={() => handleChefStatusChange(chef.id, 'Invited')}
                            className="text-[12px] font-medium text-[hsl(var(--primary))] hover:underline"
                          >
                            Re-invite
                          </button>
                        )}
                        {chef.status !== 'Inactive' && (
                          <button
                            type="button"
                            onClick={() => handleChefStatusChange(chef.id, 'Inactive')}
                            className="text-[12px] font-medium text-red-600 hover:underline"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredChefs.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-[14px] text-[hsl(var(--muted-foreground))]">No kitchen staff found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-[15px] font-semibold text-amber-900">Meal service is disabled</h2>
          <p className="mt-2 text-[13px] text-amber-800">
            Kitchen staff should only be managed when the meal-service module is enabled by the dorm owner.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-flex rounded-lg bg-white px-4 py-2.5 text-[13px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
          >
            Open Dorm Settings
          </Link>
        </div>
      )}
    </div>
  );
}
