# Phase 2 Task Breakdown of Tasks
## Phase 2: Trip Management Feature (Backend + Frontend)

### Overview
This document outlines the tasks required to complete the Trip Management feature using a feature-wise approach. We will implement both backend and frontend components for managing trips in the TransitOps system, building upon the completed User Authentication system (Phase 1).

### Dependencies (Prerequisites)
Before starting Phase 2, the following must be complete and tested:
- ✅ **Backend**: User authentication system (registration, login, JWT protection, password reset)
- ✅ **Frontend**: Authentication pages (login, register, forgot password, reset password, profile)
- ⏳ **Backend**: Vehicle and Driver models (to be completed as part of this phase's preparation or verified as ready)
  - Vehicle model with: registrationNumber (unique), name/model, type, maxCapacity, odometer, acquisitionCost, status
  - Driver model with: licenseNumber (unique), name, licenseCategory, licenseExpiry, contactNumber, safetyScore, status
  - Both models include proper validation and relationships

### Backend Tasks (Trip Management)
#### 1. Trip Model & Database
- [ ] Create Trip Sequelize model with fields:
  - id: UUID (primary key)
  - source: String (required)
  - destination: String (required)
  - vehicleId: UUID (foreign key to Vehicle, required)
  - driverId: UUID (foreign key to Driver, required)
  - cargoWeight: Decimal (required, validation: > 0)
  - plannedDistance: Decimal (required, validation: > 0)
  - actualDistance: Decimal (nullable)
  - fuelConsumed: Decimal (nullable)
  - status: ENUM('draft', 'dispatched', 'completed', 'cancelled') (default: 'draft')
  - startedAt: Timestamp (nullable)
  - endedAt: Timestamp (nullable)
  - createdAt: Timestamp
  - updatedAt: Timestamp
- [ ] Add appropriate indexes:
  - vehicleId (for filtering trips by vehicle)
  - driverId (for filtering trips by driver)
  - status (for filtering by trip status)
  - Composite index on (vehicleId, status) for availability checks
  - Composite index on (driverId, status) for driver availability checks
- [ ] Add model-level validations:
  - cargoWeight > 0
  - plannedDistance > 0
  - Custom validation: cargoWeight ≤ vehicle.maxCapacity (requires fetching vehicle record)
  - Custom validation: driver.licenseExpiry > new Date() && driver.status !== 'Suspended'
  - Custom validation: vehicle.status !== 'In Shop' && vehicle.status !== 'Retired'
  - Custom validation: !(vehicle.status === 'On Trip' || driver.status === 'On Trip') for new trip creation
- [ ] Add instance methods:
  - canDispatch(): Boolean (checks if trip can be dispatched based on validations)
  - dispatch(): Sets status to 'dispatched', startedAt = now, updates vehicle & driver status to 'On Trip'
  - complete(actualDistance, fuelConsumed): Sets status to 'completed', endedAt = now, actualDistance, fuelConsumed, updates vehicle & driver status to 'Available'
  - cancel(): Sets status to 'cancelled', updates vehicle & driver status to 'Available' (unless vehicle is retired)
- [ ] Add hooks for automatic timestamping (already in User model pattern)

#### 2. Trip Controller
- [ ] Create tripController.js with methods for:
  - getAllTrips: GET /api/v1/trips (with filtering, pagination)
  - getTripById: GET /api/v1/trips/:id
  - createTrip: POST /api/v1/trips (with all validations)
  - updateTrip: PUT /api/v1/trips/:id (only allowed for 'draft' status?)
  - deleteTrip: DELETE /api/v1/trips/:id (only allowed for 'draft' or 'cancelled'?)
  - dispatchTrip: POST /api/v1/trips/:id/dispatch (changes status to dispatched)
  - completeTrip: POST /api/v1/trips/:id/complete (requires actualDistance & fuelConsumed)
  - cancelTrip: POST /api/v1/trips/:id/cancel (changes status to cancelled)
- [ ] Implement proper error handling with HTTP status codes:
  - 200: Successful GET, PUT
  - 201: Successful POST
  - 204: Successful DELETE
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (missing/invalid token)
  - 403: Forbidden (insufficient permissions)
  - 404: Not Found (trip doesn't exist)
  - 409: Conflict (e.g., trying to dispatch non-draft trip)
  - 422: Unprocessable Entity (business rule violations)
- [ ] Use asyncHandler for consistent error handling
- [ ] Protect all routes with auth middleware
- [ ] Add role-based access control using authorize middleware:
  * Admin: Full access to all trip operations
  * Fleet Manager: Full access to all trip operations
  * Driver: Can only view/update trips assigned to them? (clarify business rules)
  * Safety Officer: View-only access to trips?
  * Financial Analyst: View access for reporting?
  * Employee: View-only access?

#### 3. Trip Routes
- [ ] Create tripRoutes.js with:
  - GET /api/v1/trips (list trips with query filters)
  - GET /api/v1/trips/:id (get specific trip)
  - POST /api/v1/trips (create new trip)
  - PUT /api/v1/trips/:id (update trip)
  - DELETE /api/v1/trips/:id (delete trip)
  - POST /api/v1/trips/:id/dispatch
  - POST /api/v1/trips/:id/complete
  - POST /api/v1/trips/:id/cancel
- [ ] Export router for use in server.js

#### 4. Integration Points
- [ ] Ensure Vehicle model has method to check availability for trips
- [ ] Ensure Driver model has method to check availability for trips
- [ ] Update Vehicle and Driver models if needed to support trip relationships (though foreign keys are in Trip model)
- [ ] Consider adding scopes to Vehicle and Driver models:
  * Vehicle.scope('available', { where: { status: 'Available' } })
  * Driver.scope('available', { where: { status: 'Available', licenseExpiry: { [Sequelize.Op.gt]: new Date() }, status: { [Sequelize.Op.ne]: 'Suspended' } } })

### Frontend Tasks (Trip Management)
#### 1. API Service Layer
- [ ] Extend authService.js or create tripService.js with methods for:
  - getTrips(filters): Promise<Trip[]> (with filtering, pagination)
  - getTripById(id): Promise<Trip>
  - createTrip(tripData): Promise<Trip>
  - updateTrip(id, tripData): Promise<Trip>
  - deleteTrip(id): Promise<void>
  - dispatchTrip(id): Promise<Trip>
  - completeTrip(id, actualDistance, fuelConsumed): Promise<Trip>
  - cancelTrip(id): Promise<Trip>
- [ ] Implement request/response interceptors for:
  - Adding Authorization header from auth context
  - Handling token expiration (redirect to login)
  - Error formatting and mapping to user-friendly messages

#### 2. Trip Listing Page
- [ ] Create TripList component with:
  - Search/filter inputs: source, destination, vehicle type, status, date range
  - Table displaying trips with columns: ID, Source, Destination, Vehicle, Driver, Status, Created At, Actions
  - Pagination controls
  - "Create New Trip" button (navigates to trip creation form)
  - Loading and error states
  - Row click to navigate to trip detail page
- [ ] Use React Query for data fetching and caching
- [ ] Implement debounced search/filter inputs
- [ ] Status badges with color coding (draft: gray, dispatched: blue, completed: green, cancelled: red)
- [ ] Actions column with View, Edit (if applicable), Dispatch, Complete, Cancel buttons (conditional based on status and user role)

#### 3. Trip Creation Form
- [ ] Create TripForm component (used for both create and edit) with:
  - Source input (text field, required)
  - Destination input (text field, required)
  - Vehicle dropdown (select, required, filtered to Available vehicles)
    * Option label: "{registrationNumber} - {name} ({type})"
    * Option value: vehicleId
    * Disabled if vehicle is not Available
  - Driver dropdown (select, required, filtered to Available Drivers with valid license)
    * Option label: "{name} - {licenseNumber}"
    * Option value: driverId
    * Disabled if driver is not Available or license expired/suspended
  - Cargo weight input (number field, required, min: 0.1)
    * Real-time validation: shows max capacity of selected vehicle and error if exceeds
  - Planned distance input (number field, required, min: 0.1)
  - Submit button (text changes based on create/edit mode)
  - Cancel button (navigates back to list)
- [ ] Implement form validation with react-hook-form and zod or yup
- [ ] Handle form submission:
  * For create: call tripService.createTrip()
  * For edit: call tripService.updateTrip(id, formData)
- [ ] On success: show notification, navigate to trip list or detail page
- [ ] Loading state on submit
- [ ] Display field-specific and general errors

#### 4. Trip Detail Page
- [ ] Create TripDetail component showing:
  - Header: Trip ID, Status badge
  - Information cards/groups:
    * Route: Source → Destination
    * Vehicle: {registrationNumber} - {name} ({type}), Current Odometer, Max Capacity
    * Driver: {name} - {licenseNumber}, Safety Score
    * Cargo: Weight ({cargoWeight} kg), Planned Distance ({plannedDistance} km)
    * Timestamps: Created At, Started At (if dispatched), Ended At (if completed/cancelled)
    * Actuals (if completed): Actual Distance, Fuel Consumed
  - Action buttons (conditional based on status and user role):
    * Edit (only if status === 'draft')
    * Dispatch (only if status === 'draft' and validations pass)
    * Complete (only if status === 'dispatched', requires odometer and fuel input modal)
    * Cancel (only if status === 'dispatched' or 'draft'? - clarify business rules)
    * Delete (only if status === 'draft' or 'cancelled'?)
- [ ] Fetch trip data on mount using tripService.getTripById(id)
- [ ] Loading and error states
- [ ] Implement actual distance/fuel input modal for completion

#### 5. Special Action Modals
- [ ] Create DispatchConfirmationModal:
  - Shows trip summary
  - Confirms: "Dispatching this trip will set vehicle and driver status to 'On Trip'"
  - Confirm and Cancel buttons
- [ ] Create CompleteTripModal:
  - Fields: Actual Distance (number, required), Fuel Consumed (number, required)
  - Validation: Actual Distance ≥ 0, Fuel Consumed ≥ 0
  - Shows: "Completing trip will record actual distance and fuel consumption"
  - Confirm and Cancel buttons
- [ ] Create CancelTripModal:
  - Shows trip summary and reason for cancellation (optional text area)
  - Confirms: "Cancelling this trip will set vehicle and driver status back to 'Available'"
  - Confirm and Cancel buttons

#### 6. Navigation & Route Protection
- [ ] Update App.tsx or routing configuration to include:
  - Public routes: (none for trip management - all require auth)
  - Protected routes:
    * /trips (TripList component, protected by RequireAuth)
    * /trips/new (TripForm component for creation, protected)
    * /trips/:id (TripDetail component, protected)
    * /trips/:id/edit (TripForm component for editing, protected)
    * /trips/:id/dispatch (handled via button in detail page, not a separate route)
    * /trips/:id/complete (handled via modal)
    * /trips/:id/cancel (handled via modal)
- [ ] Ensure all trip-related routes are wrapped with RequireAuth
- [ ] Consider adding GuestOnly equivalent for trip routes? (No, all trip routes require authentication)

#### 7. State Management & Optimistic Updates
- [ ] Use React Query mutations for create, update, delete, dispatch, complete, cancel operations:
  - onMutate: Optimistically update the cache
  - onSuccess: Invalidate relevant queries (trips list, specific trip)
  - onError: Rollback optimistic update
  - onSettled: Reset form state
- [ ] Implement query keys:
  - ['trips'] for list
  - ['trip', id] for specific trip
  - ['vehicle', vehicleId] for vehicle data (if needed)
  - ['driver', driverId] for driver data (if needed)

#### 8. Styling & User Experience
- [ ] Implement consistent styling using MUI components:
  - Cards for trip details
  - Tables for listing
  - Buttons with appropriate variants (contained, outlined, text)
  - Select components for dropdowns
  - Text fields with labels and error states
  - Dialogs for modals (Completion, Cancellation)
  - Snackbars for success/error messages (reuse notistack from auth feature)
- [ ] Ensure responsive design:
  - Mobile: Stacked forms, full-width buttons
  - Tablet/Desktop: Side-by-side fields where appropriate
- [ ] Add loading skeletons for list and detail views
- [ ] Implement proper focus management for accessibility
- [ ] Add keyboard navigation support (Enter to submit form, Escape to close modals)

#### 9. Error Handling & Validation
- [ ] Display field-specific errors under form inputs
- [ ] Display general form errors at top or bottom
- [ ] Handle API errors:
  * 400: Show validation errors from response
  * 401: Redirect to login
  * 403: Show "Insufficient permissions" message
  * 404: Show "Trip not found" message
  * 409: Show conflict message (e.g., "Cannot dispatch trip that is already dispatched")
  * 422: Show business rule violation errors
- [ ] Implement form reset on successful submission or cancellation
- [ ] Prevent multiple rapid submissions (disable button during request)

#### 10. Testing & Quality Assurance
- [ ] Test all CRUD operations with valid and invalid data
- [ ] Test status transitions:
  * Draft → Dispatched → Completed → Available vehicle/driver
  * Draft → Dispatched → Cancelled → Available vehicle/driver
  * Attempt to dispatch trip with overweight cargo → shows error
  * Attempt to dispatch trip with unavailable vehicle → shows error
  * Attempt to dispatch trip with expired license driver → shows error
  * Attempt to create trip when vehicle/driver already on trip → shows error
- [ ] Test role-based access:
  * Login as different roles, verify accessible operations
  * Ensure unauthorized attempts return 403
- [ ] Test form validation edge cases:
  * Empty required fields
  * Invalid numbers (negative, zero where not allowed)
  * Exceeding max length on text fields
- [ ] Test responsive behavior on mobile, tablet, desktop
- [ ] Verify loading states appear during async operations
- [ ] Check that notifications appear for success/error cases
- [ ] Ensure proper cleanup of subscriptions and timers to prevent memory leaks
- [ ] Test accessibility (WCAG compliance) with screen reader and keyboard navigation

### Integration Points & Data Flow
#### Backend-Frontend Contract
- API Base: http://localhost:5000/api/v1 (from backend .env)
- Endpoints:
  - GET /trips?source=...&destination=...&status=...&page=...&limit=...
  - POST /trips { source, destination, vehicleId, driverId, cargoWeight, plannedDistance }
  - GET /trips/:id
  - PUT /trips/:id { source, destination, ... }
  - DELETE /trips/:id
  - POST /trips/:id/dispatch
  - POST /trips/:id/complete { actualDistance, fuelConsumed }
  - POST /trips/:id/cancel
- Response Format (Success):
  ```json
  {
    "success": true,
    "data": { /* trip object */ },
    "error": null
  }
  ```
- Error Format:
  ```json
  {
    "success": false,
    "data": null,
    "error": {
      "message": "Error description",
      "code": "ERROR_CODE" // optional
    }
  }
  ```

#### Data Transformation
- Backend returns Sequelize instances (transformed to plain objects via .get({ plain: true }) or similar)
- Frontend expects camelCase field names (matches backend)
- Dates returned as ISO strings, parsed by frontend as needed
- Enums returned as strings

### Definition of Done (DoD) for Trip Management Feature
The Trip Management feature will be considered complete when:

#### Backend ✅
- [ ] Trip model created with all required fields and validations
- [ ] Trip controller implements all CRUD operations and special actions (dispatch, complete, cancel)
- [ ] All endpoints properly protected with authentication and role-based access
- [ ] Business rules enforced:
  * Cargo weight cannot exceed vehicle's max capacity
  * Cannot dispatch trip with vehicle in "In Shop" or "Retired" status
  * Cannot dispatch trip with driver having expired license or suspended status
  * Cannot assign vehicle or driver that is already "On Trip" to another trip
  * Dispatching sets vehicle and driver status to "On Trip"
  * Completing trip sets vehicle and driver status back to "Available"
  * Cancelling trip sets vehicle and driver status back to "Available" (unless vehicle retired)
- [ ] Proper error handling with appropriate HTTP status codes
- [ ] Unit tests for model validations and controller functions (if time permits)
- [ ] Manual testing confirms all business rules work correctly

#### Frontend ✅
- [ ] Trip listing page with filtering, sorting, pagination
- [ ] Trip creation form with dynamic vehicle/driver filtering and real-time validation
- [ ] Trip detail page displaying all relevant information
- [ ] Functional dispatch, complete, and cancel actions with confirmation modals
- [ ] All forms have proper validation and error handling
- [ ] Loading states and user feedback for all asynchronous operations
- [ ] Responsive design working on mobile, tablet, and desktop
- [ ] Role-based access control reflected in UI (buttons visibility based on user role)
- [ ] Navigation works correctly between list, create, edit, and detail views
- [ ] Notifications (success/error) displayed using notistack or similar
- [ ] Code follows established styling and passes linting
- [ ] No console errors or warnings in production build

#### System-Wide ✅
- [ ] Authentication system remains functional and integrated
- [ ] Vehicle and Driver models are not broken by trip relationships
- [ ] Status changes in trips correctly update Vehicle and Driver statuses via backend logic
- [ ] All API endpoints return consistent JSON format
- [ ] CORS properly configured to allow frontend origin
- [ ] Environment variables configured correctly for both frontend and backend
- [ ] Database schema migrations handled appropriately (Sequelize sync or migrations)

### Estimated Time Allocation (Feature-wise)
Since we're using feature-wise development for the approach, these tasks would be tackled together as a cohesive feature. However, for planning purposes:

#### Backend Tasks: ~3.5 hours
- Model definition and validations: 1 hour
- Controller implementation: 1.5 hours
- Route setup and integration: 0.5 hours
- Testing and refinement: 0.5 hours

#### Frontend Tasks: ~4.5 hours
- API service and setup: 0.5 hour
- Listing page: 1 hour
- Creation form: 1 hour
- Detail page: 0.5 hour
- Special action modals: 0.5 hour
- State management and optimistic updates: 0.5 hour
- Styling and responsive design: 0.5 hour
- Error handling and testing: 0.5 hour

#### Buffer and Integration: ~1 hour
- Total: ~9 hours (slightly over the original 1.5hr phase estimate, but feature-wise approach may take longer initially as we build both sides)

### Next Phase
Upon completion and approval of this Trip Management feature, we will proceed to Phase 3: Maintenance & Expense Management feature, following the same feature-wise approach (backend and frontend together).

---
*Task file created for review. Please provide feedback or approval before execution begins.*