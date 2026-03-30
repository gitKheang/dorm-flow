export type RoomStatus = 'Occupied' | 'Available' | 'Under Maintenance' | 'Reserved';
export type RoomType = 'Single' | 'Double' | 'Triple' | 'Suite';
export type MaintenanceStatus = 'Open' | 'In Progress' | 'Resolved';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type InvoiceStatus = 'Paid' | 'Issued' | 'Overdue' | 'Draft';

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  roomId: string;
  moveInDate: string;
  status: 'Active' | 'Inactive';
}

export interface Room {
  id: string;
  roomNumber: string;
  type: RoomType;
  floor: number;
  capacity: number;
  occupants: number;
  rentPerMonth: number;
  status: RoomStatus;
  assignedTenants: string[];
  lastUpdated: string;
  amenities: string[];
  notes: string;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  roomId: string;
  roomNumber: string;
  tenantName: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  submittedDate: string;
  updatedDate: string;
  description: string;
  category: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  amount: number;
  dueDate: string;
  issuedDate: string;
  status: InvoiceStatus;
  period: string;
}

export interface ActivityItem {
  id: string;
  type: 'payment' | 'maintenance' | 'assignment' | 'invoice' | 'room';
  message: string;
  timestamp: string;
  actor: string;
  meta?: string;
}

export const mockTenants: Tenant[] = [
  { id: 'tenant-001', name: 'Sophea Kang', email: 'sophea.kang@dormflow.app', phone: '+1-555-0142', avatar: 'SK', roomId: 'room-001', moveInDate: '2025-09-01', status: 'Active' },
  { id: 'tenant-002', name: 'Marcus Rivera', email: 'marcus.rivera@dormflow.app', phone: '+1-555-0198', avatar: 'MR', roomId: 'room-001', moveInDate: '2025-09-01', status: 'Active' },
  { id: 'tenant-003', name: 'Linh Tran', email: 'linh.tran@dormflow.app', phone: '+1-555-0267', avatar: 'LT', roomId: 'room-002', moveInDate: '2025-10-15', status: 'Active' },
  { id: 'tenant-004', name: 'Ethan Park', email: 'ethan.park@dormflow.app', phone: '+1-555-0334', avatar: 'EP', roomId: 'room-003', moveInDate: '2025-08-20', status: 'Active' },
  { id: 'tenant-005', name: 'Amara Osei', email: 'amara.osei@dormflow.app', phone: '+1-555-0411', avatar: 'AO', roomId: 'room-004', moveInDate: '2025-11-01', status: 'Active' },
  { id: 'tenant-006', name: 'Daniel Novak', email: 'daniel.novak@dormflow.app', phone: '+1-555-0523', avatar: 'DN', roomId: 'room-005', moveInDate: '2025-09-15', status: 'Active' },
  { id: 'tenant-007', name: 'Priya Menon', email: 'priya.menon@dormflow.app', phone: '+1-555-0618', avatar: 'PM', roomId: 'room-006', moveInDate: '2025-10-01', status: 'Active' },
  { id: 'tenant-008', name: 'Yuki Tanaka', email: 'yuki.tanaka@dormflow.app', phone: '+1-555-0712', avatar: 'YT', roomId: 'room-007', moveInDate: '2025-07-15', status: 'Active' },
];

export const mockRooms: Room[] = [
  { id: 'room-001', roomNumber: '101', type: 'Double', floor: 1, capacity: 2, occupants: 2, rentPerMonth: 650, status: 'Occupied', assignedTenants: ['Sophea Kang', 'Marcus Rivera'], lastUpdated: '2026-03-20', amenities: ['WiFi', 'AC', 'Shared Bath'], notes: '' },
  { id: 'room-002', roomNumber: '102', type: 'Single', floor: 1, capacity: 1, occupants: 1, rentPerMonth: 850, status: 'Occupied', assignedTenants: ['Linh Tran'], lastUpdated: '2026-03-15', amenities: ['WiFi', 'AC', 'Private Bath'], notes: 'Quiet room policy' },
  { id: 'room-003', roomNumber: '103', type: 'Single', floor: 1, capacity: 1, occupants: 1, rentPerMonth: 850, status: 'Occupied', assignedTenants: ['Ethan Park'], lastUpdated: '2026-03-10', amenities: ['WiFi', 'AC'], notes: '' },
  { id: 'room-004', roomNumber: '104', type: 'Double', floor: 1, capacity: 2, occupants: 1, rentPerMonth: 650, status: 'Available', assignedTenants: ['Amara Osei'], lastUpdated: '2026-03-22', amenities: ['WiFi', 'AC', 'Shared Bath'], notes: 'One slot open' },
  { id: 'room-005', roomNumber: '201', type: 'Triple', floor: 2, capacity: 3, occupants: 3, rentPerMonth: 520, status: 'Occupied', assignedTenants: ['Daniel Novak', 'James Okonkwo', 'Wei Chen'], lastUpdated: '2026-03-18', amenities: ['WiFi', 'AC', 'Shared Bath', 'Balcony'], notes: '' },
  { id: 'room-006', roomNumber: '202', type: 'Single', floor: 2, capacity: 1, occupants: 1, rentPerMonth: 900, status: 'Occupied', assignedTenants: ['Priya Menon'], lastUpdated: '2026-03-12', amenities: ['WiFi', 'AC', 'Private Bath', 'Kitchenette'], notes: 'Premium room' },
  { id: 'room-007', roomNumber: '203', type: 'Double', floor: 2, capacity: 2, occupants: 1, rentPerMonth: 650, status: 'Available', assignedTenants: ['Yuki Tanaka'], lastUpdated: '2026-03-24', amenities: ['WiFi', 'AC'], notes: 'One slot open' },
  { id: 'room-008', roomNumber: '204', type: 'Suite', floor: 2, capacity: 2, occupants: 0, rentPerMonth: 1200, status: 'Available', assignedTenants: [], lastUpdated: '2026-03-25', amenities: ['WiFi', 'AC', 'Private Bath', 'Kitchenette', 'Living Area'], notes: 'Premium suite, recently renovated' },
  { id: 'room-009', roomNumber: '301', type: 'Double', floor: 3, capacity: 2, occupants: 0, rentPerMonth: 650, status: 'Under Maintenance', assignedTenants: [], lastUpdated: '2026-03-23', amenities: ['WiFi', 'AC', 'Shared Bath'], notes: 'Plumbing repair in progress' },
  { id: 'room-010', roomNumber: '302', type: 'Triple', floor: 3, capacity: 3, occupants: 3, rentPerMonth: 520, status: 'Occupied', assignedTenants: ['Nadia Flores', 'Ryo Hashimoto', 'Kofi Asante'], lastUpdated: '2026-03-14', amenities: ['WiFi', 'AC', 'Shared Bath'], notes: '' },
  { id: 'room-011', roomNumber: '303', type: 'Single', floor: 3, capacity: 1, occupants: 0, rentPerMonth: 850, status: 'Available', assignedTenants: [], lastUpdated: '2026-03-26', amenities: ['WiFi', 'AC', 'Private Bath'], notes: 'Ready for new tenant' },
  { id: 'room-012', roomNumber: '304', type: 'Suite', floor: 3, capacity: 2, occupants: 2, rentPerMonth: 1200, status: 'Occupied', assignedTenants: ['Isabelle Moreau', 'Takeshi Yamamoto'], lastUpdated: '2026-03-19', amenities: ['WiFi', 'AC', 'Private Bath', 'Kitchenette', 'Living Area', 'Balcony'], notes: '' },
];

export const mockMaintenanceTickets: MaintenanceTicket[] = [
  { id: 'maint-001', title: 'Leaking faucet in bathroom', roomId: 'room-001', roomNumber: '101', tenantName: 'Sophea Kang', priority: 'High', status: 'In Progress', submittedDate: '2026-03-24', updatedDate: '2026-03-25', description: 'The bathroom faucet has been dripping constantly for 3 days.', category: 'Plumbing' },
  { id: 'maint-002', title: 'AC unit not cooling', roomId: 'room-003', roomNumber: '103', tenantName: 'Ethan Park', priority: 'High', status: 'Open', submittedDate: '2026-03-25', updatedDate: '2026-03-25', description: 'Air conditioning stopped working. Room temperature is unbearable.', category: 'HVAC' },
  { id: 'maint-003', title: 'Broken window latch', roomId: 'room-006', roomNumber: '202', tenantName: 'Priya Menon', priority: 'Medium', status: 'Open', submittedDate: '2026-03-23', updatedDate: '2026-03-23', description: 'Window latch is broken, cannot secure window properly.', category: 'Structural' },
  { id: 'maint-004', title: 'WiFi router replacement needed', roomId: 'room-005', roomNumber: '201', tenantName: 'Daniel Novak', priority: 'Medium', status: 'In Progress', submittedDate: '2026-03-22', updatedDate: '2026-03-24', description: 'WiFi signal is very weak, router may need replacement.', category: 'Electrical' },
  { id: 'maint-005', title: 'Bathroom tiles cracked', roomId: 'room-009', roomNumber: '301', tenantName: 'N/A', priority: 'Critical', status: 'In Progress', submittedDate: '2026-03-20', updatedDate: '2026-03-23', description: 'Multiple tiles cracked in main bathroom, safety hazard.', category: 'Structural' },
  { id: 'maint-006', title: 'Door lock stiff', roomId: 'room-007', roomNumber: '203', tenantName: 'Yuki Tanaka', priority: 'Low', status: 'Resolved', submittedDate: '2026-03-18', updatedDate: '2026-03-21', description: 'Door lock requires excessive force to turn.', category: 'Structural' },
  { id: 'maint-007', title: 'Light fixture flickering', roomId: 'room-002', roomNumber: '102', tenantName: 'Linh Tran', priority: 'Low', status: 'Resolved', submittedDate: '2026-03-15', updatedDate: '2026-03-19', description: 'Bedroom light flickers intermittently.', category: 'Electrical' },
  { id: 'maint-008', title: 'Mold on ceiling corner', roomId: 'room-010', roomNumber: '302', tenantName: 'Nadia Flores', priority: 'Critical', status: 'Open', submittedDate: '2026-03-26', updatedDate: '2026-03-26', description: 'Visible mold growth in ceiling corner near window. Health concern.', category: 'Structural' },
];

export const mockInvoices: Invoice[] = [
  { id: 'inv-001', tenantId: 'tenant-001', tenantName: 'Sophea Kang', roomNumber: '101', amount: 650, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Issued', period: 'April 2026' },
  { id: 'inv-002', tenantId: 'tenant-002', tenantName: 'Marcus Rivera', roomNumber: '101', amount: 650, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Paid', period: 'April 2026' },
  { id: 'inv-003', tenantId: 'tenant-003', tenantName: 'Linh Tran', roomNumber: '102', amount: 850, dueDate: '2026-03-01', issuedDate: '2026-02-15', status: 'Overdue', period: 'March 2026' },
  { id: 'inv-004', tenantId: 'tenant-004', tenantName: 'Ethan Park', roomNumber: '103', amount: 850, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Paid', period: 'April 2026' },
  { id: 'inv-005', tenantId: 'tenant-005', tenantName: 'Amara Osei', roomNumber: '104', amount: 650, dueDate: '2026-03-01', issuedDate: '2026-02-15', status: 'Overdue', period: 'March 2026' },
  { id: 'inv-006', tenantId: 'tenant-006', tenantName: 'Daniel Novak', roomNumber: '201', amount: 520, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Issued', period: 'April 2026' },
  { id: 'inv-007', tenantId: 'tenant-007', tenantName: 'Priya Menon', roomNumber: '202', amount: 900, dueDate: '2026-04-01', issuedDate: '2026-03-15', status: 'Paid', period: 'April 2026' },
  { id: 'inv-008', tenantId: 'tenant-008', tenantName: 'Yuki Tanaka', roomNumber: '203', amount: 650, dueDate: '2026-03-15', issuedDate: '2026-03-01', status: 'Overdue', period: 'March 2026' },
];

export const mockActivityFeed: ActivityItem[] = [
  { id: 'act-001', type: 'payment', message: 'Payment received for Room 202', actor: 'Priya Menon', timestamp: '2026-03-26T05:42:00Z', meta: '$900.00' },
  { id: 'act-002', type: 'maintenance', message: 'New maintenance request — Room 302', actor: 'Nadia Flores', timestamp: '2026-03-26T04:15:00Z', meta: 'Critical' },
  { id: 'act-003', type: 'payment', message: 'Payment received for Room 103', actor: 'Ethan Park', timestamp: '2026-03-25T18:30:00Z', meta: '$850.00' },
  { id: 'act-004', type: 'assignment', message: 'Tenant assigned to Room 203', actor: 'Admin', timestamp: '2026-03-25T14:00:00Z', meta: 'Yuki Tanaka' },
  { id: 'act-005', type: 'maintenance', message: 'Maintenance updated — Room 203', actor: 'Maintenance Staff', timestamp: '2026-03-25T11:20:00Z', meta: 'Resolved' },
  { id: 'act-006', type: 'invoice', message: 'Invoices generated for April 2026', actor: 'System', timestamp: '2026-03-25T08:00:00Z', meta: '8 invoices' },
  { id: 'act-007', type: 'room', message: 'Room 301 marked Under Maintenance', actor: 'Admin', timestamp: '2026-03-23T10:00:00Z', meta: 'Plumbing' },
  { id: 'act-008', type: 'payment', message: 'Payment received for Room 101', actor: 'Marcus Rivera', timestamp: '2026-03-22T16:45:00Z', meta: '$650.00' },
];

export const occupancyTrendData = [
  { date: 'Feb 25', occupied: 8, available: 4 },
  { date: 'Feb 27', occupied: 8, available: 4 },
  { date: 'Mar 1', occupied: 9, available: 3 },
  { date: 'Mar 3', occupied: 9, available: 3 },
  { date: 'Mar 5', occupied: 10, available: 2 },
  { date: 'Mar 7', occupied: 9, available: 3 },
  { date: 'Mar 9', occupied: 9, available: 3 },
  { date: 'Mar 11', occupied: 10, available: 2 },
  { date: 'Mar 13', occupied: 10, available: 2 },
  { date: 'Mar 15', occupied: 11, available: 1 },
  { date: 'Mar 17', occupied: 10, available: 2 },
  { date: 'Mar 19', occupied: 10, available: 2 },
  { date: 'Mar 21', occupied: 9, available: 3 },
  { date: 'Mar 23', occupied: 9, available: 3 },
  { date: 'Mar 25', occupied: 8, available: 4 },
  { date: 'Mar 26', occupied: 8, available: 4 },
];

export const paymentCollectionData = [
  { month: 'Oct 25', paid: 6800, issued: 1200, overdue: 400 },
  { month: 'Nov 25', paid: 7200, issued: 900, overdue: 650 },
  { month: 'Dec 25', paid: 6500, issued: 1400, overdue: 800 },
  { month: 'Jan 26', paid: 7800, issued: 800, overdue: 520 },
  { month: 'Feb 26', paid: 7100, issued: 1100, overdue: 1300 },
  { month: 'Mar 26', paid: 2400, issued: 1820, overdue: 2150 },
];