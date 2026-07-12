const { sequelize } = require('./config/database');

const testDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    // Test querying
    const result = await sequelize.query('SELECT version() as version', { type: sequelize.QueryTypes.SELECT });
    console.log(`🐘 PostgreSQL version: ${result[0].version}`);

    // Test table creation/sync
    await sequelize.sync({ alter: true });
    console.log('🔄 Database schema synchronized.');

    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:');
    console.error('   ', error.message);

    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('\n💡 Connection refused. Make sure PostgreSQL is running:');
      console.error('   - On Linux: sudo service postgresql start');
      console.error('   - On macOS: brew services start postgresql');
      console.error('   - On Windows: Start PostgreSQL service via Services app');
      console.error('   - Or use Docker: docker run --name transitops-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=transitops -p 5432:5432 -d postgres:15');
    } else if (error.original && (original.code === '28P01' || original.message.includes('password authentication failed'))) {
      console.error('\n💡 Authentication failed. Check your credentials in .env:');
      console.error('   - DB_USER:', process.env.DB_USER);
      console.error('   - DB_PASSWORD: [hidden]');
      console.error('   - Create user with: CREATE USER ' + process.env.DB_USER + ' WITH PASSWORD '\'' + process.env.DB_PASSWORD + '\'' + ';');
      console.error('   - Create database with: CREATE DATABASE ' + process.env.DB_NAME + ';');
      console.error('   - Grant privileges: GRANT ALL PRIVILEGES ON DATABASE ' + process.env.DB_NAME + ' TO ' + process.env.DB_USER + ';');
    }

    return false;
  }
};

// Run the test
testDatabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🎉 Database test passed! You can now start the development server with:');
      console.log('   npm run dev');
      process.exit(0);
    } else {
      console.log('\n💥 Database test failed. Please fix the connection issues above.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\n💥 Unexpected error during database test:', err);
    process.exit(1);
  });