import type { EnabledModule } from "@/lib/modules";
import { isPremiumModule } from "@/lib/modules";

export type DormPlan = "free" | "premium";

export type PremiumFeature =
  | "chefManagement"
  | "chefDashboard"
  | "tenantMealPreferences"
  | "mealPlanning"
  | "reports"
  | "multiDormPortfolio";

export type PremiumCheckoutSource =
  | "settings"
  | "reports"
  | "multiDorm"
  | "chefManagement"
  | "chefDashboard";

export type FeatureAccessReason = "plan" | "module" | null;

export interface PremiumFeatureAccess {
  allowed: boolean;
  reason: FeatureAccessReason;
  module: EnabledModule;
  plan: DormPlan;
}

export interface PremiumFeatureDefinition {
  id: PremiumFeature;
  title: string;
  description: string;
}

export interface PremiumCheckoutContext {
  source: PremiumCheckoutSource;
  title: string;
  description: string;
  highlightedFeature: PremiumFeature | null;
}

export const DEFAULT_PREMIUM_DORM_MODULES: EnabledModule[] = [
  "core",
  "mealService",
  "notifications",
  "analytics",
  "multiDorm",
];

export const DEFAULT_FREE_DORM_MODULES: EnabledModule[] = [
  "core",
  "notifications",
];

export const PREMIUM_PLAN_MONTHLY_PRICE_USD = 29;

export const PREMIUM_PLAN_FEATURES: PremiumFeatureDefinition[] = [
  {
    id: "multiDormPortfolio",
    title: "Multiple dorm portfolio",
    description:
      "Add, archive, and switch between dorm workspaces from one owner account.",
  },
  {
    id: "reports",
    title: "Reports and analytics",
    description:
      "Review occupancy, collections, maintenance activity, and meal-service trends for each dorm.",
  },
  {
    id: "chefManagement",
    title: "Kitchen staff management",
    description:
      "Invite chefs, manage staff status, and keep kitchen operations tied to the active dorm.",
  },
  {
    id: "chefDashboard",
    title: "Kitchen dashboard",
    description:
      "Plan meals, track servings, and monitor kitchen demand from one operational view.",
  },
  {
    id: "tenantMealPreferences",
    title: "Resident meal preferences",
    description:
      "Allow residents to save meal selections that feed directly into dorm meal planning.",
  },
  {
    id: "mealPlanning",
    title: "Meal planning workflows",
    description:
      "Coordinate planned meals, prep status, and service updates without leaving the workspace.",
  },
];

export const PREMIUM_PLAN_CHARACTERISTICS = [
  "Premium is billed per dorm, not once for the whole owner account.",
  "The active dorm gets premium modules immediately after payment succeeds.",
  "Notifications and core dorm operations stay available on both Free and Premium.",
];

export const PREMIUM_PLAN_DOWNGRADE_OUTCOMES = [
  "Dorm records, memberships, and existing dorm data stay saved.",
  "Reports, meal service, kitchen staff tools, and multi-dorm actions are locked again.",
  "Extra dorms are not deleted, but adding, switching, and archiving dorms stay blocked until Premium is restored for that dorm.",
];

const PREMIUM_CHECKOUT_CONTEXT: Record<
  PremiumCheckoutSource,
  PremiumCheckoutContext
> = {
  settings: {
    source: "settings",
    title: "Upgrade this dorm to Premium",
    description:
      "Review the plan, monthly price, and included tools before activating Premium for the active dorm.",
    highlightedFeature: null,
  },
  reports: {
    source: "reports",
    title: "Unlock reports for this dorm",
    description:
      "Premium opens occupancy, payment, maintenance, and meal-service reporting for the active dorm.",
    highlightedFeature: "reports",
  },
  multiDorm: {
    source: "multiDorm",
    title: "Unlock multiple dorm management",
    description:
      "Premium lets this dorm add, switch, and archive dorm workspaces from one owner account.",
    highlightedFeature: "multiDormPortfolio",
  },
  chefManagement: {
    source: "chefManagement",
    title: "Unlock kitchen staff tools",
    description:
      "Premium enables chef invitations, kitchen staff workflows, and resident meal-service operations.",
    highlightedFeature: "chefManagement",
  },
  chefDashboard: {
    source: "chefDashboard",
    title: "Unlock the kitchen dashboard",
    description:
      "Premium enables meal planning, service tracking, and kitchen demand visibility for this dorm.",
    highlightedFeature: "chefDashboard",
  },
};

const PREMIUM_FEATURE_MODULES: Record<PremiumFeature, EnabledModule> = {
  chefManagement: "mealService",
  chefDashboard: "mealService",
  tenantMealPreferences: "mealService",
  mealPlanning: "mealService",
  reports: "analytics",
  multiDormPortfolio: "multiDorm",
};

export function getPremiumFeatureModule(
  feature: PremiumFeature,
): EnabledModule {
  return PREMIUM_FEATURE_MODULES[feature];
}

export function isPremiumPlan(plan: DormPlan): boolean {
  return plan === "premium";
}

export function canToggleModuleForPlan(
  plan: DormPlan,
  module: EnabledModule,
): boolean {
  if (module === "core") {
    return false;
  }

  return !isPremiumModule(module) || isPremiumPlan(plan);
}

export function getPremiumFeatureAccess(
  plan: DormPlan,
  enabledModules: EnabledModule[],
  feature: PremiumFeature,
): PremiumFeatureAccess {
  const module = getPremiumFeatureModule(feature);

  if (!isPremiumPlan(plan)) {
    return {
      allowed: false,
      reason: "plan",
      module,
      plan,
    };
  }

  if (!enabledModules.includes(module)) {
    return {
      allowed: false,
      reason: "module",
      module,
      plan,
    };
  }

  return {
    allowed: true,
    reason: null,
    module,
    plan,
  };
}

export function canUsePremiumFeature(
  plan: DormPlan,
  enabledModules: EnabledModule[],
  feature: PremiumFeature,
): boolean {
  return getPremiumFeatureAccess(plan, enabledModules, feature).allowed;
}

export function getPremiumCheckoutContext(
  source?: string | null,
): PremiumCheckoutContext {
  if (
    source &&
    Object.prototype.hasOwnProperty.call(PREMIUM_CHECKOUT_CONTEXT, source)
  ) {
    return PREMIUM_CHECKOUT_CONTEXT[source as PremiumCheckoutSource];
  }

  return PREMIUM_CHECKOUT_CONTEXT.settings;
}

export function buildPremiumCheckoutHref(params?: {
  source?: PremiumCheckoutSource;
  returnTo?: string;
}): string {
  const searchParams = new URLSearchParams();

  if (params?.source) {
    searchParams.set("source", params.source);
  }

  if (params?.returnTo) {
    searchParams.set("returnTo", params.returnTo);
  }

  const query = searchParams.toString();
  return query ? `/premium?${query}` : "/premium";
}
