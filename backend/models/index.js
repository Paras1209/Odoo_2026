const User = require('./User');
const Role = require('./Role');
const Vehicle = require('./Vehicle');
const Maintenance = require('./Maintenance');
const Trip = require('./Trip');
const Expense = require('./Expense');

Role.hasMany(User, {
  as: 'users',
  foreignKey: 'roleId',
  sourceKey: 'id'
});

User.belongsTo(Role, {
  as: 'roleInfo',
  foreignKey: 'roleId',
  targetKey: 'id'
});

Vehicle.hasMany(Maintenance, {
  as: 'maintenanceRecords',
  foreignKey: 'vehicleId',
  sourceKey: 'id'
});

Maintenance.belongsTo(Vehicle, {
  as: 'vehicle',
  foreignKey: 'vehicleId',
  targetKey: 'id'
});

Vehicle.hasMany(Trip, {
  as: 'trips',
  foreignKey: 'vehicleId',
  sourceKey: 'id'
});

Trip.belongsTo(Vehicle, {
  as: 'vehicle',
  foreignKey: 'vehicleId',
  targetKey: 'id'
});

Vehicle.hasMany(Expense, {
  as: 'expenses',
  foreignKey: 'vehicleId',
  sourceKey: 'id'
});

Trip.hasMany(Expense, {
  as: 'expenses',
  foreignKey: 'tripId',
  sourceKey: 'id'
});

Expense.belongsTo(Vehicle, {
  as: 'vehicle',
  foreignKey: 'vehicleId',
  targetKey: 'id'
});

Expense.belongsTo(Trip, {
  as: 'trip',
  foreignKey: 'tripId',
  targetKey: 'id'
});

module.exports = {
  User,
  Role,
  Vehicle,
  Maintenance,
  Trip,
  Expense
};
