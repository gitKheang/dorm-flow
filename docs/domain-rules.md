# DormFlow Domain Rules

## Auth Model

- Users authenticate by identity, never by manually choosing a role.
- Authorization is membership-driven: a user can hold different memberships in different dorms.
- Public signup creates only an `Admin` membership.
- `Tenant` and `Chef` access are invite-only.
- Archived dorms cannot be used as active workspaces.

## Core Entities

- `users`: global identities keyed by email.
- `dorms`: top-level operating units.
- `memberships`: one role per user per dorm in v1.
- `tenant_profiles`: links a tenant membership to the dorm-scoped resident record.
- `chef_profiles`: links a chef membership to the dorm-scoped chef record.
- `invitations`: dorm-scoped invite tokens for tenant and chef onboarding.
- `rooms`, `invoices`, `maintenance_tickets`, `meals`: dorm-scoped business records.
- `tenant_meal_preferences`: tied to dorm-scoped tenant records.

## Invitation Workflow

- States: `pending -> accepted | revoked | expired`
- Invitations are single-use. Accepted invitations cannot be reused.
- Acceptance is email-matched and code-matched.
- Every invitation can be linked to a target resident or chef record.
- Acceptance creates the membership and activates the matching profile.
- Duplicate active membership in the same dorm is rejected.
- Expiry is enforced in the auth service before invitation reads and writes.

## Transaction Boundaries

- `createResidentWithInvitation` is atomic at the domain layer:
  It validates admin access, validates room assignment, creates the resident record, creates the invitation, and only then commits auth + workspace state together.
- `createChefWithInvitation` is atomic at the domain layer:
  It validates admin access, validates `mealService`, creates the chef record, creates the invitation, and only then commits auth + workspace state together.
- Invitation acceptance is committed as one combined state change:
  Auth acceptance creates the membership/profile and the workspace activation flips the linked resident or chef record to active in the same commit path.

## Room Rules

- Occupancy is computed from active tenant assignments, never trusted from manual counts.
- Only active tenants count toward occupancy.
- A tenant can only belong to one room at a time because room assignment is stored on the tenant record.
- Capacity cannot be exceeded.
- Rooms marked `Reserved` or `Under Maintenance` cannot receive new residents.
- Deleting a room safely unassigns its residents first.

## Invoice Rules

- Only eligible active tenants with a valid room assignment receive invoices.
- Invoice generation is idempotent per `tenant_id + billing_period` within a dorm.
- Existing invoices for the same billing period are skipped instead of duplicated.

## Maintenance Rules

- Tenants can create tickets only for their own room.
- Admins can update maintenance status.
- Status history is stored separately from the ticket record.
- Allowed transitions:
  `Open -> In Progress | Resolved`
  `In Progress -> Open | Resolved`
  `Resolved -> Open | In Progress`

## Module Guards

- `mealService` gates chef onboarding, chef operations, and meal-preference updates.
- `multiDorm` gates portfolio actions such as adding or archiving dorms.
- These checks run in the domain action layer, not only in the UI.

## Assumptions

- The demo app still uses local storage as the persistence layer.
- `enabledModules` remains in workspace state as a current-dorm mirror for compatibility, while `dormModules` is the dorm-scoped source of truth.
- Room assignment edits still happen indirectly through the existing frontend; the strict assignment validator is already used for onboarding and activation paths.

## Edge Cases Protected

- Duplicate resident or chef emails inside the same dorm.
- Duplicate active memberships inside the same dorm.
- Invitation reuse, revoked invites, and expired invites.
- Switching into archived dorms.
- Cross-dorm reads through the workspace hook by returning only membership-scoped data.
- Re-activating a tenant into a full or non-assignable room.

## TODO For Real Backend

- Move local storage persistence into real transactional server actions or RPC endpoints.
- Replace demo password handling during invite acceptance with a real identity provider flow.
- Enforce unique constraints in the database for memberships and invoices.
- Replace the current demo auth adapter with the Supabase implementation in `src/lib/auth/supabaseService.ts`.
