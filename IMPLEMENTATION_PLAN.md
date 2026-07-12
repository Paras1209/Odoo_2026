# TransitOps Implementation Plan
## 8-Hour Hackathon Plan for 2-Person Team (Nitin & Paras) - Using PostgreSQL (Odoo-style)

### Overview
Building ackstack Selection (Pre-Work - Before Hour 0)
- **Frontend**: React 18 + TypeScript + Material-UI (MUI) for responsive components
- **Backend**: Node.js 20 + Express + Sequelize ORM (PostgreSQL)
- **Auth**: JWT-based authentication with role-based middleware
- **Database**: PostgreSQL (local or cloud - aligns with Odoo's RDBMS preference)
- **Tools**: Git, VS Code, Postman/API testing, pgAdmin or DBeaver (for DB GUI)
- **Why**: Rapid development, excellent documentation, strong community support, built-in responsiveness with MUI, PostgreSQL reliability and feature-richness suitable for business applications like Odoo

### Collaboration Setup (Critical for 2-Person Team)
To work concurrently on the same PostgreSQL database and codebase:

1. **Shared PostgreSQL Database (Recommended)**
   - Option A: Local PostgreSQL (both install same version, create same database)
   - Option B: Cloud PostgreSQL (Supabase free tier, ElephantSQL, or similar - one team member creates, shares credentials)
   - Create database named `transitops`
   - Share connection details via secure channel and store in `.env` file locally (never commit `.env` to git)
   - Example `.env` (gitignored):
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=transitops
     DB_USER=postgres
     DB_PASSWORD=your-password
     PORT=5000
     JWT_SECRET=your-super-secret-jwt-key-change-in-production
     ```

2. **Git Workflow for Parallel Development**
   - Initialize a shared repository (e.g., on GitHub/GitLab)
   - Main branch: `main` (stable, deployable state)
   - Each developer works on their own feature branch:
     - Nitin: `feature/assets-users`
     - Paras: `feature/operations-reporting`
   - Branch off from `main` at start
   - Commit frequently with descriptive messages
   - Push to remote regularly
   - Open Pull Requests (PRs) for review at end of each phase (or when ready to merge)
   - Use PR reviews as quick sync points (aim for <5 min review)
   - Merge to `main` after review and verification
   - Regularly pull `main` into feature branches to avoid divergence

3. **Environment & Dependency Synchronization**
   - Both developers run `npm install` after pulling changes
   - Share `package.json` and `package-lock.json` via git
   - Use same Node.js version (use `.nvmrc` or specify in README)
   - If using local PostgreSQL, ensure both have same version and database name

4. **Communication & Sync Points**
   - Start of each phase: 5-minute sync to confirm understanding and dependencies
   - End of each phase: 10-minute integration check (merge to main, test combined functionality)
   - Use team chat for quick questions; call if blocked >10 minutes
   - After merging, both developers pull latest `main` before continuing

### Timeboxed Phase Breakdown (Total: 8 Hours)
| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| 0. Setup & Foundations | 0.5 hr | Project initialization, auth skeleton, PostgreSQL setup | Repo, basic server, DB connection, login/register |
| 1. Core Data Models | 1.0 hr | Vehicle, Driver, User/Role Sequelize models | DB models, basic CRUD APIs |
| 2. Trip Management Core | 1.5 hr | Trip creation, validation, lifecycle | Trip CRUD, status transitions, business rules |
| 3. Maintenance & Expenses | 1.0 hr | Maintenance logs, fuel/expense tracking | Maintenance CRUD, fuel logging, cost calc |
| 4. Dashboard & Reporting | 1.0 hr | KPIs, charts, basic analytics | Dashboard components, KPI calculations |
| 5. Integration & Workflow | 1.5 hr | Connect modules, test end-to-flow | Full vehicle→trip→maintenance cycle |
| 6. Polish & Bonus | 1.0 hr | UI refinement, error handling, bonus features | Responsive tweaks, validation messages, email reminders (if time) |
| 7. Final Testing & Demo Prep | 1.0 hr | Validate example workflow, prepare presentation | Working demo of 9-step workflow, cleanup |

### Detailed Task Assignment

#### Nitin's Responsibilities (Asset & User Management Focus)
- **Phase 0 (Shared)**: Project setup, initial repo, basic server skeleton, PostgreSQL connection setup
- **Phase 1**: 
  - Design & implement Vehicle Sequelize model (registrationNumber [unique], name/model, type, maxCapacity, odometer, acquisitionCost, status)
  - Design & implement Driver Sequelize model (name, licenseNumber, licenseCategory, licenseExpiry, contact, safetyScore, status)
  - Design & implement User & Role Sequelize models (for RBAC)
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
- **Phase 0 (Shared)**: Project setup, initial repo, basic server skeleton, PostgreSQL connection setup
- **Phase 1**: 
  - Assist with User/Role model design (focus on RBAC implementation)
  - Implement authentication endpoints (login/register) with JWT
  - Create auth middleware for route protection
- **Phase 2**:
  - Trip Sequelize model (source/destination, vehicleId, driverId, cargoWeight, plannedDistance, status)
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

### Critical Integration Points (PostgreSQL/Sequelize Specific)
1. **Data Modeling**:
   - Use Sequelize associations for relationships:
     - Trip.belongsTo(Vehicle, { foreignKey: 'vehicleId' })
     - Trip.belongsTo(Driver, { foreignKey: 'driverId' })
     - Maintenance.belongsTo(Vehicle, { foreignKey: 'vehicleId' })
     - FuelLog.belongsTo(Vehicle, { foreignKey: 'vehicleId' }) OR FuelLog.belongsTo(Trip, { foreignKey: 'tripId' })
   - Use appropriate data types: Sequelize.STRING, Sequelize.INTEGER, Sequelize.FLOAT, Sequelize.DATE, Sequelize.ENUM
   - Add indexes for frequently queried fields (registrationNumber, status, licenseExpiry)
   - Use scopes for common queries (e.g., available vehicles, active drivers)

2. **Vehicle Status Flow**: 
   - Nitin's Maintenance module → sets Vehicle.status = "In Shop" 
   - Paras's Trip module → checks Vehicle.status ≠ "In Shop"/"Retired" before allowing dispatch
   - Paras's Trip completion → sets Vehicle.status = "Available"

3. **Driver Status Flow**:
   - Paras's Trip module → checks Driver.licenseExpiry > today AND status ≠ "Suspended"
   - Paras's Trip dispatch → sets Driver.status = "On Trip"
   - Paras's Trip completion/cancel → sets Driver.status = "Available"

4. **Data Consistency**:
   - Use Sequelize hooks (beforeCreate, beforeUpdate) for automatic timestamping
   - Use Sequelize transactions for multi-document operations (e.g., when creating a trip, update vehicle AND driver status in same transaction)
   - Validation at model level (validate: { is: [...], min: [...], isIn: [...] })
   - Use hooks for complex validation (e.g., validate license expiry before setting driver status)

### Validation Checkpoints (Every 90 Minutes)
- **T+1.5 hr**: Basic auth working, can register/login, Vehicle/Driver models migrated, PostgreSQL connected
- **T+3.5 hr**: Can create Vehicle/Driver, Trip creation form appears with proper dropdowns (populated from DB)
- **T+5.5 hr**: Can dispatch a trip (validations working), statuses update correctly in DB
- **T+7.0 hr**: Dashboard shows KPIs (data from PostgreSQL queries/aggregations), maintenance logs affect vehicle availability
- **T+8.0 hr**: Full 9-step workflow demonstrable, ready for presentation

### Example Workflow Validation (Steps 1-9 from Problem Statement)
1. ✅ Register vehicle 'Van-05' (capacity 500kg, status Available) → Nitin's Vehicle CRUD (saved to PostgreSQL)
2. ✅ Register driver 'Alex' (valid license) → Nitin's Driver CRUD (saved to PostgreSQL)
3. ✅ Create trip with Cargo Weight=450kg → Paras's Trip form (validates 450≤500 by querying vehicle record from DB)
4. ✅ System allows dispatch → Paras's validation passes (checks vehicle/driver status from DB)
5. ✅ Vehicle/Driver status → On Trip → Paras's status transition logic (updates records in DB)
6. ✅ Complete trip (enter odometer/fuel) → Paras's completion handler + Nitin's Fuel/Expense logging (updates trip, creates fuel log)
7. ✅ System marks Vehicle/Driver as Available → Paras's completion logic (updates records)
8. ✅ Create maintenance (Oil Change) → Vehicle status → In Shop → Nitin's Maintenance logic (creates maintenance record, updates vehicle status)
9. ✅ Reports update operational cost/fuel efficiency → Paras's dashboard/recalculations (uses PostgreSQL aggregation queries)

### Risk Mitigation & Time Savers (PostgreSQL/Sequelize Specific)
- **Use Sequelize CLI**: For model generation and migrations (saves time on boilerplate)
- **Pre-built MUI Components**: Leverage pre-built tables, forms, dialogs (saves 2+ hours)
- **Seed Data**: Create basic vehicle/driver seeds for faster testing (use Sequelize seeders or manual script)
- **Shared Auth Service**: Centralize JWT handling in one module
- **Error Boundaries**: Wrap major components to prevent crashes
- **Console Logs**: Strategic logging for debugging without breaking UI
- **Git Checkpoints**: Commit after each major phase (use descriptive messages)
- **DB GUI Tools**: Use pgAdmin or DBeaver for quick data inspection during development
- **If Behind Scope**: 
  - Drop PDF export (keep CSV)
  - Simplify charts to basic MUI Charts or recharts
  - Defer email reminders to bonus phase
  - Use mock data for reports if queries slow (though PostgreSQL is fast for typical hackathon loads)

### PostgreSQL Setup Notes
1. **Local Development**: 
   - Install PostgreSQL (same version for both developers)
   - Create database: `createdb transitops`
   - Create user with appropriate privileges
2. **Cloud Development** (Recommended for consistency):
   - Use Supabase free tier, ElephantSQL, or similar PostgreSQL hosting
   - One team member creates instance, shares connection credentials
3. **Environment Variables**:
   - Store DB credentials in `.env` file (use `dotenv` package)
   - Example:
     ```
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=transitops
     DB_USER=postgres
     DB_PASSWORD=your-password
     PORT=5000
     JWT_SECRET=your-super-secret-jwt-key-change-in-production
     ```
4. **Sequelize Connection**:
   ```javascript
   const { Sequelize } = require('sequelize');
   
   const sequelize = new Sequelize(
     process.env.DB_NAME,
     process.env.DB_USER,
     process.env.DB_PASSWORD,
     {
       host: process.env.DB_HOST,
       port: process.env.DB_PORT,
       dialect: 'postgres',
       logging: false, // set to console.log for debugging
     }
   );
   
   // Test connection
   sequelize.authenticate()
     .then(() => console.log('PostgreSQL connected successfully.'))
     .catch(err => console.error('Unable to connect to the database:', err));
   ```
5. **Sequelize Models**: Define models with proper data types, validations, and associations
6. **Migrations vs Sync**: For hackathon simplicity, use `sequelize.sync({ alter: true })` in development (NOT for production). For more control, use Sequelize CLI migrations.

### Definition of Done (DoD)
- **Core**: All mandatory business rules enforced, responsive UI, auth with RBAC, data persisted in PostgreSQL
- **MVP**: Example workflow (Steps 1-9) works end-to-end with data stored in PostgreSQL
- **Stretch**: Dashboard with KPIs/filters, basic charts, CSV export (data sourced from PostgreSQL)
- **Bonus**: Date validation on forms, loading states, error messages, email reminders (if time)

### Communication Protocol
- **Daily Standup**: Quick sync at start (0 min) and after each phase
- **Blockers**: Immediately flag in team chat if stuck >15 min on validation/integration
- **Code Reviews**: Pull requests for each major feature (max 10 min review time)
- **Testing**: Manual testing of user flows; automated tests low priority for hackathon
- **DB Sync**: Regularly pull/push to ensure both developers have latest schema (use Sequelize migrations if schema changes significantly, but for hackathon we can use sync or reseed if needed)
- **Shared DB Awareness**: Both developers point to the same PostgreSQL database; changes are immediately visible to both after saving/restarting server (thanks to database transactions)

### Tech-Specific Notes (If Using Odoo Instead)
*Note: If required to build as Odoo module, adapt as follows:*
- **Backend**: Odoo ORM (models.Model), access rules for RBAC
- **Frontend**: Odoo QWeb templates + web client (less flexible than React/MUI but faster Odoo integration)
- **Auth**: Built-in Odoo authentication (use Odoo users/groups)
- **Time Savings**: Odoo provides ORM, security, basic UI components out-of-box
- **Adjustments**: Focus on creating custom models (vehicle, driver, trip etc.) and views; less time on auth/plumbing

---
*Plan created at: 2026-07-12 09:30 AM | Updated for PostgreSQL & Collaboration | Ready for execution*