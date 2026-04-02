'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import FeatureGateNotice from '@/components/premium/FeatureGateNotice';
import PlanBadge from '@/components/premium/PlanBadge';
import { useDemoSession } from '@/components/DemoSessionProvider';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function MultiDormPage() {
  const { session, switchActiveDorm } = useDemoSession();
  const {
    addDorm,
    archiveDorm,
    currentDorm,
    currentDormPlan,
    getPremiumFeatureAccess,
    upgradeDormToPremium,
    workspace,
  } = useDemoWorkspace();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('UTC+7 (Indochina Time)');
  const [waitlist, setWaitlist] = useState('0');
  const availableDormIds = useMemo(
    () => new Set(session?.memberships.map((membership) => membership.dormId) ?? []),
    [session?.memberships],
  );
  const multiDormAccess = currentDorm
    ? getPremiumFeatureAccess('multiDormPortfolio', currentDorm.id)
    : null;

  const activeDorms = useMemo(
    () => workspace.dorms.filter(
      (dorm) => dorm.status === 'Active' && availableDormIds.has(dorm.id),
    ),
    [availableDormIds, workspace.dorms],
  );

  const portfolio = useMemo(() => activeDorms.map((dorm) => {
    const rooms = workspace.rooms.filter((room) => room.dormId === dorm.id);
    const invoices = workspace.invoices.filter((invoice) => invoice.dormId === dorm.id);
    const maintenance = workspace.maintenanceTickets.filter((ticket) => ticket.dormId === dorm.id && ticket.status !== 'Resolved');
    const capacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupants, 0);
    const monthlyRevenue = invoices
      .filter((invoice) => invoice.status === 'Paid' || invoice.status === 'Issued')
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const paidCount = invoices.filter((invoice) => invoice.status === 'Paid').length;
    const collectionRate = invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0;

    return {
      dorm,
      rooms,
      capacity,
      occupiedBeds,
      collectionRate,
      monthlyRevenue,
      openMaintenance: maintenance.length,
    };
  }), [activeDorms, workspace.invoices, workspace.maintenanceTickets, workspace.rooms]);

  const totalCapacity = portfolio.reduce((sum, item) => sum + item.capacity, 0);
  const totalOccupiedBeds = portfolio.reduce((sum, item) => sum + item.occupiedBeds, 0);
  const totalRevenue = portfolio.reduce((sum, item) => sum + item.monthlyRevenue, 0);
  const totalMaintenance = portfolio.reduce((sum, item) => sum + item.openMaintenance, 0);
  const totalWaitlist = activeDorms.reduce((sum, dorm) => sum + dorm.waitlist, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupiedBeds / totalCapacity) * 100) : 0;
  const averageCollectionRate = portfolio.length > 0
    ? Math.round(portfolio.reduce((sum, item) => sum + item.collectionRate, 0) / portfolio.length)
    : 0;

  function handleUpgrade() {
    if (!currentDorm) {
      return;
    }

    try {
      upgradeDormToPremium(currentDorm.id);
      toast.success('Premium activated for this dorm workspace');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to upgrade the dorm.';
      toast.error(message);
    }
  }

  function handleAddDorm(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !city.trim() || !address.trim()) {
      return;
    }

    try {
      const nextDorm = addDorm({
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        timezone,
        waitlist: Number(waitlist) || 0,
      });

      toast.success(`${nextDorm.name} added and set as the active workspace`);
      setName('');
      setCity('');
      setAddress('');
      setTimezone('UTC+7 (Indochina Time)');
      setWaitlist('0');
      setShowForm(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add the dorm.';
      toast.error(message);
    }
  }

  function handleArchiveDorm(dormId: string, dormName: string) {
    const didArchive = archiveDorm(dormId);
    if (!didArchive) {
      toast.info('At least one active dorm must remain in the portfolio.');
      return;
    }

    toast.success(`${dormName} archived from the active portfolio`);
  }

  function activateDormWorkspace(dormId: string, successMessage?: string) {
    try {
      const nextSession = switchActiveDorm(dormId);
      if (!nextSession) {
        throw new Error('Unable to switch dorm.');
      }

      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to switch dorm.';
      toast.error(message);
      return false;
    }
  }

  if (currentDorm && multiDormAccess && !multiDormAccess.allowed) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Multi-Dorm Portfolio</h1>
            <PlanBadge plan={currentDormPlan} />
          </div>
          <p className="mt-0.5 text-[14px] text-[hsl(var(--muted-foreground))]">
            Single-dorm operations stay free. Portfolio controls unlock only for dorms on Premium.
          </p>
        </div>
        <FeatureGateNotice
          eyebrow={multiDormAccess.reason === 'plan' ? 'Premium feature' : 'Module paused'}
          title={
            multiDormAccess.reason === 'plan'
              ? 'Upgrade this dorm to manage a portfolio'
              : 'Multi-dorm controls are paused for this dorm'
          }
          description={
            multiDormAccess.reason === 'plan'
              ? 'Dorm owners pay per dorm workspace. Upgrade this dorm to add properties, switch active workspaces, and review portfolio-level metrics without changing tenant or chef billing.'
              : 'This dorm is already on Premium, but the multi-dorm module is currently turned off in settings. Existing dorm data stays intact and will become available again as soon as the module is re-enabled.'
          }
          ctaLabel={multiDormAccess.reason === 'plan' ? 'Upgrade to Premium' : 'Open settings'}
          onCta={multiDormAccess.reason === 'plan' ? handleUpgrade : undefined}
          ctaHref={multiDormAccess.reason === 'module' ? '/settings?tab=dorm' : undefined}
          secondaryLabel="Return to dashboard"
          secondaryHref="/admin-dashboard"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Multi-Dorm Portfolio</h1>
          <p className="mt-0.5 text-[14px] text-[hsl(var(--muted-foreground))]">
            Add dorms, switch the active property, and manage each dorm from a scoped operational workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/settings?tab=dorm"
            className="rounded-lg border border-[hsl(var(--border))] bg-white px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
          >
            Edit Active Dorm
          </Link>
          <button
            type="button"
            onClick={() => setShowForm((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
          >
            <Plus size={15} />
            {showForm ? 'Close Form' : 'Add Dorm'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddDorm} className="grid gap-4 rounded-xl border border-[hsl(var(--border))] bg-white p-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1.5 xl:col-span-2">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Dorm name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">City</label>
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Waitlist</label>
            <input
              type="number"
              min={0}
              value={waitlist}
              onChange={(event) => setWaitlist(event.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2 xl:col-span-5">
            <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Address</label>
            <input
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
              required
            />
          </div>
          <div className="flex gap-2 md:col-span-2 xl:col-span-5">
            <button
              type="submit"
              className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
            >
              Save Dorm
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-[hsl(var(--border))] px-4 py-2.5 text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-[hsl(var(--primary))] p-5 text-white">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/75">Portfolio Occupancy</p>
          <p className="mt-3 text-3xl font-semibold">{occupancyRate}%</p>
          <p className="mt-1 text-[13px] text-white/75">
            {totalOccupiedBeds} of {totalCapacity} beds occupied
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-emerald-700">Portfolio Revenue</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-900">{currency.format(totalRevenue)}</p>
          <p className="mt-1 text-[13px] text-emerald-700">{activeDorms.length} active dorms tracked</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-blue-700">Average Collection</p>
          <p className="mt-3 text-3xl font-semibold text-blue-900">{averageCollectionRate}%</p>
          <p className="mt-1 text-[13px] text-blue-700">Across all active properties</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-amber-700">Operational Queue</p>
          <p className="mt-3 text-3xl font-semibold text-amber-900">{totalMaintenance}</p>
          <p className="mt-1 text-[13px] text-amber-700">{totalWaitlist} residents on waitlists</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Dorm Portfolio</h2>
              <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">
                Each dorm below can be made active, then managed through the shared admin workspace.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {portfolio.map((item) => {
              const dormOccupancy = item.capacity > 0 ? Math.round((item.occupiedBeds / item.capacity) * 100) : 0;
              const isActiveDorm = currentDorm?.id === item.dorm.id;
              const occupancyBarClass =
                dormOccupancy >= 95
                  ? 'bg-emerald-500'
                  : dormOccupancy >= 85
                    ? 'bg-[hsl(var(--primary))]'
                    : 'bg-amber-500';

              return (
                <div
                  key={item.dorm.id}
                  className={`rounded-xl border p-4 transition-colors ${isActiveDorm ? 'border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.05)]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.35)]'}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-semibold text-[hsl(var(--foreground))]">{item.dorm.name}</p>
                        {isActiveDorm && (
                          <span className="rounded-full bg-[hsl(var(--primary))] px-2 py-0.5 text-[11px] font-medium text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">{item.dorm.city}</p>
                      <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">{item.dorm.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                      <div>
                        <p className="text-[hsl(var(--muted-foreground))]">Revenue</p>
                        <p className="mt-1 font-semibold text-[hsl(var(--foreground))]">
                          {currency.format(item.monthlyRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[hsl(var(--muted-foreground))]">Collection</p>
                        <p className="mt-1 font-semibold text-[hsl(var(--foreground))]">{item.collectionRate}%</p>
                      </div>
                      <div>
                        <p className="text-[hsl(var(--muted-foreground))]">Open Tickets</p>
                        <p className="mt-1 font-semibold text-[hsl(var(--foreground))]">{item.openMaintenance}</p>
                      </div>
                      <div>
                        <p className="text-[hsl(var(--muted-foreground))]">Waitlist</p>
                        <p className="mt-1 font-semibold text-[hsl(var(--foreground))]">{item.dorm.waitlist}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-[13px]">
                      <span className="text-[hsl(var(--muted-foreground))]">Occupancy</span>
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {item.occupiedBeds}/{item.capacity} beds ({dormOccupancy}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                      <div
                        className={`h-full rounded-full ${occupancyBarClass}`}
                        style={{ width: `${dormOccupancy}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!isActiveDorm && (
                      <button
                        type="button"
                        onClick={() => {
                          activateDormWorkspace(item.dorm.id, `${item.dorm.name} is now the active workspace`);
                        }}
                        className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
                      >
                        Make Active
                      </button>
                    )}
                    <Link
                      href="/settings?tab=dorm"
                      onClick={(event) => {
                        if (isActiveDorm) {
                          return;
                        }

                        const didSwitch = activateDormWorkspace(item.dorm.id);
                        if (!didSwitch) {
                          event.preventDefault();
                        }
                      }}
                      className="rounded-lg border border-[hsl(var(--border))] px-4 py-2 text-[12px] font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]"
                    >
                      Manage
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleArchiveDorm(item.dorm.id, item.dorm.name)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Active Workspace</h2>
            <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">
              Changes to rooms, people, invoices, and maintenance now follow the selected dorm.
            </p>
            {currentDorm ? (
              <div className="mt-5 space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.25)] p-4">
                <div>
                  <p className="text-[14px] font-semibold text-[hsl(var(--foreground))]">{currentDorm.name}</p>
                  <p className="text-[12px] text-[hsl(var(--muted-foreground))]">{currentDorm.city}</p>
                </div>
                <div className="space-y-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                  <p>{currentDorm.address}</p>
                  <p>{currentDorm.timezone}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-[13px] text-[hsl(var(--muted-foreground))]">No active dorm selected.</p>
            )}
          </div>

          <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-6">
            <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">What Changed</h2>
            <div className="mt-4 space-y-3 text-[13px] text-[hsl(var(--muted-foreground))]">
              <p>Adding a dorm now creates a real workspace entry instead of a static dashboard card.</p>
              <p>Selecting a dorm changes the active property used by rooms, people, invoices, maintenance, and settings.</p>
              <p>Archiving a dorm removes it from the active portfolio but preserves the record.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
