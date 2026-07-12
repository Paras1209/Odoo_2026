const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').sequelize;

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 120]
    }
  },
  licenseNumber: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 60]
    }
  },
  licenseCategory: {
    type: DataTypes.ENUM(
      'A',
      'A1',
      'A2',
      'B',
      'B1',
      'C',
      'C1',
      'D',
      'D1',
      'E',
      'F',
      'G',
      'H',
      'other'
    ),
    allowNull: false,
    defaultValue: 'other'
  },
  licenseExpiry: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  contact: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 255]
    }
  },
  safetyScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: true,
      min: 0,
      max: 100
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'on_leave'),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  tableName: 'drivers',
  indexes: [
    {
      unique: true,
      fields: ['licenseNumber']
    },
    {
      fields: ['status']
    },
    {
      fields: ['licenseCategory']
    }
  ]
});

module.exports = Driver;