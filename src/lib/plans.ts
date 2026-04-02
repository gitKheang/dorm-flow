import type { EnabledModule } from '@/lib/modules';
import { isPremiumModule } from '@/lib/modules';

export type DormPlan = 'free' | 'premium';

export type PremiumFeature =
  | 'chefManagement'
  | 'chefDashboard'
  | 'tenantMealPreferences'
  | 'mealPlanning'
  | 'reports'
  | 'multiDormPortfolio';

export type FeatureAccessReason = 'plan' | 'module' | null;

export interface PremiumFeatureAccess {
  allowed: boolean;
  reason: FeatureAccessReason;
  module: EnabledModule;
  plan: DormPlan;
}

export const DEFAULT_PREMIUM_DORM_MODULES: EnabledModule[] = [
  'core',
  'mealService',
  'notifications',
  'analytics',
  'multiDorm',
];

export const DEFAULT_FREE_DORM_MODULES: EnabledModule[] = [
  'core',
  'notifications',
];

const PREMIUM_FEATURE_MODULES: Record<PremiumFeature, EnabledModule> = {
  chefManagement: 'mealService',
  chefDashboard: 'mealService',
  tenantMealPreferences: 'mealService',
  mealPlanning: 'mealService',
  reports: 'analytics',
  multiDormPortfolio: 'multiDorm',
};

export function getPremiumFeatureModule(
  feature: PremiumFeature,
): EnabledModule {
  return PREMIUM_FEATURE_MODULES[feature];
}

export function isPremiumPlan(plan: DormPlan): boolean {
  return plan === 'premium';
}

export function canToggleModuleForPlan(
  plan: DormPlan,
  module: EnabledModule,
): boolean {
  if (module === 'core') {
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
      reason: 'plan',
      module,
      plan,
    };
  }

  if (!enabledModules.includes(module)) {
    return {
      allowed: false,
      reason: 'module',
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
