'use client';
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { occupancyTrendData } from '@/lib/mockData';

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
        <div key={`tooltip-${entry.name}`} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          <span className="text-[hsl(var(--muted-foreground))] capitalize">{entry.name}:</span>
          <span className="font-semibold tabular-nums">{entry.value} rooms</span>
        </div>
      ))}
    </div>
  );
}

export default function OccupancyChart() {
  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Occupancy Trend</h2>
          <p className="text-[13px] text-[hsl(var(--muted-foreground))] mt-0.5">Rooms occupied vs available — last 30 days</p>
        </div>
        <span className="text-[12px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-lg px-3 py-1.5">
          Feb 25 – Mar 26
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={occupancyTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradOccupied" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f4c81" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#0f4c81" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAvailable" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 88%)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'hsl(215 16% 46%)' }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(215 16% 46%)' }}
            tickLine={false}
            axisLine={false}
            domain={[0, 14]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
            iconType="circle"
            iconSize={8}
          />
          <Area
            type="monotone"
            dataKey="occupied"
            name="Occupied"
            stroke="#0f4c81"
            strokeWidth={2}
            fill="url(#gradOccupied)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="available"
            name="Available"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#gradAvailable)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}