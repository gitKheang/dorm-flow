import type { ActivityItem, Invoice, MaintenanceTicket, Room, Tenant } from '@/lib/mockData';
import type { ChefShift, ChefStatus, DemoDorm, MealItemRecord, MealPlan, TenantMealPreference } from '@/lib/demoWorkspace';

export interface WorkspaceTenant extends Tenant {
  dormId: string;
}

export interface WorkspaceRoom extends Room {
  dormId: string;
}

export interface WorkspaceInvoice extends Invoice {
  dormId: string;
}

export interface WorkspaceMaintenanceTicket extends MaintenanceTicket {
  dormId: string;
}

export interface WorkspaceActivityItem extends ActivityItem {
  dormId: string;
}

export interface WorkspaceChef {
  id: string;
  name: string;
  email: string;
  shift: ChefShift;
  specialty: string;
  status: ChefStatus;
  dormId: string;
}

export const DEMO_DORMS: DemoDorm[] = [
  {
    id: 'dorm-001',
    name: 'Sunrise Dormitory',
    city: 'Phnom Penh',
    address: '12 Riverside Campus Road, Phnom Penh',
    timezone: 'UTC+7 (Indochina Time)',
    waitlist: 18,
    status: 'Active',
    openedOn: '2024-06-01',
  },
  {
    id: 'dorm-002',
    name: 'Riverside Residences',
    city: 'Siem Reap',
    address: '55 Angkor Boulevard, Siem Reap',
    timezone: 'UTC+7 (Indochina Time)',
    waitlist: 9,
    status: 'Active',
    openedOn: '2025-01-15',
  },
  {
    id: 'dorm-003',
    name: 'Northgate Student House',
    city: 'Battambang',
    address: '8 University Lane, Battambang',
    timezone: 'UTC+7 (Indochina Time)',
    waitlist: 6,
    status: 'Active',
    openedOn: '2025-08-20',
  },
];

export const DEMO_TENANTS: WorkspaceTenant[] = [
  { id: 'tenant-001', dormId: 'dorm-001', name: 'Sophea Kang', email: 'sophea.kang@dormflow.app', phone: '+1-555-0142', avatar: 'SK', roomId: 'room-001', moveInDate: '2025-09-01', status: 'Active' },
  { id: 'tenant-002', dormId: 'dorm-001', name: 'Marcus Rivera', email: 'marcus.rivera@dormflow.app', phone: '+1-555-0198', avatar: 'MR', roomId: 'room-001', moveInDate: '2025-09-01', status: 'Active' },
  { id: 'tenant-003', dormId: 'dorm-001', name: 'Linh Tran', email: 'linh.tran@dormflow.app', phone: '+1-555-0267', avatar: 'LT', roomId: 'room-002', moveInDate: '2025-10-15', status: 'Active' },
  { id: 'tenant-004', dormId: 'dorm-001', name: 'Ethan Park', email: 'ethan.park@dormflow.app', phone: '+1-555-0334', avatar: 'EP', roomId: 'room-003', moveInDate: '2025-08-20', status: 'Active' },
  { id: 'tenant-005', dormId: 'dorm-002', name: 'Amara Osei', email: 'amara.osei@dormflow.app', phone: '+1-555-0411', avatar: 'AO', roomId: 'room-005', moveInDate: '2025-11-01', status: 'Active' },
  { id: 'tenant-006', dormId: 'dorm-002', name: 'Daniel Novak', email: 'daniel.novak@dormflow.app', phone: '+1-555-0523', avatar: 'DN', roomId: 'room-005', moveInDate: '2025-09-15', status: 'Active' },
  { id: 'tenant-007', dormId: 'dorm-002', name: 'Priya Menon', email: 'priya.menon@dormflow.app', phone: '+1-555-0618', avatar: 'PM', roomId: 'room-006', moveInDate: '2025-10-01', status: 'Active' },
  { id: 'tenant-008', dormId: 'dorm-002', name: 'Yuki Tanaka', email: 'yuki.tanaka@dormflow.app', phone: '+1-555-0712', avatar: 'YT', roomId: 'room-008', moveInDate: '2025-07-15', status: 'Active' },
  { id: 'tenant-009', dormId: 'dorm-002', name: 'Nadia Flores', email: 'nadia.flores@dormflow.app', phone: '+1-555-0845', avatar: 'NF', roomId: 'room-008', moveInDate: '2025-09-05', status: 'Active' },
  { id: 'tenant-010', dormId: 'dorm-003', name: 'Ryo Hashimoto', email: 'ryo.hashimoto@dormflow.app', phone: '+1-555-0931', avatar: 'RH', roomId: 'room-010', moveInDate: '2025-08-12', status: 'Active' },
  { id: 'tenant-011', dormId: 'dorm-003', name: 'Kofi Asante', email: 'kofi.asante@dormflow.app', phone: '+1-555-1016', avatar: 'KA', roomId: 'room-010', moveInDate: '2025-08-12', status: 'Active' },
  { id: 'tenant-012', dormId: 'dorm-003', name: 'Isabelle Moreau', email: 'isabelle.moreau@dormflow.app', phone: '+1-555-1144', avatar: 'IM', roomId: 'room-012', moveInDate: '2025-10-09', status: 'Active' },
];

export const DEMO_ROOMS: WorkspaceRoom[] = [
  { id: 'room-001', dormId: 'dorm-001', roomNumber: '101', type: 'Double', floor: 1, capacity: 2, occupants: 2, rentPerMonth: 650, status: 'Occupied', assignedTenants: ['Sophea Kang', 'Marcus Rivera'], lastUpdated: '2026-03-20', amenities: ['WiFi', 'AC', 'Shared Bath'], notes: '' },
  { id: 'room-002', dormId: 'dorm-001', roomNumber: '102', type: 'Single', floor: 1, capacity: 1, occupants: 1, rentPerMonth: 850, status: 'Occupied', assignedTenants: ['Linh Tran'], lastUpdated: '2026-03-15', amenities: ['WiFi', 'AC', 'Private Bath'], notes: 'Quiet room policy' },
  { id: 'room-003', dormId: 'dorm-001', roomNumber: '103', type: 'Single', floor: 1, capacity: 1, occupants: 1, rentPerMonth: 850, status: 'Occupied', assignedTenants: ['Ethan Park'], lastUpdated: '2026-03-10', amenities: ['WiFi', 'AC'], notes: '' },
  { id: 'room-004', dormId: 'dorm-001', roomNumber: '104', type: 'Double', floor: 1, capacity: 2, occupants: 0, rentPerMonth: 650, status: 'Available', assignedTenants: [], lastUpdated: '2026-03-22', amenities: ['WiFi', 'AC', 'Shared Bath'], notes: 'Two beds open for assignment' },
  { id: 'room-005', dormId: 'dorm-002', roomNumber: '201', type: 'Triple', floor: 2, capacity: 3, occupants: 2, rentPerMonth: 540, status: 'Occupied', assignedTenants: ['Amara Osei', 'Daniel Novak'], lastUpdated: '2026-03-18', amenities: ['WiFi', 'AC', 'Shared Bath', 'Balcony'], notes: 'One bed still available' },
  { id: 'room-006', dormId: 'dorm-002', roomNumber: '202', type: 'Single', floor: 2, capacity: 1, occupants: 1, rentPerMonth: 820, status: 'Occupied', assignedTenants: ['Priya Menon'], lastUpdated: '2026-03-12', amenities: ['WiFi', 'AC', 'Private Bath'], notes: 'Near study lounge' },
  { id: 'room-007', dormId: 'dorm-002', roomNumber: '203', type: 'Double', floor: 2, capacity: 2, occupants: 0, rentPerMonth: 680, status: 'Reserved', assignedTenants: [], lastUpdated: '2026-03-24', amenities: ['WiFi', 'AC'], notes: 'Reserved for April move-ins' },
  { id: 'room-008', dormId: 'dorm-002', roomNumber: '204', type: 'Suite', floor: 2, capacity: 2, occupants: 2, rentPerMonth: 1200, status: 'Occupied', assignedTenants: ['Yuki Tanaka', 'Nadia Flores'], lastUpdated: '2026-03-25', amenities: ['WiFi', 'AC', 'Private Bath', 'Kitchenette', 'Living Area'], notes: 'Premium suite' },
  { id: 'room-009', dormId: 'dorm-003', roomNumber: '301', type: 'Double', floor: 3, capacity: 2, occupants: 0, rentPerMonth: 700, status: 'Under Maintenance', assignedTenants: [], lastUpdated: '2026-03-23', amenities: ['WiFi', 'AC', 'Shared Bath'], notes: 'Plumbing repair in progress' },
  { id: 'room-010', dormId: 'dorm-003', roomNumber: '302', type: 'Triple', floor: 3, capacity: 3, occupants: 2, rentPerMonth: 560, status: 'Occupied', assignedTenants: ['Ryo Hashimoto', 'Kofi Asante'], lastUpdated: '2026-03-14', amenities: ['WiFi', 'AC', 'Shared Bath'], notes: 'One bed remains open' },
  { id: 'room-011', dormId: 'dorm-003', roomNumber: '303', type: 'Single', floor: 3, capacity: 1, occupants: 0, rentPerMonth: 880, status: 'Available', assignedTenants: [], lastUpdated: '2026-03-26', amenities: ['WiFi', 'AC', 'Private Bath'], notes: 'Ready for new tenant' },
  { id: 'room-012', dormId: 'dorm-003', roomNumber: '304', type: 'Suite', floor: 3, capacity: 2, occupants: 1, rentPerMonth: 1250, status: 'Occupied', assignedTenants: ['Isabelle Moreau'], lastUpdated: '2026-03-19', amenities: ['WiFi', 'AC', 'Private Bath', 'Kitchenette', 'Living Area', 'Balcony'], notes: 'Second bed open for premium occupant' },
];

export const DEMO_INVOICES: WorkspaceInvoice[] = [
  { id: 'inv-001', dormId: 'dorm-001', tenantId: 'tenant-001', tenantName: 'Sophea Kang', roomNumber: '101', amount: 650, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Issued', period: 'April 2026' },
  { id: 'inv-002', dormId: 'dorm-001', tenantId: 'tenant-002', tenantName: 'Marcus Rivera', roomNumber: '101', amount: 650, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Paid', period: 'April 2026' },
  { id: 'inv-003', dormId: 'dorm-001', tenantId: 'tenant-003', tenantName: 'Linh Tran', roomNumber: '102', amount: 850, dueDate: '2026-03-01', issuedDate: '2026-02-15', status: 'Overdue', period: 'March 2026' },
  { id: 'inv-004', dormId: 'dorm-001', tenantId: 'tenant-004', tenantName: 'Ethan Park', roomNumber: '103', amount: 850, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Paid', period: 'April 2026' },
  { id: 'inv-005', dormId: 'dorm-002', tenantId: 'tenant-005', tenantName: 'Amara Osei', roomNumber: '201', amount: 540, dueDate: '2026-03-01', issuedDate: '2026-02-15', status: 'Overdue', period: 'March 2026' },
  { id: 'inv-006', dormId: 'dorm-002', tenantId: 'tenant-006', tenantName: 'Daniel Novak', roomNumber: '201', amount: 540, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Issued', period: 'April 2026' },
  { id: 'inv-007', dormId: 'dorm-002', tenantId: 'tenant-007', tenantName: 'Priya Menon', roomNumber: '202', amount: 820, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Paid', period: 'April 2026' },
  { id: 'inv-008', dormId: 'dorm-002', tenantId: 'tenant-008', tenantName: 'Yuki Tanaka', roomNumber: '204', amount: 1200, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Paid', period: 'April 2026' },
  { id: 'inv-009', dormId: 'dorm-002', tenantId: 'tenant-009', tenantName: 'Nadia Flores', roomNumber: '204', amount: 1200, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Issued', period: 'April 2026' },
  { id: 'inv-010', dormId: 'dorm-003', tenantId: 'tenant-010', tenantName: 'Ryo Hashimoto', roomNumber: '302', amount: 560, dueDate: '2026-03-15', issuedDate: '2026-03-01', status: 'Overdue', period: 'March 2026' },
  { id: 'inv-011', dormId: 'dorm-003', tenantId: 'tenant-011', tenantName: 'Kofi Asante', roomNumber: '302', amount: 560, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Paid', period: 'April 2026' },
  { id: 'inv-012', dormId: 'dorm-003', tenantId: 'tenant-012', tenantName: 'Isabelle Moreau', roomNumber: '304', amount: 1250, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Draft', period: 'April 2026' },
];

export const DEMO_MAINTENANCE_TICKETS: WorkspaceMaintenanceTicket[] = [
  { id: 'maint-001', dormId: 'dorm-001', title: 'Leaking faucet in bathroom', roomId: 'room-001', roomNumber: '101', tenantName: 'Sophea Kang', priority: 'High', status: 'In Progress', submittedDate: '2026-03-24', updatedDate: '2026-03-25', description: 'The bathroom faucet has been dripping constantly for 3 days.', category: 'Plumbing' },
  { id: 'maint-002', dormId: 'dorm-001', title: 'AC unit not cooling', roomId: 'room-003', roomNumber: '103', tenantName: 'Ethan Park', priority: 'High', status: 'Open', submittedDate: '2026-03-25', updatedDate: '2026-03-25', description: 'Air conditioning stopped working. Room temperature is unbearable.', category: 'HVAC' },
  { id: 'maint-003', dormId: 'dorm-001', title: 'Window latch feels loose', roomId: 'room-002', roomNumber: '102', tenantName: 'Linh Tran', priority: 'Medium', status: 'Open', submittedDate: '2026-03-23', updatedDate: '2026-03-23', description: 'The window latch is not closing tightly and needs inspection.', category: 'Structural' },
  { id: 'maint-004', dormId: 'dorm-002', title: 'WiFi router replacement needed', roomId: 'room-005', roomNumber: '201', tenantName: 'Daniel Novak', priority: 'Medium', status: 'In Progress', submittedDate: '2026-03-22', updatedDate: '2026-03-24', description: 'WiFi signal is very weak, router may need replacement.', category: 'Electrical' },
  { id: 'maint-005', dormId: 'dorm-002', title: 'Drain clog in bathroom', roomId: 'room-006', roomNumber: '202', tenantName: 'Priya Menon', priority: 'High', status: 'Open', submittedDate: '2026-03-26', updatedDate: '2026-03-26', description: 'The bathroom drain is backing up after showers.', category: 'Plumbing' },
  { id: 'maint-006', dormId: 'dorm-002', title: 'Door lock stiff', roomId: 'room-008', roomNumber: '204', tenantName: 'Nadia Flores', priority: 'Low', status: 'Resolved', submittedDate: '2026-03-18', updatedDate: '2026-03-21', description: 'Door lock requires excessive force to turn.', category: 'Structural' },
  { id: 'maint-007', dormId: 'dorm-003', title: 'Bathroom tiles cracked', roomId: 'room-009', roomNumber: '301', tenantName: 'N/A', priority: 'Critical', status: 'In Progress', submittedDate: '2026-03-20', updatedDate: '2026-03-23', description: 'Multiple tiles cracked in main bathroom, safety hazard.', category: 'Structural' },
  { id: 'maint-008', dormId: 'dorm-003', title: 'Mold on ceiling corner', roomId: 'room-010', roomNumber: '302', tenantName: 'Ryo Hashimoto', priority: 'Critical', status: 'Open', submittedDate: '2026-03-26', updatedDate: '2026-03-26', description: 'Visible mold growth in ceiling corner near window. Health concern.', category: 'Structural' },
];

export const DEMO_ACTIVITY_FEED: WorkspaceActivityItem[] = [
  { id: 'act-001', dormId: 'dorm-001', type: 'payment', message: 'Payment received for Room 103', actor: 'Ethan Park', timestamp: '2026-03-26T05:42:00Z', meta: '$850.00' },
  { id: 'act-002', dormId: 'dorm-001', type: 'maintenance', message: 'New maintenance request — Room 102', actor: 'Linh Tran', timestamp: '2026-03-26T04:15:00Z', meta: 'Medium' },
  { id: 'act-003', dormId: 'dorm-002', type: 'payment', message: 'Payment received for Room 202', actor: 'Priya Menon', timestamp: '2026-03-25T18:30:00Z', meta: '$820.00' },
  { id: 'act-004', dormId: 'dorm-002', type: 'assignment', message: 'Suite 204 reached full occupancy', actor: 'Admin', timestamp: '2026-03-25T14:00:00Z', meta: '2 residents' },
  { id: 'act-005', dormId: 'dorm-002', type: 'maintenance', message: 'Maintenance updated — Room 204', actor: 'Maintenance Staff', timestamp: '2026-03-25T11:20:00Z', meta: 'Resolved' },
  { id: 'act-006', dormId: 'dorm-003', type: 'invoice', message: 'Invoices drafted for April 2026', actor: 'System', timestamp: '2026-03-25T08:00:00Z', meta: '3 invoices' },
  { id: 'act-007', dormId: 'dorm-003', type: 'room', message: 'Room 301 marked Under Maintenance', actor: 'Admin', timestamp: '2026-03-23T10:00:00Z', meta: 'Plumbing' },
  { id: 'act-008', dormId: 'dorm-003', type: 'maintenance', message: 'Critical mold ticket opened for Room 302', actor: 'Ryo Hashimoto', timestamp: '2026-03-26T01:30:00Z', meta: 'Critical' },
];

export const DEMO_CHEFS: WorkspaceChef[] = [
  { id: 'chef-001', dormId: 'dorm-001', name: 'Chef Kim', email: 'chef.kim@sunrisedorm.app', shift: 'Morning', specialty: 'Dorm Meal Planning', status: 'Active' },
  { id: 'chef-002', dormId: 'dorm-002', name: 'Chef Dara', email: 'chef.dara@riversideresidences.app', shift: 'Split', specialty: 'Bulk Dinner Service', status: 'Active' },
  { id: 'chef-003', dormId: 'dorm-003', name: 'Chef Sokha', email: 'chef.sokha@northgatehouse.app', shift: 'Evening', specialty: 'Late Service & Inventory', status: 'Invited' },
];

export const DEMO_TENANT_MEAL_PREFERENCES: TenantMealPreference[] = [
  { tenantId: 'tenant-001', plan: 'Full Board', notes: 'Vegetarian meals on weekdays.' },
  { tenantId: 'tenant-003', plan: 'Breakfast Only', notes: 'Prefers early service before class.' },
  { tenantId: 'tenant-007', plan: 'Half Board', notes: 'Lunch and dinner preferred on weekdays.' },
  { tenantId: 'tenant-009', plan: 'Full Board', notes: 'Avoid shellfish ingredients.' },
  { tenantId: 'tenant-012', plan: 'Breakfast Only', notes: 'Light breakfast is preferred before lectures.' },
];

export const DEMO_MEALS: MealItemRecord[] = [
  { id: 'meal-001', dormId: 'dorm-001', name: 'Scrambled Eggs & Toast', category: 'Breakfast', day: 'Monday', servings: 24, dietary: ['Vegetarian'], status: 'Served', calories: 380 },
  { id: 'meal-002', dormId: 'dorm-001', name: 'Grilled Chicken Rice Bowl', category: 'Lunch', day: 'Monday', servings: 26, dietary: ['Gluten-Free', 'High Protein'], status: 'Served', calories: 620 },
  { id: 'meal-003', dormId: 'dorm-001', name: 'Lentil Curry & Rice', category: 'Dinner', day: 'Monday', servings: 24, dietary: ['Vegan', 'Gluten-Free'], status: 'In Prep', calories: 590 },
  { id: 'meal-004', dormId: 'dorm-002', name: 'Oatmeal with Fruits', category: 'Breakfast', day: 'Tuesday', servings: 18, dietary: ['Vegan', 'Gluten-Free'], status: 'Served', calories: 320 },
  { id: 'meal-005', dormId: 'dorm-002', name: 'Veggie Pasta Salad', category: 'Lunch', day: 'Tuesday', servings: 20, dietary: ['Vegetarian'], status: 'Served', calories: 480 },
  { id: 'meal-006', dormId: 'dorm-002', name: 'Salmon with Steamed Veg', category: 'Dinner', day: 'Tuesday', servings: 20, dietary: ['Gluten-Free', 'High Protein'], status: 'Planned', calories: 650 },
  { id: 'meal-007', dormId: 'dorm-003', name: 'Pancakes with Syrup', category: 'Breakfast', day: 'Wednesday', servings: 14, dietary: ['Vegetarian'], status: 'Planned', calories: 420 },
  { id: 'meal-008', dormId: 'dorm-003', name: 'Chicken Wrap', category: 'Lunch', day: 'Wednesday', servings: 14, dietary: ['High Protein'], status: 'Planned', calories: 540 },
  { id: 'meal-009', dormId: 'dorm-003', name: 'Soup & Bread', category: 'Dinner', day: 'Wednesday', servings: 14, dietary: [], status: 'Planned', calories: 430 },
];

export const DEFAULT_MEAL_PLAN: MealPlan = 'No Meal Plan';
