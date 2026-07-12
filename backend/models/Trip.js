const { DataTypes, Sequelize } = require('sequelize');
const sequelize = require('../config/database').sequelize;
const Vehicle = require('./Vehicle');
const Driver = require('./Driver');

const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  source: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  destination: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  vehicleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'drivers',
      key: 'id'
    }
  },
  cargoWeight: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0.1
    }
  },
  plannedDistance: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0.1
    }
  },
  actualDistance: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  fuelConsumed: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'dispatched', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'trips',
  indexes: [
    {
      fields: ['vehicleId']
    },
    {
      fields: ['driverId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['vehicleId', 'status']
    },
    {
      fields: ['driverId', 'status']
    }
  ]
});

// Model-level validations
Trip.addValidator('cargoWeightNotExceedCapacity', function(value) {
  // This validation will be implemented in the instance method since it requires fetching the vehicle
  return true; // Placeholder - actual validation in instance method
});

// Instance methods
Trip.prototype.canDispatch = async function() {
  // Check if trip is in draft status
  if (this.status !== 'draft') {
    return false;
  }

  // Check if vehicle exists and is available
  const vehicle = await Vehicle.findByPk(this.vehicleId);
  if (!vehicle || vehicle.status === 'In Shop' || vehicle.status === 'Retired') {
    return false;
  }

  // Check if driver exists and is available
  const driver = await Driver.findByPk(this.driverId);
  if (!driver || driver.status === 'Suspended' || new Date(driver.licenseExpiry) < new Date()) {
    return false;
  }

  // Check if vehicle or driver is already on another trip
  const activeTripCount = await Trip.count({
    where: {
      [Sequelize.Op.or]: [
        { vehicleId: this.vehicleId, status: 'dispatched' },
        { driverId: this.driverId, status: 'dispatched' }
      ],
      id: this.id ? { [Sequelize.Op.not]: this.id } : undefined // Exclude current trip if updating
    }
  });

  return activeTripCount === 0 && this.cargoWeight <= vehicle.maxCapacity;
};

Trip.prototype.dispatch = async function() {
  if (!await this.canDispatch()) {
    throw new Error('Cannot dispatch trip due to validation failures');
  }

  const vehicle = await Vehicle.findByPk(this.vehicleId);
  const driver = await Driver.findByPk(this.driverId);

  this.status = 'dispatched';
  this.startedAt = new Date();

  // Update vehicle and driver status
  if (vehicle) {
    vehicle.status = 'On Trip';
    await vehicle.save();
  }

  if (driver) {
    driver.status = 'On Trip';
    await driver.save();
  }

  await this.save();
  return this;
};

Trip.prototype.complete = async function(actualDistance, fuelConsumed) {
  if (this.status !== 'dispatched') {
    throw new Error('Only dispatched trips can be completed');
  }

  // Validate inputs
  if (actualDistance < 0) {
    throw new Error('Actual distance cannot be negative');
  }

  if (fuelConsumed < 0) {
    throw new Error('Fuel consumed cannot be negative');
  }

  const vehicle = await Vehicle.findByPk(this.vehicleId);
  const driver = await Driver.findByPk(this.driverId);

  this.status = 'completed';
  this.endedAt = new Date();
  this.actualDistance = actualDistance;
  this.fuelConsumed = fuelConsumed;

  // Update vehicle and driver status back to Available
  if (vehicle) {
    vehicle.status = 'Available';
    await vehicle.save();
  }

  if (driver) {
    driver.status = 'Available';
    await driver.save();
  }

  await this.save();
  return this;
};

Trip.prototype.cancel = async function() {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel completed trip');
  }

  const vehicle = await Vehicle.findByPk(this.vehicleId);
  const driver = await Driver.findByPk(this.driverId);

  this.status = 'cancelled';
  this.endedAt = new Date();

  // Update vehicle and driver status back to Available (unless vehicle is retired)
  if (vehicle) {
    if (vehicle.status !== 'Retired') {
      vehicle.status = 'Available';
      await vehicle.save();
    }
  }

  if (driver) {
    driver.status = 'Available';
    await driver.save();
  }

  await this.save();
  return this;
};

// Associations
Trip.associate = (models) => {
  Trip.belongsTo(models.Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
  Trip.belongsTo(models.Driver, { foreignKey: 'driverId', as: 'driver' );
};

module.exports = Trip;

// Associations
Trip.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
Trip.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

module.exports = Trip;