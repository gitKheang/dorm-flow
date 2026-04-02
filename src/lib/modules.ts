export type EnabledModule =
  | 'core'
  | 'mealService'
  | 'notifications'
  | 'analytics'
  | 'multiDorm';

export const PREMIUM_MODULES: EnabledModule[] = [
  'mealService',
  'analytics',
  'multiDorm',
];

export function isPremiumModule(module: EnabledModule): boolean {
  return PREMIUM_MODULES.includes(module);
}
