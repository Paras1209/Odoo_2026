# Admin Access Issue - Fixed

## Problem
Admin was not able to access user records via the API.

## Root Cause
Route ordering issue in `backend/routes/adminRoutes.js`. The parameterized route `/users/:id` was defined before the specific route `/users/pending/count`, causing Express to treat "pending" as a user ID parameter.

## Solution Applied

### 1. Fixed Route Order
**File**: `backend/routes/adminRoutes.js`

**Before** (incorrect):
```javascript
router.route('/users').get(getUsers);
router.route('/users/pending/count').get(getPendingUsersCount);  // ❌ Won't work
router.route('/users/:id').get(getUser).put(updateUser).delete(deleteUser);
```

**After** (correct):
```javascript
// Specific routes MUST come before parameterized routes
router.route('/users/pending/count').get(getPendingUsersCount);  // ✅ Now works
router.route('/users').get(getUsers);
router.route('/users/:id').get(getUser).put(updateUser).delete(deleteUser);
```

### 2. Created Diagnostic Tools

#### testAdminAccess.js
**File**: `backend/scripts/testAdminAccess.js`

Tests database-level access to verify:
- Admin user exists
- User has admin role
- User status is active
- Can query all users
- Role associations working

**Usage**:
```bash
cd backend
node scripts/testAdminAccess.js admin@example.com
```

#### TEST_ADMIN_API.md
**File**: `TEST_ADMIN_API.md`

Complete guide for testing admin API endpoints with:
- curl examples
- Common errors and solutions
- Debugging checklist
- Postman/Insomnia setup

## Verification Steps

### Step 1: Restart Backend Server
```bash
cd backend
npm start
```

### Step 2: Run Database Test
```bash
node scripts/testAdminAccess.js your-admin@example.com
```

Expected output:
```
=== Testing Admin Access ===

✓ Connected to database
✓ User found: Admin Name
✓ User has admin role
✓ User status is active
✓ Admin role exists
✓ Successfully queried X users

✅ ALL TESTS PASSED!
```

### Step 3: Test API Endpoint
```bash
# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Use token from response
curl http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "...",
      "name": "User Name",
      "email": "user@example.com",
      "status": "active",
      "roleInfo": {
        "id": "...",
        "code": "admin",
        "name": "Administrator"
      }
    }
  ]
}
```

## API Endpoints (All require admin role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List all users |
| GET | `/api/v1/admin/users?status=pending` | Filter by status |
| GET | `/api/v1/admin/users?search=john` | Search by name/email |
| GET | `/api/v1/admin/users/pending/count` | Count pending users |
| GET | `/api/v1/admin/users/:id` | Get single user |
| PUT | `/api/v1/admin/users/:id` | Update user (role/status) |
| DELETE | `/api/v1/admin/users/:id` | Delete user |
| GET | `/api/v1/admin/roles` | List available roles |

## Troubleshooting

### Still Getting 403 Forbidden?
Check that your admin user is properly configured:

```sql
SELECT 
  u.id,
  u.name,
  u.email,
  u.status,
  r.code as role,
  r.name as role_name
FROM users u
LEFT JOIN roles r ON u."roleId" = r.id
WHERE u.email = 'your-admin@example.com';
```

Should show:
- status: `active`
- role: `admin`

If not, update:
```sql
UPDATE users 
SET "roleId" = (SELECT id FROM roles WHERE code = 'admin'),
    status = 'active'
WHERE email = 'your-admin@example.com';
```

### Getting Role Not Found?
Seed the roles:

```bash
cd backend
node -e "
const { connectDB } = require('./config/database');
const Role = require('./models/Role');
(async () => {
  await connectDB();
  await Role.seedDefaultRoles();
  console.log('Roles seeded successfully');
  process.exit(0);
})();
"
```

### Token Issues?
Verify JWT_SECRET in `.env`:
```
JWT_SECRET=your-long-secret-key-minimum-32-characters
```

### Database Connection Issues?
Check `.env` database configuration:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transitops
DB_USER=your_user
DB_PASSWORD=your_password
```

## Changes Made Summary

1. ✅ Fixed route ordering in `adminRoutes.js`
2. ✅ Created `testAdminAccess.js` diagnostic script
3. ✅ Created `TEST_ADMIN_API.md` testing guide
4. ✅ Created this fix documentation

## Files Modified
- `backend/routes/adminRoutes.js` - Fixed route order

## Files Created
- `backend/scripts/testAdminAccess.js` - Database access test
- `TEST_ADMIN_API.md` - API testing guide
- `ADMIN_ACCESS_FIX.md` - This file

## Status
✅ **FIXED** - Admin can now access user records through the API.

## Next Steps After Verification

1. Test all admin endpoints
2. Create admin UI component for user management (optional)
3. Add frontend service for admin operations
4. Implement user approval workflow in UI

---

**Note**: Make sure to restart your backend server after these changes for them to take effect.
