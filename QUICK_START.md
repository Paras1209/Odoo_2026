# Quick Start Guide - RBAC Implementation

## 🚀 Getting Started

### Prerequisites
- PostgreSQL database running
- Node.js installed
- Backend and frontend dependencies installed

### Step 1: Database Migration
Run the SQL migration to add new status and update roles:

```bash
cd backend
psql -U your_username -d your_database -f migrations/add_pending_status_and_dispatcher_role.sql
```

Or connect to your database and run the migration manually.

### Step 2: Create Initial Admin User
You need at least one admin to manage other users.

**Option A: Using the script (Recommended)**
```bash
cd backend
node scripts/createAdmin.js
```
Follow the prompts to create your admin account.

**Option B: Manual SQL**
```sql
-- First, get the admin role ID
SELECT id FROM roles WHERE code = 'admin';

-- Then update an existing user or create a new one
UPDATE users 
SET status = 'active', 
    "roleId" = '<admin-role-id-from-above>'
WHERE email = 'your-admin@example.com';
```

### Step 3: Start the Backend
```bash
cd backend
npm start
# or
npm run dev
```

### Step 4: Start the Frontend
```bash
cd frontend
npm run dev
```

### Step 5: Test the System

#### Test User Registration
1. Navigate to http://localhost:5173/register
2. Register a new user (notice: no role selection)
3. See "pending approval" message after registration
4. Try to access protected routes - should see "pending approval" message

#### Test Admin Functions
1. Login as admin (user you created in Step 2)
2. You should see all navigation menu items
3. Navigate to admin panel (you'll need to create this UI or use API directly)

#### Using the Admin API
```bash
# List all users
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:5000/api/v1/admin/users

# List pending users
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:5000/api/v1/admin/users?status=pending

# Activate a user and assign role
curl -X PUT \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "dispatcher", "status": "active"}' \
  http://localhost:5000/api/v1/admin/users/<user_id>

# List all roles
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:5000/api/v1/admin/roles
```

## 🎯 Testing Workflow

### 1. New User Registration Flow
```
User Registration → Account created (pending status) 
→ User sees "awaiting approval" message 
→ User cannot access system features
```

### 2. Admin Approval Flow
```
Admin logs in → Views pending users 
→ Assigns appropriate role 
→ Changes status to 'active' 
→ User can now login and access role-specific features
```

### 3. Role-Based Access
Each role has specific access:
- **Admin**: Everything
- **Dispatcher**: Dashboard, Trips (full access)
- **Fleet Manager**: Fleet, Maintenance
- **Safety Officer**: Drivers, Compliance
- **Financial Analyst**: Fuel, Expenses, Analytics
- **Driver**: Own profile and assignments
- **Employee**: Profile only

## 📊 Verify Implementation

### Check Database
```sql
-- Verify new status exists
SELECT DISTINCT status FROM users;
-- Should include: active, inactive, suspended, pending

-- Verify dispatcher role exists
SELECT * FROM roles WHERE code = 'dispatcher';

-- Check user distribution
SELECT 
  r.name as role,
  u.status,
  COUNT(*) as count
FROM users u
JOIN roles r ON u."roleId" = r.id
GROUP BY r.name, u.status
ORDER BY r.name, u.status;
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Register (no role parameter)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}' \
  http://localhost:5000/api/v1/auth/register

# Login
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  http://localhost:5000/api/v1/auth/login

# Try to access protected route (should fail for pending users)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/v1/trips
```

## 🔧 Troubleshooting

### Issue: Cannot create admin user
**Solution**: Make sure the roles table is seeded with the admin role.
```bash
cd backend
node -e "
const { connectDB } = require('./config/database');
const Role = require('./models/Role');
(async () => {
  await connectDB();
  await Role.seedDefaultRoles();
  console.log('Roles seeded');
  process.exit(0);
})();
"
```

### Issue: Enum type error when adding 'pending' status
**Solution**: The enum might need to be recreated. See migration file for details.

### Issue: Frontend shows "Access Denied" for all routes
**Solution**: 
1. Check that user status is 'active' in database
2. Verify user has appropriate role assigned
3. Check browser console for errors
4. Verify token is valid

### Issue: Navigation menu is empty
**Solution**: 
1. Check that useRoleAccess hook is working
2. Verify user has an active status
3. Check role permissions in database

## 📱 Next Steps

### For Deployment
1. Update `.env` files with production values
2. Run migrations on production database
3. Create admin user in production
4. Test role-based access in production

### Optional Enhancements
1. Create admin UI for user management
2. Add email notifications for account approval
3. Implement audit logging
4. Add bulk user operations
5. Create dashboard showing pending users count

## 📚 Documentation
- Full documentation: `ROLE_BASED_ACCESS_CONTROL.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
- API examples in both files above

## ✅ Success Checklist
- [ ] Database migration completed
- [ ] Admin user created and can login
- [ ] New user registration creates pending account
- [ ] Pending users cannot access system
- [ ] Admin can view and manage users
- [ ] Admin can assign roles and activate users
- [ ] Activated users can access role-appropriate features
- [ ] Navigation menu shows only accessible items
- [ ] Unauthorized access shows appropriate messages
- [ ] All TypeScript/JavaScript files have no syntax errors

## 🆘 Support
If you encounter issues:
1. Check the console logs (backend and frontend)
2. Verify database connection
3. Check that all dependencies are installed
4. Review the implementation files for examples
5. Check the API responses for error messages

---

**Ready to go!** 🎉 Your role-based access control system is now implemented.
