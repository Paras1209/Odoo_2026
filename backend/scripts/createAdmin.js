/**
 * Script to create an initial admin user
 * Usage: node scripts/createAdmin.js
 */

require('dotenv').config();
const readline = require('readline');
const { connectDB } = require('../config/database');
const User = require('../models/User');
const Role = require('../models/Role');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdminUser() {
  try {
    console.log('\n=== Create Admin User ===\n');

    // Connect to database
    await connectDB();
    console.log('✓ Connected to database\n');

    // Get admin role
    const adminRole = await Role.findOne({ where: { code: 'admin' } });
    if (!adminRole) {
      console.error('✗ Error: Admin role not found in database');
      console.error('  Please run the database migration first');
      process.exit(1);
    }

    // Get user details
    const name = await question('Admin Name: ');
    const email = await question('Admin Email: ');
    const password = await question('Admin Password (min 6 characters): ');

    // Validate input
    if (!name || !email || !password) {
      console.error('\n✗ All fields are required');
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('\n✗ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('\n⚠ User with this email already exists');
      const update = await question('Update this user to admin? (yes/no): ');
      
      if (update.toLowerCase() === 'yes' || update.toLowerCase() === 'y') {
        existingUser.name = name;
        existingUser.password = password;
        existingUser.roleId = adminRole.id;
        existingUser.status = 'active';
        await existingUser.save();
        
        console.log('\n✓ User updated to admin successfully!');
        console.log(`  Email: ${existingUser.email}`);
        console.log(`  Role: admin`);
        console.log(`  Status: active`);
      } else {
        console.log('\n✗ Operation cancelled');
      }
    } else {
      // Create new admin user
      const user = await User.create({
        name,
        email,
        password,
        roleId: adminRole.id,
        status: 'active'
      });

      console.log('\n✓ Admin user created successfully!');
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: admin`);
      console.log(`  Status: active`);
    }

    console.log('\nYou can now login with these credentials.\n');

  } catch (error) {
    console.error('\n✗ Error creating admin user:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.message}`);
      });
    }
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the script
createAdminUser();
