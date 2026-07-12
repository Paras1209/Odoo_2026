# TransitOps Backend

Backend API for TransitOps - Transport Operations Platform built with Node.js, Express, and PostgreSQL.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Docker](#docker)
- [Contributing](#contributing)
- [License](#license)

## Features
- RESTful API for transport operations management
- User authentication with JWT
- Role-based access control (RBAC)
- Vehicle management with status tracking
- Driver management with license validation
- Trip management with business rules
- Maintenance tracking
- Expense management
- Dashboard analytics and reporting
- CSV export functionality
- Input validation and sanitization
- Security best practices (Helmet, CORS, bcrypt)

## Tech Stack
- **Runtime**: Node.js v20+
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: Custom validation middleware
- **Security**: Helmet, CORS, bcrypt
- **Development**: Nodemon, ESLint, Prettier, Jest
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Docker and Docker Compose (for easy PostgreSQL setup)
  - OR PostgreSQL (v13 or higher) installed directly
- Git

### Option 1: Using Docker Compose (Recommended for Development)
1. Clone the repository
   ```bash
   git clone <repository-url>
   cd transitops-backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start PostgreSQL using Docker Compose
   ```bash
   docker-compose up -d
   ```

4. Verify database is ready
   ```bash
   docker-compose exec db pg_isready -U postgres
   ```

5. Copy environment variables
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults work with Docker Compose)
   ```

6. Test database connection
   ```bash
   npm run test:db
   ```

7. Start the development server
   ```bash
   npm run dev
   ```

### Option 2: Direct PostgreSQL Installation
1. Install PostgreSQL (v13 or higher)
2. Create a database and user:
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql
   
   # Inside psql:
   CREATE DATABASE transitops;
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE transitops TO your_username;
   \q
   ```
3. Update `.env` with your database credentials
4. Follow steps 2, 5-7 from the Docker Compose method above

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
# For Docker Compose (default values):
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transitops
DB_USER=postgres
DB_PASSWORD=postgres

# For direct PostgreSQL installation:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=transitops
# DB_USER=your_postgres_username
# DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
# Generate a strong secret using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=24h

# Frontend URL (for CORS in production)
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile (protected)
- `PUT /api/v1/auth/profile` - Update user profile (protected)

### Vehicles
- `GET /api/v1/vehicles` - Get all vehicles with filtering
- `GET /api/v1/vehicles/:id` - Get vehicle by ID
- `POST /api/v1/vehicles` - Create new vehicle
- `PUT /api/v1/vehicles/:id` - Update vehicle
- `DELETE /api/v1/vehicles/:id` - Delete vehicle

### Drivers
- `GET /api/v1/drivers` - Get all drivers with filtering
- `GET /api/v1/drivers/:id` - Get driver by ID
- `POST /api/v1/drivers` - Create new driver
- `PUT /api/v1/drivers/:id` - Update driver
- `DELETE /api/v1/drivers/:id` - Delete driver

### Trips
- `GET /api/v1/trips` - Get all trips with filtering
- `GET /api/v1/trips/:id` - Get trip by ID
- `POST /api/v1/trips` - Create new trip
- `PUT /api/v1/trips/:id` - Update trip
- `DELETE /api/v1/trips/:id` - Delete trip
- `POST /api/v1/trips/:id/dispatch` - Dispatch trip
- `POST /api/v1/trips/:id/complete` - Complete trip
- `POST /api/v1/trips/:id/cancel` - Cancel trip

### Maintenance
- `GET /api/v1/maintenance` - Get all maintenance records
- `GET /api/v1/maintenance/:id` - Get maintenance record by ID
- `POST /api/v1/maintenance` - Create new maintenance record
- `PUT /api/v1/maintenance/:id` - Update maintenance record
- `DELETE /api/v1/maintenance/:id` - Delete maintenance record

### Expenses
- `GET /api/v1/expenses` - Get all expenses
- `GET /api/v1/expenses/:id` - Get expense by ID
- `POST /api/v1/expenses` - Create new expense
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

### Dashboard & Reports
- `GET /api/v1/dashboard/kpis` - Get KPI metrics
- `GET /api/v1/dashboard/charts` - Get chart data
- `GET /api/v1/reports/fuel-efficiency` - Get fuel efficiency report
- `GET /api/v1/reports/operational-cost` - Get operational cost report
- `GET /api/v1/reports/vehicle-roi` - Get vehicle ROI report
- `GET /api/v1/reports/export/csv` - Export data as CSV

## Database Schema

### Users
- id (UUID)
- name (String)
- email (String, unique)
- password (String, hashed)
- role (ENUM: admin, fleet_manager, driver, safety_officer, financial_analyst, employee)
- status (ENUM: active, inactive, suspended)
- createdAt (Timestamp)
- updatedAt (Timestamp)

### Vehicles
- id (UUID)
- registrationNumber (String, unique)
- name (String)
- type (String)
- maxCapacity (Integer)
- odometer (Integer)
- acquisitionCost (Decimal)
- status (ENUM: available, on_trip, in_shop, retired)
- createdAt (Timestamp)
- updatedAt (Timestamp)

### Drivers
- id (UUID)
- name (String)
- licenseNumber (String, unique)
- licenseCategory (String)
- licenseExpiry (Date)
- contactNumber (String)
- safetyScore (Integer)
- status (ENUM: available, on_trip, off_duty, suspended)
- createdAt (Timestamp)
- updatedAt (Timestamp)

### Trips
- id (UUID)
- source (String)
- destination (String)
- vehicleId (UUID, foreign key)
- driverId (UUID, foreign key)
- cargoWeight (Decimal)
- plannedDistance (Decimal)
- actualDistance (Decimal, nullable)
- fuelConsumed (Decimal, nullable)
- status (ENUM: draft, dispatched, completed, cancelled)
- startedAt (Timestamp, nullable)
- endedAt (Timestamp, nullable)
- createdAt (Timestamp)
- updatedAt (Timestamp)

### Maintenance
- id (UUID)
- vehicleId (UUID, foreign key)
- type (String)
- description (Text)
- cost (Decimal)
- date (Date)
- status (ENUM: scheduled, in_progress, completed, cancelled)
- createdAt (Timestamp)
- updatedAt (Timestamp)

### Expenses
- id (UUID)
- vehicleId (UUID, foreign key, nullable)
- tripId (UUID, foreign key, nullable)
- type (ENUM: fuel, toll, maintenance, other)
- amount (Decimal)
- date (Date)
- description (Text)
- receiptUrl (String, nullable)
- createdAt (Timestamp)
- updatedAt (Timestamp)

## Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run test:db` - Test database connection
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Code Quality
- Follows ES6+ standards
- Uses ESLint for code linting
- Uses Prettier for code formatting
- RESTful API design
- Comprehensive error handling
- Input validation and sanitization

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- API tests: `tests/api/`

## Deployment

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Process manager (PM2, Docker, etc.)

### Production Deployment
1. Set `NODE_ENV=production`
2. Ensure proper database connection settings
3. Set strong `JWT_SECRET`
4. Configure proper CORS origins
5. Set up process manager or container orchestration
6. Monitor logs and performance

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d --build

# Or build standalone image
docker build -t transitops-backend .
docker run -p 5000:5000 --env-file .env transitops-backend
```

### Kubernetes Deployment
(Refer to k8s/ directory for manifests)

## Docker

### Quick Start with Docker Compose
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Access Adminer (database GUI)
# Visit http://localhost:8080
# Use PostgreSQL credentials from .env
```

### Docker Compose Services
- **db**: PostgreSQL 15 database
- **adminer**: Web-based database administration tool

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure to:
- Follow the existing code style
- Write unit tests for new functionality
- Update documentation as needed
- Keep pull requests focused

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Built for Odoo Hackathon 2026
- Inspired by transport and logistics management systems
- Thanks to all contributors and open-source maintainers