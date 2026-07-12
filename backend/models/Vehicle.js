const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  registrationNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 120]
    }
  },
  model: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 120]
    }
  },
  type: {
    type: DataTypes.ENUM(
      'bus',
      'van',
      'truck',
      'car',
      'motorcycle',
      'trailer',
      'other'
    ),
    allowNull: false,
    defaultValue: 'other'
  },
  maxCapacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true,
      min: 1
    }
  },
  odometer: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  acquisitionCost: {
    type: DataTypes.DECIMAL(14, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('available', 'on_trip', 'in_shop', 'retired'),
    allowNull: false,
    defaultValue: 'available'
  }
}, {
  timestamps: true,
  tableName: 'vehicles',
  indexes: [
    {
      unique: true,
      fields: ['registrationNumber']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = Vehicle;