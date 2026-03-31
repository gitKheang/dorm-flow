import React from 'react';

function LoadingBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-[hsl(var(--muted))] ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <LoadingBlock className="h-8 w-56" />
        <LoadingBlock className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`loading-card-${index}`}
            className="rounded-xl border border-[hsl(var(--border))] bg-white p-5"
          >
            <LoadingBlock className="mb-4 h-10 w-10 rounded-xl" />
            <LoadingBlock className="mb-2 h-7 w-24" />
            <LoadingBlock className="h-4 w-32" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-6 xl:col-span-2">
          <LoadingBlock className="mb-5 h-5 w-40" />
          <LoadingBlock className="h-64 w-full" />
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-6">
          <LoadingBlock className="mb-5 h-5 w-28" />
          <LoadingBlock className="mb-4 h-40 w-full rounded-full" />
          <div className="space-y-2">
            <LoadingBlock className="h-4 w-full" />
            <LoadingBlock className="h-4 w-full" />
            <LoadingBlock className="h-4 w-5/6" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-6">
        <LoadingBlock className="mb-5 h-5 w-48" />
        <LoadingBlock className="h-64 w-full" />
      </div>
    </div>
  );
}
