const { Sequelize } = require('sequelize');
const sequelize = require('../config/database').sequelize;

// Import models
const User = require('./User');
const Role = require('./Role');
const Vehicle = require('./Vehicle');
const Driver = require('./Driver');
const Trip = require('./Trip');
const Maintenance = require('./Maintenance');
const Expense = require('./Expense');

// Define model associations
const initializeAssociations = () => {
  // Role <-> User associations
  Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
  User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleInfo' });

  // Vehicle associations
  Vehicle.hasMany(Trip, { foreignKey: 'vehicleId', as: 'trips' });
  Vehicle.hasMany(Maintenance, { foreignKey: 'vehicleId', as: 'maintenanceRecords' });
  Vehicle.hasMany(Expense, { foreignKey: 'vehicleId', as: 'expenses' });

  // Driver associations
  Driver.hasMany(Trip, { foreignKey: 'driverId', as: 'trips' });

  // Trip associations
  Trip.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
  Trip.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

  // Maintenance associations
  Maintenance.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

  // Expense associations
  Expense.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
};

// Initialize associations
initializeAssociations();

module.exports = {
  sequelize,
  Sequelize,
  User,
  Role,
  Vehicle,
  Driver,
  Trip,
  Maintenance,
  Expense,
  initializeAssociations
};
