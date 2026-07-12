# PostgreSQL 18 Setup Guide for TransitOps

This guide explains how to set up PostgreSQL 18 for the TransitOps backend application.

## Prerequisites
- Administrative/root access to your machine (for installation)
- Internet connection to download PostgreSQL

## Installation Steps

### Windows
1. Download PostgreSQL 18 from the official website: https://www.postgresql.org/download/windows/
2. Run the installer and follow the wizard:
   - Choose installation directory (default: `C:\Program Files\PostgreSQL\18`)
   - Select components to install (at least PostgreSQL Server and pgAdmin)
   - Set a password for the `postgres` superuser (remember this for later)
   - Keep the default port (5432) unless you have a conflict
   - Set locale to default
3. Complete the installation

### macOS
#### Option 1: Using PostgreSQL.app (Recommended for simplicity)
1. Download PostgreSQL.app from https://postgresapp.com/
2. Drag PostgreSQL.app to your Applications folder
3. Open PostgreSQL.app from Applications
4. Click "Initialize" to start a new server
5. Click "Start" to start the PostgreSQL server
6. The server will run on port 5432 by default

#### Option 2: Using Homebrew
```bash
# Install PostgreSQL 18
brew install postgresql@18

# Start service
brew services start postgresql@18

# Or start manually
pg_ctl -D /opt/homebrew/var/postgresql@18 start
```

### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install PostgreSQL 18
sudo apt install postgresql-18

# Start service (usually starts automatically after installation)
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify service is running
sudo systemctl status postgresql
```

## Creating Database and User

After installing PostgreSQL, create the database and user for TransitOps:

### Using psql Command Line
```bash
# Connect to PostgreSQL as the postgres user (adjust for your system)
# On Windows: you may need to use the SQL Shell (psql) from the Start menu
# On macOS/Linux: use terminal

# Connect as postgres user (you'll be prompted for the password you set during installation)
psql -U postgres

# Inside the psql prompt, run:
CREATE DATABASE transitops;
CREATE USER transitops_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE transitops TO transitops_user;
\q  # quit psql
```

### Using pgAdmin (GUI)
1. Open pgAdmin (installed with PostgreSQL or via PostgreSQL.app)
2. Connect to the PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database..."
   - Name: `transitops`
   - Owner: `postgres` (or your preferred user)
   - Click "Save"
4. Create a user:
   - Right-click on "Login/Group Roles" → "Create" → "Login/Group Role..."
   - General tab: 
     - Name: `transitops_user`
   - Definition tab:
     - Password: `your_secure_password`
   - Privileges tab: 
     - Login: Yes
     - Superuser: No (unless you want full admin)
   - Databases tab:
     - Select `transitops` and move it to "Privileged databases" list
   - Click "Save"

## Connection Testing

After setting up the database and user, test your connection with:

```bash
npm run test:db
```

This should output:
```
✅ Database connection has been established successfully.
🐘 PostgreSQL version: PostgreSQL 18.x on x86_64-pc-linux-gnu, ...
🔄 Database schema synchronized.
🎉 Database test passed! You can now start the development server with:
   npm run dev
```

## Environment Configuration

Edit your `.env` file with the following values:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transitops
DB_USER=transitops_user          # or whatever username you created
DB_PASSWORD=your_secure_password # the password you set

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h

# Frontend URL (for CORS in production)
FRONTEND_URL=http://localhost:3000
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL service is running:
  - Windows: Check Services app for "postgresql-x64-18" service
  - macOS: Check PostgreSQL.app status or run `brew services list`
  - Linux: `sudo systemctl status postgresql`
- Verify port 5432 is not blocked by firewall
- Confirm DB_HOST and DB_PORT in .env are correct

### Authentication Failed
- Double-check username and password in .env
- Ensure the user exists in PostgreSQL
- Verify the user has CONNECT privileges on the `transitops` database
- Check that you're connecting to the correct database name

### Database Does Not Exist
- Verify you created the `transitops` database
- Check DB_NAME in .env matches exactly
- Recreate if needed: `CREATE DATABASE transitops;`

### Permission Denied
- Ensure your user has been granted privileges on the database:
  ```sql
  GRANT ALL PRIVILEGES ON DATABASE transitops TO transitops_user;
  ```
- For schema operations, ensure user has CREATE and USAGE on public schema:
  ```sql
  GRANT ALL ON SCHEMA public TO transitops_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO transitops_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO transitops_user;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO transitops_user;
  ```

## Development Tips

### Using psql for Debugging
```bash
# Connect to your transitops database
psql -U transitops_user -d transitops

# Once connected, you can run SQL commands:
\d            # list tables
\d+ users     # describe users table
SELECT * FROM users LIMIT 5;
```

### Common SQL Queries for Development
```bash
# Check current database
SELECT current_database();

# Check current user
SELECT current_user;

# List all tables
\dt

# Show table structure
\d+ table_name

# Reset database (use with caution!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

## Production Considerations

For production deployments with PostgreSQL 18:
1. **Connection Pooling**: Consider using PgBouncer for connection pooling
2. **Backup Strategy**: Implement regular logical (pg_dump) and physical backups
3. **Monitoring**: Use pg_stat_statements, check disk usage, monitor connections
4. **Security**:
   - Connect via SSL/TLS in production
   - Restrict listen_addresses if not needed locally
   - Use strong passwords and consider certificate authentication
   - Regularly update PostgreSQL for security patches
5. **Performance**:
   - Tune shared_buffers, effective_cache_size, work_mem based on your hardware
   - Create appropriate indexes for your query patterns
   - Consider partitioning for large tables (trips, expenses, maintenance logs)

## References
- PostgreSQL 18 Official Documentation: https://www.postgresql.org/docs/18/
- PostgreSQL Tutorial: https://www.postgresqltutorial.com/
- Sequelize PostgreSQL Guide: https://sequelize.org/master/manual/dialects-postgres.html