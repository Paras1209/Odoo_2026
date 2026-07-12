# TransitOps Implementation Plan
## 8-Hour Hackathon Plan for 2-Person Team (Nitin & Paras) - Using MongoDB

### Overview
Building ackstack Selection (Pre-Work - Before Hour 0)
- **Frontend**: React 18 + TypeScript + Material-UI (MUI) for responsive components
- **Backend**: Node.js 20 + Express + Mongoose ODM (MongoDB)
- **Auth**: JWT-based authentication with role-based middleware
- **Database**: MongoDB (local or cloud Atlas - local for development simplicity)
- **Tools**: Git, VS Code, Postman/API testing, MongoDB Compass (for GUI)
- **Why**: Rapid development, excellent documentation, strong community support, built-in responsiveness with MUI, MongoDB flexibility for evolving schema

### Timeboxed Phase Breakdown (Total: 8 Hours)
| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| 0. Setup & Foundations | 0.5 hr | Project initialization, auth skeleton, MongoDB setup | Repo, basic server, DB connection, login/register |
| 1. Core Data Models | 1.0 hr | Vehicle, Driver, User/Role Mongoose schemas | DB models, basic CRUD APIs |
| 2. Trip Management Core | 1.5 hr | Trip creation, validation, lifecycle | Trip CRUD, status transitions, business rules |
| 3. Maintenance & Expenses | 1.0 hr | Maintenance logs, fuel/expense tracking | Maintenance CRUD, fuel logging, cost calc |
| 4. Dashboard & Reporting | 1.0 hr | KPIs, charts, basic analytics | Dashboard components, KPI calculations |
| 5. Integration & Workflow | 1.5 hr | Connect modules, test end-to-flow | Full vehicle→trip→maintenance cycle |
| 6. Polish & Bonus | 1.0 hr | UI refinement, error handling, bonus features | Responsive tweaks, validation messages, email reminders (if time) |
| 7. Final Testing & Demo Prep | 1.0 hr | Validate example workflow, prepare presentation | Working demo of 9-step workflow, cleanup |

### Detailed Task Assignment

#### Nitin's Responsibilities (Asset & User Management Focus)
- **Phase 0 (Shared)**: Project setup, initial repo, basic server skeleton, MongoDB connection setup
- **Phase 1**: 
  - Design & implement Vehicle Mongoose schema (registrationNumber [unique], name/model, type, maxCapacity, odometer, acquisitionCost, status)
  - Design & implement Driver Mongoose schema (name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status)
  - Design & implement User & Role Mongoose schemas (for RBAC)
  - Basic CRUD endpoints for Vehicles/Drivers (with validation)
- **Phase 3**:
  - Maintenance model & CRUD (linked to Vehicle, auto-sets status to "In Shop" on create, back to "Available" on close)
  - Fuel/Expense model & CRUD (linked to Vehicle/Trip)
  - Automatic operational cost calculation (Fuel + Maintenance) per vehicle
- **Phase 5**: 
  - Integrate Maintenance with Vehicle status changes
  - Validate that Retired/In Shop vehicles don't appear in dispatch options
  - Ensure Maintenance closing logic works
- **Phase 6**: 
  - Add form validation messages for Vehicle/Driver inputs
  - Implement status-based UI disabling (e.g., grey out unavailable vehicles in trip form)

#### Paras's Responsibilities (Operations & Reporting Focus)
- **Phase 0 (Shared)**: Project setup, initial repo, basic server skeleton, MongoDB connection setup
- **Phase 1**: 
  - Assist with User/Role model design (focus on RBAC implementation)
  - Implement authentication endpoints (login/register) with JWT
  - Create auth middleware for route protection
- **Phase 2**:
  - Trip Mongoose schema (source/destination, vehicleId, driverId, cargoWeight, plannedDistance, status)
  - Trip CRUD endpoints with ALL validations:
    * Vehicle registration number unique (handled in Vehicle model)
    * Retired/In Shop vehicles excluded from dropdown
    * Drivers with expired licenses/suspended status excluded
    * Vehicle/driver already On Trip cannot be reassigned
    * Cargo weight ≤ vehicle maxCapacity
  - Status transition logic (Draft → Dispatched → Completed → Cancelled)
  - Automatic status updates: Dispatching sets vehicle/driver to "On Trip"; Completing sets back to "Available"; Cancelling restores to "Available"
- **Phase 4**:
  - Dashboard components: KPI cards (Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %)
  - Filter controls (by vehicle type, status, region)
  - Basic charts (fuel efficiency over time, operational cost trends)
  - Reports: Fuel Efficiency (Distance/Fuel), Fleet Utilization, Operational Cost, Vehicle ROI formula implementation
  - CSV export functionality
- **Phase 5**:
  - Connect Trip completion to Fuel/Expense logging prompt
  - Ensure dashboard reflects real-time status changes from Nitin's modules
  - Validate that completed trips update odometer/fuel logs correctly
- **Phase 6**:
  - Implement responsive layout adjustments (MUI Grid system)
  - Add loading states and error boundaries
  - Implement date pickers for maintenance/fuel logs

### Critical Integration Points (MongoDB Specific)
1. **Data Modeling**:
   - Use Mongoose references for relationships: 
     - Trip.vehicleId → Vehicle._id (ObjectId)
     - Trip.driverId → Driver._id (ObjectId)
     - Maintenance.vehicleId → Vehicle._id (ObjectId)
     - FuelLog.vehicleId → Vehicle._id (ObjectId) or FuelLog.tripId → Trip._id (ObjectId)
   - Use virtuals for calculated fields where appropriate (e.g., vehicle age)
   - Use indexes for frequently queried fields (registrationNumber, status, licenseExpiry)

2. **Vehicle Status Flow**: 
   - Nitin's Maintenance module → sets Vehicle.status = "In Shop" 
   - Paras's Trip module → checks Vehicle.status ≠ "In Shop"/"Retired" before allowing dispatch
   - Paras's Trip completion → sets Vehicle.status = "Available"

3. **Driver Status Flow**:
   - Paras's Trip module → checks Driver.licenseExpiry > today AND status ≠ "Suspended"
   - Paras's Trip dispatch → sets Driver.status = "On Trip"
   - Paras's Trip completion/cancel → sets Driver.status = "Available"

4. **Data Consistency**:
   - Use Mongoose middleware (pre/save hooks) for automatic timestamping
   - Consider using transactions for multi-document operations (e.g., updating vehicle/driver status when creating a trip) if using MongoDB replica set or sharded cluster (for simplicity in hackathon, we might use application-level transactions)
   - Validation at schema level (required, min, max, enum, custom validators)

### Validation Checkpoints (Every 90 Minutes)
- **T+1.5 hr**: Basic auth working, can register/login, Vehicle/Driver models migrated, MongoDB connected
- **T+3.5 hr**: Can create Vehicle/Driver, Trip creation form appears with proper dropdowns (populated from DB)
- **T+5.5 hr**: Can dispatch a trip (validations working), statuses update correctly in DB
- **T+7.0 hr**: Dashboard shows KPIs (data from MongoDB aggregations), maintenance logs affect vehicle availability
- **T+8.0 hr**: Full 9-step workflow demonstrable, ready for presentation

### Example Workflow Validation (Steps 1-9 from Problem Statement)
1. ✅ Register vehicle 'Van-05' (capacity 500kg, status Available) → Nitin's Vehicle CRUD (saved to MongoDB)
2. ✅ Register driver 'Alex' (valid license) → Nitin's Driver CRUD (saved to MongoDB)
3. ✅ Create trip with Cargo Weight=450kg → Paras's Trip form (validates 450≤500 by checking vehicle document from DB)
4. ✅ System allows dispatch → Paras's validation passes (checks vehicle/driver status from DB)
5. ✅ Vehicle/Driver status → On Trip → Paras's status transition logic (updates documents in DB)
6. ✅ Complete trip (enter odometer/fuel) → Paras's completion handler + Nitin's Fuel/Expense logging (updates trip, creates fuel log)
7. ✅ System marks Vehicle/Driver as Available → Paras's completion logic (updates documents)
8. ✅ Create maintenance (Oil Change) → Vehicle status → In Shop → Nitin's Maintenance logic (creates maintenance doc, updates vehicle status)
9. ✅ Reports update operational cost/fuel efficiency → Paras's dashboard/recalculations (uses MongoDB aggregation pipelines)

### Risk Mitigation & Time Savers (MongoDB Specific)
- **Use Mongoose Schemas**: Provides structure and validation while maintaining flexibility
- **Pre-built MUI Components**: Leverage pre-built tables, forms, dialogs (saves 2+ hours)
- **Seed Data**: Create basic vehicle/driver seeds for faster testing (use `mongoose-seed` or manual seeding script)
- **Shared Auth Service**: Centralize JWT handling in one module
- **Error Boundaries**: Wrap major components to prevent crashes
- **Console Logs**: Strategic logging for debugging without breaking UI
- **Git Checkpoints**: Commit after each major phase (use descriptive messages)
- **MongoDB Compass**: Use for quick data inspection during development
- **If Behind Scope**: 
  - Drop PDF export (keep CSV)
  - Simplify charts to basic MUI Charts or recharts
  - Defer email reminders to bonus phase
  - Use mock data for reports if aggregation queries slow (though MongoDB is fast for typical hackathon loads)

### MongoDB Setup Notes
1. **Local Development**: 
   - Install MongoDB Community Edition
   - Or use MongoDB Atlas free tier (recommended for consistency across team members)
   - Connection string format: `mongodb://localhost:27017/transitops` or Atlas SRV string
2. **Environment Variables**:
   - Store MongoDB URI in `.env` file (use `dotenv` package)
   - Example: `MONGODB_URI=mongodb://localhost:27017/transitops`
3. **Mongoose Connection**:
   ```javascript
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI, {
     useNewUrlParser: true,
     useUnifiedTopology: true,
   });
   ```
4. **Data Types**: 
   - Use `Schema.Types.ObjectId` for references
   - Use `Date` for timestamps
   - Use `Number` for weights, costs, etc.
   - Use `String` for text fields with `enum` for status fields
5. **Validation**:
   - Use Mongoose built-in validators (required, min, max, enum, match)
   - Custom validators for complex logic (e.g., license expiry date > today)

### Definition of Done (DoD)
- **Core**: All mandatory business rules enforced, responsive UI, auth with RBAC, data persisted in MongoDB
- **MVP**: Example workflow (Steps 1-9) works end-to-end with data stored in MongoDB
- **Stretch**: Dashboard with KPIs/filters, basic charts, CSV export (data sourced from MongoDB)
- **Bonus**: Date validation on forms, loading states, error messages, email reminders (if time)

### Communication Protocol
- **Daily Standup**: Quick sync at start (0 min) and after each phase
- **Blockers**: Immediately flag in team chat if stuck >15 min on validation/integration
- **Code Reviews**: Pull requests for each major feature (max 10 min review time)
- **Testing**: Manual testing of user flows; automated tests low priority for hackathon
- **DB Sync**: Regularly pull/push to ensure both developers have latest schema (use migrations if schema changes significantly, but for hackathon we can restart with fresh seed data if needed)

### Tech-Specific Notes (If Using Odoo Instead)
*Note: If required to build as Odoo module, adapt as follows:*
- **Backend**: Odoo ORM (models.Model), access rules for RBAC
- **Frontend**: Odoo QWeb templates + web client (less flexible than React/MUI but faster Odoo integration)
- **Auth**: Built-in Odoo authentication (use Odoo users/groups)
- **Time Savings**: Odoo provides ORM, security, basic UI components out-of-box
- **Adjustments**: Focus on creating custom models (vehicle, driver, trip etc.) and views; less time on auth/plumbing

---
*Plan created at: 2026-07-12 09:30 AM | Updated for MongoDB | Ready for execution*