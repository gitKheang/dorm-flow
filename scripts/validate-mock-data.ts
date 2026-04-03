import assert from "node:assert/strict";
import { createDemoAuthSeedSnapshot } from "../src/lib/auth/demoService";
import { createAuthService } from "../src/lib/auth/service";
import {
  mapDormToAuthDorm,
  syncWorkspaceState,
} from "../src/lib/domain/workspaceActions";
import {
  buildMealScheduleWindow,
  DEFAULT_WORKSPACE_STATE,
  restoreDemoWorkspace,
} from "../src/lib/demoWorkspace";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function validateSeedWorkspace() {
  const workspace = syncWorkspaceState(clone(DEFAULT_WORKSPACE_STATE));

  assert.equal(workspace.dorms.length, 3);
  assert.equal(workspace.dormModules.length, workspace.dorms.length);
  assert.ok(workspace.payments.length > 0);
  assert.ok(workspace.notifications.length > 0);
  assert.equal(
    workspace.maintenanceStatusHistory.length,
    workspace.maintenanceTickets.length,
  );

  for (const room of workspace.rooms) {
    assert.ok(
      room.occupants <= room.capacity,
      `Seed room ${room.roomNumber} exceeds capacity.`,
    );
  }

  assert.equal(
    workspace.invoices.find((invoice) => invoice.id === "inv-002")?.status,
    "Paid",
  );
  assert.equal(
    workspace.invoices.find((invoice) => invoice.id === "inv-003")?.status,
    "Overdue",
  );
  assert.equal(
    workspace.invoices.find((invoice) => invoice.id === "inv-012")?.status,
    "Draft",
  );

  assert.equal(
    workspace.rooms.find((room) => room.id === "room-001")?.occupants,
    2,
  );
  assert.equal(
    workspace.rooms.find((room) => room.id === "room-009")?.status,
    "Under Maintenance",
  );
  assert.equal(
    workspace.rooms.find((room) => room.id === "room-004")?.status,
    "Reserved",
  );
  assert.equal(
    workspace.tenants.find((tenant) => tenant.id === "tenant-013")
      ?.invitationLifecycleState,
    "pending",
  );
  assert.equal(
    workspace.tenants.find((tenant) => tenant.id === "tenant-014")?.status,
    "Inactive",
  );
  assert.ok(
    (workspace.maintenanceTickets.find((ticket) => ticket.id === "maint-009")
      ?.attachments?.length ?? 0) > 0,
    "Expected the seeded room-004 ticket to include at least one attachment.",
  );

  const currentDayLabel = buildMealScheduleWindow()[0]?.dayLabel;
  assert.ok(
    currentDayLabel,
    "Expected the rolling meal schedule to expose the current day.",
  );
  const dormOneCurrentDayMeals = workspace.mealItems.filter(
    (meal) => meal.dormId === "dorm-001" && meal.day === currentDayLabel,
  );
  assert.equal(
    dormOneCurrentDayMeals.length,
    3,
    "Sunrise Dormitory should have breakfast, lunch, and dinner for the current day.",
  );
  assert.deepEqual(dormOneCurrentDayMeals.map((meal) => meal.category).sort(), [
    "Breakfast",
    "Dinner",
    "Lunch",
  ]);
}

function validateAuthSeedConsistency() {
  const workspace = syncWorkspaceState(clone(DEFAULT_WORKSPACE_STATE));
  const seed = createDemoAuthSeedSnapshot({
    dorms: workspace.dorms.map(mapDormToAuthDorm),
    tenants: workspace.tenants,
    chefs: workspace.chefs,
  });
  const authService = createAuthService("demo");
  const auth = authService.initialize(null, seed);

  const pendingChef = workspace.chefs.find(
    (chef) => chef.invitationLifecycleState === "pending",
  );
  assert.ok(pendingChef, "Expected at least one pending chef in seed data.");
  assert.ok(
    auth.invitations.some(
      (invitation) =>
        invitation.targetRecordId === pendingChef.id &&
        invitation.role === "Chef" &&
        invitation.status === "pending",
    ),
    "Pending seed chef must have a real invitation record.",
  );

  const pendingTenant = workspace.tenants.find(
    (tenant) => tenant.invitationLifecycleState === "pending",
  );
  assert.ok(
    pendingTenant,
    "Expected at least one pending tenant in seed data.",
  );
  assert.ok(
    auth.invitations.some(
      (invitation) =>
        invitation.targetRecordId === pendingTenant.id &&
        invitation.role === "Tenant" &&
        invitation.status === "pending",
    ),
    "Pending seed tenant must have a real invitation record.",
  );

  const adminResult = authService.signIn(auth, {
    email: "admin@sunrisedorm.app",
    password: "SunriseAdmin2026",
  });
  assert.equal(adminResult.session?.activeDormId, workspace.currentDormId);

  const tenantResult = authService.signIn(auth, {
    email: "sophea.kang@dormflow.app",
    password: "TenantPass2026",
  });
  assert.equal(tenantResult.session?.activeDormId, "dorm-001");
}

function validateLegacyRestore() {
  const legacySnapshot = clone(DEFAULT_WORKSPACE_STATE) as unknown as Record<
    string,
    unknown
  >;
  delete legacySnapshot.payments;
  delete legacySnapshot.notifications;
  delete legacySnapshot.dormModules;
  delete legacySnapshot.maintenanceStatusHistory;

  const restored = syncWorkspaceState(
    restoreDemoWorkspace(JSON.stringify(legacySnapshot)),
  );

  assert.ok(restored.payments.length > 0);
  assert.ok(restored.notifications.length > 0);
  assert.equal(restored.dormModules.length, restored.dorms.length);
  assert.equal(
    restored.maintenanceStatusHistory.length,
    restored.maintenanceTickets.length,
  );
}

function validateMalformedRestoreFallbacks() {
  const malformedSnapshot = {
    ...clone(DEFAULT_WORKSPACE_STATE),
    payments: [{ id: "legacy-payment" }],
    notifications: [{ id: "legacy-notification" }],
  };

  const restored = syncWorkspaceState(
    restoreDemoWorkspace(JSON.stringify(malformedSnapshot)),
  );

  assert.ok(restored.payments.length > 0);
  assert.ok(
    restored.payments.every(
      (payment) => payment.invoiceId && payment.reference,
    ),
    "Malformed stored payments should be replaced by valid ledger records.",
  );
  assert.ok(restored.notifications.length > 0);
  assert.ok(
    restored.notifications.every(
      (notification) => notification.eventType && notification.message,
    ),
    "Malformed stored notifications should be replaced by valid seed notifications.",
  );
}

function runValidation() {
  validateSeedWorkspace();
  validateAuthSeedConsistency();
  validateLegacyRestore();
  validateMalformedRestoreFallbacks();
  console.log("Mock data validation passed.");
}

runValidation();
