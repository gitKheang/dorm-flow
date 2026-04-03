# DormFlow - Daily Development Report

**Project:** DormFlow - Dormitory Management System (Frontend + UX/UI)
**Period:** 16 March 2026 - 2 April 2026
**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Recharts

---

## 16 March 2026 (Monday)

**Task:** Project Setup & Planning

- Set up Next.js project with TypeScript and Tailwind CSS
- Create project folder structure (pages, components, lib, styles)
- Plan wireframes and screen flow for the dorm management system
- Define user roles: Admin, Tenant, Chef
- List out all pages and features needed for the app

---

## 17 March 2026 (Tuesday)

**Task:** Authentication Screen - UI/UX Design & Development

- Design login and sign-up screen layout
- Build AuthClient component with email and password form
- Add role-based login flow (Admin, Tenant, Chef)
- Create demo accounts for testing without backend
- Set up session management using localStorage

---

## 18 March 2026 (Wednesday)

**Task:** App Layout & Sidebar Navigation

- Design sidebar navigation menu with icons for each page
- Build responsive layout (sidebar hidden on mobile, visible on desktop)
- Add sidebar toggle button for mobile screens
- Create AppLogo and DormFlowMark branding components
- Show different menu items based on user role

---

## 19 March 2026 (Thursday)

**Task:** Reusable UI Components

- Build AppSelect dropdown component for use across all pages
- Create AppIcon and AppImage wrapper components
- Design color-coded status badges (green, blue, red, amber)
- Build custom ToggleSwitch component for settings
- Set up Sonner toast notification for success and error messages

---

## 20 March 2026 (Friday)

**Task:** Data Models & State Management

- Define TypeScript types for all data (rooms, tenants, invoices, payments, maintenance, meals)
- Build DemoAppProvider for global app state
- Create DemoSessionProvider to handle login, logout, and session
- Build DemoWorkspaceProvider to manage workspace data
- Set up localStorage to save and load data in demo mode

---

## 21 March 2026 (Saturday)

**Task:** Room Management - List View

- Design room management page with table layout
- Build room list showing room number, type, floor, status, and rent
- Add search bar to find rooms by number or type
- Add filter options: by status (Occupied, Available, Maintenance, Reserved) and by room type
- Build pagination with page size options (10, 20, 50 per page)
- Add column header click to sort rooms

---

## 23 March 2026 (Monday)

**Task:** Room Management - Add/Edit Room

- Build AddRoomModal form with fields: room number, type, floor, capacity, rent, amenities
- Add room edit feature to update existing room details
- Add delete room button with confirmation
- Design room status badges with color coding
- Add bulk select checkbox for rooms in the list
- Build room amenities checklist (WiFi, AC, Bathroom, Kitchenette)

---

## 24 March 2026 (Tuesday)

**Task:** Tenant Management Page

- Design tenant list page with resident information
- Build search by name, email, or phone number
- Add filter by status: Active, Inactive, Invite Pending
- Create invite resident form (name, email, phone, room assignment)
- Show tenant status with colored indicators
- Build room reassignment dropdown to move tenant to a different room

---

## 25 March 2026 (Wednesday)

**Task:** Invoice System

- Design invoice list page with table layout
- Show invoice details: tenant name, period, amount, due date, status
- Build status badges: Paid, Issued, Overdue, Draft
- Create invoice breakdown section with line items (room rent, meal charges, late fees, adjustments)
- Display issue date and due date for each invoice

---

## 26 March 2026 (Thursday)

**Task:** Payment Tracking Page

- Design payment page with 4 summary cards (total paid, successful, pending, failed)
- Build payment list showing invoice period, tenant, amount, status, and time
- Add relative time display (e.g. "2 minutes ago")
- Create payment trend bar chart using Recharts library
- Design payment status badges: paid (green), pending (blue), failed (red), refunded (amber)

---

## 27 March 2026 (Friday)

**Task:** Maintenance Request System

- Design maintenance page with ticket list
- Build search and filter: by status (Open, In Progress, Resolved) and priority (Critical, High, Medium, Low)
- Create new ticket form: room, tenant, title, category, priority, description
- Design priority badges with colors (red, orange, amber, gray)
- Add status update dropdown to change ticket status step by step

---

## 28 March 2026 (Saturday)

**Task:** File Attachments & Export Feature

- Build MaintenanceAttachmentField component for uploading photos and files
- Add image preview thumbnail and file size display
- Create ExportDialog modal with CSV and PDF export options
- Build CSV export function for rooms, invoices, and payments data
- Build PDF export that opens print-friendly page in new window

---

## 30 March 2026 (Monday)

**Task:** Admin Dashboard

- Design admin dashboard layout with 6 KPI cards (occupancy rate, rent collection, overdue invoices, open tickets, paid invoices, revenue)
- Build occupancy trend area chart using Recharts
- Build payment status breakdown chart
- Create activity feed showing recent actions with icons and timestamps
- Add maintenance summary list showing open and in-progress tickets
- Show plan badge (Free/Premium) on dashboard

---

## 31 March 2026 (Tuesday)

**Task:** Tenant Dashboard & Chef Dashboard

- Design tenant dashboard with room info, invoices, maintenance, and roommates sections
- Build maintenance request form for tenants to submit tickets
- Create 7-day meal preference grid (breakfast, lunch, dinner toggle)
- Design chef dashboard with day selector tabs and meal plan cards
- Build add meal form (name, category, servings, calories)
- Add meal status flow: Planned, In Prep, Served
- Show dietary tags and kitchen reminders sidebar

---

## 1 April 2026 (Wednesday)

**Task:** Settings, Premium Features & Multi-Dorm

- Design settings page with tabs: Profile, Security, Notifications, Dorm Settings
- Build password change form with validation
- Add notification preference toggles
- Create premium plan system with Free and Premium tiers
- Build feature gating for premium modules (Meal Service, Analytics, Multi-Dorm)
- Design multi-dorm portfolio page with add dorm form and dorm cards
- Build reports page with area chart, bar chart, and pie chart for analytics

---

## 2 April 2026 (Thursday)

**Task:** Notifications, Testing & Final Polish

- Build notification list with type-based icons (maintenance, invoice, meal, assignment)
- Add mark as read for individual and all notifications
- Create mock data and run validation scripts for data consistency
- Test responsive design on mobile, tablet, and desktop
- Review and fix UI spacing, colors, and font sizes across all pages
- Final check on all user flows: login, room management, invoices, payments, maintenance, dashboards
