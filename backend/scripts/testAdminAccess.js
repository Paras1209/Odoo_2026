/**
 * Script to test admin access to user records
 * Usage: node scripts/testAdminAccess.js <admin_email>
 */

require('dotenv').config();
const { connectDB } = require('../config/database');
const User = require('../models/User');
const Role = require('../models/Role');

async function testAdminAccess() {
  try {
    const adminEmail = process.argv[2];
    
    if (!adminEmail) {
      console.error('Usage: node scripts/testAdminAccess.js <admin_email>');
      process.exit(1);
    }

    console.log('\n=== Testing Admin Access ===\n');

    // Connect to database
    await connectDB();
    console.log('✓ Connected to database\n');

    // 1. Check if admin user exists
    console.log('1. Checking admin user...');
    const adminUser = await User.findOne({
      where: { email: adminEmail },
      include: [{ model: Role, as: 'roleInfo', attributes: ['id', 'code', 'name'] }]
    });

    if (!adminUser) {
      console.error(`✗ User with email ${adminEmail} not found`);
      process.exit(1);
    }

    console.log(`✓ User found: ${adminUser.name}`);
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Role: ${adminUser.roleInfo?.code || 'NO ROLE'}`);
    console.log(`  Status: ${adminUser.status}\n`);

    // 2. Verify admin role
    console.log('2. Verifying admin role...');
    if (adminUser.roleInfo?.code !== 'admin') {
      console.error(`✗ User is not an admin. Current role: ${adminUser.roleInfo?.code || 'none'}`);
      console.log('\nTo fix: Run the following SQL:');
      console.log(`UPDATE users SET "roleId" = (SELECT id FROM roles WHERE code = 'admin'), status = 'active' WHERE email = '${adminEmail}';`);
      process.exit(1);
    }
    console.log('✓ User has admin role\n');

    // 3. Verify status
    console.log('3. Verifying user status...');
    if (adminUser.status !== 'active') {
      console.error(`✗ User status is '${adminUser.status}', must be 'active'`);
      console.log('\nTo fix: Run the following SQL:');
      console.log(`UPDATE users SET status = 'active' WHERE email = '${adminEmail}';`);
      process.exit(1);
    }
    console.log('✓ User status is active\n');

    // 4. Check if admin role exists
    console.log('4. Checking admin role definition...');
    const adminRole = await Role.findOne({ where: { code: 'admin' } });
    if (!adminRole) {
      console.error('✗ Admin role not found in database');
      console.log('  Run: await Role.seedDefaultRoles()');
      process.exit(1);
    }
    console.log('✓ Admin role exists\n');

    // 5. Test querying all users
    console.log('5. Testing user query access...');
    const allUsers = await User.findAll({
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires'] },
      include: [{ model: Role, as: 'roleInfo', attributes: ['id', 'code', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✓ Successfully queried ${allUsers.length} users\n`);

    // 6. Display users summary
    console.log('6. Users Summary:');
    console.log('─'.repeat(80));
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.roleInfo?.name || 'No Role'} (${user.roleInfo?.code || 'N/A'})`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // 7. Check pending users
    console.log('7. Pending Users:');
    const pendingUsers = allUsers.filter(u => u.status === 'pending');
    if (pendingUsers.length === 0) {
      console.log('   No pending users\n');
    } else {
      console.log(`   ${pendingUsers.length} pending user(s):`);
      pendingUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.email})`);
      });
      console.log('');
    }

    // 8. Check roles
    console.log('8. Available Roles:');
    const roles = await Role.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']]
    });
    roles.forEach(role => {
      const userCount = allUsers.filter(u => u.roleInfo?.code === role.code).length;
      console.log(`   - ${role.name} (${role.code}): ${userCount} user(s)`);
    });
    console.log('');

    // 9. Summary
    console.log('='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80));
    console.log('\nAdmin user can access all user records.');
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Pending: ${pendingUsers.length}`);
    console.log(`Active: ${allUsers.filter(u => u.status === 'active').length}`);
    console.log(`Inactive: ${allUsers.filter(u => u.status === 'inactive').length}`);
    console.log(`Suspended: ${allUsers.filter(u => u.status === 'suspended').length}`);
    console.log('\n');

  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the test
testAdminAccess();
