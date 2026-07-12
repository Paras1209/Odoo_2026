# Role-Based Access Control (RBAC) Implementation

## Overview
This document describes the role-based access control system implemented in TransitOps. The system ensures that users can only access features and data appropriate for their assigned role.

## Changes Made

### 1. User Registration Flow
- **Before**: Users could select their own role during registration
- **After**: 
  - Users register without specifying a role
  - New accounts are created with `status: 'pending'`
  - Default role assigned: `employee`
  - Admin must activate account and assign appropriate role

### 2. User Status Types
```
- pending:   Newly registered, awaiting admin approval
- active:    Approved and can access the system
- inactive:  Deactivated account
- suspended: Temporarily blocked access
```

### 3. Available Roles & Access

#### Admin
- Full system access
- Can manage all users, roles, and settings
- **Access**: Everything

#### Fleet Manager
- Manages fleet and maintenance operations
- **Access**: Fleet, Maintenance, Drivers (read-only)

#### Dispatcher
- Manages daily trip operations
- **Access**: Dashboard, Trips (full CRUD), Drivers (read-only), Vehicles (read-only)

#### Safety Officer
- Oversees driver safety and compliance
- **Access**: Drivers, Compliance, Incidents, Vehicles (read-only)

#### Financial Analyst
- Reviews financial data and analytics
- **Access**: Fuel & Expenses, Analytics, Reports

#### Driver
- Views own assignments and profile
- **Access**: Profile, Assignments (read-only), Trips (read-only)

#### Employee
- Default role with minimal access
- **Access**: Profile only

## Backend Changes

### Models

#### User Model (`backend/models/User.js`)
- Added `pending` status to user status enum
- Changed default status from `active` to `pending`
- Users must be activated by admin

#### Role Model (`backend/models/Role.js`)
- Updated role definitions with proper permissions
- Added `dispatcher` role
- Updated permission sets for each role

### Controllers

#### Auth Controller (`backend/controllers/authController.js`)
- Removed ability to set role during registration
- All new users created as `employee` with `pending` status
- Registration returns message about pending approval

#### Admin Controller (`backend/controllers/adminController.js`)
**New controller with admin-only endpoints:**
- `GET /api/v1/admin/users` - List all users with filters
- `GET /api/v1/admin/users/:id` - Get single user details
- `PUT /api/v1/admin/users/:id` - Update user role/status
- `DELETE /api/v1/admin/users/:id` - Delete user
- `GET /api/v1/admin/roles` - List available roles
- `GET /api/v1/admin/users/pending/count` - Count pending users

### Middleware

#### Auth Middleware (`backend/middleware/auth.js`)
- Enhanced status checks
- Blocks access for `pending`, `suspended`, and `inactive` users
- Shows appropriate error messages for each status

### Routes

#### Admin Routes (`backend/routes/adminRoutes.js`)
**New route file for admin operations**
- All routes protected by `protect` and `authorize('admin')` middleware

## Frontend Changes

### Types (`frontend/src/types/auth.ts`)
- Added `dispatcher` to UserRole type
- Added `pending` to UserStatus type
- Removed `role` from RegisterData interface

### Components

#### Register Component (`frontend/src/pages/Register.tsx`)
- Removed role selection dropdown
- Updated form validation schema
- Updated registration text to mention admin approval

#### RequireAuth Component (`frontend/src/components/RequireAuth.tsx`)
- Enhanced with role-based access control
- Added status checks (pending, suspended, inactive)
- Shows appropriate error messages
- Supports optional `roles` prop for route protection

#### Navbar Component (`frontend/src/components/Navbar.tsx`)
- Added role-based navigation menu
- Shows only accessible menu items based on user role
- Displays user role and status badges
- Enhanced mobile drawer with navigation items

### Hooks

#### useRoleAccess Hook (`frontend/src/hooks/useRoleAccess.ts`)
**New custom hook for checking role-based access**
```typescript
const { hasAccess, isAdmin, isDispatcher } = useRoleAccess();

// Check access to specific features
if (hasAccess('trips')) {
  // Show trips section
}
```

### Routing (`frontend/src/App.tsx`)
- Applied role-based protection to routes
- Trips routes restricted by role:
  - View trips: dispatcher, fleet_manager, driver, admin
  - Create/edit trips: dispatcher, admin

## Usage Examples

### Protecting a Route
```typescript
<Route 
  path="/trips" 
  element={
    <RequireAuth roles={['dispatcher', 'fleet_manager', 'admin']}>
      <TripList />
    </RequireAuth>
  } 
/>
```

### Checking Access in Component
```typescript
import { useRoleAccess } from '../hooks/useRoleAccess';

function MyComponent() {
  const { hasAccess, isAdmin } = useRoleAccess();
  
  return (
    <>
      {hasAccess('trips') && <TripSection />}
      {isAdmin && <AdminPanel />}
    </>
  );
}
```

### Admin User Management Flow
1. User registers → Account created as `pending`
2. Admin logs in → Sees pending users count
3. Admin navigates to user management
4. Admin assigns appropriate role
5. Admin changes status to `active`
6. User can now access their role-specific features

## API Testing

### Register a New User
```bash
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Admin: List Pending Users
```bash
GET /api/v1/admin/users?status=pending
Headers: Authorization: Bearer <admin_token>
```

### Admin: Activate User & Assign Role
```bash
PUT /api/v1/admin/users/:userId
Headers: Authorization: Bearer <admin_token>
{
  "role": "dispatcher",
  "status": "active"
}
```

## Security Notes

1. **Role Assignment**: Only admins can assign roles
2. **Self-Modification**: Admins cannot modify their own role/status
3. **Status Checks**: All protected routes verify user status
4. **Token-Based**: All API calls require valid JWT token
5. **Middleware Chain**: Routes protected by both `protect` and `authorize` middleware

## Migration Needed

If you have existing users in the database, run a migration to:
1. Update User table to add 'pending' status to enum
2. Set existing users to 'active' status (if they should remain active)
3. Ensure all users have proper role assignments

## Future Enhancements

- [ ] Email notifications for account approval
- [ ] Audit log for role/status changes
- [ ] Granular permission system
- [ ] Role hierarchy
- [ ] Time-based access (temporary roles)
- [ ] Multi-role support
