'use client';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PaymentTrendPoint } from '@/lib/domain/paymentAnalytics';

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-[hsl(var(--border))] rounded-xl shadow-lg p-3 text-[13px]">
      <p className="font-semibold text-[hsl(var(--foreground))] mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={`bar-tooltip-${entry.name}`} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: entry.color }} />
          <span className="text-[hsl(var(--muted-foreground))]">{entry.name}:</span>
          <span className="font-semibold tabular-nums">${entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function PaymentChart({ data }: { data: PaymentTrendPoint[] }) {
  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
      <div className="mb-6">
        <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Payment Activity</h2>
        <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">Monthly payment attempts by status</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={10}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 88%)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'hsl(215 16% 46%)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(215 16% 46%)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            iconType="square"
            iconSize={8}
          />
          <Bar dataKey="paid" name="Paid" fill="#22c55e" radius={[3, 3, 0, 0]} />
          <Bar dataKey="pending" name="Pending" fill="#0f4c81" radius={[3, 3, 0, 0]} />
          <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
