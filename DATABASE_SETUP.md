# PostgreSQL Setup Guide for TransitOps

This guide explains how to set up PostgreSQL for the TransitOps backend application.

## Option 1: Using Docker (Recommended for Development)

### Prerequisites
- Docker installed (https://docs.docker.com/get-docker/)
- Docker Compose installed (comes with Docker Desktop on Mac/Windows, or install separately on Linux)

### Steps
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd transitops-backend
   ```

2. Start PostgreSQL using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Verify the database is ready:
   ```bash
   docker-compose exec db pg_isready -U postgres
   ```

4. Access the database:
   ```bash
   docker-compose exec db psql -U postgres -d transitops
   ```

5. Optional: Access Adminer (web-based database management) at http://localhost:8080
   - System: PostgreSQL
   - Server: db
   - Username: postgres
   - Password: postgres
   - Database: transitops

### Docker Compose Services
- **db**: PostgreSQL 15 database
- **adminer**: Web-based database administration tool (http://localhost:8080)

### Environment Variables (for .env)
When using Docker Compose with the default configuration, your .env file should contain:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transitops
DB_USER=postgres
DB_PASSWORD=postgres
```

## Option 2: Manual Installation

### macOS (using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql

# Start service
brew services start postgresql

# Create database and user
createdb transitops
createjs -s transitops_user  # Creates user and prompts for password
# Then grant privileges:
# GRANT ALL PRIVILEGES ON DATABASE transitops TO transitops_user;
```

### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -i -u postgres

# Create database and user
createdb transitops
createuser -P transitops_user  # Will prompt for password
# Then grant privileges:
psql -c "GRANT ALL PRIVILEGES ON DATABASE transitops TO transitops_user;"
exit
```

### Windows
1. Download and install PostgreSQL from https://www.postgresql.org/download/windows/
2. During installation, set:
   - Password for the postgres user
   - Port (default 5432)
3. Use pgAdmin or the SQL Shell to create database and user:
   ```sql
   CREATE DATABASE transitops;
   CREATE USER transitops_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE transitops TO transitops_user;
   ```

## Connection Testing

After setting up PostgreSQL, test your connection with:

```bash
npm run test:db
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL service is running
- Verify port is correct (default 5432)
- Check firewall settings

### Authentication Failed
- Verify username and password in .env file
- Ensure user has been created in PostgreSQL
- Check that user has privileges on the database

### Database Does Not Exist
- Create the database: `createdb transitops` or `CREATE DATABASE transitops;`
- Verify DB_NAME in .env matches the created database

## Production Considerations

For production deployments:
1. Use managed PostgreSQL services (AWS RDS, Google Cloud SQL, Azure Database for PostgreSQL)
2. Implement proper connection pooling
3. Set up automated backups
4. Configure monitoring and alerting
5. Use environment-specific configuration files
6. Implement database migrations with proper version control
7. Use SSL/TLS for database connections
8. Implement read replicas for scaling read operations

## References
- PostgreSQL Official Documentation: https://www.postgresql.org/docs/
- Docker PostgreSQL Image: https://hub.docker.com/_/postgres
- Sequelize PostgreSQL Guide: https://sequelize.org/master/manual/dialects-postgres.html