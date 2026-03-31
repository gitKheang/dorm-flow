import React from 'react';

const dormPortfolio = [
  {
    name: 'Sunrise Dormitory',
    city: 'Phnom Penh',
    capacity: 120,
    occupiedBeds: 108,
    collectionRate: 96,
    monthlyRevenue: 78200,
    openMaintenance: 4,
    waitlist: 18,
  },
  {
    name: 'Riverside Residences',
    city: 'Siem Reap',
    capacity: 84,
    occupiedBeds: 70,
    collectionRate: 91,
    monthlyRevenue: 51400,
    openMaintenance: 7,
    waitlist: 9,
  },
  {
    name: 'Northgate Student House',
    city: 'Battambang',
    capacity: 64,
    occupiedBeds: 58,
    collectionRate: 98,
    monthlyRevenue: 43600,
    openMaintenance: 2,
    waitlist: 6,
  },
];

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function MultiDormPage() {
  const totalCapacity = dormPortfolio.reduce((sum, dorm) => sum + dorm.capacity, 0);
  const totalOccupiedBeds = dormPortfolio.reduce((sum, dorm) => sum + dorm.occupiedBeds, 0);
  const totalRevenue = dormPortfolio.reduce((sum, dorm) => sum + dorm.monthlyRevenue, 0);
  const totalMaintenance = dormPortfolio.reduce((sum, dorm) => sum + dorm.openMaintenance, 0);
  const totalWaitlist = dormPortfolio.reduce((sum, dorm) => sum + dorm.waitlist, 0);
  const occupancyRate = Math.round((totalOccupiedBeds / totalCapacity) * 100);
  const averageCollectionRate = Math.round(
    dormPortfolio.reduce((sum, dorm) => sum + dorm.collectionRate, 0) / dormPortfolio.length
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Multi-Dorm Overview</h1>
          <p className="mt-0.5 text-[14px] text-[hsl(var(--muted-foreground))]">
            Portfolio-level occupancy, revenue, and operational health across all properties
          </p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
            Portfolio Focus
          </p>
          <p className="mt-1 text-[14px] font-medium text-[hsl(var(--foreground))]">
            Riverside needs attention on occupancy and ticket volume this week.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-[hsl(var(--primary))] p-5 text-white">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/75">Portfolio Occupancy</p>
          <p className="mt-3 text-3xl font-semibold">{occupancyRate}%</p>
          <p className="mt-1 text-[13px] text-white/75">
            {totalOccupiedBeds} of {totalCapacity} beds occupied
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-emerald-700">Monthly Revenue</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-900">{currency.format(totalRevenue)}</p>
          <p className="mt-1 text-[13px] text-emerald-700">{dormPortfolio.length} active dorms reporting</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-blue-700">Average Collection</p>
          <p className="mt-3 text-3xl font-semibold text-blue-900">{averageCollectionRate}%</p>
          <p className="mt-1 text-[13px] text-blue-700">Healthy payment performance across the portfolio</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-amber-700">Open Maintenance</p>
          <p className="mt-3 text-3xl font-semibold text-amber-900">{totalMaintenance}</p>
          <p className="mt-1 text-[13px] text-amber-700">{totalWaitlist} residents currently on waitlists</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Dorm Performance</h2>
              <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">
                Occupancy, collections, and workload by property
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {dormPortfolio.map((dorm) => {
              const dormOccupancy = Math.round((dorm.occupiedBeds / dorm.capacity) * 100);
              const occupancyBarClass =
                dormOccupancy >= 95
                  ? 'bg-emerald-500'
                  : dormOccupancy >= 85
                    ? 'bg-[hsl(var(--primary))]'
                    : 'bg-amber-500';

              return (
                <div
                  key={dorm.name}
                  className="rounded-xl border border-[hsl(var(--border))] p-4 transition-colors hover:bg-[hsl(var(--muted)/0.35)]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[15px] font-semibold text-[hsl(var(--foreground))]">{dorm.name}</p>
                      <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">{dorm.city}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
                      <div>
                        <p className="text-[hsl(var(--muted-foreground))]">Revenue</p>
                        <p className="mt-1 font-semibold text-[hsl(var(--foreground))]">
                          {currency.format(dorm.monthlyRevenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[hsl(var(--muted-foreground))]">Collection</p>
                        <p className="mt-1 font-semibold text-[hsl(var(--foreground))]">{dorm.collectionRate}%</p>
                      </div>
                      <div>
                        <p className="text-[hsl(var(--muted-foreground))]">Open Tickets</p>
                        <p className="mt-1 font-semibold text-[hsl(var(--foreground))]">{dorm.openMaintenance}</p>
                      </div>
                      <div>
                        <p className="text-[hsl(var(--muted-foreground))]">Waitlist</p>
                        <p className="mt-1 font-semibold text-[hsl(var(--foreground))]">{dorm.waitlist}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-[13px]">
                      <span className="text-[hsl(var(--muted-foreground))]">Occupancy</span>
                      <span className="font-medium text-[hsl(var(--foreground))]">
                        {dorm.occupiedBeds}/{dorm.capacity} beds ({dormOccupancy}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                      <div
                        className={`h-full rounded-full ${occupancyBarClass}`}
                        style={{ width: `${dormOccupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-6">
          <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Priority Watchlist</h2>
          <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">
            The most immediate portfolio actions based on current metrics
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                title: 'Riverside occupancy is trailing portfolio average',
                detail: '70 of 84 beds occupied. Consider pushing local marketing or referral incentives.',
                tone: 'border-amber-200 bg-amber-50 text-amber-900',
              },
              {
                title: 'Sunrise waitlist can be converted faster',
                detail: '18 pending residents can offset churn if room turnover is accelerated this week.',
                tone: 'border-blue-200 bg-blue-50 text-blue-900',
              },
              {
                title: 'Northgate collections are strong',
                detail: '98% collection rate makes it the best candidate for pricing and expansion analysis.',
                tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-xl border p-4 ${item.tone}`}>
                <p className="text-[13px] font-semibold">{item.title}</p>
                <p className="mt-1 text-[12px] leading-5 opacity-80">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-white">
        <div className="border-b border-[hsl(var(--border))] px-6 py-4">
          <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Portfolio Table</h2>
          <p className="mt-0.5 text-[13px] text-[hsl(var(--muted-foreground))]">
            Standardized property snapshot for weekly operations reviews
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[hsl(var(--border))]">
            <thead className="bg-[hsl(var(--muted)/0.45)]">
              <tr className="text-left text-[12px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                <th className="px-6 py-3 font-medium">Dorm</th>
                <th className="px-6 py-3 font-medium">City</th>
                <th className="px-6 py-3 font-medium">Occupancy</th>
                <th className="px-6 py-3 font-medium">Collection</th>
                <th className="px-6 py-3 font-medium">Revenue</th>
                <th className="px-6 py-3 font-medium">Open Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--border))]">
              {dormPortfolio.map((dorm) => {
                const dormOccupancy = Math.round((dorm.occupiedBeds / dorm.capacity) * 100);

                return (
                  <tr key={dorm.name} className="text-[14px] text-[hsl(var(--foreground))]">
                    <td className="px-6 py-4 font-medium">{dorm.name}</td>
                    <td className="px-6 py-4 text-[hsl(var(--muted-foreground))]">{dorm.city}</td>
                    <td className="px-6 py-4">{dormOccupancy}%</td>
                    <td className="px-6 py-4">{dorm.collectionRate}%</td>
                    <td className="px-6 py-4">{currency.format(dorm.monthlyRevenue)}</td>
                    <td className="px-6 py-4">{dorm.openMaintenance}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
