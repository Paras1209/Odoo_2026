/**
 * Application-wide constants
 * Centralized location for all status values, enums, and magic strings
 */

// Vehicle Constants
const VEHICLE_TYPES = ['bus', 'van', 'truck', 'car', 'motorcycle', 'trailer', 'other'];

const VEHICLE_STATUSES = {
  AVAILABLE: 'available',
  ON_TRIP: 'on_trip',
  IN_SHOP: 'in_shop',
  RETIRED: 'retired'
};

const ALLOWED_VEHICLE_STATUSES = Object.values(VEHICLE_STATUSES);

// Driver Constants
const DRIVER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  ON_LEAVE: 'on_leave'
};

const ALLOWED_DRIVER_STATUSES = Object.values(DRIVER_STATUSES);

const LICENSE_CATEGORIES = ['A', 'A1', 'A2', 'B', 'B1', 'C', 'C1', 'D', 'D1', 'E', 'F', 'G', 'H', 'other'];

// Trip Constants
const TRIP_STATUSES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const ALLOWED_TRIP_STATUSES = Object.values(TRIP_STATUSES);

// User Constants
const USER_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
};

const ALLOWED_USER_STATUSES = Object.values(USER_STATUSES);

// Maintenance Constants
const MAINTENANCE_TYPES = ['routine', 'repair', 'inspection', 'emergency', 'upgrade', 'other'];

const MAINTENANCE_STATUSES = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const ALLOWED_MAINTENANCE_STATUSES = Object.values(MAINTENANCE_STATUSES);

// Expense Constants
const EXPENSE_TYPES = ['fuel', 'maintenance', 'insurance', 'registration', 'toll', 'fine', 'parking', 'other'];

// Role Constants
const ROLE_CODES = {
  ADMIN: 'admin',
  FLEET_MANAGER: 'fleet_manager',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  SAFETY_OFFICER: 'safety_officer',
  FINANCIAL_ANALYST: 'financial_analyst',
  EMPLOYEE: 'employee'
};

const ALLOWED_ROLE_CODES = Object.values(ROLE_CODES);

// Pagination Constants
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

module.exports = {
  // Vehicle
  VEHICLE_TYPES,
  VEHICLE_STATUSES,
  ALLOWED_VEHICLE_STATUSES,
  
  // Driver
  DRIVER_STATUSES,
  ALLOWED_DRIVER_STATUSES,
  LICENSE_CATEGORIES,
  
  // Trip
  TRIP_STATUSES,
  ALLOWED_TRIP_STATUSES,
  
  // User
  USER_STATUSES,
  ALLOWED_USER_STATUSES,
  
  // Maintenance
  MAINTENANCE_TYPES,
  MAINTENANCE_STATUSES,
  ALLOWED_MAINTENANCE_STATUSES,
  
  // Expense
  EXPENSE_TYPES,
  
  // Role
  ROLE_CODES,
  ALLOWED_ROLE_CODES,
  
  // Pagination
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT
};
