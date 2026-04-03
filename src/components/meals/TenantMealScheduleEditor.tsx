"use client";

import React, { useMemo } from "react";
import { Check, Lock, X } from "lucide-react";
import type {
  MealScheduleDay,
  TenantMealSelection,
} from "@/lib/demoWorkspace";
import {
  countEnabledMealSelections,
  getMealSlotAccessState,
  MEAL_SLOT_CATEGORIES,
} from "@/lib/demoWorkspace";

export default function TenantMealScheduleEditor({
  disabled,
  notes,
  onNotesChange,
  onToggleSelection,
  schedule,
  selections,
}: {
  disabled: boolean;
  notes: string;
  onNotesChange: (value: string) => void;
  onToggleSelection: (selectionId: string) => void;
  schedule: MealScheduleDay[];
  selections: TenantMealSelection[];
}) {
  const selectionsById = useMemo(
    () => new Map(selections.map((selection) => [selection.id, selection])),
    [selections],
  );
  const enabledCount = countEnabledMealSelections(selections);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
          <div className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            Day
          </div>
          {MEAL_SLOT_CATEGORIES.map((category) => (
            <div
              key={category}
              className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]"
            >
              {category}
            </div>
          ))}
        </div>

        {schedule.map((day) => (
          <div
            key={day.date}
            className="grid grid-cols-[160px_repeat(3,minmax(0,1fr))] border-b border-[hsl(var(--border))] last:border-b-0"
          >
            <div className="border-r border-[hsl(var(--border))] bg-white px-4 py-4">
              <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
                {day.dayLabel}
              </p>
              <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                {day.shortLabel}
                {day.isToday ? " · Today" : ""}
              </p>
            </div>
            {MEAL_SLOT_CATEGORIES.map((category) => {
              const selection = selectionsById.get(
                `${day.date}-${category.toLowerCase()}`,
              );
              if (!selection) {
                return <div key={`${day.date}-${category}`} className="px-4 py-4" />;
              }

              const access = getMealSlotAccessState(selection);
              const locked = disabled || access.locked;

              return (
                <div
                  key={selection.id}
                  className="border-r border-[hsl(var(--border))] px-4 py-4 last:border-r-0"
                >
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onToggleSelection(selection.id)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                      selection.enabled
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))]"
                    } ${
                      locked
                        ? "cursor-not-allowed opacity-70"
                        : "hover:border-[hsl(var(--primary)/0.35)] hover:bg-[hsl(var(--primary)/0.04)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-medium">
                        {locked
                          ? access.reason === "past"
                            ? "Closed"
                            : access.reason === "cutoff"
                              ? "Cutoff passed"
                              : "Locked"
                          : selection.enabled
                            ? "Included"
                            : "Skipped"}
                      </span>
                      {locked ? (
                        <Lock size={14} />
                      ) : selection.enabled ? (
                        <Check size={14} />
                      ) : (
                        <X size={14} />
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-[hsl(var(--muted-foreground))]">
                      {access.serviceLabel}
                    </p>
                    <p className="mt-1 text-[11px] text-[hsl(var(--muted-foreground))]">
                      Cutoff: {access.cutoffLabel}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-[hsl(var(--muted)/0.45)] px-4 py-3">
        <div>
          <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">
            {enabledCount} meal slot{enabledCount === 1 ? "" : "s"} selected for the next 7 days
          </p>
          <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
            Breakfast closes the night before. Lunch and dinner close on the same day.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-[hsl(var(--foreground))]">
          Notes for the kitchen team
        </label>
        <textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          rows={3}
          disabled={disabled}
          placeholder="Add dietary notes or anything the kitchen team should know."
          className={`w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2.5 text-[13px] resize-none ${
            disabled
              ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
              : "bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
          }`}
        />
      </div>
    </div>
  );
}
