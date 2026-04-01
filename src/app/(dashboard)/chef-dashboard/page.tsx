'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ChefHat, UtensilsCrossed, Users, Clock, CheckCircle2, AlertTriangle, Plus, Trash2, CalendarDays, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useDemoSession } from '@/components/DemoSessionProvider';
import { useDemoWorkspace } from '@/components/DemoWorkspaceProvider';
import AppSelect from '@/components/ui/AppSelect';
import type { MealItemRecord } from '@/lib/demoWorkspace';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const;
const MEAL_STATUS_OPTIONS = [
  { value: 'Planned', label: 'Planned' },
  { value: 'In Prep', label: 'In Prep' },
  { value: 'Served', label: 'Served' },
];

const statusColors: Record<string, string> = {
  Planned: 'bg-blue-100 text-blue-700',
  'In Prep': 'bg-amber-100 text-amber-700',
  Served: 'bg-green-100 text-green-700',
};

const categoryColors: Record<string, string> = {
  Breakfast: 'bg-orange-50 text-orange-700 border-orange-200',
  Lunch: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Dinner: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Snack: 'bg-pink-50 text-pink-700 border-pink-200',
};

export default function ChefDashboardPage() {
  const { session } = useDemoSession();
  const {
    addMeal,
    currentDormMeals,
    currentDormTenants,
    deleteMeal,
    hasModule,
    updateMealStatus,
    workspace,
  } = useDemoWorkspace();
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealCategory, setNewMealCategory] = useState<typeof CATEGORIES[number]>('Breakfast');
  const [newMealServings, setNewMealServings] = useState(50);
  const [newMealCalories, setNewMealCalories] = useState(500);

  const meals = currentDormMeals;
  const todayMeals = meals.filter(m => m.day === selectedDay);
  const mealServiceEnabled = hasModule('mealService');
  const totalServings = meals.reduce((s, m) => s + m.servings, 0);
  const mealsServed = meals.filter(m => m.status === 'Served').length;
  const inPrep = meals.filter(m => m.status === 'In Prep').length;
  const planned = meals.filter(m => m.status === 'Planned').length;
  const subscribedResidents = workspace.tenantMealPreferences.filter((preference) => {
    const tenant = currentDormTenants.find((item) => item.id === preference.tenantId);
    return tenant && preference.plan !== 'No Meal Plan';
  });
  const breakfastDemand = subscribedResidents.filter((preference) => preference.plan === 'Breakfast Only' || preference.plan === 'Full Board').length;
  const lunchDinnerDemand = subscribedResidents.filter((preference) => preference.plan === 'Half Board' || preference.plan === 'Full Board').length;

  const dietaryBreakdown = meals.reduce((acc, m) => {
    m.dietary.forEach(d => { acc[d] = (acc[d] || 0) + 1; });
    return acc;
  }, {} as Record<string, number>);

  const categoryOptions = CATEGORIES.map((category) => ({ value: category, label: category }));

  function handleStatusChange(id: string, status: MealItemRecord['status']) {
    try {
      updateMealStatus(id, status);
      toast.success('Meal status updated');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update the meal status.';
      toast.error(message);
    }
  }

  function handleDeleteMeal(id: string) {
    try {
      deleteMeal(id);
      toast.success('Meal removed from plan');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove the meal.';
      toast.error(message);
    }
  }

  function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    if (!newMealName.trim()) return;
    try {
      addMeal({
        name: newMealName.trim(),
        category: newMealCategory,
        day: selectedDay,
        servings: newMealServings,
        calories: newMealCalories,
      });
      setNewMealName('');
      setShowAddForm(false);
      toast.success(`${newMealName} added to ${selectedDay}'s plan`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add the meal.';
      toast.error(message);
    }
  }

  if (!mealServiceEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Kitchen Dashboard</h1>
          <p className="mt-0.5 text-[14px] text-[hsl(var(--muted-foreground))]">
            Chef Portal — {session?.dormName ?? 'Sunrise Dormitory'}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-[16px] font-semibold text-amber-900">Meal service is currently disabled</h2>
          <p className="mt-2 text-[13px] text-amber-800">
            The dorm owner has paused meal service, so kitchen operations are hidden until that module is turned back on.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-flex rounded-lg bg-white px-4 py-2.5 text-[13px] font-medium text-amber-900 transition-colors hover:bg-amber-100"
          >
            Open Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Kitchen Dashboard</h1>
            <p className="text-[14px] text-[hsl(var(--muted-foreground))] mt-0.5">
              Chef Portal — {session?.dormName ?? 'Sunrise Dormitory'}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors"
          >
            <Plus size={15} />
            Add Meal
          </button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[hsl(var(--primary))] text-white rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <ChefHat size={20} className="opacity-80" />
              <span className="text-[11px] font-medium uppercase tracking-wider opacity-70">Total Meals</span>
            </div>
            <p className="text-3xl font-700">{meals.length}</p>
            <p className="text-[13px] opacity-70">This week's plan</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[hsl(var(--border))] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="bg-green-50 p-2 rounded-lg">
                <CheckCircle2 size={16} className="text-green-600" />
              </div>
              <span className="text-[11px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Served</span>
            </div>
            <p className="text-2xl font-700 text-[hsl(var(--foreground))]">{mealsServed}</p>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Meals completed</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[hsl(var(--border))] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="bg-amber-50 p-2 rounded-lg">
                <Flame size={16} className="text-amber-600" />
              </div>
              <span className="text-[11px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <p className="text-2xl font-700 text-[hsl(var(--foreground))]">{inPrep}</p>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">In preparation</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-[hsl(var(--border))] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Users size={16} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-700 text-[hsl(var(--foreground))]">{subscribedResidents.length}</p>
            <p className="text-[12px] text-[hsl(var(--muted-foreground))]">Residents on meal plans</p>
          </div>
        </div>

        {/* Day selector + meal plan */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Day tabs */}
          <div className="xl:col-span-3 bg-white rounded-xl border border-[hsl(var(--border))] p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[hsl(var(--foreground))]">Weekly Meal Plan</h2>
              <div className="flex items-center gap-1.5 text-[12px] text-[hsl(var(--muted-foreground))]">
                <CalendarDays size={14} />
                Week of Mar 23 – 29, 2026
              </div>
            </div>

            {/* Day tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    selectedDay === day
                      ? 'bg-[hsl(var(--primary))] text-white'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            {/* Add meal form */}
            {showAddForm && (
              <form onSubmit={handleAddMeal} className="p-4 bg-[hsl(var(--muted)/0.5)] rounded-lg border border-[hsl(var(--border))] space-y-3">
                <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">Add meal for {selectedDay}</p>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newMealName}
                    onChange={e => setNewMealName(e.target.value)}
                    placeholder="Meal name"
                    className="col-span-2 px-3 py-2 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                    required
                  />
                  <AppSelect
                    ariaLabel="Meal category"
                    value={newMealCategory}
                    options={categoryOptions}
                    onChange={(value) => setNewMealCategory(value as typeof CATEGORIES[number])}
                    fullWidth
                    triggerClassName="py-2"
                  />
                  <input
                    type="number"
                    value={newMealServings}
                    onChange={e => setNewMealServings(Number(e.target.value))}
                    placeholder="Servings"
                    min={1}
                    className="px-3 py-2 text-[13px] border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 py-2 text-[13px] font-medium text-white bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary)/0.9)] transition-colors">
                    Add Meal
                  </button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-[13px] font-medium text-[hsl(var(--muted-foreground))] bg-white border border-[hsl(var(--border))] rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Meals for selected day */}
            <div className="space-y-3">
              {CATEGORIES.map(cat => {
                const catMeals = todayMeals.filter(m => m.category === cat);
                if (catMeals.length === 0) return null;
                return (
                  <div key={cat}>
                    <p className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border mb-2 ${categoryColors[cat]}`}>
                      <UtensilsCrossed size={11} />
                      {cat}
                    </p>
                    <div className="space-y-2">
                      {catMeals.map(meal => (
                        <div key={meal.id} className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{meal.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{meal.servings} servings</span>
                              <span className="text-[hsl(var(--muted-foreground))]">·</span>
                              <span className="text-[12px] text-[hsl(var(--muted-foreground))]">{meal.calories} kcal</span>
                              {meal.dietary.map(d => (
                                <span key={d} className="text-[11px] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-1.5 py-0.5 rounded">
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                          <AppSelect
                            ariaLabel={`Meal status for ${meal.name}`}
                            value={meal.status}
                            options={MEAL_STATUS_OPTIONS}
                            onChange={(value) => handleStatusChange(meal.id, value as MealItemRecord['status'])}
                            triggerClassName={`min-w-[104px] border-0 px-2 py-1 text-[11px] ${statusColors[meal.status]}`}
                            menuClassName="min-w-[128px]"
                          />
                          <button
                            onClick={() => handleDeleteMeal(meal.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-[hsl(var(--muted-foreground))] hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {todayMeals.length === 0 && (
                <div className="text-center py-8">
                  <UtensilsCrossed size={32} className="text-[hsl(var(--muted-foreground))] mx-auto mb-2 opacity-40" />
                  <p className="text-[13px] text-[hsl(var(--muted-foreground))]">No meals planned for {selectedDay}</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-3 text-[13px] text-[hsl(var(--primary))] font-medium hover:underline"
                  >
                    + Add first meal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: dietary breakdown + quick stats */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4">
              <h3 className="text-[14px] font-semibold text-[hsl(var(--foreground))]">Dietary Tags</h3>
              <div className="space-y-2">
                {Object.entries(dietaryBreakdown).map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between">
                    <span className="text-[13px] text-[hsl(var(--foreground))]">{tag}</span>
                    <span className="text-[12px] font-medium bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] px-2 py-0.5 rounded-full">
                      {count} meals
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4">
              <h3 className="text-[14px] font-semibold text-[hsl(var(--foreground))]">Today's Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[hsl(var(--muted-foreground))]">Meals planned</span>
                  <span className="font-medium">{todayMeals.length}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[hsl(var(--muted-foreground))]">Total servings</span>
                  <span className="font-medium">{todayMeals.reduce((s, m) => s + m.servings, 0)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[hsl(var(--muted-foreground))]">Breakfast demand</span>
                  <span className="font-medium">{breakfastDemand}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[hsl(var(--muted-foreground))]">Lunch / dinner demand</span>
                  <span className="font-medium">{lunchDinnerDemand}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[hsl(var(--muted-foreground))]">Avg calories</span>
                  <span className="font-medium">
                    {todayMeals.length > 0 ? Math.round(todayMeals.reduce((s, m) => s + m.calories, 0) / todayMeals.length) : 0} kcal
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-5 space-y-4">
              <h3 className="text-[14px] font-semibold text-[hsl(var(--foreground))]">Resident Meal Notes</h3>
              <div className="space-y-3">
                {subscribedResidents.length === 0 && (
                  <p className="text-[13px] text-[hsl(var(--muted-foreground))]">No residents are currently enrolled in meal service.</p>
                )}
                {subscribedResidents.map((preference) => {
                  const tenant = currentDormTenants.find((item) => item.id === preference.tenantId);
                  if (!tenant) return null;

                  return (
                    <div key={preference.tenantId} className="rounded-lg border border-[hsl(var(--border))] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-medium text-[hsl(var(--foreground))]">{tenant.name}</p>
                        <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                          {preference.plan}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-[hsl(var(--muted-foreground))]">
                        {preference.notes || 'No kitchen notes provided.'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-600" />
                <p className="text-[13px] font-semibold text-amber-800">Reminders</p>
              </div>
              <ul className="space-y-1.5">
                <li className="text-[12px] text-amber-700 flex items-start gap-1.5">
                  <Clock size={11} className="mt-0.5 flex-shrink-0" />
                  Dinner prep starts at 4:30 PM
                </li>
                <li className="text-[12px] text-amber-700 flex items-start gap-1.5">
                  <Clock size={11} className="mt-0.5 flex-shrink-0" />
                  Weekly inventory check: Friday
                </li>
                <li className="text-[12px] text-amber-700 flex items-start gap-1.5">
                  <Clock size={11} className="mt-0.5 flex-shrink-0" />
                  Submit next week's plan by Sunday
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    
  );
}
