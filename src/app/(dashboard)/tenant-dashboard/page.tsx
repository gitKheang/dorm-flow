'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BedDouble, CreditCard, Wrench, CheckCircle2, AlertTriangle, ChevronRight, Plus, Home, Wifi, Wind, Bath, UtensilsCrossed } from 'lucide-react';
import { useDemoSession } from '@/components/DemoSessionProvider';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import AppSelect from '@/components/ui/AppSelect';
import { mockInvoices, mockMaintenanceTickets, mockRooms } from '@/lib/mockData';
import { toast } from 'sonner';

const mealPlanOptions = [
  { value: 'No Meal Plan', label: 'No Meal Plan' },
  { value: 'Breakfast Only', label: 'Breakfast Only' },
  { value: 'Half Board', label: 'Half Board' },
  { value: 'Full Board', label: 'Full Board' },
];

export default function TenantDashboardPage() {
  const { session } = useDemoSession();
  const { hasModule, setTenantMealPreference, workspace } = useDemoWorkspace();
  const currentTenantId = session?.tenantId ?? 'tenant-001';
  const tenant = workspace.tenants.find((item) => item.id === currentTenantId);
  const room = mockRooms.find(r => r.id === tenant?.roomId);
  const invoices = mockInvoices.filter(i => i.tenantId === currentTenantId);
  const tickets = mockMaintenanceTickets.filter(t => t.tenantName === tenant?.name);
  const mealServiceEnabled = hasModule('mealService');
  const currentMealPreference = workspace.tenantMealPreferences.find((preference) => preference.tenantId === currentTenantId);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDesc, setRequestDesc] = useState('');
  const [requestCategory, setRequestCategory] = useState('Plumbing');
  const [mealPlan, setMealPlan] = useState(currentMealPreference?.plan ?? 'No Meal Plan');
  const [mealNotes, setMealNotes] = useState(currentMealPreference?.notes ?? '');

  const overdueInvoice = invoices.find(i => i.status === 'Overdue');
  const pendingInvoice = invoices.find(i => i.status === 'Issued');

  const amenityIcons: Record<string, React.ElementType> = {
    WiFi: Wifi,
    AC: Wind,
    'Private Bath': Bath,
    'Shared Bath': Bath,
    Kitchenette: UtensilsCrossed,
  };

  function handleSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!requestTitle.trim()) return;
    toast.success('Maintenance request submitted! We\'ll respond within 24 hours.');
    setRequestTitle('');
    setRequestDesc('');
    setShowRequestForm(false);
  }

  useEffect(() => {
    setMealPlan(currentMealPreference?.plan ?? 'No Meal Plan');
    setMealNotes(currentMealPreference?.notes ?? '');
  }, [currentMealPreference]);

  function handleSaveMealPlan() {
    setTenantMealPreference(currentTenantId, {
      plan: mealPlan as 'No Meal Plan' | 'Breakfast Only' | 'Half Board' | 'Full Board',
      notes: mealNotes.trim(),
    });
    toast.success('Meal preference updated');
  }

  const statusColors: Record<string, string> = {
    Paid: 'bg-green-100 text-green-700',
    Issued: 'bg-blue-100 text-blue-700',
    Overdue: 'bg-red-100 text-red-700',
    Draft: 'bg-gray-100 text-gray-600',
  };

  const ticketStatusColors: Record<string, string> = {
    Open: 'bg-red-100 text-red-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    Resolved: 'bg-green-100 text-green-700',
  };

  return (
    
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">
              Welcome back, {tenant?.name?.split(' ')[0]}
            </h1>
            <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
              Tenant Portal — {session?.dormName ?? 'Sunrise Dormitory'}
            </p>
          </div>
          {overdueInvoice && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
              <AlertTriangle size={15} className="text-red-600 flex-shrink-0" />
              <span className="text-[13px] text-red-700 font-medium">Overdue invoice: ${overdueInvoice.amount}</span>
            </div>
          )}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[hsl(var(--primary))] text-white rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <BedDouble size={20} className="opacity-80" />
              <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">Your Room</span>
            </div>
            <p className="text-3xl font-700">Room {room?.roomNumber}</p>
            <p className="text-[13px] opacity-70">{room?.type} · Floor {room?.floor}</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[hsl(var(--border))] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="bg-green-50 p-2 rounded-lg">
                <CreditCard size={16} className="text-green-600" />
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${pendingInvoice ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {pendingInvoice ? 'Due soon' : 'All paid'}
              </span>
            </div>
            <p className="text-2xl font-700 text-[hsl(var(--foreground))]">${room?.rentPerMonth}/mo</p>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Monthly rent</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[hsl(var(--border))] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="bg-amber-50 p-2 rounded-lg">
                <Wrench size={16} className="text-amber-600" />
              </div>
              <span className="text-[11px] font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-2 py-0.5 rounded-full">
                {tickets.filter(t => t.status !== 'Resolved').length} open
              </span>
            </div>
            <p className="text-2xl font-700 text-[hsl(var(--foreground))]">{tickets.length}</p>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Maintenance requests</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[hsl(var(--border))] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Home size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-700 text-[hsl(var(--foreground))]">{room?.occupants}/{room?.capacity}</p>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Occupants in room</p>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Room details */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-5">
            <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Room Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-[hsl(var(--muted-foreground))]">Room Number</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{room?.roomNumber}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[hsl(var(--muted-foreground))]">Type</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{room?.type}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[hsl(var(--muted-foreground))]">Floor</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{room?.floor}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[hsl(var(--muted-foreground))]">Move-in Date</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{tenant?.moveInDate}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-[hsl(var(--muted-foreground))]">Monthly Rent</span>
                <span className="font-medium text-[hsl(var(--foreground))]">${room?.rentPerMonth}</span>
              </div>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {room?.amenities?.map(a => {
                  const AIcon = amenityIcons[a] || CheckCircle2;
                  return (
                    <span key={a} className="flex items-center gap-1.5 text-[12px] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] px-2.5 py-1 rounded-full">
                      <AIcon size={12} />
                      {a}
                    </span>
                  );
                })}
              </div>
            </div>
            {room?.notes && (
              <p className="text-[12px] text-[hsl(var(--muted-foreground))] italic border-t border-[hsl(var(--border))] pt-3">
                Note: {room.notes}
              </p>
            )}
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">My Invoices</h2>
              <Link href="/invoices" className="text-[12px] text-[hsl(var(--primary))] font-medium hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {invoices.length === 0 && (
                <p className="text-[13px] text-[hsl(var(--muted-foreground))] text-center py-6">No invoices yet</p>
              )}
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.4)] transition-colors">
                  <div>
                    <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{inv.period}</p>
                    <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Due {inv.dueDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-semibold text-[hsl(var(--foreground))]">${inv.amount}</span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[inv.status]}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {pendingInvoice && (
              <button
                onClick={() => toast.success('Redirecting to payment gateway...')}
                className="w-full py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard size={15} />
                Pay ${pendingInvoice.amount} Now
              </button>
            )}
          </div>

          {/* Maintenance */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Maintenance</h2>
              <button
                onClick={() => setShowRequestForm(true)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[hsl(var(--primary))] hover:underline"
              >
                <Plus size={13} />
                New Request
              </button>
            </div>

            {showRequestForm && (
              <form onSubmit={handleSubmitRequest} className="space-y-3 p-4 bg-[hsl(var(--muted)/0.5)] rounded-lg border border-[hsl(var(--border))]">
                <input
                  type="text"
                  value={requestTitle}
                  onChange={e => setRequestTitle(e.target.value)}
                  placeholder="Issue title (e.g. Leaking faucet)"
                  className="w-full px-3 py-2 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                  required
                />
                <AppSelect
                  ariaLabel="Maintenance category"
                  fullWidth
                  value={requestCategory}
                  options={['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Furniture', 'Other'].map((category) => ({
                    value: category,
                    label: category,
                  }))}
                  onChange={setRequestCategory}
                  triggerClassName="py-2"
                />
                <textarea
                  value={requestDesc}
                  onChange={e => setRequestDesc(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] resize-none"
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors">
                    Submit
                  </button>
                  <button type="button" onClick={() => setShowRequestForm(false)} className="px-4 py-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] bg-white border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {tickets.length === 0 && (
                <p className="text-[13px] text-[hsl(var(--muted-foreground))] text-center py-6">No requests submitted</p>
              )}
              {tickets.map(t => (
                <div key={t.id} className="p-3 rounded-lg border border-[hsl(var(--border))]">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium text-[hsl(var(--foreground))] leading-snug">{t.title}</p>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${ticketStatusColors[t.status]}`}>
                      {t.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{t.category}</span>
                    <span className="text-[hsl(var(--muted-foreground))]">·</span>
                    <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{t.submittedDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Roommates */}
        {(room?.assignedTenants?.length ?? 0) > 1 && (
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
            <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))] mb-4">Roommates</h2>
            <div className="flex flex-wrap gap-3">
              {room?.assignedTenants?.filter(name => name !== tenant?.name)?.map(name => (
                <div key={name} className="flex items-center gap-3 bg-[hsl(var(--muted)/0.5)] rounded-lg px-4 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-[hsl(var(--primary))] text-[12px] font-semibold">
                    {name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <span className="text-[13px] font-medium text-[hsl(var(--foreground))]">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mealServiceEnabled && (
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Meal Service</h2>
                <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">
                  Set the meal plan the kitchen team should prepare for your stay.
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                mealPlan === 'No Meal Plan' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'
              }`}>
                {mealPlan}
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Meal plan</label>
                <AppSelect
                  ariaLabel="Tenant meal plan"
                  fullWidth
                  value={mealPlan}
                  options={mealPlanOptions}
                  onChange={(value) => setMealPlan(value as 'No Meal Plan' | 'Breakfast Only' | 'Half Board' | 'Full Board')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">Notes for kitchen team</label>
                <textarea
                  value={mealNotes}
                  onChange={(event) => setMealNotes(event.target.value)}
                  rows={3}
                  placeholder="Add dietary preferences, preferred service windows, or anything the chef should know."
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveMealPlan}
                className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[hsl(var(--primary)/0.9)]"
              >
                Save Meal Preference
              </button>
              <p className="self-center text-[12px] text-[hsl(var(--muted-foreground))]">
                Changes appear in the chef workspace immediately.
              </p>
            </div>
          </div>
        )}
      </div>
    
  );
}
