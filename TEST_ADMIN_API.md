# Testing Admin API Access

## Quick Diagnosis

### Step 1: Test Database Access
Run this script to verify the admin user and database access:

```bash
cd backend
node scripts/testAdminAccess.js admin@example.com
```

Replace `admin@example.com` with your admin's email.

### Step 2: Test API Endpoints

#### 2.1 Login as Admin
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

Save the `token` from the response.

#### 2.2 Get All Users
```bash
curl http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [...]
}
```

**Common Errors & Solutions:**

##### Error: 401 Unauthorized
```json
{
  "status": "error",
  "message": "Not authorized, no token"
}
```
**Solution**: Make sure you're including the Authorization header with Bearer token.

##### Error: 403 Forbidden
```json
{
  "status": "error",
  "message": "Not authorized to access this resource"
}
```
**Solution**: User is not admin. Check role:
```sql
SELECT u.email, r.code as role, u.status 
FROM users u 
JOIN roles r ON u."roleId" = r.id 
WHERE u.email = 'admin@example.com';
```

If not admin, update:
```sql
UPDATE users 
SET "roleId" = (SELECT id FROM roles WHERE code = 'admin'), 
    status = 'active' 
WHERE email = 'admin@example.com';
```

##### Error: 403 Account pending
```json
{
  "status": "error",
  "message": "Account pending admin approval"
}
```
**Solution**: Admin account is pending. Update status:
```sql
UPDATE users SET status = 'active' WHERE email = 'admin@example.com';
```

##### Error: 500 Internal Server Error
Check backend console logs for the actual error. Common issues:
- Database connection failed
- Models not properly associated
- Role model not loaded

#### 2.3 Get Single User
```bash
curl http://localhost:5000/api/v1/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2.4 Update User Role
```bash
curl -X PUT http://localhost:5000/api/v1/admin/users/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "dispatcher",
    "status": "active"
  }'
```

#### 2.5 Get All Roles
```bash
curl http://localhost:5000/api/v1/admin/roles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 2.6 Get Pending Users Count
```bash
curl http://localhost:5000/api/v1/admin/users/pending/count \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Common Issues & Solutions

### Issue 1: Route Order Problem (FIXED)
**Symptom**: Getting 404 or wrong responses
**Cause**: Routes with parameters must come after specific routes
**Solution**: Already fixed in adminRoutes.js - specific routes now come first

### Issue 2: Admin User Not Properly Set Up
**Symptom**: 403 Forbidden error
**Solution**: 
```bash
# Use the create admin script
node scripts/createAdmin.js

# Or manually update in database
psql -U your_user -d your_database
UPDATE users 
SET "roleId" = (SELECT id FROM roles WHERE code = 'admin'), 
    status = 'active' 
WHERE email = 'your-admin@example.com';
```

### Issue 3: Models Not Associated
**Symptom**: Role info missing or null
**Solution**: Ensure models/index.js is being loaded. Check server startup logs.

### Issue 4: Database Not Synced
**Symptom**: Table or column doesn't exist errors
**Solution**: 
```bash
# Run migrations
psql -U your_user -d your_database -f backend/migrations/add_pending_status_and_dispatcher_role.sql

# Or in development, restart server to trigger sync
NODE_ENV=development npm start
```

### Issue 5: JWT Secret Missing
**Symptom**: "Invalid token" or "Token failed" errors
**Solution**: Check .env file has JWT_SECRET set:
```
JWT_SECRET=your-long-random-secret-key-here
```

## Debugging Checklist

- [ ] Backend server is running
- [ ] Database is connected (check console logs)
- [ ] Admin routes are registered in server.js
- [ ] Admin user exists with role 'admin' and status 'active'
- [ ] JWT_SECRET is set in .env
- [ ] Authorization header includes "Bearer " prefix
- [ ] Token is valid (not expired)
- [ ] Route order is correct in adminRoutes.js

## Testing with Postman/Insomnia

1. **Create a new request collection**

2. **Add Environment Variables**:
   - `base_url`: http://localhost:5000
   - `token`: (will be set after login)

3. **Login Request**:
   - Method: POST
   - URL: `{{base_url}}/api/v1/auth/login`
   - Body: JSON
   ```json
   {
     "email": "admin@example.com",
     "password": "your_password"
   }
   ```
   - Test script to save token:
   ```javascript
   pm.environment.set("token", pm.response.json().data.token);
   ```

4. **Get Users Request**:
   - Method: GET
   - URL: `{{base_url}}/api/v1/admin/users`
   - Headers: `Authorization: Bearer {{token}}`

5. **Update User Request**:
   - Method: PUT
   - URL: `{{base_url}}/api/v1/admin/users/:userId`
   - Headers: `Authorization: Bearer {{token}}`
   - Body: JSON
   ```json
   {
     "role": "dispatcher",
     "status": "active"
   }
   ```

## Expected Flow

1. Admin logs in → Gets token
2. Token includes userId
3. Middleware decodes token → Loads user with roleInfo
4. Middleware checks if roleInfo.code === 'admin'
5. If yes, allows access to admin routes
6. Controller queries users from database
7. Returns users with their role info

If any step fails, check that specific part of the chain.
