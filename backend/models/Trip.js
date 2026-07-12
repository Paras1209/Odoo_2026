const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Trip = sequelize.define('Trip', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  source: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 120]
    }
  },
  destination: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 120]
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
  cargoWeight: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  plannedDistance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  actualDistance: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  fuelConsumed: {
    type: DataTypes.DECIMAL(12, 2),
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
      fields: ['status']
    }
  ]
});

module.exports = Trip;